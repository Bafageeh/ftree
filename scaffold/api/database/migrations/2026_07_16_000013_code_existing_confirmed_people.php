<?php

use App\Models\Person;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Person::query()
            ->whereNull('chart_reading_id')
            ->orderBy('chart_order')
            ->orderBy('id')
            ->each(function (Person $person): void {
                $person->forceFill([
                    'source_code' => $person->source_code ?: sprintf('CORE-%03d', $person->chart_order ?: $person->id),
                    'approval_status' => 'supervisor_confirmed',
                    'is_provisional' => false,
                    'approved_at' => $person->approved_at ?: now(),
                ])->save();
            });
    }

    public function down(): void
    {
        // Codes are stable references and should not be removed during rollback.
    }
};
