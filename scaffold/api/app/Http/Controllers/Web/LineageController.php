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
        abort_unless($lineage->trace($person)['connected_to_prophet'], 404);

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

        $allRecords = $allPeople
            ->map(fn (Person $person) => [
                'person' => $person,
                'trace' => $lineage->trace($person),
            ])
            ->filter(fn (array $record) => $record['trace']['connected_to_prophet'])
            ->values();

        if ($selected) {
            $selectedTrace = $lineage->trace($selected);
            abort_unless($selectedTrace['connected_to_prophet'], 404);
        } else {
            $selectedTrace = null;
        }

        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('lineage_status', 'all');

        if (! in_array($status, ['all', 'connected', 'confirmed', 'pending'], true)) {
            $status = 'all';
        }

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
            ->when($status === 'confirmed', fn ($records) => $records->filter(fn (array $record) => $record['trace']['fully_confirmed']))
            ->when($status === 'pending', fn ($records) => $records->reject(fn (array $record) => $record['trace']['fully_confirmed']))
            ->values();

        $confirmed = $allRecords->filter(fn (array $record) => $record['trace']['fully_confirmed']);
        $pending = $allRecords->reject(fn (array $record) => $record['trace']['fully_confirmed']);

        return view('lineage.index', [
            'records' => $records,
            'selected' => $selected,
            'selectedTrace' => $selectedTrace,
            'search' => $search,
            'status' => $status,
            'counts' => [
                'total' => $allRecords->count(),
                'confirmed' => $confirmed->count(),
                'pending' => $pending->count(),
            ],
        ]);
    }
}
