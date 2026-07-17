<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $relations = [
            'CORE-002' => ['محمد ﷺ', 'CORE-001', 'فاطمة الزهراء'],
            'CORE-003' => ['فاطمة الزهراء', 'CORE-002', 'الحسين السبط'],
            'CORE-004' => ['الحسين السبط', 'CORE-003', 'علي زين العابدين'],
            'CORE-005' => ['علي زين العابدين', 'CORE-004', 'محمد الباقر'],
            'CORE-006' => ['محمد الباقر', 'CORE-005', 'جعفر الصادق'],
            'CORE-007' => ['جعفر الصادق', 'CORE-006', 'علي العريضي'],
            'CORE-008' => ['علي العريضي', 'CORE-007', 'محمد النقيب'],
            'CORE-009' => ['محمد النقيب', 'CORE-008', 'عيسى النقيب'],
            'CORE-010' => ['عيسى النقيب', 'CORE-009', 'أحمد المهاجر'],
            'CORE-011' => ['أحمد المهاجر', 'CORE-010', 'عبيد الله'],
            'CORE-012' => ['عبيد الله', 'CORE-011', 'علوي'],
            'CORE-013' => ['علوي', 'CORE-012', 'محمد'],
            'CORE-014' => ['محمد', 'CORE-013', 'علوي'],
            'CORE-015' => ['علوي', 'CORE-014', 'علي خالع قسم'],
            'CORE-016' => ['علي خالع قسم', 'CORE-015', 'محمد صاحب مرباط'],
            'CORE-017' => ['محمد صاحب مرباط', 'CORE-016', 'علي بن محمد صاحب مرباط'],
            'CORE-018' => ['علي بن محمد صاحب مرباط', 'CORE-017', 'محمد الفقيه المقدم'],
            'CORE-019' => ['محمد الفقيه المقدم', 'CORE-018', 'علوي بن محمد الفقيه المقدم'],
            'CORE-020' => ['علوي بن محمد الفقيه المقدم', 'CORE-019', 'علي بن علوي بن محمد الفقيه المقدم'],
            'CORE-021' => ['علوي بن محمد الفقيه المقدم', 'CORE-019', 'عبد الله بن علوي بن محمد الفقيه المقدم'],
            'CORE-022' => ['محمد الفقيه المقدم', 'CORE-018', 'أحمد بن محمد الفقيه المقدم'],
            'CORE-023' => ['محمد الفقيه المقدم', 'CORE-018', 'علي بن محمد الفقيه المقدم'],
            'CORE-024' => ['محمد الفقيه المقدم', 'CORE-018', 'عبد الرحمن بن محمد الفقيه المقدم'],
            'MIRBAT-ALAWI-001' => ['محمد صاحب مرباط', 'CORE-016', 'علوي بن محمد صاحب مرباط'],
        ];

        $now = now();

        foreach ($relations as $childCode => [$parentName, $parentCode, $fullName]) {
            $parent = DB::table('people')->where('source_code', $parentCode)->first();
            $child = DB::table('people')->where('source_code', $childCode)->first();

            if (! $parent) {
                throw new \RuntimeException("Missing parent {$parentCode} ({$parentName}).");
            }

            if (! $child) {
                if ($childCode !== 'MIRBAT-ALAWI-001') {
                    throw new \RuntimeException("Missing child {$childCode} ({$fullName}).");
                }

                DB::table('people')->insert([
                    'full_name' => $fullName,
                    'source_code' => $childCode,
                    'node_type' => 'person',
                    'honorific' => 'عم الفقيه المقدم',
                    'lineage_parent_id' => $parent->id,
                    'status' => 'readable',
                    'approval_status' => 'supervisor_confirmed',
                    'is_provisional' => false,
                    'supervisor_note' => 'قرأ من السهم المباشر في المشجرة الأصلية.',
                    'approved_at' => $now,
                    'chart_branch' => 'alawi_mirbat',
                    'chart_color' => '#F3E7A1',
                    'generation' => ((int) $parent->generation) + 1,
                    'summary' => 'ابن مباشر لمحمد صاحب مرباط.',
                    'source_reference' => 'مشجرة أصول السادة آل باعلوي - الصفحة الوحيدة',
                    'source_locator' => 'مركز المشجرة - علوي عم الفقيه المقدم',
                    'chart_order' => 1702,
                    'is_living' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                continue;
            }

            DB::table('people')
                ->where('id', $child->id)
                ->update([
                    'full_name' => $fullName,
                    'lineage_parent_id' => $parent->id,
                    'generation' => ((int) $parent->generation) + 1,
                    'updated_at' => $now,
                ]);
        }

        $this->assertChildren('CORE-016', [
            'علي بن محمد صاحب مرباط',
            'علوي بن محمد صاحب مرباط',
        ]);

        $this->assertChildren('CORE-018', [
            'علوي بن محمد الفقيه المقدم',
            'أحمد بن محمد الفقيه المقدم',
            'علي بن محمد الفقيه المقدم',
            'عبد الرحمن بن محمد الفقيه المقدم',
        ]);

        $this->assertChildren('CORE-019', [
            'علي بن علوي بن محمد الفقيه المقدم',
            'عبد الله بن علوي بن محمد الفقيه المقدم',
        ]);
    }

    private function assertChildren(string $parentCode, array $requiredNames): void
    {
        $parentId = DB::table('people')->where('source_code', $parentCode)->value('id');
        $actual = DB::table('people')
            ->where('lineage_parent_id', $parentId)
            ->where('approval_status', '!=', 'rejected')
            ->pluck('full_name');

        foreach ($requiredNames as $name) {
            if (! $actual->contains($name)) {
                throw new \RuntimeException("{$name} is not stored as a child of {$parentCode}.");
            }
        }
    }

    public function down(): void
    {
        // لا نعيد العلاقات الخاطئة؛ التراجع لا يحذف بيانات النسب الصحيحة.
    }
};
