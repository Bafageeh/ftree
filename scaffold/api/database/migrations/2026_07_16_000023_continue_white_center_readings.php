<?php

use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // التكبير حسم عبارة طاهر جد آل حضر، فترفع من المراجعة إلى قراءة واضحة.
        ChartReading::query()->where('source_key', 'white-w026')->update([
            'provisional_name' => 'طاهر جد آل حضر',
            'normalized_name' => 'طاهر جد آل حضر',
            'reading_status' => 'readable',
            'confidence' => 98,
            'notes' => 'ثبتت العبارة من القصاصة المكبرة. تبقى علاقة المؤسس بانتظار اعتماد المشرف.',
        ]);

        $readings = [
            [
                'source_key' => 'white-w030',
                'provisional_name' => 'محمد السقاف',
                'normalized_name' => 'محمد السقاف',
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'person',
                'reading_status' => 'readable',
                'confidence' => 97,
                'source_locator' => 'الفرع الأبيض - وسط الجهة اليمنى - العقدة البيضاوية أسفل علوي',
                'notes' => 'محمد والسقاف مقروءان بوضوح. السهم المجاور لم يُحسم رمزه بعد.',
            ],
            [
                'source_key' => 'white-w031',
                'provisional_name' => 'أحمد مزروق',
                'normalized_name' => null,
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'person',
                'reading_status' => 'review',
                'confidence' => 91,
                'source_locator' => 'الفرع الأبيض - وسط الجهة اليمنى - العقدة المجاورة لمحمد السقاف',
                'notes' => 'أحمد واضح، وقراءة مزروق مرجحة بدرجة عالية وتنتظر اعتماد المشرف.',
            ],
            [
                'source_key' => 'white-w032',
                'provisional_name' => 'عبيد الله وطاب',
                'normalized_name' => 'عبيد الله وطاب',
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'person',
                'reading_status' => 'readable',
                'confidence' => 97,
                'source_locator' => 'الفرع الأبيض - الوسط السفلي - العقدة الكبيرة بين عدة أسهم',
                'notes' => 'الاسم المركب مقروء بوضوح من التكبير. تعدد الأسهم حول العقدة يمنع تعيين أب واحد قبل المراجعة.',
            ],
            [
                'source_key' => 'white-w033',
                'provisional_name' => 'عقيل مدجج',
                'normalized_name' => null,
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'person',
                'reading_status' => 'review',
                'confidence' => 88,
                'source_locator' => 'الفرع الأبيض - وسط اليمين - العقدة الواقعة يسار شيخ',
                'notes' => 'عقيل واضح، وضبط مدجج مرجح من الصورة المكبرة ويحتاج اعتماد المشرف.',
            ],
            [
                'source_key' => 'white-w034',
                'provisional_name' => 'محمد [صلة الطويلة غير محسومة]',
                'normalized_name' => null,
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'person',
                'reading_status' => 'review',
                'confidence' => 76,
                'source_locator' => 'الفرع الأبيض - أعلى الوسط - العقدة متعددة الأسطر فوق البوقي',
                'notes' => 'محمد واضح، وتظهر كلمة الطويلة في السطر الأخير، أما كلمة الصلة الوسطى فلم تُحسم حرفيًا.',
            ],
        ];

        foreach ($readings as $reading) {
            ChartReading::updateOrCreate(
                ['source_key' => $reading['source_key']],
                [
                    ...$reading,
                    'is_promoted' => false,
                    'person_id' => null,
                ]
            );
        }
    }

    public function down(): void
    {
        ChartReading::query()->whereIn('source_key', [
            'white-w030',
            'white-w031',
            'white-w032',
            'white-w033',
            'white-w034',
        ])->delete();

        ChartReading::query()->where('source_key', 'white-w026')->update([
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 91,
            'notes' => 'طاهر وجد آل واضحان، وقراءة حضر مرجحة وتحتاج اعتماد المشرف.',
        ]);
    }
};
