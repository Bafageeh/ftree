<?php

namespace Database\Seeders;

use App\Models\ChartReading;
use App\Models\Person;
use Illuminate\Database\Seeder;

class ProvisionalPersonSeeder extends Seeder
{
    public function run(): void
    {
        $branchGeneration = [
            'ali_alawi_faqih' => 21,
            'abdullah_alawi_faqih' => 21,
            'ahmad_faqih' => 20,
            'ali_faqih' => 20,
            'abdulrahman_faqih' => 20,
        ];

        $peopleBySource = [];

        ChartReading::query()
            ->orderBy('id')
            ->each(function (ChartReading $reading) use (&$peopleBySource, $branchGeneration): void {
                $person = Person::query()->updateOrCreate(
                    ['chart_reading_id' => $reading->id],
                    [
                        'source_code' => $reading->source_key,
                        'full_name' => $reading->provisional_name,
                        'node_type' => $reading->node_type,
                        'honorific' => null,
                        'lineage_parent_id' => null,
                        'status' => $reading->reading_status,
                        'approval_status' => 'pending_supervisor',
                        'is_provisional' => true,
                        'supervisor_note' => null,
                        'approved_at' => null,
                        'chart_branch' => $reading->chart_branch,
                        'chart_color' => $reading->chart_color,
                        'generation' => $branchGeneration[$reading->chart_branch] ?? 1,
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

                $peopleBySource[$reading->source_key] = $person;

                $reading->forceFill([
                    'is_promoted' => true,
                    'person_id' => $person->id,
                ])->save();
            });

        ChartReading::query()
            ->whereNotNull('parent_source_key')
            ->orderBy('id')
            ->each(function (ChartReading $reading) use (&$peopleBySource): void {
                $person = $peopleBySource[$reading->source_key] ?? null;
                $parent = $peopleBySource[$reading->parent_source_key] ?? null;

                if (! $person || ! $parent) {
                    return;
                }

                $person->forceFill([
                    'lineage_parent_id' => $parent->id,
                    'generation' => max(1, $parent->generation + 1),
                ])->save();
            });
    }
}
