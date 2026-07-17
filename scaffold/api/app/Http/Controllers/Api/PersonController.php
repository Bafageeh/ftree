<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PersonResource;
use App\Models\Person;
use App\Services\PropheticLineageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PersonController extends Controller
{
    public function index(Request $request, PropheticLineageService $lineage): AnonymousResourceCollection
    {
        $query = Person::query()
            ->with('parent:id,full_name,honorific,source_code,approval_status,lineage_parent_id');

        if ($request->filled('lineage_status')) {
            $people = Person::query()
                ->where('approval_status', '!=', 'rejected')
                ->get();
            $lineage->warm($people);

            $ids = match ((string) $request->string('lineage_status')) {
                'connected', 'connected_to_prophet' => $lineage->connectedIds($people),
                'disconnected', 'disconnected_from_prophet' => $lineage->disconnectedIds($people),
                'confirmed', 'connected_to_prophet_confirmed' => $people
                    ->filter(fn (Person $person) => $lineage->trace($person)['fully_confirmed'])
                    ->pluck('id')
                    ->values(),
                'pending', 'connected_to_prophet_pending_review' => $people
                    ->filter(function (Person $person) use ($lineage) {
                        $trace = $lineage->trace($person);

                        return $trace['connected_to_prophet'] && ! $trace['fully_confirmed'];
                    })
                    ->pluck('id')
                    ->values(),
                default => $people->pluck('id')->values(),
            };

            $query->whereIn('id', $ids);
        }

        $people = $query
            ->when(! $request->filled('approval_status'), fn ($builder) => $builder->where('approval_status', '!=', 'rejected'))
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

    public function show(Person $person): PersonResource
    {
        return new PersonResource($person->load(['parent', 'children']));
    }

    public function lineage(Person $person, PropheticLineageService $lineage): JsonResponse
    {
        $trace = $lineage->trace($person);
        $displayPath = $trace['connected_to_prophet']
            ? $trace['path_text']
            : trim('محمد ﷺ ← [صلة نسب مفقودة أو غير موثقة] ← '.$trace['path_text']);

        return response()->json([
            'person' => new PersonResource($person),
            'connected_to_prophet' => $trace['connected_to_prophet'],
            'fully_confirmed' => $trace['fully_confirmed'],
            'pending_review_count' => $trace['pending_review_count'],
            'lineage_status' => $trace['status'],
            'prophet' => $trace['prophet'] ? new PersonResource($trace['prophet']) : null,
            'highest_known_ancestor' => $trace['highest_known_ancestor']
                ? new PersonResource($trace['highest_known_ancestor'])
                : null,
            'missing_parent_for' => $trace['missing_parent_for']
                ? new PersonResource($trace['missing_parent_for'])
                : null,
            'path' => PersonResource::collection($trace['path']),
            'path_text' => $trace['path_text'],
            'display_path_text' => $displayPath,
            'relation_count' => $trace['relation_count'],
            'cycle_detected' => $trace['cycle_detected'],
        ]);
    }

    public function lineageGaps(PropheticLineageService $lineage): JsonResponse
    {
        $people = Person::query()
            ->where('approval_status', '!=', 'rejected')
            ->orderByRaw('chart_order is null')
            ->orderBy('chart_order')
            ->orderBy('generation')
            ->orderBy('id')
            ->get();
        $lineage->warm($people);

        $traces = $people
            ->map(fn (Person $person) => ['person' => $person, 'trace' => $lineage->trace($person)])
            ->reject(fn (array $item) => $item['trace']['connected_to_prophet']);

        $groups = $traces
            ->groupBy(fn (array $item) => $item['trace']['highest_known_ancestor']?->id ?? 'unknown')
            ->map(function ($items) {
                $first = $items->first();
                $highest = $first['trace']['highest_known_ancestor'];
                $examples = $items
                    ->sortByDesc(fn (array $item) => $item['trace']['path']->count())
                    ->take(5)
                    ->map(fn (array $item) => [
                        'person' => new PersonResource($item['person']),
                        'known_path' => PersonResource::collection($item['trace']['path']),
                        'known_path_text' => $item['trace']['path_text'],
                        'display_path_text' => trim('محمد ﷺ ← [صلة نسب مفقودة أو غير موثقة] ← '.$item['trace']['path_text']),
                        'lineage_status' => $item['trace']['status'],
                        'pending_review_count' => $item['trace']['pending_review_count'],
                    ])
                    ->values();

                return [
                    'missing_parent_for' => $highest ? new PersonResource($highest) : null,
                    'known_chain_members_count' => $items->count(),
                    'display_start' => $highest
                        ? 'محمد ﷺ ← [صلة نسب مفقودة أو غير موثقة] ← '.$highest->full_name
                        : 'محمد ﷺ ← [صلة نسب مفقودة أو غير موثقة]',
                    'examples' => $examples,
                ];
            })
            ->values();

        return response()->json([
            'definition' => 'منقطعة النسب: كل سلسلة لا يصل مسار آبائها المسجل غير المرفوض حتى محمد ﷺ.',
            'prophet_source_code' => PropheticLineageService::PROPHET_SOURCE_CODE,
            'groups_count' => $groups->count(),
            'people_count' => $traces->count(),
            'data' => $groups,
        ]);
    }

    public function stats(PropheticLineageService $lineage): JsonResponse
    {
        $people = Person::query()
            ->where('approval_status', '!=', 'rejected')
            ->get();
        $lineage->warm($people);

        $traces = $people->map(fn (Person $person) => $lineage->trace($person));
        $connected = $traces->filter(fn (array $trace) => $trace['connected_to_prophet']);
        $connectedConfirmed = $traces->filter(fn (array $trace) => $trace['fully_confirmed']);
        $connectedPending = $connected->reject(fn (array $trace) => $trace['fully_confirmed']);
        $disconnected = $traces->reject(fn (array $trace) => $trace['connected_to_prophet']);

        return response()->json([
            'total' => $people->count(),
            'connected_to_prophet' => $connected->count(),
            'connected_to_prophet_confirmed' => $connectedConfirmed->count(),
            'connected_to_prophet_pending_review' => $connectedPending->count(),
            'disconnected_from_prophet' => $disconnected->count(),
            'confirmed' => Person::where('approval_status', 'supervisor_confirmed')->count(),
            'pending_supervisor' => Person::where('approval_status', 'pending_supervisor')->count(),
            'readable' => Person::where('approval_status', '!=', 'rejected')->where('status', 'readable')->count(),
            'review' => Person::where('approval_status', '!=', 'rejected')->where('status', 'review')->count(),
            'unclear' => Person::where('approval_status', '!=', 'rejected')->where('status', 'unclear')->count(),
            'generations' => Person::where('approval_status', '!=', 'rejected')->max('generation') ?? 0,
            'branches' => Person::query()
                ->where('approval_status', '!=', 'rejected')
                ->whereNotNull('chart_branch')
                ->where('chart_branch', '!=', 'central_trunk')
                ->distinct('chart_branch')
                ->count('chart_branch'),
        ]);
    }
}
