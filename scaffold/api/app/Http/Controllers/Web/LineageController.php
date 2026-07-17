<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Person;
use App\Services\PropheticLineageService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class LineageController extends Controller
{
    public function index(Request $request, PropheticLineageService $lineage): View
    {
        return $this->render($request, null, $lineage);
    }

    public function show(Request $request, Person $person, PropheticLineageService $lineage): View
    {
        abort_if($person->approval_status === 'rejected', 404);

        return $this->render($request, $person, $lineage);
    }

    private function render(Request $request, ?Person $selected, PropheticLineageService $lineage): View
    {
        $allPeople = Person::query()
            ->where('approval_status', '!=', 'rejected')
            ->orderByRaw('chart_order is null')
            ->orderBy('chart_order')
            ->orderBy('generation')
            ->orderBy('id')
            ->get();

        $lineage->warm($allPeople);

        $allRecords = $allPeople->map(fn (Person $person) => [
            'person' => $person,
            'trace' => $lineage->trace($person),
        ]);

        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('lineage_status', 'all');

        $records = $allRecords
            ->when($search !== '', function ($records) use ($search) {
                return $records->filter(function (array $record) use ($search) {
                    $person = $record['person'];
                    $haystack = implode(' ', array_filter([
                        $person->full_name,
                        $person->honorific,
                        $person->source_code,
                        $person->source_locator,
                    ]));

                    return mb_stripos($haystack, $search) !== false;
                });
            })
            ->when($status === 'connected', fn ($records) => $records->filter(fn (array $record) => $record['trace']['connected_to_prophet']))
            ->when($status === 'confirmed', fn ($records) => $records->filter(fn (array $record) => $record['trace']['fully_confirmed']))
            ->when($status === 'pending', fn ($records) => $records->filter(fn (array $record) => $record['trace']['connected_to_prophet'] && ! $record['trace']['fully_confirmed']))
            ->when($status === 'disconnected', fn ($records) => $records->reject(fn (array $record) => $record['trace']['connected_to_prophet']))
            ->values();

        $connected = $allRecords->filter(fn (array $record) => $record['trace']['connected_to_prophet']);
        $confirmed = $allRecords->filter(fn (array $record) => $record['trace']['fully_confirmed']);
        $pending = $connected->reject(fn (array $record) => $record['trace']['fully_confirmed']);
        $disconnected = $allRecords->reject(fn (array $record) => $record['trace']['connected_to_prophet']);

        return view('lineage.index', [
            'records' => $records,
            'selected' => $selected,
            'selectedTrace' => $selected ? $lineage->trace($selected) : null,
            'search' => $search,
            'status' => $status,
            'counts' => [
                'total' => $allRecords->count(),
                'connected' => $connected->count(),
                'confirmed' => $confirmed->count(),
                'pending' => $pending->count(),
                'disconnected' => $disconnected->count(),
            ],
        ]);
    }
}
