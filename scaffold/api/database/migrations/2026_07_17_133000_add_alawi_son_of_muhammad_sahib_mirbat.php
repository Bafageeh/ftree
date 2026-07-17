<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $parentId = DB::table('people')
            ->where('source_code', 'CORE-016')
            ->value('id');

        if (! $parentId) {
            return;
        }

        DB::table('people')->updateOrInsert(
            ['source_code' => 'MIRBAT-ALAWI-001'],
            [
                'full_name' => 'علوي بن محمد صاحب مرباط',
                'node_type' => 'person',
                'honorific' => null,
                'lineage_parent_id' => $parentId,
                'status' => 'readable',
                'approval_status' => 'pending_supervisor',
                'is_provisional' => true,
                'supervisor_note' => 'أضيف بوصفه ابنًا مباشرًا ثانيًا لمحمد صاحب مرباط، إلى جانب علي بن محمد صاحب مرباط، وفق موضع التفرع في المشجرة الأصلية وتصحيح المشرف.',
                'approved_at' => null,
                'chart_branch' => null,
                'chart_color' => '#DFF3D4',
                'generation' => 17,
                'summary' => 'ابن محمد صاحب مرباط، وفرعه مستقل عن مسار علي بن محمد صاحب مرباط.',
                'source_reference' => 'مشجرة أصول السادة آل باعلوي - الصفحة الوحيدة',
                'source_locator' => 'مركز المشجرة عند محمد صاحب مرباط - فرع الابن علوي',
                'chart_order' => 1602,
                'is_living' => false,
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('people')
            ->where('source_code', 'MIRBAT-ALAWI-001')
            ->delete();
    }
};
