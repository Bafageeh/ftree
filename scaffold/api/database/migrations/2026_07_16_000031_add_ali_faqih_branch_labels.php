<?php

use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // هذه الأوراق تقع يمين الجذع البني مباشرة، ولذلك تتبع فرع
        // علي بن الفقيه المقدم لا فرع علي بن علوي بن الفقيه المقدم.
        ChartReading::query()->whereIn('source_key', [
            'green-g097-lower',
            'green-g098-lower',
            'green-g099-lower',
            'green-g100-lower',
        ])->update([
            'chart_branch' => 'ali_faqih',
            'chart_color' => '#DFF3D4',
        ]);

        $readings = [
            [
                'source_key' => 'lightgreen-l001',
                'provisional_name' => 'محمد أحمد [السطر الثالث غير محسوم]',
                'normalized_name' => null,
                'node_type' => 'branch_label',
                'reading_status' => 'review',
                'confidence' => 74,
                'source_locator' => 'فرع علي بن الفقيه المقدم - الورقة الكبيرة الثانية من الأعلى بمحاذاة الجذع البني',
                'notes' => 'محمد وأحمد ظاهران بوضوح، أما السطر الثالث القصير فلم يُحسم حرفيًا؛ يحفظ كما ظهر حتى مراجعة المشرف.',
            ],
            [
                'source_key' => 'lightgreen-l002',
                'provisional_name' => 'أبو بكر باعقيل',
                'normalized_name' => 'أبو بكر باعقيل',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 97,
                'source_locator' => 'فرع علي بن الفقيه المقدم - الورقة الكبيرة الثالثة من الأعلى بمحاذاة الجذع البني',
                'notes' => 'ثبت الاسم واللقب من التكبير عالي الدقة. السهم المجاور يحتاج مطابقة رمز العقدة قبل الربط.',
            ],
            [
                'source_key' => 'lightgreen-l003',
                'provisional_name' => 'علوي الشاطري',
                'normalized_name' => 'علوي الشاطري',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 96,
                'source_locator' => 'فرع علي بن الفقيه المقدم - الورقة الكبيرة الرابعة من الأعلى بمحاذاة الجذع البني',
                'notes' => 'الاسم واللقب مقروءان بوضوح جيد من النسخة عالية الدقة.',
            ],
            [
                'source_key' => 'lightgreen-l004',
                'provisional_name' => 'أبو بكر الحبشي',
                'normalized_name' => 'أبو بكر الحبشي',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 98,
                'source_locator' => 'فرع علي بن الفقيه المقدم - الورقة الكبيرة الخامسة من الأعلى بمحاذاة الجذع البني',
                'notes' => 'ثبتت العبارة كاملة من التكبير: أبو بكر الحبشي.',
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
                    'is_promoted' => false,
                    'person_id' => null,
                ]
            );
        }
    }

    public function down(): void
    {
        ChartReading::query()->whereIn('source_key', [
            'lightgreen-l001',
            'lightgreen-l002',
            'lightgreen-l003',
            'lightgreen-l004',
        ])->delete();

        ChartReading::query()->whereIn('source_key', [
            'green-g097-lower',
            'green-g098-lower',
            'green-g099-lower',
            'green-g100-lower',
        ])->update([
            'chart_branch' => 'ali_alawi_faqih',
            'chart_color' => '#8EDB79',
        ]);
    }
};
