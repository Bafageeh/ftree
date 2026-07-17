<?php

use App\Models\ChartEdge;
use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $updates = [
            'green-g015-541-436' => [
                'provisional_name' => 'عبد الرحمن بن علي خضير',
                'normalized_name' => 'عبد الرحمن بن علي خضير',
                'reading_status' => 'readable',
                'confidence' => 99,
                'notes' => 'ثبتت العبارة كاملة من الورقة الكبيرة في النسخة الأصلية عالية الدقة.',
            ],
            'green-g070-965-1041' => [
                'provisional_name' => 'هاشم',
                'normalized_name' => 'هاشم',
                'reading_status' => 'readable',
                'confidence' => 98,
                'notes' => 'شكل الشين والنقط واضحان في النسخة الأصلية.',
            ],
            'green-g072-1450-1063' => [
                'provisional_name' => 'علوي الغيور',
                'normalized_name' => 'علوي الغيور',
                'reading_status' => 'readable',
                'confidence' => 96,
                'notes' => 'ثبت الاسم واللقب من القصاصة الأصلية المكبرة.',
            ],
            'green-g078-880-1115' => [
                'provisional_name' => 'عقيل جد آل باعوي',
                'normalized_name' => 'عقيل جد آل باعوي',
                'reading_status' => 'readable',
                'confidence' => 95,
                'notes' => 'ثبتت العبارة من النسخة الأصلية؛ باعوي ظاهرة بوضوح كافٍ.',
            ],
            'green-g094-1035-1227' => [
                'provisional_name' => 'أبو بكر بن محمد',
                'normalized_name' => 'أبو بكر بن محمد',
                'reading_status' => 'readable',
                'confidence' => 98,
                'notes' => 'ثبت الاسم المركب من النسخة الأصلية عالية الدقة.',
            ],
            'green-g095-1485-1256' => [
                'provisional_name' => 'علي الفقيه ٥٩٠هـ',
                'normalized_name' => 'علي الفقيه ٥٩٠هـ',
                'reading_status' => 'readable',
                'confidence' => 97,
                'notes' => 'الاسم والتاريخ ٥٩٠هـ ظاهران بوضوح في العقدة.',
            ],
        ];

        foreach ($updates as $sourceKey => $values) {
            ChartReading::query()->where('source_key', $sourceKey)->update($values);
        }

        $edges = [
            [
                'from_source_key' => 'green-g006-1149-364',
                'to_source_key' => 'green-g003-969-254',
                'relation_type' => 'branch_founder',
                'reading_status' => 'readable',
                'confidence' => 98,
                'source_locator' => 'أعلى الفرع الأخضر - محمد وورقة الهادي جد بيت آل الهادي',
                'notes' => 'السهم المباشر في المشجرة يصل الورقة بعقدة محمد. حُفظ بالاتجاه النسبي الموحد: محمد مؤسس ثم ورقة الهادي فرعًا.',
            ],
            [
                'from_source_key' => 'green-g012-934-434',
                'to_source_key' => 'green-g004-741-317',
                'relation_type' => 'branch_founder',
                'reading_status' => 'readable',
                'confidence' => 97,
                'source_locator' => 'أعلى الفرع الأخضر - حسن الأحمر وورقة يحيى جد آل بن يحيى',
                'notes' => 'الاتصال المباشر ظاهر بوضوح في النسخة الأصلية. حُفظ بالاتجاه النسبي الموحد: حسن الأحمر مؤسس ثم ورقة يحيى فرعًا.',
            ],
        ];

        foreach ($edges as $edge) {
            ChartEdge::updateOrCreate(
                [
                    'from_source_key' => $edge['from_source_key'],
                    'to_source_key' => $edge['to_source_key'],
                    'relation_type' => $edge['relation_type'],
                ],
                [
                    'reading_status' => $edge['reading_status'],
                    'confidence' => $edge['confidence'],
                    'approval_status' => 'pending_supervisor',
                    'source_locator' => $edge['source_locator'],
                    'notes' => $edge['notes'],
                ]
            );
        }
    }

    public function down(): void
    {
        ChartEdge::query()->whereIn('from_source_key', [
            'green-g006-1149-364',
            'green-g012-934-434',
        ])->whereIn('to_source_key', [
            'green-g003-969-254',
            'green-g004-741-317',
        ])->delete();
    }
};
