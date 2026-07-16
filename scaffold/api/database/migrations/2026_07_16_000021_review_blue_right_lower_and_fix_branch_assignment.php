<?php

use App\Models\ChartEdge;
use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // مراجعة حدود الألوان أثبتت أن هذه الورقة تقع داخل الفرع الأزرق،
        // لا الفرع الأبيض كما سُجلت أول مرة.
        ChartReading::query()->where('source_key', 'white-w027')->update([
            'provisional_name' => 'شيخ جد آل النهدي',
            'normalized_name' => null,
            'chart_branch' => 'ahmad_faqih',
            'chart_color' => '#DCEEF2',
            'reading_status' => 'review',
            'confidence' => 90,
            'source_locator' => 'الفرع الأزرق - أعلى اليمين - الورقة المتصلة بعبيد الله',
            'notes' => 'ثبتت قراءة شيخ جد آل، وقراءة النهدي مرجحة بدرجة عالية. نُقلت الورقة إلى الفرع الأزرق بعد مراجعة حد اللون، وتبقى بانتظار اعتماد المشرف.',
        ]);

        $readings = [
            [
                'source_key' => 'blue-b030',
                'provisional_name' => 'محمد [اللقب مرجح: الباقر]',
                'normalized_name' => null,
                'parent_source_key' => null,
                'chart_branch' => 'ahmad_faqih',
                'chart_color' => '#DCEEF2',
                'node_type' => 'branch_label',
                'reading_status' => 'review',
                'confidence' => 87,
                'source_locator' => 'الفرع الأزرق - أسفل اليمين - الورقة الواقعة بين محمد البار ومحمد البيض',
                'notes' => 'محمد واضح، واللقب يُقرأ على الأرجح الباقر. لم يُعتمد النص نهائيًا لأن نقط القاف تحتاج مطابقة أخرى.',
            ],
            [
                'source_key' => 'blue-b031',
                'provisional_name' => 'محمد [الاسم الثاني غير محسوم]',
                'normalized_name' => null,
                'parent_source_key' => null,
                'chart_branch' => 'ahmad_faqih',
                'chart_color' => '#DCEEF2',
                'node_type' => 'person',
                'reading_status' => 'unclear',
                'confidence' => 58,
                'source_locator' => 'الفرع الأزرق - أسفل اليمين - العقدة البيضاوية الملاصقة لورقة blue-b030',
                'notes' => 'اسم محمد واضح، أما الكلمة أسفله فغير محسومة من النسخة الحالية. الاتصال بالورقة ظاهر، لكن الاسم الكامل ينتظر مراجعة المشرف.',
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

        $edges = [
            [
                'from_source_key' => 'blue-b010',
                'to_source_key' => 'white-w027',
                'relation_type' => 'branch_founder',
                'reading_status' => 'readable',
                'confidence' => 95,
                'source_locator' => 'الفرع الأزرق - أعلى اليمين - عبيد الله والورقة شيخ جد آل النهدي',
                'notes' => 'السهم في الصورة يعود من ورقة الأسرة إلى عقدة عبيد الله. حُفظ هنا بالاتجاه النسبي الموحد: عبيد الله مؤسس ثم ورقة الأسرة فرعًا.',
            ],
            [
                'from_source_key' => 'blue-b031',
                'to_source_key' => 'blue-b030',
                'relation_type' => 'branch_founder',
                'reading_status' => 'review',
                'confidence' => 90,
                'source_locator' => 'الفرع الأزرق - أسفل اليمين - العقدة الملاصقة وورقة محمد [الباقر]',
                'notes' => 'الاتصال المباشر ظاهر، لكن الاسم الثاني للعقدة ولقب الورقة ما زالا بحاجة إلى اعتماد المشرف.',
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
        ChartEdge::query()->whereIn('to_source_key', ['white-w027', 'blue-b030'])->delete();
        ChartReading::query()->whereIn('source_key', ['blue-b030', 'blue-b031'])->delete();

        ChartReading::query()->where('source_key', 'white-w027')->update([
            'provisional_name' => 'شيخ جد آل [اللقب غير محسوم]',
            'normalized_name' => null,
            'chart_branch' => 'abdullah_alawi_faqih',
            'chart_color' => '#FFFFFF',
            'reading_status' => 'unclear',
            'confidence' => 55,
            'source_locator' => 'الفرع الأبيض - يمين المنتصف - الورقة التي تبدأ بكلمة شيخ',
        ]);
    }
};
