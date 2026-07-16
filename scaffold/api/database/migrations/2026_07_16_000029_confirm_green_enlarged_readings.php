<?php

use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $updates = [
            'green-g009-1639-395' => [
                'provisional_name' => 'عمر الهندوان',
                'normalized_name' => 'عمر الهندوان',
                'reading_status' => 'readable',
                'confidence' => 97,
                'notes' => 'ثبت الاسم واللقب من القصاصة المكبرة G009: عمر الهندوان. تبقى علاقة السهم بانتظار مطابقة العقدة المقابلة.',
            ],
            'green-g020-1183-520' => [
                'provisional_name' => 'عبد الرحمن زحوم',
                'normalized_name' => 'عبد الرحمن زحوم',
                'reading_status' => 'readable',
                'confidence' => 96,
                'notes' => 'ثبتت القراءة من القصاصة المكبرة G020: عبد الرحمن زحوم، وصححت القراءة الأقدم زقوم.',
            ],
            'green-g023-911-546' => [
                'provisional_name' => 'محمد جد آل مقيبل',
                'normalized_name' => 'محمد جد آل مقيبل',
                'reading_status' => 'readable',
                'confidence' => 96,
                'notes' => 'ثبتت العبارة من القصاصة المكبرة G023: محمد جد آل مقيبل. السهم الخارج من الورقة يحتاج القصاصة المجاورة لتحديد المؤسس.',
            ],
            'green-g008-1713-385' => [
                'provisional_name' => 'أبو بكر خربشان',
                'normalized_name' => null,
                'reading_status' => 'review',
                'confidence' => 90,
                'notes' => 'أبو بكر واضح، وقراءة خربشان قوية من القصاصة G008، لكن أول حرف من اللقب يبقى بانتظار اعتماد المشرف.',
            ],
        ];

        foreach ($updates as $sourceKey => $values) {
            ChartReading::query()->where('source_key', $sourceKey)->update($values);
        }
    }

    public function down(): void
    {
        ChartReading::query()->where('source_key', 'green-g009-1639-395')->update([
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 90,
        ]);

        ChartReading::query()->where('source_key', 'green-g020-1183-520')->update([
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 82,
        ]);

        ChartReading::query()->where('source_key', 'green-g023-911-546')->update([
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 91,
        ]);

        ChartReading::query()->where('source_key', 'green-g008-1713-385')->update([
            'confidence' => 82,
        ]);
    }
};
