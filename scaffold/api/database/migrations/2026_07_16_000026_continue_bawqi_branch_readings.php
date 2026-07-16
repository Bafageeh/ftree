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
                'source_key' => 'white-w035',
                'provisional_name' => 'محمد',
                'normalized_name' => 'محمد',
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'person',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأبيض - الجهة اليمنى العليا - العقدة البيضاوية المباشرة قبل ورقة البوقي',
                'notes' => 'الاسم واضح، والسهم المباشر إلى ورقة البوقي محفوظ كعلاقة مؤسس بانتظار اعتماد المشرف.',
            ],
            [
                'source_key' => 'white-w036',
                'provisional_name' => 'عبيد الله',
                'normalized_name' => 'عبيد الله',
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'person',
                'reading_status' => 'readable',
                'confidence' => 98,
                'source_locator' => 'الفرع الأبيض - الجهة اليمنى العليا - العقدة البيضاوية أسفل شيخ وبجوار ورقة البوقي',
                'notes' => 'الاسم واضح. يظهر اتصال مباشر بورقة البوقي واتصال من عقدة شيخ.',
            ],
            [
                'source_key' => 'white-w037',
                'provisional_name' => 'شيخ',
                'normalized_name' => 'شيخ',
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'person',
                'reading_status' => 'readable',
                'confidence' => 98,
                'source_locator' => 'الفرع الأبيض - الجهة اليمنى العليا - العقدة البيضاوية الواقعة قبل عبيد الله',
                'notes' => 'الاسم واضح والسهم إلى عبيد الله ظاهر في القصاصة المكبرة.',
            ],
            [
                'source_key' => 'white-w038',
                'provisional_name' => 'مبارك',
                'normalized_name' => 'مبارك',
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'person',
                'reading_status' => 'readable',
                'confidence' => 98,
                'source_locator' => 'الفرع الأبيض - الجهة اليمنى - العقدة البيضاوية أسفل ورقة البوقي',
                'notes' => 'الاسم واضح، لكن تعدد الأسهم حول العقدة يحتاج مراجعة المشرف قبل تعيين الأب.',
            ],
        ];

        foreach ($readings as $reading) {
            ChartReading::updateOrCreate(
                ['source_key' => $reading['source_key']],
                [
                    ...$reading,
                    'is_promoted' => false,
                    'person_id' => null,
                ]
            );
        }

        $edges = [
            [
                'from_source_key' => 'white-w035',
                'to_source_key' => 'white-w025',
                'relation_type' => 'branch_founder',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأبيض - سهم محمد المباشر إلى ورقة البوقي',
                'notes' => 'حفظ الاتجاه النسبي الموحد: محمد مؤسس ثم البوقي فرعًا.',
            ],
            [
                'from_source_key' => 'white-w036',
                'to_source_key' => 'white-w025',
                'relation_type' => 'branch_founder',
                'reading_status' => 'readable',
                'confidence' => 96,
                'source_locator' => 'الفرع الأبيض - اتصال عبيد الله بورقة البوقي',
                'notes' => 'لورقة البوقي أكثر من اتصال ظاهر؛ حفظت العلاقة كسهم مراجع بانتظار المشرف.',
            ],
            [
                'from_source_key' => 'white-w037',
                'to_source_key' => 'white-w036',
                'relation_type' => 'lineage',
                'reading_status' => 'readable',
                'confidence' => 97,
                'source_locator' => 'الفرع الأبيض - السهم بين شيخ وعبيد الله',
                'notes' => 'السهم واضح في القصاصة المكبرة، وتبقى العلاقة بانتظار اعتماد المشرف.',
            ],
        ];

        foreach ($edges as $edge) {
            ChartEdge::updateOrCreate(
                [
                    'from_source_key' => $edge['from_source_key'],
                    'to_source_key' => $edge['to_source_key'],
                    'relation_type' => $edge['relation_type'],
                ],
                [
                    'reading_status' => $edge['reading_status'],
                    'confidence' => $edge['confidence'],
                    'approval_status' => 'pending_supervisor',
                    'source_locator' => $edge['source_locator'],
                    'notes' => $edge['notes'],
                ]
            );
        }
    }

    public function down(): void
    {
        ChartEdge::query()->whereIn('from_source_key', ['white-w035', 'white-w036', 'white-w037'])->delete();
        ChartReading::query()->whereIn('source_key', ['white-w035', 'white-w036', 'white-w037', 'white-w038'])->delete();
    }
};
