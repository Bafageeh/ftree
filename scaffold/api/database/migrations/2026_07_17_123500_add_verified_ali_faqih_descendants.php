<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $rows = [
            [
                'source_code' => 'AF-001',
                'full_name' => 'حسن الترابي',
                'parent_source_code' => 'CORE-023',
                'generation' => 20,
                'chart_order' => 2301,
                'source_locator' => 'الفرع الأخضر الفاتح - يمين الجذع - حسن الترابي المتصل بعلي بن الفقيه المقدم',
            ],
            [
                'source_code' => 'AF-002',
                'full_name' => 'محمد أسد الله',
                'parent_source_code' => 'AF-001',
                'generation' => 21,
                'chart_order' => 2302,
                'source_locator' => 'الفرع الأخضر الفاتح - يمين الجذع - الورقة الكبيرة محمد أسد الله',
            ],
            [
                'source_code' => 'AF-003',
                'full_name' => 'حسن المعلم',
                'parent_source_code' => 'AF-002',
                'generation' => 22,
                'chart_order' => 2303,
                'source_locator' => 'الفرع الأخضر الفاتح - يمين ورقة محمد أسد الله - حسن المعلم',
            ],
            [
                'source_code' => 'AF-004',
                'full_name' => 'أحمد',
                'parent_source_code' => 'AF-002',
                'generation' => 22,
                'chart_order' => 2304,
                'source_locator' => 'الفرع الأخضر الفاتح - أسفل يمين ورقة محمد أسد الله - أحمد',
            ],
        ];

        foreach ($rows as $row) {
            $parentId = DB::table('people')
                ->where('source_code', $row['parent_source_code'])
                ->value('id');

            if (! $parentId) {
                throw new RuntimeException('Missing parent '.$row['parent_source_code'].' while adding '.$row['source_code']);
            }

            DB::table('people')->updateOrInsert(
                ['source_code' => $row['source_code']],
                [
                    'full_name' => $row['full_name'],
                    'node_type' => 'person',
                    'honorific' => null,
                    'lineage_parent_id' => $parentId,
                    'status' => 'readable',
                    'approval_status' => 'pending_supervisor',
                    'is_provisional' => true,
                    'supervisor_note' => 'قراءة مباشرة من السهم في المشجرة المرفوعة؛ مرتبطة بالأصل النبوي وتنتظر اعتماد المشرف.',
                    'approved_at' => null,
                    'chart_branch' => 'ali_faqih',
                    'chart_color' => '#DFF3D4',
                    'generation' => $row['generation'],
                    'summary' => 'استكمال أول دفعة من أبناء فرع علي بن الفقيه المقدم من المشجرة الأصلية.',
                    'source_reference' => 'مشجرة أصول السادة آل باعلوي - الصفحة الوحيدة',
                    'source_locator' => $row['source_locator'],
                    'chart_order' => $row['chart_order'],
                    'is_living' => false,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    public function down(): void
    {
        DB::table('people')
            ->whereIn('source_code', ['AF-001', 'AF-002', 'AF-003', 'AF-004'])
            ->delete();
    }
};
