<?php

use App\Models\ChartEdge;
use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // التكبير الأعلى دقة أظهر أن الكلمة الثانية في العقدة المتصلة
        // بورقة محمد الكاف تُقرأ على الأرجح «بركة».
        ChartReading::query()->where('source_key', 'blue-b031')->update([
            'provisional_name' => 'محمد بركة',
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 92,
            'source_locator' => 'الفرع الأزرق - أسفل اليمين - العقدة البيضاوية المتصلة مباشرة بورقة محمد الكاف',
            'notes' => 'محمد واضح، وقراءة بركة قوية من التكبير الجديد. تبقى بانتظار اعتماد المشرف قبل تحويلها إلى قراءة نهائية.',
        ]);

        // عقدة واضحة إضافية بجوار ورقة محمد البيض.
        ChartReading::updateOrCreate(
            ['source_key' => 'blue-b032'],
            [
                'provisional_name' => 'محبوب',
                'normalized_name' => 'محبوب',
                'parent_source_key' => null,
                'chart_branch' => 'ahmad_faqih',
                'chart_color' => '#DCEEF2',
                'node_type' => 'person',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأزرق - أسفل اليمين - العقدة الأفقية يسار ورقة محمد البيض',
                'notes' => 'الاسم مقروء بوضوح شديد، والسهم المباشر إلى ورقة محمد البيض ظاهر في القصاصة المكبرة.',
                'is_promoted' => false,
                'person_id' => null,
            ]
        );

        $edges = [
            [
                'from_source_key' => 'blue-b032',
                'to_source_key' => 'blue-b027',
                'relation_type' => 'branch_founder',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأزرق - محبوب وورقة محمد البيض',
                'notes' => 'السهم المباشر ظاهر بوضوح. حُفظت العلاقة بالاتجاه النسبي الموحد: محبوب مؤسس ثم محمد البيض فرعًا.',
            ],
            [
                'from_source_key' => 'blue-b020',
                'to_source_key' => 'blue-b027',
                'relation_type' => 'branch_founder',
                'reading_status' => 'readable',
                'confidence' => 96,
                'source_locator' => 'الفرع الأزرق - عقدة عبد الرحمن العليا وورقة محمد البيض',
                'notes' => 'يظهر سهم ثانٍ واضح من عقدة عبد الرحمن إلى ورقة محمد البيض؛ لذلك للورقة أكثر من مؤسس مسجل بانتظار اعتماد المشرف.',
            ],
            [
                'from_source_key' => 'white-w018',
                'to_source_key' => 'white-w028',
                'relation_type' => 'branch_founder',
                'reading_status' => 'readable',
                'confidence' => 96,
                'source_locator' => 'الفرع الأبيض - عبيد الله وورقة محمد جد آل حامد',
                'notes' => 'السهم في النسخة المكبرة يصل ورقة محمد جد آل حامد بعقدة عبيد الله. حُفظ بالاتجاه النسبي الموحد: عبيد الله مؤسس ثم الورقة فرعًا.',
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
        ChartEdge::query()
            ->whereIn('from_source_key', ['blue-b032', 'blue-b020', 'white-w018'])
            ->whereIn('to_source_key', ['blue-b027', 'white-w028'])
            ->delete();

        ChartReading::query()->where('source_key', 'blue-b032')->delete();

        ChartReading::query()->where('source_key', 'blue-b031')->update([
            'provisional_name' => 'محمد [الاسم الثاني غير محسوم]',
            'normalized_name' => null,
            'reading_status' => 'unclear',
            'confidence' => 62,
            'notes' => 'اسم محمد واضح، والكلمة الثانية غير محسومة. ثبت أن العقدة متصلة بورقة محمد الكاف blue-b024.',
        ]);
    }
};
