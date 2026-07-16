<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartEdge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChartEdgeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $edges = ChartEdge::query()
            ->when($request->filled('status'), fn ($query) => $query->where('reading_status', $request->string('status')))
            ->when($request->filled('approval'), fn ($query) => $query->where('approval_status', $request->string('approval')))
            ->when($request->filled('type'), fn ($query) => $query->where('relation_type', $request->string('type')))
            ->orderByDesc('confidence')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $edges]);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'total' => ChartEdge::count(),
            'readable' => ChartEdge::where('reading_status', 'readable')->count(),
            'review' => ChartEdge::where('reading_status', 'review')->count(),
            'unclear' => ChartEdge::where('reading_status', 'unclear')->count(),
            'confirmed' => ChartEdge::where('approval_status', 'supervisor_confirmed')->count(),
            'pending_supervisor' => ChartEdge::where('approval_status', 'pending_supervisor')->count(),
        ]);
    }
}
