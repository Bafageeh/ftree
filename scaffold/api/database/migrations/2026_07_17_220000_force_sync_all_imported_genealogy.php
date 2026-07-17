<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $rows = [
            // الدفعة الأولى والثانية.
            ['ALI-FAQIH-HASAN-TURABI', 'حسن الترابي', 'CORE-023', 'ali_faqih', 'readable', 'supervisor_confirmed', false, null, 2301],
            ['ALI-FAQIH-MUHAMMAD-ASAD-ALLAH', 'محمد أسد الله', 'ALI-FAQIH-HASAN-TURABI', 'ali_faqih', 'readable', 'supervisor_confirmed', false, null, 2302],
            ['ALI-FAQIH-HASAN-MUALLIM', 'حسن المعلم', 'ALI-FAQIH-MUHAMMAD-ASAD-ALLAH', 'ali_faqih', 'readable', 'supervisor_confirmed', false, null, 2303],
            ['ALI-FAQIH-AHMAD-ASAD-ALLAH', 'أحمد بن محمد أسد الله', 'ALI-FAQIH-MUHAMMAD-ASAD-ALLAH', 'ali_faqih', 'readable', 'supervisor_confirmed', false, null, 2304],
            ['ALI-FAQIH-MUHAMMAD-HASAN-MUALLIM', 'محمد جمل الليل بن حسن المعلم', 'ALI-FAQIH-HASAN-MUALLIM', 'ali_faqih', 'readable', 'supervisor_confirmed', false, 'جمل الليل', 2305],
            ['ALI-FAQIH-ALAWI-AHMAD', 'علوي بن أحمد بن محمد أسد الله', 'ALI-FAQIH-AHMAD-ASAD-ALLAH', 'ali_faqih', 'readable', 'supervisor_confirmed', false, null, 2306],
            ['S03-03-U001', 'S03-03-U001', 'ALI-FAQIH-MUHAMMAD-ASAD-ALLAH', 'ali_faqih', 'unclear', 'pending_supervisor', true, null, 2307],
            ['ALI-FAQIH-AHMAD-HASAN-MUALLIM', 'أحمد بن حسن المعلم', 'ALI-FAQIH-HASAN-MUALLIM', 'ali_faqih', 'readable', 'supervisor_confirmed', false, null, 2308],
            ['JAMAL-ALLAYL-ALI', 'علي بن محمد جمل الليل', 'ALI-FAQIH-MUHAMMAD-HASAN-MUALLIM', 'ali_faqih', 'readable', 'supervisor_confirmed', false, null, 2309],
            ['JAMAL-ALLAYL-ABDULLAH', 'عبد الله بن محمد جمل الليل', 'ALI-FAQIH-MUHAMMAD-HASAN-MUALLIM', 'ali_faqih', 'readable', 'supervisor_confirmed', false, null, 2310],
            ['JAMAL-ALLAYL-AHMAD-BIN-ABDULLAH', 'أحمد بن عبد الله بن محمد جمل الليل', 'JAMAL-ALLAYL-ABDULLAH', 'ali_faqih', 'readable', 'supervisor_confirmed', false, 'جد آل باحسن', 2311],

            // الدفعة الثالثة الكبيرة، تُترك للمراجعة كما طلب المستخدم.
            ['JAMAL-ALI-HASAN', 'حسن بن علي بن محمد جمل الليل', 'JAMAL-ALLAYL-ALI', 'ali_faqih', 'readable', 'pending_supervisor', true, null, 2312],
            ['JAMAL-ALI-ABDULRAHMAN', 'عبد الرحمن بن علي بن محمد جمل الليل', 'JAMAL-ALLAYL-ALI', 'ali_faqih', 'readable', 'pending_supervisor', true, null, 2313],
            ['JAMAL-ALI-AHMAD', 'أحمد بن علي بن محمد جمل الليل', 'JAMAL-ALLAYL-ALI', 'ali_faqih', 'readable', 'pending_supervisor', true, 'جد آل الغرور', 2314],
            ['JAMAL-HASAN-HARUN', 'هارون بن حسن بن علي بن محمد جمل الليل', 'JAMAL-ALI-HASAN', 'ali_faqih', 'readable', 'pending_supervisor', true, null, 2315],
            ['JAMAL-HARUN-ABDULLAH-ALSALIH', 'عبد الله الصالح بن هارون', 'JAMAL-HASAN-HARUN', 'ali_faqih', 'readable', 'pending_supervisor', true, null, 2316],
            ['JAMAL-HARUN-AHMAD', 'أحمد بن هارون', 'JAMAL-HASAN-HARUN', 'ali_faqih', 'readable', 'pending_supervisor', true, null, 2317],
            ['JAMAL-ABDULLAH-ALSALIH-HUSAYN', 'حسين بن عبد الله الصالح', 'JAMAL-HARUN-ABDULLAH-ALSALIH', 'ali_faqih', 'readable', 'pending_supervisor', true, null, 2318],
            ['JAMAL-ABDULLAH-ALSALIH-ABDULRAHMAN', 'عبد الرحمن بن عبد الله الصالح', 'JAMAL-HARUN-ABDULLAH-ALSALIH', 'ali_faqih', 'readable', 'pending_supervisor', true, null, 2319],
            ['JAMAL-ABDULLAH-ALSALIH-MUHAMMAD', 'محمد بن عبد الله الصالح', 'JAMAL-HARUN-ABDULLAH-ALSALIH', 'ali_faqih', 'readable', 'pending_supervisor', true, null, 2320],
            ['JAMAL-ABDULLAH-ALSALIH-AHMAD', 'أحمد بن عبد الله الصالح', 'JAMAL-HARUN-ABDULLAH-ALSALIH', 'ali_faqih', 'readable', 'pending_supervisor', true, null, 2321],
            ['S03-04-U002', 'S03-04-U002', 'JAMAL-HARUN-ABDULLAH-ALSALIH', 'ali_faqih', 'unclear', 'pending_supervisor', true, null, 2322],
            ['S03-04-U003', 'S03-04-U003', 'JAMAL-HASAN-HARUN', 'ali_faqih', 'unclear', 'pending_supervisor', true, null, 2323],
            ['S03-04-U004', 'S03-04-U004', 'JAMAL-ALLAYL-ALI', 'ali_faqih', 'unclear', 'pending_supervisor', true, null, 2324],
            ['S04-04-GROOT-U001', 'S04-04-GROOT-U001', 'CORE-020', 'ali_alawi_faqih', 'unclear', 'pending_supervisor', true, null, 2325],
            ['ALI-ALAWI-BRANCH-ABDULLAH', 'عبد الله', 'S04-04-GROOT-U001', 'ali_alawi_faqih', 'readable', 'pending_supervisor', true, null, 2326],
            ['ALI-ALAWI-BRANCH-SALIM', 'سالم بن عبد الله', 'ALI-ALAWI-BRANCH-ABDULLAH', 'ali_alawi_faqih', 'readable', 'pending_supervisor', true, null, 2327],
            ['ALI-ALAWI-BRANCH-MUHAMMAD', 'محمد بن عبد الله', 'ALI-ALAWI-BRANCH-ABDULLAH', 'ali_alawi_faqih', 'readable', 'pending_supervisor', true, null, 2328],
            ['ALI-ALAWI-MUHAMMAD-ALFAQIRI', 'محمد الفقيري بن سالم', 'ALI-ALAWI-BRANCH-SALIM', 'ali_alawi_faqih', 'readable', 'pending_supervisor', true, null, 2329],
            ['ALI-ALAWI-AQIL-ALFAQIRI', 'عقيل الفقيري بن عبد الله', 'ALI-ALAWI-BRANCH-ABDULLAH', 'ali_alawi_faqih', 'readable', 'pending_supervisor', true, null, 2330],
            ['S04-04-U002', 'S04-04-U002', 'ALI-ALAWI-BRANCH-ABDULLAH', 'ali_alawi_faqih', 'unclear', 'pending_supervisor', true, null, 2331],
            ['S04-04-U003', 'S04-04-U003', 'ALI-ALAWI-BRANCH-SALIM', 'ali_alawi_faqih', 'unclear', 'pending_supervisor', true, null, 2332],
        ];

        $now = now();
        $colors = [
            'ali_faqih' => '#DFF3D4',
            'ali_alawi_faqih' => '#8EDB79',
        ];

        foreach ($rows as [$sourceCode, $fullName, $parentCode, $branch, $status, $approvalStatus, $isProvisional, $honorific, $order]) {
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
                    'approval_status' => $approvalStatus,
                    'is_provisional' => $isProvisional,
                    'supervisor_note' => $isProvisional
                        ? 'مستورد من المشجرة المكبرة ومتاح للمراجعة والتعديل.'
                        : 'قُرئ وربط من المشجرة المكبرة.',
                    'approved_at' => $approvalStatus === 'supervisor_confirmed' ? $now : null,
                    'chart_branch' => $branch,
                    'chart_color' => $colors[$branch],
                    'generation' => ((int) $parent->generation) + 1,
                    'summary' => 'مزامنة تصحيحية شاملة لجميع الأسماء المستخرجة حتى الآن.',
                    'source_reference' => 'مشجرة أصول السادة آل باعلوي - النسخة المقسمة المكبرة',
                    'source_locator' => $sourceCode,
                    'chart_order' => $order,
                    'is_living' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $importedCount = DB::table('people')->whereBetween('chart_order', [2301, 2332])->count();
        if ($importedCount < 32) {
            throw new \RuntimeException("Expected 32 imported genealogy records, found {$importedCount}.");
        }
    }

    public function down(): void
    {
        // لا نحذف بيانات النسب المستوردة عند التراجع العرضي.
    }
};
