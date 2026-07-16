<?php

namespace App\Services;

use App\Models\ChartReading;
use App\Models\Person;

class ChartReadingPromoter
{
    public function promote(ChartReading $reading): Person
    {
        $branchGeneration = [
            'ali_alawi_faqih' => 21,
            'abdullah_alawi_faqih' => 21,
            'ahmad_faqih' => 20,
            'ali_faqih' => 20,
            'abdulrahman_faqih' => 20,
        ];

        $parent = $reading->parent_source_key
            ? Person::query()->where('source_code', $reading->parent_source_key)->first()
            : null;

        $person = Person::query()->updateOrCreate(
            ['chart_reading_id' => $reading->id],
            [
                'source_code' => $reading->source_key,
                'full_name' => $reading->provisional_name,
                'node_type' => $reading->node_type,
                'honorific' => null,
                'lineage_parent_id' => $parent?->id,
                'status' => $reading->reading_status,
                'approval_status' => 'pending_supervisor',
                'is_provisional' => true,
                'supervisor_note' => null,
                'approved_at' => null,
                'chart_branch' => $reading->chart_branch,
                'chart_color' => $reading->chart_color,
                'generation' => $parent
                    ? max(1, $parent->generation + 1)
                    : ($branchGeneration[$reading->chart_branch] ?? 1),
                'summary' => trim(implode("\n", array_filter([
                    'قراءة مرمزة كما ظهرت في المشجرة، وبانتظار اعتماد المشرف.',
                    $reading->notes,
                ]))),
                'source_reference' => 'مشجرة أصول السادة آل باعلوي - قراءة أولية مرمزة',
                'source_locator' => $reading->source_locator,
                'chart_order' => 1000 + $reading->id,
                'is_living' => false,
            ]
        );

        if (! $reading->is_promoted || $reading->person_id !== $person->id) {
            $reading->forceFill([
                'is_promoted' => true,
                'person_id' => $person->id,
            ])->saveQuietly();
        }

        return $person;
    }

    public function promoteAll(): int
    {
        $count = 0;

        ChartReading::query()->orderBy('id')->each(function (ChartReading $reading) use (&$count): void {
            $this->promote($reading);
            $count++;
        });

        ChartReading::query()
            ->whereNotNull('parent_source_key')
            ->orderBy('id')
            ->each(function (ChartReading $reading): void {
                $person = Person::query()->where('chart_reading_id', $reading->id)->first();
                $parent = Person::query()->where('source_code', $reading->parent_source_key)->first();

                if (! $person || ! $parent) {
                    return;
                }

                $person->forceFill([
                    'lineage_parent_id' => $parent->id,
                    'generation' => max(1, $parent->generation + 1),
                ])->save();
            });

        return $count;
    }
}
