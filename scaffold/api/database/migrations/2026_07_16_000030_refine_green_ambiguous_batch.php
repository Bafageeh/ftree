<?php

use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $updates = [
            'green-g025-1549-599' => [
                'provisional_name' => 'عبد الله عبود',
                'normalized_name' => 'عبد الله عبود',
                'reading_status' => 'readable',
                'confidence' => 97,
                'notes' => 'ثبت الاسم كاملًا من القصاصة المكبرة G025: عبد الله عبود.',
            ],
            'green-g026-1624-609' => [
                'provisional_name' => 'حسن الروع',
                'normalized_name' => 'حسن الروع',
                'reading_status' => 'readable',
                'confidence' => 95,
                'notes' => 'ثبتت القراءة من القصاصة المكبرة G026: حسن الروع.',
            ],
            'green-g035-1095-650' => [
                'provisional_name' => 'زين جد آل عقيل بن عمر',
                'normalized_name' => 'زين جد آل عقيل بن عمر',
                'reading_status' => 'readable',
                'confidence' => 95,
                'notes' => 'ثبتت العبارة متعددة الأسطر من القصاصة G035: زين جد آل عقيل بن عمر.',
            ],
            'green-g051-1370-876' => [
                'provisional_name' => 'محمد جبر',
                'normalized_name' => 'محمد جبر',
                'reading_status' => 'readable',
                'confidence' => 96,
                'notes' => 'ثبت الاسم من التكبير G051: محمد جبر.',
            ],
            'green-g059-743-917' => [
                'provisional_name' => 'أحمد عبيد بكير',
                'normalized_name' => null,
                'reading_status' => 'review',
                'confidence' => 92,
                'notes' => 'أحمد عبيد واضحان، وقراءة بكير قوية من القصاصة المكبرة، وتبقى بانتظار اعتماد المشرف.',
            ],
        ];

        foreach ($updates as $sourceKey => $values) {
            ChartReading::query()->where('source_key', $sourceKey)->update($values);
        }
    }

    public function down(): void
    {
        ChartReading::query()->where('source_key', 'green-g025-1549-599')->update([
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 84,
        ]);

        ChartReading::query()->where('source_key', 'green-g026-1624-609')->update([
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 82,
        ]);

        ChartReading::query()->where('source_key', 'green-g035-1095-650')->update([
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 68,
        ]);

        ChartReading::query()->where('source_key', 'green-g051-1370-876')->update([
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 88,
        ]);

        ChartReading::query()->where('source_key', 'green-g059-743-917')->update([
            'provisional_name' => 'أحمد عبيد [اللقب غير محسوم]',
            'normalized_name' => null,
            'reading_status' => 'unclear',
            'confidence' => 52,
        ]);
    }
};
