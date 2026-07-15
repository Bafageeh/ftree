<?php

use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        ChartReading::where('source_key', 'green-g015-541-436')->update([
            'provisional_name' => 'عبد الرحمن بن علي حبشي',
            'normalized_name' => 'عبد الرحمن بن علي حبشي',
            'reading_status' => 'readable',
            'confidence' => 97,
            'notes' => 'تمت مراجعة القصاصة المكبرة؛ القراءة الواضحة: عبد الرحمن بن علي حبشي.',
        ]);

        ChartReading::where('source_key', 'green-g016-784-497')->update([
            'provisional_name' => 'سهل جد آل سهل',
            'normalized_name' => 'سهل جد آل سهل',
            'reading_status' => 'readable',
            'confidence' => 96,
            'notes' => 'تمت مراجعة القصاصة المكبرة؛ العبارة الواضحة: سهل جد آل سهل.',
        ]);
    }

    public function down(): void
    {
        ChartReading::where('source_key', 'green-g015-541-436')->update([
            'provisional_name' => 'عبد الرحمن بن علي خضير',
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 84,
            'notes' => 'قراءة سابقة قبل مراجعة القصاصة المكبرة.',
        ]);

        ChartReading::where('source_key', 'green-g016-784-497')->update([
            'provisional_name' => 'سهل جد آل سميط',
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 82,
            'notes' => 'قراءة سابقة قبل مراجعة القصاصة المكبرة.',
        ]);
    }
};
