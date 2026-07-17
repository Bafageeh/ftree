<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PersonResource;
use App\Models\Person;
use App\Services\PropheticLineageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PersonController extends Controller
{
    public function index(Request $request, PropheticLineageService $lineage): AnonymousResourceCollection
    {
        [$allPeople, $connectedIds] = $this->connectedPeople($lineage);

        $query = Person::query()
            ->whereIn('id', $connectedIds)
            ->with('parent:id,full_name,honorific,source_code,approval_status,lineage_parent_id');

        $lineageStatus = (string) $request->string('lineage_status', 'all');
        if (in_array($lineageStatus, ['confirmed', 'connected_to_prophet_confirmed'], true)) {
            $confirmedIds = $allPeople
                ->filter(fn (Person $person) => $lineage->trace($person)['fully_confirmed'])
                ->pluck('id');
            $query->whereIn('id', $confirmedIds);
        } elseif (in_array($lineageStatus, ['pending', 'connected_to_prophet_pending_review'], true)) {
            $pendingIds = $allPeople
                ->filter(function (Person $person) use ($lineage) {
                    $trace = $lineage->trace($person);

                    return $trace['connected_to_prophet'] && ! $trace['fully_confirmed'];
                })
                ->pluck('id');
            $query->whereIn('id', $pendingIds);
        } elseif (in_array($lineageStatus, ['disconnected', 'disconnected_from_prophet'], true)) {
            $query->whereRaw('1 = 0');
        }

        $people = $query
            ->when($request->filled('search'), function ($builder) use ($request) {
                $search = trim((string) $request->string('search'));
                $builder->where(function ($nested) use ($search) {
                    $nested->where('full_name', 'like', "%{$search}%")
                        ->orWhere('source_code', 'like', "%{$search}%")
                        ->orWhere('honorific', 'like', "%{$search}%")
                        ->orWhere('summary', 'like', "%{$search}%")
                        ->orWhere('source_locator', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn ($builder) => $builder->where('status', $request->string('status')))
            ->when($request->filled('approval_status'), fn ($builder) => $builder->where('approval_status', $request->string('approval_status')))
            ->when($request->filled('branch'), fn ($builder) => $builder->where('chart_branch', $request->string('branch')))
            ->when($request->filled('node_type'), fn ($builder) => $builder->where('node_type', $request->string('node_type')))
            ->orderBy('is_provisional')
            ->orderByRaw('chart_order is null')
            ->orderBy('chart_order')
            ->orderBy('generation')
            ->orderBy('id')
            ->paginate(min(max((int) $request->integer('per_page', 50), 1), 250));

        return PersonResource::collection($people);
    }

    public function show(Person $person, PropheticLineageService $lineage): PersonResource
    {
        abort_if($person->approval_status === 'rejected', 404);
        abort_unless($lineage->trace($person)['connected_to_prophet'], 404);

        $children = Person::query()
            ->where('lineage_parent_id', $person->id)
            ->where('approval_status', '!=', 'rejected')
            ->get()
            ->filter(fn (Person $child) => $lineage->trace($child)['connected_to_prophet'])
            ->values();

        $person->setRelation('children', $children);
        $person->load('parent');

        return new PersonResource($person);
    }

    public function lineage(Person $person, PropheticLineageService $lineage): JsonResponse
    {
        abort_if($person->approval_status === 'rejected', 404);

        $trace = $lineage->trace($person);
        abort_unless($trace['connected_to_prophet'], 404);

        $children = Person::query()
            ->where('lineage_parent_id', $person->id)
            ->where('approval_status', '!=', 'rejected')
            ->orderByRaw('chart_order is null')
            ->orderBy('chart_order')
            ->orderBy('full_name')
            ->get();
        $descendantIds = $this->descendantIds($person->id);
        $person->setRelation('children', $children);

        return response()->json([
            'person' => new PersonResource($person),
            'children' => PersonResource::collection($children),
            'children_count' => $children->count(),
            'descendants_count' => count($descendantIds),
            'connected_to_prophet' => true,
            'fully_confirmed' => $trace['fully_confirmed'],
            'pending_review_count' => $trace['pending_review_count'],
            'lineage_status' => $trace['status'],
            'prophet' => new PersonResource($trace['prophet']),
            'path' => PersonResource::collection($trace['path']),
            'path_text' => $trace['path_text'],
            'display_path_text' => $trace['path_text'],
            'relation_count' => $trace['relation_count'],
            'cycle_detected' => false,
        ]);
    }

    public function update(Request $request, Person $person): PersonResource
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'source_code' => ['nullable', 'string', 'max:120', Rule::unique('people', 'source_code')->ignore($person->id)],
            'honorific' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['readable', 'review', 'unclear'])],
            'supervisor_note' => ['nullable', 'string', 'max:4000'],
        ]);

        $person->fill([
            'full_name' => trim($validated['full_name']),
            'source_code' => filled($validated['source_code'] ?? null) ? trim($validated['source_code']) : null,
            'honorific' => filled($validated['honorific'] ?? null) ? trim($validated['honorific']) : null,
            'status' => $validated['status'],
            'supervisor_note' => filled($validated['supervisor_note'] ?? null) ? trim($validated['supervisor_note']) : null,
        ]);
        $person->save();
        $person->load('parent');

        return new PersonResource($person);
    }

    public function addChildren(Request $request, Person $person): JsonResponse
    {
        $validated = $request->validate([
            'count' => ['required', 'integer', 'min:1', 'max:50'],
            'names' => ['sometimes', 'array', 'max:50'],
            'names.*' => ['nullable', 'string', 'max:255'],
        ]);

        $count = (int) $validated['count'];
        $names = collect($validated['names'] ?? [])->map(fn ($name) => trim((string) $name))->values();
        $nextOrder = ((int) Person::max('chart_order')) + 1;
        $created = collect();

        DB::transaction(function () use ($person, $count, $names, $nextOrder, $created): void {
            for ($index = 0; $index < $count; $index++) {
                $providedName = $names->get($index, '');
                $sourceCode = sprintf(
                    'MANUAL-P%d-%s-%02d-%s',
                    $person->id,
                    now()->format('YmdHis'),
                    $index + 1,
                    Str::upper(Str::random(4)),
                );
                $isPlaceholder = $providedName === '';

                $child = Person::create([
                    'full_name' => $isPlaceholder ? $sourceCode : $providedName,
                    'source_code' => $sourceCode,
                    'node_type' => 'person',
                    'honorific' => null,
                    'lineage_parent_id' => $person->id,
                    'status' => $isPlaceholder ? 'unclear' : 'readable',
                    'approval_status' => 'pending_supervisor',
                    'is_provisional' => true,
                    'supervisor_note' => $isPlaceholder
                        ? 'ابن مضاف يدويًا باسم مؤقت؛ استبدل الرمز بالاسم الصحيح.'
                        : 'ابن مضاف يدويًا من صفحة تفاصيل النسب.',
                    'approved_at' => null,
                    'chart_branch' => $person->chart_branch,
                    'chart_color' => $person->chart_color,
                    'generation' => ((int) $person->generation) + 1,
                    'summary' => 'إضافة يدوية قابلة للتعديل والمراجعة.',
                    'source_reference' => 'إضافة يدوية من التطبيق',
                    'source_locator' => 'صفحة تفاصيل النسب للأب '.$person->full_name,
                    'chart_order' => $nextOrder + $index,
                    'is_living' => false,
                ]);

                $created->push($child);
            }
        });

        return response()->json([
            'message' => 'تمت إضافة الأبناء.',
            'created_count' => $created->count(),
            'children' => PersonResource::collection($created),
        ], 201);
    }

    public function destroy(Person $person): JsonResponse
    {
        abort_if($person->source_code === 'CORE-001', 422, 'لا يمكن حذف أصل الشجرة سيد البشر محمد ﷺ.');

        $descendantIds = $this->descendantIds($person->id);
        $allIds = array_values(array_unique([$person->id, ...$descendantIds]));
        $sourceCodes = Person::query()->whereIn('id', $allIds)->pluck('source_code')->filter()->values();

        DB::transaction(function () use ($allIds, $sourceCodes): void {
            if (Schema::hasTable('chart_readings') && Schema::hasColumn('chart_readings', 'person_id')) {
                DB::table('chart_readings')->whereIn('person_id', $allIds)->update(['person_id' => null]);
            }

            if (Schema::hasTable('review_requests') && Schema::hasColumn('review_requests', 'person_id')) {
                DB::table('review_requests')->whereIn('person_id', $allIds)->update(['person_id' => null]);
            }

            if (Schema::hasTable('chart_edges') && $sourceCodes->isNotEmpty()) {
                DB::table('chart_edges')
                    ->whereIn('from_source_key', $sourceCodes)
                    ->orWhereIn('to_source_key', $sourceCodes)
                    ->delete();
            }

            Person::query()
                ->whereIn('id', $allIds)
                ->orderByDesc('generation')
                ->orderByDesc('id')
                ->get()
                ->each(fn (Person $node) => $node->delete());
        });

        return response()->json([
            'message' => 'تم حذف الاسم وجميع ذريته.',
            'deleted_count' => count($allIds),
            'descendants_deleted' => count($descendantIds),
        ]);
    }

    public function stats(PropheticLineageService $lineage): JsonResponse
    {
        [$allPeople, $connectedIds] = $this->connectedPeople($lineage);
        $connectedPeople = $allPeople->whereIn('id', $connectedIds)->values();
        $confirmedIds = $connectedPeople
            ->filter(fn (Person $person) => $lineage->trace($person)['fully_confirmed'])
            ->pluck('id');
        $pendingIds = $connectedPeople->pluck('id')->diff($confirmedIds)->values();

        return response()->json([
            'total' => $connectedPeople->count(),
            'connected_to_prophet' => $connectedPeople->count(),
            'connected_to_prophet_confirmed' => $confirmedIds->count(),
            'connected_to_prophet_pending_review' => $pendingIds->count(),
            'disconnected_from_prophet' => 0,
            'confirmed' => Person::whereIn('id', $connectedIds)->where('approval_status', 'supervisor_confirmed')->count(),
            'pending_supervisor' => Person::whereIn('id', $connectedIds)->where('approval_status', 'pending_supervisor')->count(),
            'readable' => Person::whereIn('id', $connectedIds)->where('status', 'readable')->count(),
            'review' => Person::whereIn('id', $connectedIds)->where('status', 'review')->count(),
            'unclear' => Person::whereIn('id', $connectedIds)->where('status', 'unclear')->count(),
            'generations' => Person::whereIn('id', $connectedIds)->max('generation') ?? 0,
            'branches' => Person::query()
                ->whereIn('id', $connectedIds)
                ->whereNotNull('chart_branch')
                ->where('chart_branch', '!=', 'central_trunk')
                ->distinct('chart_branch')
                ->count('chart_branch'),
        ]);
    }

    /**
     * @return array<int, int>
     */
    private function descendantIds(int $rootId): array
    {
        $childrenByParent = Person::query()
            ->where('approval_status', '!=', 'rejected')
            ->get(['id', 'lineage_parent_id'])
            ->groupBy('lineage_parent_id');
        $result = [];
        $seen = [$rootId => true];
        $queue = [$rootId];

        while ($queue !== []) {
            $parentId = array_shift($queue);
            foreach ($childrenByParent->get($parentId, collect()) as $child) {
                if (isset($seen[$child->id])) {
                    continue;
                }
                $seen[$child->id] = true;
                $result[] = $child->id;
                $queue[] = $child->id;
            }
        }

        return $result;
    }

    /**
     * @return array{0: Collection<int, Person>, 1: Collection<int, int>}
     */
    private function connectedPeople(PropheticLineageService $lineage): array
    {
        $people = Person::query()
            ->where('approval_status', '!=', 'rejected')
            ->get();
        $connectedIds = $lineage->connectedIds($people);

        return [$people, $connectedIds];
    }
}
