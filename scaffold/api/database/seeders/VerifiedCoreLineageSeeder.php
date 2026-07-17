<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class VerifiedCoreLineageSeeder extends Seeder
{
    public function run(): void
    {
        $mirbat = DB::table('people')->where('source_code', 'CORE-016')->first();

        if (! $mirbat) {
            throw new RuntimeException('CORE-016 Muhammad Sahib Mirbat was not found.');
        }

        $now = now();

        // تثبيت اسم الابن الأول كاملًا كما يظهر في المشجرة.
        DB::table('people')
            ->where('source_code', 'CORE-017')
            ->update([
                'full_name' => 'علي بن محمد صاحب مرباط',
                'honorific' => 'والد الفقيه المقدم',
                'lineage_parent_id' => $mirbat->id,
                'generation' => ((int) $mirbat->generation) + 1,
                'source_reference' => 'مشجرة أصول السادة آل باعلوي - الصفحة الوحيدة',
                'source_locator' => 'مركز المشجرة فوق محمد صاحب مرباط - علي والد الفقيه المقدم',
                'updated_at' => $now,
            ]);

        // إضافة الابن الثاني باسم كامل، لا باسم «علوي» المختصر.
        DB::table('people')->updateOrInsert(
            ['source_code' => 'MIRBAT-ALAWI-001'],
            [
                'full_name' => 'علوي بن محمد صاحب مرباط',
                'node_type' => 'person',
                'honorific' => 'عم الفقيه المقدم',
                'lineage_parent_id' => $mirbat->id,
                'status' => 'readable',
                'approval_status' => 'supervisor_confirmed',
                'is_provisional' => false,
                'supervisor_note' => 'قرأ من السهم المباشر الخارج من محمد صاحب مرباط واعتمد بعد تصحيح المشرف.',
                'approved_at' => $now,
                'chart_branch' => 'alawi_mirbat',
                'chart_color' => '#F3E7A1',
                'generation' => ((int) $mirbat->generation) + 1,
                'summary' => 'الابن الثاني لمحمد صاحب مرباط، وهو عم محمد الفقيه المقدم.',
                'source_reference' => 'مشجرة أصول السادة آل باعلوي - الصفحة الوحيدة',
                'source_locator' => 'مركز المشجرة فوق محمد صاحب مرباط - علوي عم الفقيه المقدم',
                'chart_order' => 1702,
                'is_living' => false,
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        // حذف القراءات السابقة التي أضيفت على تخمين قبل تتبع الأسهم كاملة.
        DB::table('people')
            ->whereIn('source_code', ['AF-001', 'AF-002', 'AF-003', 'AF-004'])
            ->delete();

        $children = DB::table('people')
            ->where('lineage_parent_id', $mirbat->id)
            ->where('approval_status', '!=', 'rejected')
            ->pluck('full_name')
            ->sort()
            ->values();

        $required = collect([
            'علي بن محمد صاحب مرباط',
            'علوي بن محمد صاحب مرباط',
        ])->sort()->values();

        if ($children->intersect($required)->count() !== 2) {
            throw new RuntimeException('The two verified children of Muhammad Sahib Mirbat were not synchronized.');
        }
    }
}
