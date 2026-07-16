<?php

use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $white = [
            [1, 'صالح جد آل صالح', 'branch_label', 96, 'عنوان أسرة واضح في أعلى الفرع الأبيض.'],
            [2, 'محمد', 'person', 99, null],
            [3, 'أبو بكر', 'person', 99, null],
            [4, 'عمر', 'person', 99, null],
            [5, 'عبد الله', 'person', 99, null],
            [6, 'علوي', 'person', 99, null],
            [7, 'مرزوق', 'person', 98, null],
            [8, 'أحمد', 'person', 99, null],
            [9, 'أبو بكر', 'person', 99, 'موضع مستقل ثان في الفرع الأبيض.'],
            [10, 'عبد الله', 'person', 99, 'موضع مستقل ثان في الفرع الأبيض.'],
            [11, 'علوي', 'person', 99, 'موضع مستقل ثان في الفرع الأبيض.'],
            [12, 'شيخ', 'person', 99, null],
            [13, 'عبد الرحمن', 'person', 99, null],
            [14, 'محمد', 'person', 99, 'موضع مستقل ثان في الفرع الأبيض.'],
            [15, 'أحمد', 'person', 99, 'موضع مستقل ثان في الفرع الأبيض.'],
            [16, 'عبد الرحمن', 'person', 99, 'موضع مستقل ثان في الفرع الأبيض.'],
            [17, 'شيخ', 'person', 99, 'موضع مستقل ثان في الفرع الأبيض.'],
            [18, 'عبيد الله', 'person', 98, null],
            [19, 'مبارك', 'person', 98, null],
            [20, 'عبد الله', 'person', 99, 'موضع مستقل ثالث في الفرع الأبيض.'],
        ];

        $blue = [
            [1, 'عمر', 'person', 99, null],
            [2, 'عبد الله', 'person', 99, null],
            [3, 'محمد', 'person', 99, null],
            [4, 'أبو بكر', 'person', 99, null],
            [5, 'محمد', 'person', 99, 'موضع مستقل ثان في الفرع الأزرق.'],
            [6, 'عبد الرحمن', 'person', 99, null],
            [7, 'سالم', 'person', 99, null],
            [8, 'علي', 'person', 99, null],
            [9, 'عمر', 'person', 99, 'موضع مستقل ثان في الفرع الأزرق.'],
            [10, 'عبيد الله', 'person', 98, null],
            [11, 'محمد', 'person', 99, 'موضع مستقل ثالث في الفرع الأزرق.'],
            [12, 'أحمد', 'person', 99, null],
            [13, 'علوي', 'person', 99, null],
            [14, 'عبد الله', 'person', 99, 'موضع مستقل ثان في الفرع الأزرق.'],
            [15, 'محمد', 'person', 99, 'موضع مستقل رابع في الفرع الأزرق.'],
            [16, 'حسين', 'person', 99, null],
            [17, 'حسن', 'person', 99, null],
            [18, 'علي', 'person', 99, 'موضع مستقل ثان في الفرع الأزرق.'],
            [19, 'عمر', 'person', 99, 'موضع مستقل ثالث في الفرع الأزرق.'],
            [20, 'عبد الرحمن', 'person', 99, 'موضع مستقل ثان في الفرع الأزرق.'],
        ];

        foreach ($white as [$number, $name, $type, $confidence, $notes]) {
            ChartReading::updateOrCreate(
                ['source_key' => sprintf('white-w%03d', $number)],
                [
                    'provisional_name' => $name,
                    'normalized_name' => $name,
                    'parent_source_key' => null,
                    'chart_branch' => 'abdullah_alawi_faqih',
                    'chart_color' => '#FFFFFF',
                    'node_type' => $type,
                    'reading_status' => 'readable',
                    'confidence' => $confidence,
                    'source_locator' => sprintf('الفرع الأبيض - الجزء العلوي - W%03d', $number),
                    'notes' => $notes,
                    'is_promoted' => false,
                    'person_id' => null,
                ]
            );
        }

        foreach ($blue as [$number, $name, $type, $confidence, $notes]) {
            ChartReading::updateOrCreate(
                ['source_key' => sprintf('blue-b%03d', $number)],
                [
                    'provisional_name' => $name,
                    'normalized_name' => $name,
                    'parent_source_key' => null,
                    'chart_branch' => 'ahmad_faqih',
                    'chart_color' => '#DCEEF2',
                    'node_type' => $type,
                    'reading_status' => 'readable',
                    'confidence' => $confidence,
                    'source_locator' => sprintf('الفرع الأزرق - الجزء الأوسط والعلوي - B%03d', $number),
                    'notes' => $notes,
                    'is_promoted' => false,
                    'person_id' => null,
                ]
            );
        }
    }

    public function down(): void
    {
        ChartReading::query()->whereBetween('source_key', ['white-w001', 'white-w020'])->delete();
        ChartReading::query()->whereBetween('source_key', ['blue-b001', 'blue-b020'])->delete();
    }
};
