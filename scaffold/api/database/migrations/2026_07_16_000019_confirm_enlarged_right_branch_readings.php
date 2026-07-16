<?php

use App\Models\ChartEdge;
use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $confirmedReadings = [
            'white-w025' => [
                'provisional_name' => 'البوقي',
                'normalized_name' => 'البوقي',
                'reading_status' => 'readable',
                'confidence' => 98,
                'notes' => 'ثبتت قراءة البوقي من القصاصة المكبرة. للورقة أكثر من اتصال محتمل ويظل تعيين المؤسسين بانتظار المشرف.',
            ],
            'blue-b025' => [
                'provisional_name' => 'سالم جد آل بن سهل والرويقي',
                'normalized_name' => 'سالم جد آل بن سهل والرويقي',
                'reading_status' => 'readable',
                'confidence' => 98,
                'notes' => 'ثبت النص كاملًا من النسخة المكبرة، والاتصال المباشر بعقدة سالم محفوظ كسهم مراجع.',
            ],
            'blue-b026' => [
                'provisional_name' => 'محمد شروق',
                'normalized_name' => 'محمد شروق',
                'reading_status' => 'readable',
                'confidence' => 96,
                'notes' => 'ثبت الاسم من النسخة المكبرة. تظهر للورقة وصلتان من عقدتين باسم عبد الرحمن، وتبقيان بانتظار المشرف.',
            ],
        ];

        foreach ($confirmedReadings as $sourceKey => $values) {
            ChartReading::query()->where('source_key', $sourceKey)->update($values);
        }

        $edges = [
            [
                'from_source_key' => 'blue-b006',
                'to_source_key' => 'blue-b022',
                'relation_type' => 'branch_founder',
                'reading_status' => 'readable',
                'confidence' => 96,
                'source_locator' => 'الفرع الأزرق - ورقة محمد جد آل القمري والعقدة العليا عبد الرحمن',
                'notes' => 'في الصورة يتجه السهم من ورقة الأسرة إلى أصلها. حُفظت العلاقة هنا بالاتجاه النسبي الموحّد: عبد الرحمن أب/مؤسس ثم محمد جد آل القمري فرعًا.',
            ],
            [
                'from_source_key' => 'blue-b020',
                'to_source_key' => 'blue-b023',
                'relation_type' => 'branch_founder',
                'reading_status' => 'readable',
                'confidence' => 98,
                'source_locator' => 'الفرع الأزرق - ورقة محمد البار والعقدة السفلى عبد الرحمن',
                'notes' => 'الاتصال المباشر واضح. حُفظت العلاقة بالاتجاه النسبي الموحّد: عبد الرحمن أب/مؤسس ثم محمد البار فرعًا.',
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

        ChartEdge::query()->where([
            'from_source_key' => 'white-w007',
            'to_source_key' => 'white-w006',
        ])->update([
            'notes' => 'سهم الصورة يتجه من علوي نحو أصله مرزوق. حُفظت العلاقة في النظام بالاتجاه النسبي الموحّد: مرزوق أب ثم علوي ابنًا.',
        ]);

        ChartEdge::query()->where([
            'from_source_key' => 'white-w006',
            'to_source_key' => 'white-w021',
        ])->update([
            'notes' => 'سهم الصورة يتجه من ورقة محمد المشهور نحو علوي. حُفظت العلاقة في النظام: علوي مؤسس ثم محمد المشهور فرعًا.',
        ]);
    }

    public function down(): void
    {
        ChartEdge::query()->whereIn('to_source_key', ['blue-b022', 'blue-b023'])->delete();
    }
};
