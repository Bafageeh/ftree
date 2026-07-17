<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use RuntimeException;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $this->updateExisting(
            'ALI-FAQIH-MUHAMMAD-HASAN-MUALLIM',
            'محمد جمل الليل بن حسن المعلم',
            'ALI-FAQIH-HASAN-MUALLIM',
            'S02-03 / S03-03 - الورقة محمد جمل الليل والسهم إلى حسن المعلم',
            $now,
        );

        // الرمز المؤقت باقٍ حتى تصحيح الاسم، لكن السهم يربطه مباشرة بمحمد أسد الله.
        $this->updateExisting(
            'S03-03-U001',
            'S03-03-U001',
            'ALI-FAQIH-MUHAMMAD-ASAD-ALLAH',
            'S03-03 - الورقة الكبيرة أسفل محمد أسد الله؛ الاسم يحتاج تصحيح المستخدم',
            $now,
            true,
        );

        $rows = [
            [
                'source_code' => 'ALI-FAQIH-AHMAD-HASAN-MUALLIM',
                'full_name' => 'أحمد بن حسن المعلم',
                'parent_code' => 'ALI-FAQIH-HASAN-MUALLIM',
                'source_locator' => 'S02-03 / S03-03 - أحمد والسهم المباشر إلى حسن المعلم',
                'chart_order' => 2308,
            ],
            [
                'source_code' => 'JAMAL-ALLAYL-ALI',
                'full_name' => 'علي بن محمد جمل الليل',
                'parent_code' => 'ALI-FAQIH-MUHAMMAD-HASAN-MUALLIM',
                'source_locator' => 'S03-03 - علي والسهم المباشر إلى محمد جمل الليل',
                'chart_order' => 2309,
            ],
            [
                'source_code' => 'JAMAL-ALLAYL-ABDULLAH',
                'full_name' => 'عبد الله بن محمد جمل الليل',
                'parent_code' => 'ALI-FAQIH-MUHAMMAD-HASAN-MUALLIM',
                'source_locator' => 'S03-03 - عبد الله والسهم المباشر إلى محمد جمل الليل',
                'chart_order' => 2310,
            ],
            [
                'source_code' => 'JAMAL-ALLAYL-AHMAD-BIN-ABDULLAH',
                'full_name' => 'أحمد بن عبد الله بن محمد جمل الليل',
                'parent_code' => 'JAMAL-ALLAYL-ABDULLAH',
                'source_locator' => 'S03-03 / S03-04 - أحمد جد آل باحسن والسهم إلى عبد الله',
                'chart_order' => 2311,
            ],
        ];

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
                    'status' => 'readable',
                    'approval_status' => 'supervisor_confirmed',
                    'is_provisional' => false,
                    'supervisor_note' => 'قُرئ الاسم والسهم من الأقسام المكبرة للمشجرة.',
                    'approved_at' => $now,
                    'chart_branch' => 'ali_faqih',
                    'chart_color' => '#DFF3D4',
                    'generation' => ((int) $parent->generation) + 1,
                    'summary' => 'قراءة مباشرة من القسم المكبر وربط بالسهم الظاهر إلى الأب.',
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

    private function updateExisting(
        string $sourceCode,
        string $fullName,
        string $parentCode,
        string $sourceLocator,
        mixed $now,
        bool $provisional = false,
    ): void {
        $person = DB::table('people')->where('source_code', $sourceCode)->first();
        $parent = DB::table('people')->where('source_code', $parentCode)->first();

        if (! $person || ! $parent) {
            throw new RuntimeException("Missing existing person or parent while updating {$sourceCode}.");
        }

        DB::table('people')->where('id', $person->id)->update([
            'full_name' => $fullName,
            'lineage_parent_id' => $parent->id,
            'generation' => ((int) $parent->generation) + 1,
            'status' => $provisional ? 'unclear' : 'readable',
            'approval_status' => $provisional ? 'pending_supervisor' : 'supervisor_confirmed',
            'is_provisional' => $provisional,
            'supervisor_note' => $provisional
                ? 'رمز مؤقت؛ العلاقة مصححة والاسم يحتاج استبدالًا.'
                : 'تم استكمال اللقب من القسم المكبر للمشجرة.',
            'approved_at' => $provisional ? null : $now,
            'source_locator' => $sourceLocator,
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        DB::table('people')->whereIn('source_code', [
            'ALI-FAQIH-AHMAD-HASAN-MUALLIM',
            'JAMAL-ALLAYL-ALI',
            'JAMAL-ALLAYL-ABDULLAH',
            'JAMAL-ALLAYL-AHMAD-BIN-ABDULLAH',
        ])->delete();
    }
};
