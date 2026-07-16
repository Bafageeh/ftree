<?php

use App\Models\ChartEdge;
use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // مراجعة لاحقة أظهرت أن هذه الروابط الأربع لم تكن ظاهرة بما يكفي في القصاصة.
        // نزيلها من النسب المؤقت بدل الإبقاء على علاقة قد تكون خاطئة.
        ChartReading::query()
            ->whereIn('source_key', ['white-w001', 'white-w003', 'white-w004', 'white-w005'])
            ->update(['parent_source_key' => null]);

        ChartReading::query()->where('source_key', 'white-w001')->update([
            'reading_status' => 'review',
            'normalized_name' => null,
            'confidence' => 60,
            'notes' => 'أعيدت هذه القراءة إلى المراجعة؛ النص والربط السابقان لم يطابقا السهم بوضوح كافٍ في النسخة المكبرة.',
        ]);

        // تكبير الجهة اليمنى حسم لقب القمري.
        ChartReading::query()->where('source_key', 'blue-b022')->update([
            'provisional_name' => 'محمد جد آل القمري',
            'normalized_name' => 'محمد جد آل القمري',
            'reading_status' => 'readable',
            'confidence' => 98,
            'notes' => 'تم تثبيت قراءة القمري من القصاصة عالية الدقة، ويبقى اعتماد المشرف النهائي.',
        ]);

        $readings = [
            [
                'source_key' => 'white-w025',
                'provisional_name' => 'البوقي',
                'normalized_name' => null,
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'branch_label',
                'reading_status' => 'review',
                'confidence' => 90,
                'source_locator' => 'الفرع الأبيض - أعلى اليمين - الورقة أسفل عبد الرحمن الشاطري',
                'notes' => 'القراءة الأقرب: البوقي. تظهر للورقة أكثر من وصلة، لذلك لا تُجبر على أب واحد.',
            ],
            [
                'source_key' => 'white-w026',
                'provisional_name' => 'طاهر جد آل حضر',
                'normalized_name' => null,
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'branch_label',
                'reading_status' => 'review',
                'confidence' => 91,
                'source_locator' => 'الفرع الأبيض - أعلى اليمين - الورقة الواقعة أسفل البوقي',
                'notes' => 'طاهر وجد آل واضحان، وقراءة حضر مرجحة وتحتاج اعتماد المشرف.',
            ],
            [
                'source_key' => 'white-w027',
                'provisional_name' => 'شيخ جد آل [اللقب غير محسوم]',
                'normalized_name' => null,
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'branch_label',
                'reading_status' => 'unclear',
                'confidence' => 55,
                'source_locator' => 'الفرع الأبيض - يمين المنتصف - الورقة التي تبدأ بكلمة شيخ',
                'notes' => 'شيخ جد آل مقروءة، أما لقب الأسرة فغير محسوم من النسخة الحالية.',
            ],
            [
                'source_key' => 'white-w028',
                'provisional_name' => 'محمد جد آل حامد',
                'normalized_name' => 'محمد جد آل حامد',
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 96,
                'source_locator' => 'الفرع الأبيض - أعلى الوسط - الورقة المجاورة لمحمد صاحب المشهد',
                'notes' => 'الاسم مقروء من النسخة المكبرة؛ السهم المقابل يحتاج مطابقة أوسع قبل الربط.',
            ],
            [
                'source_key' => 'white-w029',
                'provisional_name' => 'محمد صاحب المشهد',
                'normalized_name' => 'محمد صاحب المشهد',
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأبيض - أعلى اليسار من الجهة اليمنى - ورقة محمد صاحب المشهد',
                'notes' => 'قراءة واضحة جدًا، ولم يُحسم رمز المؤسس المتصل بالورقة بعد.',
            ],
            [
                'source_key' => 'blue-b025',
                'provisional_name' => 'سالم جد آل بن سهل والرويقي',
                'normalized_name' => null,
                'parent_source_key' => 'blue-b007',
                'chart_branch' => 'ahmad_faqih',
                'chart_color' => '#DCEEF2',
                'node_type' => 'branch_label',
                'reading_status' => 'review',
                'confidence' => 90,
                'source_locator' => 'الفرع الأزرق - يمين المنتصف - الورقة المتصلة بعقدة سالم',
                'notes' => 'سالم جد آل بن سهل واضحة، والرويقي قراءة مرجحة. السهم المباشر من سالم ظاهر.',
            ],
            [
                'source_key' => 'blue-b026',
                'provisional_name' => 'محمد شروق',
                'normalized_name' => null,
                'parent_source_key' => null,
                'chart_branch' => 'ahmad_faqih',
                'chart_color' => '#DCEEF2',
                'node_type' => 'branch_label',
                'reading_status' => 'review',
                'confidence' => 84,
                'source_locator' => 'الفرع الأزرق - يمين المنتصف - الورقة فوق محمد جد آل القمري',
                'notes' => 'محمد واضح، واللقب شروق مرجح. تظهر وصْلتان من عقدتين باسم عبد الرحمن.',
            ],
            [
                'source_key' => 'blue-b027',
                'provisional_name' => 'محمد البيض',
                'normalized_name' => 'محمد البيض',
                'parent_source_key' => 'blue-b029',
                'chart_branch' => 'ahmad_faqih',
                'chart_color' => '#DCEEF2',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 95,
                'source_locator' => 'الفرع الأزرق - أسفل اليمين - الورقة فوق الزخرفة',
                'notes' => 'الاسم واضح، والسهم المباشر من محروس ظاهر في النسخة المكبرة.',
            ],
            [
                'source_key' => 'blue-b028',
                'provisional_name' => 'عبد الرحمن بلفقيه',
                'normalized_name' => 'عبد الرحمن بلفقيه',
                'parent_source_key' => null,
                'chart_branch' => 'ahmad_faqih',
                'chart_color' => '#DCEEF2',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأزرق - أسفل الوسط - ورقة عبد الرحمن بلفقيه',
                'notes' => 'قراءة واضحة جدًا؛ يحتاج السهم إلى لقطة أوسع لتعيين رمز المؤسس.',
            ],
            [
                'source_key' => 'blue-b029',
                'provisional_name' => 'محروس',
                'normalized_name' => 'محروس',
                'parent_source_key' => null,
                'chart_branch' => 'ahmad_faqih',
                'chart_color' => '#DCEEF2',
                'node_type' => 'person',
                'reading_status' => 'readable',
                'confidence' => 96,
                'source_locator' => 'الفرع الأزرق - أسفل اليمين - العقدة المتصلة بمحمد البيض',
                'notes' => 'العقدة مقروءة محروس، ويتجه سهمها إلى ورقة محمد البيض.',
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
            ['white-w007', 'white-w006', 'lineage', 'readable', 99, 'الفرع الأبيض - سلسلة المشهور', 'مرزوق ← علوي بحسب اتجاه السهم من الأب إلى الابن.'],
            ['white-w006', 'white-w021', 'branch_founder', 'readable', 99, 'الفرع الأبيض - ورقة محمد المشهور', 'علوي يتصل مباشرة بورقة محمد المشهور.'],
            ['white-w009', 'white-w022', 'branch_founder', 'readable', 98, 'الفرع الأبيض - ورقة عبد الرحمن الشاطري', 'أبو بكر يتصل مباشرة بورقة عبد الرحمن الشاطري.'],
            ['blue-b007', 'blue-b025', 'branch_founder', 'readable', 96, 'الفرع الأزرق - ورقة سالم جد آل بن سهل والرويقي', 'السهم المباشر من سالم إلى ورقة الأسرة ظاهر.'],
            ['blue-b029', 'blue-b027', 'branch_founder', 'readable', 97, 'الفرع الأزرق - ورقة محمد البيض', 'السهم المباشر من محروس إلى محمد البيض ظاهر.'],
            ['blue-b006', 'blue-b026', 'branch_founder', 'review', 82, 'الفرع الأزرق - ورقة محمد شروق', 'إحدى الوصلتين الظاهرتين تأتي من عقدة باسم عبد الرحمن؛ تعيين الرمز مرجح.'],
            ['blue-b020', 'blue-b026', 'branch_founder', 'review', 82, 'الفرع الأزرق - ورقة محمد شروق', 'الوصلة الثانية الظاهرة تأتي من عقدة أخرى باسم عبد الرحمن؛ تعيين الرمز مرجح.'],
        ];

        foreach ($edges as [$from, $to, $type, $status, $confidence, $locator, $notes]) {
            ChartEdge::updateOrCreate(
                [
                    'from_source_key' => $from,
                    'to_source_key' => $to,
                    'relation_type' => $type,
                ],
                [
                    'reading_status' => $status,
                    'confidence' => $confidence,
                    'approval_status' => 'pending_supervisor',
                    'source_locator' => $locator,
                    'notes' => $notes,
                ]
            );
        }
    }

    public function down(): void
    {
        ChartEdge::query()->whereIn('to_source_key', [
            'white-w006', 'white-w021', 'white-w022',
            'blue-b025', 'blue-b026', 'blue-b027',
        ])->delete();

        ChartReading::query()->whereIn('source_key', [
            'white-w025', 'white-w026', 'white-w027', 'white-w028', 'white-w029',
            'blue-b025', 'blue-b026', 'blue-b027', 'blue-b028', 'blue-b029',
        ])->delete();
    }
};
