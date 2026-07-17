<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $rows = [
            // ذرية علي بن محمد جمل الليل من S03-03 / S03-04.
            ['JAMAL-ALI-HASAN', 'حسن بن علي بن محمد جمل الليل', 'JAMAL-ALLAYL-ALI', 'ali_faqih', 'readable', 'S03-03 / S03-04 - حسن والسهم إلى علي', 2312, null],
            ['JAMAL-ALI-ABDULRAHMAN', 'عبد الرحمن بن علي بن محمد جمل الليل', 'JAMAL-ALLAYL-ALI', 'ali_faqih', 'readable', 'S03-03 / S03-04 - عبد الرحمن والسهم إلى علي', 2313, null],
            ['JAMAL-ALI-AHMAD', 'أحمد بن علي بن محمد جمل الليل', 'JAMAL-ALLAYL-ALI', 'ali_faqih', 'readable', 'S03-03 / S03-04 - أحمد والسهم إلى علي', 2314, 'جد آل الغرور'],
            ['JAMAL-HASAN-HARUN', 'هارون بن حسن بن علي بن محمد جمل الليل', 'JAMAL-ALI-HASAN', 'ali_faqih', 'readable', 'S03-04 - هارون والسهم إلى حسن', 2315, null],
            ['JAMAL-HARUN-ABDULLAH-ALSALIH', 'عبد الله الصالح بن هارون', 'JAMAL-HASAN-HARUN', 'ali_faqih', 'readable', 'S03-04 / S04-04 - عبد الله الصالح والسهم إلى هارون', 2316, null],
            ['JAMAL-HARUN-AHMAD', 'أحمد بن هارون', 'JAMAL-HASAN-HARUN', 'ali_faqih', 'readable', 'S03-04 - أحمد والسهم إلى هارون', 2317, null],
            ['JAMAL-ABDULLAH-ALSALIH-HUSAYN', 'حسين بن عبد الله الصالح', 'JAMAL-HARUN-ABDULLAH-ALSALIH', 'ali_faqih', 'readable', 'S03-04 / S04-04 - حسين والسهم إلى عبد الله الصالح', 2318, null],
            ['JAMAL-ABDULLAH-ALSALIH-ABDULRAHMAN', 'عبد الرحمن بن عبد الله الصالح', 'JAMAL-HARUN-ABDULLAH-ALSALIH', 'ali_faqih', 'readable', 'S03-04 / S04-04 - عبد الرحمن والسهم إلى عبد الله الصالح', 2319, null],
            ['JAMAL-ABDULLAH-ALSALIH-MUHAMMAD', 'محمد بن عبد الله الصالح', 'JAMAL-HARUN-ABDULLAH-ALSALIH', 'ali_faqih', 'readable', 'S03-04 / S04-04 - محمد والسهم إلى عبد الله الصالح', 2320, null],
            ['JAMAL-ABDULLAH-ALSALIH-AHMAD', 'أحمد بن عبد الله الصالح', 'JAMAL-HARUN-ABDULLAH-ALSALIH', 'ali_faqih', 'readable', 'S03-04 / S04-04 - أحمد والسهم إلى عبد الله الصالح', 2321, null],
            ['S03-04-U002', 'S03-04-U002', 'JAMAL-HARUN-ABDULLAH-ALSALIH', 'ali_faqih', 'unclear', 'S03-04 - عقدة ظاهرة متصلة بعبد الله الصالح والاسم يحتاج تعديلًا', 2322, null],
            ['S03-04-U003', 'S03-04-U003', 'JAMAL-HASAN-HARUN', 'ali_faqih', 'unclear', 'S03-04 - عقدة ظاهرة متصلة بهارون والاسم يحتاج تعديلًا', 2323, null],
            ['S03-04-U004', 'S03-04-U004', 'JAMAL-ALLAYL-ALI', 'ali_faqih', 'unclear', 'S03-04 - عقدة ظاهرة متصلة بعلي والاسم يحتاج تعديلًا', 2324, null],

            // مجموعة محمد الفقيري من S04-04؛ الرمز الأول يحفظ موضع الاتصال غير المقروء إلى أصل الفرع.
            ['S04-04-GROOT-U001', 'S04-04-GROOT-U001', 'CORE-020', 'ali_alawi_faqih', 'unclear', 'S04-04 - حلقة وصل غير مقروءة بين أصل الفرع والمجموعة', 2325, null],
            ['ALI-ALAWI-BRANCH-ABDULLAH', 'عبد الله', 'S04-04-GROOT-U001', 'ali_alawi_faqih', 'readable', 'S04-04 - عبد الله في مجموعة محمد الفقيري', 2326, null],
            ['ALI-ALAWI-BRANCH-SALIM', 'سالم بن عبد الله', 'ALI-ALAWI-BRANCH-ABDULLAH', 'ali_alawi_faqih', 'readable', 'S04-04 - سالم والسهم إلى عبد الله', 2327, null],
            ['ALI-ALAWI-BRANCH-MUHAMMAD', 'محمد بن عبد الله', 'ALI-ALAWI-BRANCH-ABDULLAH', 'ali_alawi_faqih', 'readable', 'S04-04 - محمد والسهم إلى عبد الله', 2328, null],
            ['ALI-ALAWI-MUHAMMAD-ALFAQIRI', 'محمد الفقيري بن سالم', 'ALI-ALAWI-BRANCH-SALIM', 'ali_alawi_faqih', 'readable', 'S04-04 - محمد الفقيري والسهم إلى سالم', 2329, null],
            ['ALI-ALAWI-AQIL-ALFAQIRI', 'عقيل الفقيري بن عبد الله', 'ALI-ALAWI-BRANCH-ABDULLAH', 'ali_alawi_faqih', 'readable', 'S04-04 - عقيل الفقيري والسهم إلى عبد الله', 2330, null],
            ['S04-04-U002', 'S04-04-U002', 'ALI-ALAWI-BRANCH-ABDULLAH', 'ali_alawi_faqih', 'unclear', 'S04-04 - عقدة إضافية متصلة بعبد الله والاسم يحتاج تعديلًا', 2331, null],
            ['S04-04-U003', 'S04-04-U003', 'ALI-ALAWI-BRANCH-SALIM', 'ali_alawi_faqih', 'unclear', 'S04-04 - عقدة إضافية متصلة بسالم والاسم يحتاج تعديلًا', 2332, null],
        ];

        $now = now();
        $colors = [
            'ali_faqih' => '#DFF3D4',
            'ali_alawi_faqih' => '#8EDB79',
        ];

        foreach ($rows as [$sourceCode, $fullName, $parentCode, $branch, $status, $locator, $order, $honorific]) {
            $parent = DB::table('people')->where('source_code', $parentCode)->first();

            if (! $parent) {
                throw new \RuntimeException("Missing genealogy parent {$parentCode} for {$sourceCode}.");
            }

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
                    'supervisor_note' => $status === 'unclear'
                        ? 'رمز مؤقت؛ موضع العقدة وعلاقتها محفوظان لحين تعديل الاسم.'
                        : 'الاسم مقروء من القسم المكبر، والعلاقة متاحة لمراجعة المستخدم.',
                    'approved_at' => null,
                    'chart_branch' => $branch,
                    'chart_color' => $colors[$branch],
                    'generation' => ((int) $parent->generation) + 1,
                    'summary' => 'استيراد سريع من المشجرة المكبرة مع إبقاء السجل قابلًا للتعديل والمراجعة.',
                    'source_reference' => 'مشجرة أصول السادة آل باعلوي - النسخة المقسمة المكبرة',
                    'source_locator' => $locator,
                    'chart_order' => $order,
                    'is_living' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    public function down(): void
    {
        DB::table('people')->whereIn('source_code', [
            'JAMAL-ALI-HASAN',
            'JAMAL-ALI-ABDULRAHMAN',
            'JAMAL-ALI-AHMAD',
            'JAMAL-HASAN-HARUN',
            'JAMAL-HARUN-ABDULLAH-ALSALIH',
            'JAMAL-HARUN-AHMAD',
            'JAMAL-ABDULLAH-ALSALIH-HUSAYN',
            'JAMAL-ABDULLAH-ALSALIH-ABDULRAHMAN',
            'JAMAL-ABDULLAH-ALSALIH-MUHAMMAD',
            'JAMAL-ABDULLAH-ALSALIH-AHMAD',
            'S03-04-U002',
            'S03-04-U003',
            'S03-04-U004',
            'S04-04-GROOT-U001',
            'ALI-ALAWI-BRANCH-ABDULLAH',
            'ALI-ALAWI-BRANCH-SALIM',
            'ALI-ALAWI-BRANCH-MUHAMMAD',
            'ALI-ALAWI-MUHAMMAD-ALFAQIRI',
            'ALI-ALAWI-AQIL-ALFAQIRI',
            'S04-04-U002',
            'S04-04-U003',
        ])->delete();
    }
};
