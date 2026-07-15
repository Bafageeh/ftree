<?php

use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $rows = [
            [1, 'محمد الفقيه', 'readable', 98, 'branch_label', 'عنوان فرع واضح في أعلى الفرع الأصفر.'],
            [2, 'أحمد الفقيه', 'readable', 97, 'person', null],
            [3, 'علوي', 'readable', 99, 'person', null],
            [4, 'عبد الله', 'readable', 99, 'person', null],
            [5, 'حمد', 'readable', 99, 'person', null],
            [6, 'عبد الرحمن', 'readable', 99, 'person', null],
            [7, 'عبد الله', 'readable', 99, 'person', 'موضع مستقل آخر في الفرع الأصفر.'],
            [8, 'عمر', 'readable', 99, 'person', null],
            [9, 'أبو بكر', 'readable', 99, 'person', null],
            [10, 'عبد الرحمن', 'readable', 99, 'person', 'موضع مستقل آخر في الفرع الأصفر.'],
            [11, 'محمد', 'readable', 99, 'person', null],
            [12, 'عبد الله', 'readable', 99, 'person', 'موضع مستقل ثالث في الفرع الأصفر.'],
            [13, 'هاشم', 'readable', 99, 'person', null],
            [14, 'محمد', 'readable', 99, 'person', 'موضع مستقل ثانٍ في الفرع الأصفر.'],
            [15, 'عبد الرحمن', 'readable', 99, 'person', 'موضع مستقل ثالث في الفرع الأصفر.'],
            [16, 'محمد', 'readable', 99, 'person', 'موضع مستقل ثالث في الفرع الأصفر.'],
            [17, 'علي', 'readable', 99, 'person', null],
            [18, 'علوي', 'readable', 99, 'person', 'موضع مستقل ثانٍ في الفرع الأصفر.'],
            [19, 'عبد الرحمن', 'readable', 99, 'person', 'موضع مستقل رابع في الفرع الأصفر.'],
            [20, 'أحمد', 'readable', 99, 'person', null],
            [21, 'طاهر جد آل طاهر', 'readable', 95, 'branch_label', 'عنوان فرع أسري واضح في الجزء الأوسط السفلي.'],
            [22, 'حسين باقاره', 'review', 78, 'branch_label', 'حسين واضح، وقراءة باقاره مرجحة وتحتاج مطابقة حرفية.'],
            [23, 'محمد جد آل الكثير', 'review', 82, 'branch_label', 'محمد وجد آل واضحان، وقراءة الكثير مرجحة.'],
            [24, 'هاشم جد آل قائم', 'review', 76, 'branch_label', 'هاشم وجد آل واضحان، وضبط قائم يحتاج مراجعة.'],
            [25, 'عبد الملك جد آل [اسم الأسرة غير محسوم]', 'unclear', 46, 'branch_label', 'عبد الملك وجد آل واضحان، واسم الأسرة في السطر الأوسط غير محسوم.'],
        ];

        foreach ($rows as [$number, $name, $status, $confidence, $type, $notes]) {
            $sourceKey = sprintf('yellow-y%03d', $number);

            ChartReading::updateOrCreate(
                ['source_key' => $sourceKey],
                [
                    'provisional_name' => $name,
                    'normalized_name' => $status === 'readable' ? $name : null,
                    'parent_source_key' => null,
                    'chart_branch' => 'abdulrahman_faqih',
                    'chart_color' => '#FFF3A6',
                    'node_type' => $type,
                    'reading_status' => $status,
                    'confidence' => $confidence,
                    'source_locator' => sprintf('الفرع الأصفر - الدفعة الأولى - Y%03d', $number),
                    'notes' => $notes,
                    'is_promoted' => false,
                    'person_id' => null,
                ]
            );
        }
    }

    public function down(): void
    {
        ChartReading::query()
            ->where('source_key', '>=', 'yellow-y001')
            ->where('source_key', '<=', 'yellow-y025')
            ->delete();
    }
};
