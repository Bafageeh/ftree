<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $rows = [
            // المجموعة A: أعلى يسار القسم S03-04.
            ['S03-04-A-ROOT-U001', 'S03-04-A-ROOT-U001', 'CORE-022', 'unclear', null, 'حلقة وصل مؤقتة للأجيال السابقة غير الظاهرة كاملة في القصاصة', 2400],
            ['S03-04-A-AHMAD-001', 'أحمد', 'S03-04-A-ROOT-U001', 'readable', null, 'العقدة الأب التي تتجه إليها عدة أسهم في أعلى يسار القسم', 2401],
            ['S03-04-A-ABUBAKR-001', 'أبو بكر', 'S03-04-A-AHMAD-001', 'readable', null, 'السهم من أبي بكر إلى أحمد', 2402],
            ['S03-04-A-MUHAMMAD-001', 'محمد', 'S03-04-A-ABUBAKR-001', 'readable', null, 'السهم من محمد إلى أبي بكر', 2403],
            ['S03-04-A-ABUBAKR-002', 'أبو بكر', 'S03-04-A-MUHAMMAD-001', 'readable', null, 'السهم من أبي بكر إلى محمد', 2404],
            ['S03-04-A-MUHAMMAD-ALWISAL', 'محمد الوصال', 'S03-04-A-ABUBAKR-002', 'readable', null, 'السهم من محمد الوصال إلى أبي بكر', 2405],
            ['S03-04-A-ABDULLAH-001', 'عبد الله', 'S03-04-A-AHMAD-001', 'readable', null, 'السهم من عبد الله إلى أحمد', 2406],
            ['S03-04-A-ABUBAKR-003', 'أبو بكر', 'S03-04-A-ABDULLAH-001', 'readable', 'بقية اللقب غير واضحة', 'السهم من أبي بكر ذي اللقب غير الواضح إلى عبد الله', 2407],
            ['S03-04-A-MUHAMMAD-002', 'محمد', 'S03-04-A-AHMAD-001', 'readable', null, 'السهم من محمد الأوسط إلى أحمد', 2408],
            ['S03-04-A-UMAR-001', 'عمر', 'S03-04-A-MUHAMMAD-002', 'readable', null, 'السهم من عمر إلى محمد', 2409],
            ['S03-04-A-AHMAD-002', 'أحمد', 'S03-04-A-UMAR-001', 'readable', 'بقية الاسم غير واضحة', 'السهم من أحمد السفلي إلى عمر', 2410],
            ['S03-04-A-AHMAD-003', 'أحمد', 'S03-04-A-ROOT-U001', 'readable', null, 'العقدة الأخرى المسماة أحمد في يمين المجموعة', 2411],
            ['S03-04-A-ALAWI-001', 'علوي', 'S03-04-A-AHMAD-003', 'readable', null, 'السهم من علوي إلى أحمد', 2412],

            // المجموعة B: وسط القسم S03-04، وهي أوضح مجموعة متفرعة.
            ['S03-04-B-ROOT-U001', 'S03-04-B-ROOT-U001', 'CORE-022', 'unclear', null, 'حلقة وصل مؤقتة للأجيال السابقة غير الظاهرة كاملة في القصاصة', 2413],
            ['S03-04-B-MUHAMMAD-001', 'محمد', 'S03-04-B-ROOT-U001', 'readable', null, 'العقدة الأب في يسار المجموعة الوسطى', 2414],
            ['S03-04-B-ALI-001', 'علي', 'S03-04-B-MUHAMMAD-001', 'readable', null, 'السهم من علي إلى محمد', 2415],
            ['S03-04-B-JUMAN-001', 'جمان', 'S03-04-B-ALI-001', 'readable', null, 'السهم من جمان إلى علي', 2416],
            ['S03-04-B-HASAN-001', 'حسن', 'S03-04-B-JUMAN-001', 'readable', null, 'السهم من حسن إلى جمان', 2417],
            ['S03-04-B-AHMAD-001', 'أحمد', 'S03-04-B-ALI-001', 'readable', null, 'السهم من أحمد إلى علي', 2418],
            ['S03-04-B-ABDULLAH-001', 'عبد الله', 'S03-04-B-AHMAD-001', 'readable', null, 'السهم من عبد الله إلى أحمد', 2419],
            ['S03-04-B-ABDULRAHMAN-ALSAQQAF', 'عبد الرحمن السقاف', 'S03-04-B-ABDULLAH-001', 'readable', null, 'السهم من عبد الرحمن السقاف إلى عبد الله', 2420],
            ['S03-04-B-MUHAMMAD-002', 'محمد', 'S03-04-B-ALI-001', 'readable', null, 'السهم من محمد الأيمن إلى علي', 2421],
            ['S03-04-B-ABUBAKR-ALJIFRI', 'أبو بكر الجفري', 'S03-04-B-MUHAMMAD-002', 'readable', null, 'السهم من أبي بكر الجفري إلى محمد', 2422],
            ['S03-04-B-ALI-ALKHAWAS', 'علي الخواص', 'S03-04-B-ABUBAKR-ALJIFRI', 'readable', null, 'السهم من علي الخواص إلى أبي بكر الجفري', 2423],
            ['S03-04-B-ABDULRAHMAN-001', 'عبد الرحمن', 'S03-04-B-MUHAMMAD-002', 'readable', null, 'السهم من عبد الرحمن إلى محمد الأيمن', 2424],

            // المجموعة C: أعلى يمين القسم قرب ورقة سالم.
            ['S03-04-C-ROOT-U001', 'S03-04-C-ROOT-U001', 'CORE-022', 'unclear', null, 'حلقة وصل مؤقتة للأجيال السابقة غير الظاهرة كاملة في القصاصة', 2425],
            ['S03-04-C-ABDULLAH-001', 'عبد الله', 'S03-04-C-ROOT-U001', 'readable', null, 'العقدة الظاهرة أسفل سالم', 2426],
            ['S03-04-C-SALIM-001', 'سالم', 'S03-04-C-ABDULLAH-001', 'readable', null, 'السهم من سالم إلى عبد الله', 2427],
            ['S03-04-C-BAYT-BAKR', 'بيت بكر', 'S03-04-C-SALIM-001', 'readable', null, 'السهم من بيت بكر إلى سالم', 2428],
            ['S03-04-C-MAHMOUD-001', 'محمود', 'S03-04-C-ABDULLAH-001', 'readable', null, 'العقدة المسماة محمود المتصلة بمسار عبد الله', 2429],
            ['S03-04-C-U001', 'S03-04-C-U001', 'S03-04-C-MAHMOUD-001', 'unclear', null, 'العقدة أسفل محمود؛ الاسم غير محسوم ويُستبدل لاحقًا', 2430],

            // المجموعة D: عمر جد آل الفقيري.
            ['S03-04-D-ROOT-U001', 'S03-04-D-ROOT-U001', 'CORE-022', 'unclear', null, 'حلقة وصل مؤقتة للأجيال السابقة غير الظاهرة كاملة في القصاصة', 2431],
            ['S03-04-D-ABDULRAHMAN-001', 'عبد الرحمن', 'S03-04-D-ROOT-U001', 'readable', null, 'العقدة السابقة لعمر في سلم السهم', 2432],
            ['S03-04-D-UMAR-ALFAQIRI', 'عمر', 'S03-04-D-ABDULRAHMAN-001', 'readable', 'جد آل الفقيري', 'ورقة عمر جد آل الفقيري والسهم إلى عبد الرحمن', 2433],

            // المجموعة E: محمد البيض.
            ['S03-04-E-ROOT-U001', 'S03-04-E-ROOT-U001', 'CORE-022', 'unclear', null, 'حلقة وصل مؤقتة للأجيال السابقة غير الظاهرة كاملة في القصاصة', 2434],
            ['S03-04-E-MUHAMMAD-ALBAYD', 'محمد البيض', 'S03-04-E-ROOT-U001', 'readable', null, 'الورقة الكبيرة المسماة محمد البيض', 2435],
            ['S03-04-E-ABDULRAHMAN-001', 'عبد الرحمن', 'S03-04-E-MUHAMMAD-ALBAYD', 'readable', null, 'السهم من عبد الرحمن إلى محمد البيض', 2436],
            ['S03-04-E-MAHROUS-001', 'محروس', 'S03-04-E-MUHAMMAD-ALBAYD', 'readable', null, 'السهم من محروس إلى محمد البيض', 2437],

            // المجموعة F: عبد الرحمن بالفقية.
            ['S03-04-F-ROOT-U001', 'S03-04-F-ROOT-U001', 'CORE-022', 'unclear', null, 'حلقة وصل مؤقتة للأجيال السابقة غير الظاهرة كاملة في القصاصة', 2438],
            ['S03-04-F-ABDULRAHMAN-BALFAQIH', 'عبد الرحمن بالفقية', 'S03-04-F-ROOT-U001', 'readable', null, 'الورقة الكبيرة أسفل يسار القسم', 2439],

            // المجموعة G: محمد البار.
            ['S03-04-G-ROOT-U001', 'S03-04-G-ROOT-U001', 'CORE-022', 'unclear', null, 'حلقة وصل مؤقتة للأجيال السابقة غير الظاهرة كاملة في القصاصة', 2440],
            ['S03-04-G-MUHAMMAD-ALBAR', 'محمد البار', 'S03-04-G-ROOT-U001', 'readable', null, 'الورقة الكبيرة المسماة محمد البار', 2441],
            ['S03-04-G-ABDULRAHMAN-001', 'عبد الرحمن', 'S03-04-G-MUHAMMAD-ALBAR', 'readable', null, 'السهم من عبد الرحمن إلى محمد البار', 2442],
            ['S03-04-G-UMAR-001', 'عمر', 'S03-04-G-ABDULRAHMAN-001', 'readable', null, 'السهم من عمر إلى عبد الرحمن', 2443],
        ];

        $now = now();

        foreach ($rows as [$sourceCode, $fullName, $parentCode, $status, $honorific, $locator, $order]) {
            $parent = DB::table('people')->where('source_code', $parentCode)->first();

            if (! $parent) {
                throw new \RuntimeException("Missing genealogy parent {$parentCode} for {$sourceCode}.");
            }

            $unclear = $status === 'unclear';

            DB::table('people')->updateOrInsert(
                ['source_code' => $sourceCode],
                [
                    'full_name' => $fullName,
                    'node_type' => 'person',
                    'honorific' => $honorific,
                    'lineage_parent_id' => $parent->id,
                    'status' => $status,
                    'approval_status' => 'pending_supervisor',
                    'is_provisional' => true,
                    'supervisor_note' => $unclear
                        ? 'رمز مؤقت يحفظ موضع العقدة ومسارها حتى استبدال الاسم أو استكمال الأجيال السابقة.'
                        : 'قراءة أولية من القسم المكبر S03-04؛ الاسم والعلاقة متاحان للمراجعة والتعديل.',
                    'approved_at' => null,
                    'chart_branch' => 'ahmad_faqih',
                    'chart_color' => '#DCEEF2',
                    'generation' => ((int) $parent->generation) + 1,
                    'summary' => 'دفعة قراءة موسعة من الفرع الأزرق مع إبقاء جميع العقد قيد مراجعة المشرف.',
                    'source_reference' => 'مشجرة أصول السادة آل باعلوي - النسخة المقسمة المكبرة',
                    'source_locator' => 'S03-04 - '.$locator,
                    'chart_order' => $order,
                    'is_living' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $count = DB::table('people')->whereBetween('chart_order', [2400, 2443])->count();
        if ($count < 44) {
            throw new \RuntimeException("Expected 44 imported S03-04 nodes, found {$count}.");
        }
    }

    public function down(): void
    {
        // لا نحذف بيانات المراجعة المستوردة عند التراجع العرضي.
    }
};
