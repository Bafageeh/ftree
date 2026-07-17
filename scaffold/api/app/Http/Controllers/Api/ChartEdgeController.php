<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartEdge;
use App\Models\Person;
use App\Services\PropheticLineageService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChartEdgeController extends Controller
{
    public function index(Request $request, PropheticLineageService $lineage): JsonResponse
    {
        $edges = $this->connectedQuery($lineage)
            ->when($request->filled('status'), fn ($query) => $query->where('reading_status', $request->string('status')))
            ->when($request->filled('approval'), fn ($query) => $query->where('approval_status', $request->string('approval')))
            ->when($request->filled('type'), fn ($query) => $query->where('relation_type', $request->string('type')))
            ->orderByDesc('confidence')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $edges]);
    }

    public function stats(PropheticLineageService $lineage): JsonResponse
    {
        $query = $this->connectedQuery($lineage);

        return response()->json([
            'total' => (clone $query)->count(),
            'readable' => (clone $query)->where('reading_status', 'readable')->count(),
            'review' => (clone $query)->where('reading_status', 'review')->count(),
            'unclear' => (clone $query)->where('reading_status', 'unclear')->count(),
            'confirmed' => (clone $query)->where('approval_status', 'supervisor_confirmed')->count(),
            'pending_supervisor' => (clone $query)->where('approval_status', 'pending_supervisor')->count(),
        ]);
    }

    private function connectedQuery(PropheticLineageService $lineage): Builder
    {
        $people = Person::query()
            ->where('approval_status', '!=', 'rejected')
            ->get();
        $connectedIds = $lineage->connectedIds($people);
        $sourceCodes = $people
            ->whereIn('id', $connectedIds)
            ->pluck('source_code')
            ->filter()
            ->values();

        return ChartEdge::query()
            ->whereIn('from_source_key', $sourceCodes)
            ->whereIn('to_source_key', $sourceCodes);
    }
}
