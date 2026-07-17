<?php

use App\Models\ChartEdge;
use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // تصحيحات من النسخة الأصلية بدقة 600dpi.
        $updates = [
            'green-g003-969-254' => [
                'provisional_name' => 'الهادي جد بيت آل الهادي',
                'normalized_name' => 'الهادي جد بيت آل الهادي',
                'reading_status' => 'readable',
                'confidence' => 99,
                'notes' => 'صححت القراءة السابقة «الهاروني». النص في الورقة واضح: الهادي جد بيت آل الهادي.',
            ],
            'green-g012-934-434' => [
                'provisional_name' => 'حسن الأحمر',
                'normalized_name' => 'حسن الأحمر',
                'reading_status' => 'readable',
                'confidence' => 98,
                'notes' => 'ثبت الاسم واللقب من النسخة الأصلية عالية الدقة.',
            ],
            'green-g016-784-497' => [
                'provisional_name' => 'سهل جد آل سهل',
                'normalized_name' => 'سهل جد آل سهل',
                'reading_status' => 'readable',
                'confidence' => 98,
                'notes' => 'صححت القراءة السابقة «سميط». العبارة الظاهرة: سهل جد آل سهل.',
            ],
            'green-g090-192-1179' => [
                'provisional_name' => 'أبو بكر فقيه جد آل بن بكر الفقيه للسقاف بن عقيل',
                'normalized_name' => null,
                'reading_status' => 'review',
                'confidence' => 93,
                'notes' => 'قرئت العبارة متعددة الأسطر من النسخة الأصلية: أبو بكر فقيه، جد آل بن بكر الفقيه، للسقاف بن عقيل. تبقى للمراجعة بسبب طول العبارة وترتيبها.',
            ],
        ];

        foreach ($updates as $sourceKey => $values) {
            ChartReading::query()->where('source_key', $sourceKey)->update($values);
        }

        $readings = [
            [
                'source_key' => 'green-west-w001',
                'provisional_name' => 'عمر العمري ٩٤٤هـ',
                'normalized_name' => 'عمر العمري ٩٤٤هـ',
                'chart_branch' => 'ali_alawi_faqih',
                'chart_color' => '#8EDB79',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 98,
                'source_locator' => 'الفرع الأخضر - الجهة اليسرى الوسطى - الورقة الكبيرة ذات التاريخ ٩٤٤',
                'notes' => 'الاسم والتاريخ واضحان من النسخة الأصلية. التاريخ محفوظ كما ظهر على المشجرة.',
            ],
            [
                'source_key' => 'green-west-n001',
                'provisional_name' => 'شيخ العمري',
                'normalized_name' => 'شيخ العمري',
                'chart_branch' => 'ali_alawi_faqih',
                'chart_color' => '#8EDB79',
                'node_type' => 'person',
                'reading_status' => 'readable',
                'confidence' => 98,
                'source_locator' => 'الفرع الأخضر - العقدة المتصلة مباشرة بورقة عمر العمري ٩٤٤هـ',
                'notes' => 'العقدة والاتصال المباشر واضحان.',
            ],
            [
                'source_key' => 'green-west-w002',
                'provisional_name' => 'محمد آل الأهدل ١٢٢٨هـ',
                'normalized_name' => 'محمد آل الأهدل ١٢٢٨هـ',
                'chart_branch' => 'ali_alawi_faqih',
                'chart_color' => '#8EDB79',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 96,
                'source_locator' => 'الفرع الأخضر - الجهة اليسرى السفلية - الورقة الكبيرة ذات التاريخ ١٢٢٨',
                'notes' => 'الاسم والتاريخ مقروءان بوضوح جيد. يؤجل تعيين المؤسس حتى تتبع الخط المتصل كاملًا.',
            ],
            [
                'source_key' => 'green-west-w003',
                'provisional_name' => 'محمد المشهور',
                'normalized_name' => 'محمد المشهور',
                'chart_branch' => 'ali_alawi_faqih',
                'chart_color' => '#8EDB79',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأخضر - أسفل الجهة اليسرى - الورقة الكبيرة فوق الزخرفة',
                'notes' => 'موضع مستقل في الفرع الأخضر، ولا يدمج مع ورقة محمد المشهور في الفرع الأبيض.',
            ],
            [
                'source_key' => 'green-west-w004',
                'provisional_name' => 'محمد حمودة جد آل بن شعودة',
                'normalized_name' => null,
                'chart_branch' => 'ali_alawi_faqih',
                'chart_color' => '#8EDB79',
                'node_type' => 'branch_label',
                'reading_status' => 'review',
                'confidence' => 84,
                'source_locator' => 'الفرع الأخضر - الجهة اليسرى الوسطى - الورقة الكبيرة فوق عمر العمري',
                'notes' => 'محمد وحمودة وجد آل وبن ظاهرة. قراءة شعودة قوية، وتبقى العبارة بانتظار اعتماد المشرف.',
            ],
            [
                'source_key' => 'green-west-n002',
                'provisional_name' => 'عبد الله',
                'normalized_name' => 'عبد الله',
                'chart_branch' => 'ali_alawi_faqih',
                'chart_color' => '#8EDB79',
                'node_type' => 'person',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأخضر - العقدة المتصلة مباشرة بورقة محمد حمودة جد آل بن شعودة',
                'notes' => 'موضع مستقل لعقدة عبد الله؛ الرمز الموقعي يمنع خلطه بمواضع عبد الله الأخرى.',
            ],
            [
                'source_key' => 'lightgreen-l005',
                'provisional_name' => 'سهيل جد آل بن سهل',
                'normalized_name' => 'سهيل جد آل بن سهل',
                'chart_branch' => 'ali_faqih',
                'chart_color' => '#DFF3D4',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 98,
                'source_locator' => 'فرع علي بن الفقيه المقدم - أسفل الجهة الملاصقة للجذع البني',
                'notes' => 'ثبتت العبارة كاملة من النسخة الأصلية. يؤجل ربط المؤسس حتى مراجعة الخط الصاعد كاملًا.',
            ],
        ];

        foreach ($readings as $reading) {
            ChartReading::updateOrCreate(
                ['source_key' => $reading['source_key']],
                [
                    ...$reading,
                    'parent_source_key' => null,
                    'is_promoted' => false,
                    'person_id' => null,
                ]
            );
        }

        $edges = [
            [
                'from_source_key' => 'green-west-n001',
                'to_source_key' => 'green-west-w001',
                'relation_type' => 'branch_founder',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأخضر - شيخ العمري وورقة عمر العمري ٩٤٤هـ',
                'notes' => 'السهم المباشر ظاهر. حُفظ بالاتجاه النسبي الموحد: شيخ العمري مؤسس ثم ورقة عمر العمري فرعًا.',
            ],
            [
                'from_source_key' => 'green-west-n002',
                'to_source_key' => 'green-west-w004',
                'relation_type' => 'branch_founder',
                'reading_status' => 'review',
                'confidence' => 96,
                'source_locator' => 'الفرع الأخضر - عبد الله وورقة محمد حمودة جد آل بن شعودة',
                'notes' => 'الاتصال المباشر واضح، بينما نص الورقة نفسه ما زال بانتظار اعتماد المشرف.',
            ],
            [
                'from_source_key' => 'green-g086-385-1175',
                'to_source_key' => 'green-g090-192-1179',
                'relation_type' => 'branch_founder',
                'reading_status' => 'readable',
                'confidence' => 97,
                'source_locator' => 'الفرع الأخضر - عبد الرحمن الأبيض والورقة الطويلة لأبي بكر فقيه',
                'notes' => 'السهم المباشر من الورقة إلى عقدة عبد الرحمن الأبيض ظاهر في النسخة الأصلية؛ حُفظ بالاتجاه النسبي الموحد.',
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
            'green-west-n001',
            'green-west-n002',
            'green-g086-385-1175',
        ])->whereIn('to_source_key', [
            'green-west-w001',
            'green-west-w004',
            'green-g090-192-1179',
        ])->delete();

        ChartReading::query()->whereIn('source_key', [
            'green-west-w001',
            'green-west-n001',
            'green-west-w002',
            'green-west-w003',
            'green-west-w004',
            'green-west-n002',
            'lightgreen-l005',
        ])->delete();
    }
};
