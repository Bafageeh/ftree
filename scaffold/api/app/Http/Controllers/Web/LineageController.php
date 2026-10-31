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
        abort_unless($person->source_reference === 'الشجرة_مع_الجذع_المربوط(20261031-160557).xlsx', 404);
        abort_if($person->approval_status === 'rejected', 404);
        abort_unless($lineage->trace($person)['connected_to_prophet'], 404);

        return $this->render($request, $person, $lineage);
    }

    private static function normalizeSearchText(string $value): string
    {
        $value = mb_strtolower(trim($value), 'UTF-8');
        $value = preg_replace('/[\\x{064B}-\\x{065F}\\x{0670}\\x{0640}]/u', '', $value) ?? $value;
        $value = strtr($value, ['أ' => 'ا', 'إ' => 'ا', 'آ' => 'ا', 'ٱ' => 'ا', 'ى' => 'ي', 'ة' => 'ه', 'ؤ' => 'و', 'ئ' => 'ي']);
        return preg_replace('/\\s+/u', ' ', $value) ?? $value;
    }

    private function render(Request $request, ?Person $selected, PropheticLineageService $lineage): View
    {
        $allPeople = Person::query()
            ->where('approval_status', '!=', 'rejected')
            ->where('source_reference', 'الشجرة_مع_الجذع_المربوط(20261031-160557).xlsx')
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

                    $searchText = self::normalizeSearchText($search);
                    $recordText = self::normalizeSearchText($haystack);
                    $recordCompact = str_replace(' ', '', $recordText);
                    $terms = preg_split('/\s+/u', $searchText, -1, PREG_SPLIT_NO_EMPTY) ?: [];

                    foreach ($terms as $term) {
                        if (mb_strpos($recordText, $term) === false && mb_strpos($recordCompact, $term) === false) {
                            return false;
                        }
                    }

                    return count($terms) > 0;
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
