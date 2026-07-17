<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartReading;
use App\Models\Person;
use App\Services\PropheticLineageService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChartReadingController extends Controller
{
    public function index(Request $request, PropheticLineageService $lineage): JsonResponse
    {
        $readings = $this->connectedQuery($lineage)
            ->when($request->filled('branch'), fn ($query) => $query->where('chart_branch', $request->string('branch')))
            ->when($request->filled('status'), fn ($query) => $query->where('reading_status', $request->string('status')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim((string) $request->string('search'));
                $query->where(function ($nested) use ($search) {
                    $nested->where('provisional_name', 'like', "%{$search}%")
                        ->orWhere('normalized_name', 'like', "%{$search}%")
                        ->orWhere('source_locator', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('confidence')
            ->orderBy('id')
            ->paginate(min(max((int) $request->integer('per_page', 100), 1), 200));

        return response()->json($readings);
    }

    public function stats(PropheticLineageService $lineage): JsonResponse
    {
        $query = $this->connectedQuery($lineage);

        return response()->json([
            'total' => (clone $query)->count(),
            'readable' => (clone $query)->where('reading_status', 'readable')->count(),
            'review' => (clone $query)->where('reading_status', 'review')->count(),
            'unclear' => (clone $query)->where('reading_status', 'unclear')->count(),
            'promoted' => (clone $query)->where('is_promoted', true)->count(),
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

        return ChartReading::query()->whereIn('source_key', $sourceCodes);
    }
}
