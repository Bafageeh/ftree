<?php

use App\Models\ChartEdge;
use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $readings = [
            [
                'source_key' => 'lightgreen-n001',
                'provisional_name' => 'حسين العاقل',
                'normalized_name' => 'حسين العاقل',
                'reading_status' => 'readable',
                'confidence' => 98,
                'source_locator' => 'فرع علي بن الفقيه - البيضاوي يمين الورقة lightgreen-l001 في الجزء العلوي',
                'notes' => 'الاسم واللقب واضحان، والسهم المباشر إلى الورقة الكبيرة ظاهر في النسخة المكبرة.',
            ],
            [
                'source_key' => 'lightgreen-n002',
                'provisional_name' => 'أحمد',
                'normalized_name' => 'أحمد',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'فرع علي بن الفقيه - البيضاوي الأوسط الملاصق للورقة lightgreen-l001',
                'notes' => 'موضع أحمد مستقل، والسهم منه إلى الورقة الكبيرة ظاهر بوضوح.',
            ],
            [
                'source_key' => 'lightgreen-n003',
                'provisional_name' => 'علوي',
                'normalized_name' => 'علوي',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'فرع علي بن الفقيه - البيضاوي يمين ورقة أبي بكر باعقيل',
                'notes' => 'الاسم واضح، والسهم الصاعد منه إلى ورقة أبي بكر باعقيل ظاهر بوضوح جيد.',
            ],
        ];

        foreach ($readings as $reading) {
            ChartReading::updateOrCreate(
                ['source_key' => $reading['source_key']],
                [
                    ...$reading,
                    'parent_source_key' => null,
                    'chart_branch' => 'ali_faqih',
                    'chart_color' => '#DFF3D4',
                    'node_type' => 'person',
                    'is_promoted' => false,
                    'person_id' => null,
                ]
            );
        }

        $edges = [
            ['lightgreen-n001', 'lightgreen-l001', 97, 'حسين العاقل إلى الورقة الكبيرة المجاورة'],
            ['lightgreen-n002', 'lightgreen-l001', 96, 'أحمد إلى الورقة الكبيرة المجاورة'],
            ['lightgreen-n003', 'lightgreen-l002', 97, 'علوي إلى ورقة أبي بكر باعقيل'],
        ];

        foreach ($edges as [$from, $to, $confidence, $label]) {
            ChartEdge::updateOrCreate(
                [
                    'from_source_key' => $from,
                    'to_source_key' => $to,
                    'relation_type' => 'branch_founder',
                ],
                [
                    'reading_status' => 'review',
                    'confidence' => $confidence,
                    'approval_status' => 'pending_supervisor',
                    'source_locator' => 'فرع علي بن الفقيه - الأسهم الملاصقة للجذع البني',
                    'notes' => $label . '؛ الاتجاه محفوظ بصيغة المؤسس إلى ورقة الفرع وينتظر اعتماد المشرف.',
                ]
            );
        }
    }

    public function down(): void
    {
        ChartEdge::query()->whereIn('from_source_key', [
            'lightgreen-n001',
            'lightgreen-n002',
            'lightgreen-n003',
        ])->delete();

        ChartReading::query()->whereIn('source_key', [
            'lightgreen-n001',
            'lightgreen-n002',
            'lightgreen-n003',
        ])->delete();
    }
};
