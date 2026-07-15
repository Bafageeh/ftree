<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PersonResource;
use App\Models\Person;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PersonController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $people = Person::query()
            ->with('parent:id,full_name,honorific')
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim((string) $request->string('search'));
                $query->where(function ($nested) use ($search) {
                    $nested->where('full_name', 'like', "%{$search}%")
                        ->orWhere('honorific', 'like', "%{$search}%")
                        ->orWhere('summary', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderBy('generation')
            ->orderBy('id')
            ->paginate(min(max((int) $request->integer('per_page', 50), 1), 100));

        return PersonResource::collection($people);
    }

    public function show(Person $person): PersonResource
    {
        return new PersonResource($person->load(['parent', 'children']));
    }

    public function lineage(Person $person): JsonResponse
    {
        $path = collect();
        $current = $person;
        $visited = [];

        while ($current && ! in_array($current->id, $visited, true)) {
            $path->prepend($current);
            $visited[] = $current->id;
            $current = $current->parent;
        }

        return response()->json([
            'person' => new PersonResource($person),
            'path' => PersonResource::collection($path),
            'path_text' => $path->pluck('full_name')->implode(' ← '),
        ]);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'total' => Person::count(),
            'readable' => Person::where('status', 'readable')->count(),
            'review' => Person::where('status', 'review')->count(),
            'unclear' => Person::where('status', 'unclear')->count(),
            'generations' => Person::max('generation') ?? 0,
        ]);
    }
}
