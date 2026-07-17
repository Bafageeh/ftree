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

        return response()->json([
            'person' => new PersonResource($person),
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

    public function stats(PropheticLineageService $lineage): JsonResponse
    {
        [$allPeople, $connectedIds] = $this->connectedPeople($lineage);
        $connectedPeople = $allPeople->whereIn('id', $connectedIds)->values();
        $traces = $connectedPeople->map(fn (Person $person) => $lineage->trace($person));
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
