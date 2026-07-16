<?php

use App\Models\ChartEdge;
use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // التكبير الكامل حسم أن الورقة ليست «محمد الباقر»، بل هي نفس ورقة
        // «محمد الكاف» المسجلة سابقًا برمز blue-b024. نحذف القراءة المكررة
        // وننقل اتصال العقدة المجاورة إلى الرمز الصحيح.
        ChartEdge::query()
            ->where('from_source_key', 'blue-b031')
            ->where('to_source_key', 'blue-b030')
            ->where('relation_type', 'branch_founder')
            ->delete();

        ChartReading::query()->where('source_key', 'blue-b030')->delete();

        ChartReading::query()->where('source_key', 'blue-b031')->update([
            'provisional_name' => 'محمد [الاسم الثاني غير محسوم]',
            'normalized_name' => null,
            'reading_status' => 'unclear',
            'confidence' => 62,
            'source_locator' => 'الفرع الأزرق - أسفل اليمين - العقدة البيضاوية المتصلة بورقة محمد الكاف',
            'notes' => 'اسم محمد واضح، والكلمة الثانية غير محسومة. ثبت أن العقدة متصلة بورقة محمد الكاف blue-b024، لا بقراءة مستقلة جديدة.',
        ]);

        ChartEdge::updateOrCreate(
            [
                'from_source_key' => 'blue-b031',
                'to_source_key' => 'blue-b024',
                'relation_type' => 'branch_founder',
            ],
            [
                'reading_status' => 'review',
                'confidence' => 94,
                'approval_status' => 'pending_supervisor',
                'source_locator' => 'الفرع الأزرق - أسفل اليمين - العقدة الملاصقة وورقة محمد الكاف',
                'notes' => 'الاتصال المباشر ظاهر بوضوح. الاسم الكامل للعقدة ما زال بانتظار اعتماد المشرف.',
            ]
        );

        // التكبير عالي التباين حسم اللقب: شريم، وليس شروق.
        ChartReading::query()->where('source_key', 'blue-b026')->update([
            'provisional_name' => 'محمد شريم',
            'normalized_name' => 'محمد شريم',
            'reading_status' => 'readable',
            'confidence' => 99,
            'notes' => 'تم تصحيح القراءة من محمد شروق إلى محمد شريم بعد تكبير الحروف عالي التباين. بانتظار اعتماد المشرف النهائي.',
        ]);

        $readings = [
            [
                'source_key' => 'green-g097-lower',
                'provisional_name' => 'علي بن باهارون',
                'normalized_name' => 'علي بن باهارون',
                'parent_source_key' => null,
                'chart_branch' => 'ali_alawi_faqih',
                'chart_color' => '#8EDB79',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأخضر - أسفل اليسار - الورقة العليا قرب الإطار البني',
                'notes' => 'الاسم واضح جدًا. السهم يخرج خارج القصاصة الحالية، لذلك لم يُعيّن الأب.',
            ],
            [
                'source_key' => 'green-g098-lower',
                'provisional_name' => 'أبو بكر الجنيد',
                'normalized_name' => 'أبو بكر الجنيد',
                'parent_source_key' => null,
                'chart_branch' => 'ali_alawi_faqih',
                'chart_color' => '#8EDB79',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأخضر - أسفل اليسار - الورقة الواقعة تحت علي بن باهارون',
                'notes' => 'الاسم واضح. يظهر اتصال إلى عقدة عمر، لكن رمز العقدة يحتاج مطابقة الصورة الكاملة قبل الربط.',
            ],
            [
                'source_key' => 'green-g099-lower',
                'provisional_name' => 'علي السري',
                'normalized_name' => 'علي السري',
                'parent_source_key' => null,
                'chart_branch' => 'ali_alawi_faqih',
                'chart_color' => '#8EDB79',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأخضر - أسفل اليسار - الورقة الثالثة قرب الإطار البني',
                'notes' => 'الاسم مقروء بوضوح، ويؤجل الربط حتى تتبع السهم في لقطة أوسع.',
            ],
            [
                'source_key' => 'green-g100-lower',
                'provisional_name' => 'محمد القمري',
                'normalized_name' => 'محمد القمري',
                'parent_source_key' => null,
                'chart_branch' => 'ali_alawi_faqih',
                'chart_color' => '#8EDB79',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأخضر - أسفل الصفحة - الورقة الكبيرة فوق أسفل الإطار',
                'notes' => 'الاسم واضح جدًا. مسار السهم جزئي في القصاصة الحالية، لذلك لم يُثبت المؤسس بعد.',
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
            'green-g097-lower',
            'green-g098-lower',
            'green-g099-lower',
            'green-g100-lower',
        ])->delete();

        ChartEdge::query()
            ->where('from_source_key', 'blue-b031')
            ->where('to_source_key', 'blue-b024')
            ->where('relation_type', 'branch_founder')
            ->delete();

        ChartReading::query()->where('source_key', 'blue-b026')->update([
            'provisional_name' => 'محمد شروق',
            'normalized_name' => 'محمد شروق',
            'reading_status' => 'readable',
            'confidence' => 96,
        ]);
    }
};
