<?php

use App\Models\Person;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $nodes = [
            ['code' => 'CORE-001', 'name' => 'محمد ﷺ', 'parent' => null, 'generation' => 1],
            ['code' => 'CORE-002', 'name' => 'فاطمة الزهراء', 'parent' => 'CORE-001', 'generation' => 2],
            ['code' => 'CORE-003', 'name' => 'الحسين السبط', 'parent' => 'CORE-002', 'generation' => 3],
            ['code' => 'CORE-004', 'name' => 'علي زين العابدين', 'parent' => 'CORE-003', 'generation' => 4],
            ['code' => 'CORE-005', 'name' => 'محمد الباقر', 'parent' => 'CORE-004', 'generation' => 5],
            ['code' => 'CORE-006', 'name' => 'جعفر الصادق', 'parent' => 'CORE-005', 'generation' => 6],
            ['code' => 'CORE-007', 'name' => 'علي العريضي', 'parent' => 'CORE-006', 'generation' => 7],
            ['code' => 'CORE-008', 'name' => 'محمد النقيب', 'parent' => 'CORE-007', 'generation' => 8],
            ['code' => 'CORE-009', 'name' => 'عيسى النقيب', 'parent' => 'CORE-008', 'generation' => 9],
            ['code' => 'CORE-010', 'name' => 'أحمد المهاجر', 'parent' => 'CORE-009', 'generation' => 10],
            ['code' => 'CORE-011', 'name' => 'عبيد الله', 'parent' => 'CORE-010', 'generation' => 11],
            ['code' => 'CORE-012', 'name' => 'علوي', 'parent' => 'CORE-011', 'generation' => 12],
            ['code' => 'CORE-013', 'name' => 'محمد', 'parent' => 'CORE-012', 'generation' => 13],
            ['code' => 'CORE-014', 'name' => 'علوي', 'parent' => 'CORE-013', 'generation' => 14],
            ['code' => 'CORE-015', 'name' => 'علي خالع قسم', 'parent' => 'CORE-014', 'generation' => 15],
            ['code' => 'CORE-016', 'name' => 'محمد صاحب مرباط', 'parent' => 'CORE-015', 'generation' => 16],
            ['code' => 'CORE-017', 'name' => 'علي بن محمد صاحب مرباط', 'parent' => 'CORE-016', 'generation' => 17],
            ['code' => 'CORE-018', 'name' => 'محمد الفقيه المقدم', 'parent' => 'CORE-017', 'generation' => 18],
            ['code' => 'CORE-019', 'name' => 'علوي بن الفقيه المقدم', 'parent' => 'CORE-018', 'generation' => 19],
            ['code' => 'CORE-020', 'name' => 'علي بن علوي بن الفقيه المقدم', 'parent' => 'CORE-019', 'generation' => 20],
            ['code' => 'CORE-021', 'name' => 'عبد الله بن علوي بن الفقيه المقدم', 'parent' => 'CORE-019', 'generation' => 20],
            ['code' => 'CORE-022', 'name' => 'أحمد بن الفقيه المقدم', 'parent' => 'CORE-018', 'generation' => 19],
            ['code' => 'CORE-023', 'name' => 'علي بن الفقيه المقدم', 'parent' => 'CORE-018', 'generation' => 19],
            ['code' => 'CORE-024', 'name' => 'عبد الرحمن بن الفقيه المقدم', 'parent' => 'CORE-018', 'generation' => 19],
        ];

        DB::transaction(function () use ($nodes): void {
            $resolved = [];

            foreach ($nodes as $index => $node) {
                $person = Person::query()->where('source_code', $node['code'])->first()
                    ?? Person::query()->where('chart_order', $index + 1)->where('is_provisional', false)->first();

                if (! $person) {
                    continue;
                }

                $person->forceFill([
                    'source_code' => $node['code'],
                    'full_name' => $node['name'],
                    'lineage_parent_id' => $node['parent'] ? ($resolved[$node['parent']] ?? null) : null,
                    'generation' => $node['generation'],
                    'chart_order' => $index + 1,
                    'approval_status' => 'supervisor_confirmed',
                    'is_provisional' => false,
                    'status' => 'readable',
                ])->save();

                $resolved[$node['code']] = $person->id;
            }
        });
    }

    public function down(): void
    {
        // تصحيح بيانات مرجعية؛ لا يعاد إلى أسماء ناقصة عند التراجع.
    }
};
