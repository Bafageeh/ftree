<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartReading;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChartReadingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $readings = ChartReading::query()
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

    public function stats(): JsonResponse
    {
        return response()->json([
            'total' => ChartReading::count(),
            'readable' => ChartReading::where('reading_status', 'readable')->count(),
            'review' => ChartReading::where('reading_status', 'review')->count(),
            'unclear' => ChartReading::where('reading_status', 'unclear')->count(),
            'promoted' => ChartReading::where('is_promoted', true)->count(),
        ]);
    }
}
