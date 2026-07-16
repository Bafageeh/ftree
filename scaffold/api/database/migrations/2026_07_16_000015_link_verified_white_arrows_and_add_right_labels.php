<?php

use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // الأسهم المؤكدة بصريًا في أعلى الفرع الأبيض: السهم يتجه من الفرع/الابن إلى الأب.
        $verifiedParents = [
            'white-w001' => 'white-w005', // صالح جد آل صالح ← عبد الله
            'white-w005' => 'white-w004', // عبد الله ← عمر
            'white-w004' => 'white-w003', // عمر ← أبو بكر
            'white-w003' => 'white-w002', // أبو بكر ← محمد
            'white-w006' => 'white-w007', // علوي ← مرزوق في مسار المشهور
        ];

        foreach ($verifiedParents as $child => $parent) {
            ChartReading::query()->where('source_key', $child)->update([
                'parent_source_key' => $parent,
                'notes' => trim((string) ChartReading::query()->where('source_key', $child)->value('notes')."\nتم تثبيت اتجاه السهم من الصورة المكبرة، ويبقى اعتماد المشرف النهائي."),
            ]);
        }

        $newReadings = [
            [
                'source_key' => 'white-w021',
                'provisional_name' => 'محمد المشهور',
                'normalized_name' => 'محمد المشهور',
                'parent_source_key' => 'white-w006',
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأبيض - أعلى اليمين - الورقة محمد المشهور',
                'notes' => 'الاسم واضح، والسهم يتجه مباشرة إلى علوي (white-w006). بانتظار اعتماد المشرف.',
            ],
            [
                'source_key' => 'white-w022',
                'provisional_name' => 'عبد الرحمن الشاطري',
                'normalized_name' => 'عبد الرحمن الشاطري',
                'parent_source_key' => 'white-w009',
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 98,
                'source_locator' => 'الفرع الأبيض - أعلى اليمين - الورقة عبد الرحمن الشاطري',
                'notes' => 'الاسم واضح، والسهم يتجه مباشرة إلى أبي بكر في هذا المسار. بانتظار اعتماد المشرف.',
            ],
            [
                'source_key' => 'white-w023',
                'provisional_name' => 'محمد جد آل حضرمي',
                'normalized_name' => 'محمد جد آل حضرمي',
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'branch_label',
                'reading_status' => 'review',
                'confidence' => 91,
                'source_locator' => 'الفرع الأبيض - يمين المنتصف - ورقة محمد جد آل حضرمي',
                'notes' => 'قراءة الاسم مرجحة بدرجة عالية، لكن رمز الأب المقابل لم يُحسم بعد.',
            ],
            [
                'source_key' => 'white-w024',
                'provisional_name' => 'علوي الكاف',
                'normalized_name' => 'علوي الكاف',
                'parent_source_key' => null,
                'chart_branch' => 'abdullah_alawi_faqih',
                'chart_color' => '#FFFFFF',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 98,
                'source_locator' => 'الفرع الأبيض - يمين المنتصف - ورقة علوي الكاف',
                'notes' => 'الاسم واضح، ويحتاج تتبع السهم الطويل إلى رمز الأب داخل الفرع.',
            ],
            [
                'source_key' => 'blue-b021',
                'provisional_name' => 'عقيل عمران',
                'normalized_name' => 'عقيل عمران',
                'parent_source_key' => null,
                'chart_branch' => 'ahmad_faqih',
                'chart_color' => '#DCEEF2',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 96,
                'source_locator' => 'الفرع الأزرق - أعلى المنتصف - ورقة عقيل عمران',
                'notes' => 'الاسم مقروء بوضوح جيد، وربطه بالأب مؤجل حتى مطابقة العقدة المجاورة.',
            ],
            [
                'source_key' => 'blue-b022',
                'provisional_name' => 'محمد جد آل القمري',
                'normalized_name' => null,
                'parent_source_key' => null,
                'chart_branch' => 'ahmad_faqih',
                'chart_color' => '#DCEEF2',
                'node_type' => 'branch_label',
                'reading_status' => 'review',
                'confidence' => 84,
                'source_locator' => 'الفرع الأزرق - يمين المنتصف السفلي - ورقة محمد جد آل القمري',
                'notes' => 'محمد وجد آل واضحان، ولقب القمري قراءة مرجحة تحتاج اعتماد المشرف.',
            ],
            [
                'source_key' => 'blue-b023',
                'provisional_name' => 'محمد البار',
                'normalized_name' => 'محمد البار',
                'parent_source_key' => null,
                'chart_branch' => 'ahmad_faqih',
                'chart_color' => '#DCEEF2',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأزرق - يمين الأسفل - ورقة محمد البار',
                'notes' => 'الاسم واضح جدًا، ويحتاج فقط تعيين رمز الأب بعد تتبع السهم.',
            ],
            [
                'source_key' => 'blue-b024',
                'provisional_name' => 'محمد الكاف',
                'normalized_name' => 'محمد الكاف',
                'parent_source_key' => null,
                'chart_branch' => 'ahmad_faqih',
                'chart_color' => '#DCEEF2',
                'node_type' => 'branch_label',
                'reading_status' => 'readable',
                'confidence' => 99,
                'source_locator' => 'الفرع الأزرق - أسفل اليمين - ورقة محمد الكاف',
                'notes' => 'الاسم واضح جدًا، ويحتاج فقط تعيين رمز الأب بعد تتبع السهم.',
            ],
        ];

        foreach ($newReadings as $reading) {
            ChartReading::updateOrCreate(
                ['source_key' => $reading['source_key']],
                [
                    ...$reading,
                    'is_promoted' => false,
                    'person_id' => null,
                ]
            );
        }
    }

    public function down(): void
    {
        ChartReading::query()->whereIn('source_key', [
            'white-w021', 'white-w022', 'white-w023', 'white-w024',
            'blue-b021', 'blue-b022', 'blue-b023', 'blue-b024',
        ])->delete();

        ChartReading::query()->whereIn('source_key', [
            'white-w001', 'white-w003', 'white-w004', 'white-w005', 'white-w006',
        ])->update(['parent_source_key' => null]);
    }
};
