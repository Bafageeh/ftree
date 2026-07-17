<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PersonResource;
use App\Models\ChartEdge;
use App\Models\ChartReading;
use App\Models\Person;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SupervisorReviewController extends Controller
{
    public function reviewPerson(Request $request, Person $person): PersonResource
    {
        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approve', 'pending', 'reject'])],
            'full_name' => ['nullable', 'string', 'max:255'],
            'reading_status' => ['nullable', Rule::in(['readable', 'review', 'unclear'])],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($person, $validated): void {
            $decision = $validated['decision'];
            $fullName = trim((string) ($validated['full_name'] ?? $person->full_name));
            $readingStatus = $validated['reading_status'] ?? $person->status;
            $note = trim((string) ($validated['note'] ?? ''));

            $person->forceFill([
                'full_name' => $fullName !== '' ? $fullName : $person->full_name,
                'status' => $readingStatus,
                'approval_status' => match ($decision) {
                    'approve' => 'supervisor_confirmed',
                    'reject' => 'rejected',
                    default => 'pending_supervisor',
                },
                'is_provisional' => $decision !== 'approve',
                'supervisor_note' => $note !== '' ? $note : null,
                'approved_at' => $decision === 'approve' ? now() : null,
            ])->save();

            $reading = $person->chartReading;
            if (! $reading) {
                return;
            }

            $reading->forceFill([
                'provisional_name' => $person->full_name,
                'normalized_name' => $decision === 'approve' ? $person->full_name : null,
                'reading_status' => $readingStatus,
                'notes' => $note !== ''
                    ? trim(implode("\n", array_filter([$reading->notes, 'ملاحظة المشرف: '.$note])))
                    : $reading->notes,
                'is_promoted' => true,
                'person_id' => $person->id,
            ])->saveQuietly();
        });

        return new PersonResource($person->fresh(['parent', 'children']));
    }

    public function reviewEdge(Request $request, ChartEdge $chartEdge): JsonResponse
    {
        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approve', 'pending', 'reject'])],
            'reverse' => ['sometimes', 'boolean'],
            'reading_status' => ['nullable', Rule::in(['readable', 'review', 'unclear'])],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($chartEdge, $validated): void {
            $decision = $validated['decision'];
            $note = trim((string) ($validated['note'] ?? ''));

            if (($validated['reverse'] ?? false) === true) {
                [$chartEdge->from_source_key, $chartEdge->to_source_key] = [
                    $chartEdge->to_source_key,
                    $chartEdge->from_source_key,
                ];
            }

            if ($decision === 'approve') {
                $parent = $this->personForSourceKey($chartEdge->from_source_key);
                $child = $this->personForSourceKey($chartEdge->to_source_key);

                if (! $parent || ! $child) {
                    throw ValidationException::withMessages([
                        'relation' => 'تعذر العثور على سجل الأب أو الابن. راجع رمزي الاسمين قبل الاعتماد.',
                    ]);
                }

                if ($parent->is($child) || $this->createsCycle($parent, $child)) {
                    throw ValidationException::withMessages([
                        'relation' => 'لا يمكن اعتماد هذه العلاقة لأنها ستنشئ دورة غير صحيحة في شجرة النسب.',
                    ]);
                }

                $child->forceFill([
                    'lineage_parent_id' => $parent->id,
                    'generation' => max(1, ((int) $parent->generation) + 1),
                ])->save();
            }

            $chartEdge->forceFill([
                'relation_type' => 'lineage',
                'reading_status' => $validated['reading_status'] ?? $chartEdge->reading_status,
                'approval_status' => match ($decision) {
                    'approve' => 'supervisor_confirmed',
                    'reject' => 'rejected',
                    default => 'pending_supervisor',
                },
                'notes' => $note !== ''
                    ? trim(implode("\n", array_filter([$chartEdge->notes, 'ملاحظة المشرف: '.$note])))
                    : $chartEdge->notes,
            ])->save();
        });

        return response()->json(['data' => $chartEdge->fresh()]);
    }

    private function personForSourceKey(string $sourceKey): ?Person
    {
        $person = Person::query()->where('source_code', $sourceKey)->first();
        if ($person) {
            return $person;
        }

        return ChartReading::query()
            ->where('source_key', $sourceKey)
            ->with('person')
            ->first()
            ?->person;
    }

    private function createsCycle(Person $parent, Person $child): bool
    {
        $current = $parent;
        $visited = [];

        while ($current && ! isset($visited[$current->id])) {
            if ($current->id === $child->id) {
                return true;
            }

            $visited[$current->id] = true;
            $current = $current->lineage_parent_id
                ? Person::query()->find($current->lineage_parent_id)
                : null;
        }

        return false;
    }
}
