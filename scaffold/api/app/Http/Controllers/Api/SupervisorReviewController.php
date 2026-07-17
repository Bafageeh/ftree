<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PersonResource;
use App\Models\Person;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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
}
