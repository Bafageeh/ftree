<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use RuntimeException;

return new class extends Migration
{
    public function up(): void
    {
        $rows = [
            [
                'source_code' => 'ALI-FAQIH-HASAN-TURABI',
                'full_name' => 'حسن الترابي',
                'parent_code' => 'CORE-023',
                'status' => 'readable',
                'approval_status' => 'supervisor_confirmed',
                'is_provisional' => false,
                'source_locator' => 'S02-03 / S03-03 - السهم المباشر من حسن الترابي إلى علي بن الفقيه المقدم',
                'chart_order' => 2301,
            ],
            [
                'source_code' => 'ALI-FAQIH-MUHAMMAD-ASAD-ALLAH',
                'full_name' => 'محمد أسد الله',
                'parent_code' => 'ALI-FAQIH-HASAN-TURABI',
                'status' => 'readable',
                'approval_status' => 'supervisor_confirmed',
                'is_provisional' => false,
                'source_locator' => 'S03-03 - السهم من محمد أسد الله إلى حسن الترابي',
                'chart_order' => 2302,
            ],
            [
                'source_code' => 'ALI-FAQIH-HASAN-MUALLIM',
                'full_name' => 'حسن المعلم',
                'parent_code' => 'ALI-FAQIH-MUHAMMAD-ASAD-ALLAH',
                'status' => 'readable',
                'approval_status' => 'supervisor_confirmed',
                'is_provisional' => false,
                'source_locator' => 'S03-03 - السهم من حسن المعلم إلى محمد أسد الله',
                'chart_order' => 2303,
            ],
            [
                'source_code' => 'ALI-FAQIH-AHMAD-ASAD-ALLAH',
                'full_name' => 'أحمد بن محمد أسد الله',
                'parent_code' => 'ALI-FAQIH-MUHAMMAD-ASAD-ALLAH',
                'status' => 'readable',
                'approval_status' => 'supervisor_confirmed',
                'is_provisional' => false,
                'source_locator' => 'S03-03 - الاسم أحمد والسهم المباشر إلى محمد أسد الله',
                'chart_order' => 2304,
            ],
            [
                'source_code' => 'ALI-FAQIH-MUHAMMAD-HASAN-MUALLIM',
                'full_name' => 'محمد بن حسن المعلم',
                'parent_code' => 'ALI-FAQIH-HASAN-MUALLIM',
                'status' => 'readable',
                'approval_status' => 'supervisor_confirmed',
                'is_provisional' => false,
                'source_locator' => 'S03-03 - الاسم محمد والسهم المباشر إلى حسن المعلم',
                'chart_order' => 2305,
            ],
            [
                'source_code' => 'ALI-FAQIH-ALAWI-AHMAD',
                'full_name' => 'علوي بن أحمد بن محمد أسد الله',
                'parent_code' => 'ALI-FAQIH-AHMAD-ASAD-ALLAH',
                'status' => 'readable',
                'approval_status' => 'supervisor_confirmed',
                'is_provisional' => false,
                'source_locator' => 'S03-03 - الاسم علوي والسهم المباشر إلى أحمد',
                'chart_order' => 2306,
            ],
            [
                'source_code' => 'S03-03-U001',
                'full_name' => 'S03-03-U001',
                'parent_code' => 'ALI-FAQIH-AHMAD-ASAD-ALLAH',
                'status' => 'unclear',
                'approval_status' => 'pending_supervisor',
                'is_provisional' => true,
                'source_locator' => 'S03-03 - الورقة الكبيرة أسفل محمد أسد الله؛ الاسم يحتاج تصحيح المستخدم',
                'chart_order' => 2307,
            ],
        ];

        $now = now();

        foreach ($rows as $row) {
            $parent = DB::table('people')->where('source_code', $row['parent_code'])->first();

            if (! $parent) {
                throw new RuntimeException("Missing genealogy parent {$row['parent_code']} for {$row['source_code']}.");
            }

            DB::table('people')->updateOrInsert(
                ['source_code' => $row['source_code']],
                [
                    'full_name' => $row['full_name'],
                    'node_type' => 'person',
                    'honorific' => null,
                    'lineage_parent_id' => $parent->id,
                    'status' => $row['status'],
                    'approval_status' => $row['approval_status'],
                    'is_provisional' => $row['is_provisional'],
                    'supervisor_note' => $row['is_provisional']
                        ? 'رمز مؤقت؛ العلاقة مقروءة والاسم يحتاج استبدالًا.'
                        : 'قُرئ الاسم والسهم من القسم المكبر للمشجرة.',
                    'approved_at' => $row['is_provisional'] ? null : $now,
                    'chart_branch' => 'ali_faqih',
                    'chart_color' => '#DFF3D4',
                    'generation' => ((int) $parent->generation) + 1,
                    'summary' => $row['is_provisional']
                        ? 'عقدة نسب صحيحة موضعيًا باسم مؤقت حتى تصحيح القراءة.'
                        : 'قراءة مباشرة من القسم المكبر وربط بالسهم الظاهر إلى الأب.',
                    'source_reference' => 'مشجرة أصول السادة آل باعلوي - النسخة المقسمة المكبرة',
                    'source_locator' => $row['source_locator'],
                    'chart_order' => $row['chart_order'],
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
            'ALI-FAQIH-HASAN-TURABI',
            'ALI-FAQIH-MUHAMMAD-ASAD-ALLAH',
            'ALI-FAQIH-HASAN-MUALLIM',
            'ALI-FAQIH-AHMAD-ASAD-ALLAH',
            'ALI-FAQIH-MUHAMMAD-HASAN-MUALLIM',
            'ALI-FAQIH-ALAWI-AHMAD',
            'S03-03-U001',
        ])->delete();
    }
};
