<?php

use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        ChartReading::where('source_key', 'yellow-y023')->update([
            'provisional_name' => 'محمد جد آل الكثير',
            'normalized_name' => 'محمد جد آل الكثير',
            'reading_status' => 'readable',
            'confidence' => 96,
            'notes' => 'أعيدت مراجعة العبارة من القصاصة المكبرة وأصبحت مقروءة بوضوح.',
        ]);

        ChartReading::where('source_key', 'yellow-y024')->update([
            'provisional_name' => 'هاشم جد آل هاشم',
            'normalized_name' => 'هاشم جد آل هاشم',
            'reading_status' => 'readable',
            'confidence' => 95,
            'notes' => 'صححت القراءة السابقة بعد التكبير؛ الكلمة الأخيرة هاشم.',
        ]);

        $rows = [
            [26, 'محمد جد آل بن سميط', 'readable', 96, 'branch_label', 'عنوان فرع واضح في الجزء العلوي الأوسط من الفرع الأصفر.'],
            [27, 'عمر آل باعبود عبد الله عبود', 'review', 74, 'branch_label', 'عمر وآل باعبود وعبد الله عبود ظاهرة، لكن ترتيب العبارة يحتاج مراجعة نهائية.'],
            [28, 'عبد الله جد آل [اسم الأسرة غير محسوم]', 'unclear', 55, 'branch_label', 'عبد الله وجد آل واضحان، واسم الأسرة غير مقروء بما يكفي.'],
            [29, 'عبد الرحمن بافقيه', 'readable', 94, 'person', 'الاسم واللقب مقروءان بوضوح جيد.'],
            [30, 'محمد موسى عبيد الله', 'review', 79, 'person', 'محمد وموسى وعبيد الله مرجحة، ويحتاج ترتيب الكلمات إلى مطابقة.'],
            [31, 'علوية [صلة النسب غير محسومة]', 'unclear', 52, 'person', 'اسم علوية واضح، أما بقية العبارة الصغيرة فغير محسومة.'],
            [32, 'أحمد', 'readable', 99, 'person', 'موضع مستقل جديد في القسم السفلي من الفرع الأصفر.'],
            [33, 'أحمد', 'readable', 99, 'person', 'موضع مستقل آخر في القسم السفلي من الفرع الأصفر.'],
            [34, 'السيد عبد الله', 'review', 83, 'person', 'عبد الله واضح، وقراءة السيد مرجحة من السطر الأعلى.'],
            [35, 'محمد اليسعي بن سلمة', 'review', 73, 'branch_label', 'محمد وبن سلمة واضحان، وقراءة اليسعي مرجحة وتحتاج مراجعة حرفية.'],
            [36, 'عمر', 'readable', 99, 'person', 'موضع مستقل جديد.'],
            [37, 'محمد', 'readable', 99, 'person', 'موضع مستقل جديد.'],
            [38, 'عبد الله', 'readable', 99, 'person', 'موضع مستقل جديد.'],
            [39, 'هاشم', 'readable', 99, 'person', 'موضع مستقل جديد.'],
            [40, 'محمد', 'readable', 99, 'person', 'موضع مستقل آخر.'],
            [41, 'علي', 'readable', 99, 'person', 'موضع مستقل جديد.'],
            [42, 'علوي', 'readable', 99, 'person', 'موضع مستقل جديد.'],
            [43, 'عبد الرحمن', 'readable', 99, 'person', 'موضع مستقل جديد.'],
            [44, 'طاهر', 'readable', 99, 'person', 'موضع مستقل جديد.'],
            [45, 'محمد', 'readable', 99, 'person', 'موضع مستقل إضافي.'],
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
                    'source_locator' => sprintf('الفرع الأصفر - الدفعة الثانية - Y%03d', $number),
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
            ->where('source_key', '>=', 'yellow-y026')
            ->where('source_key', '<=', 'yellow-y045')
            ->delete();

        ChartReading::where('source_key', 'yellow-y023')->update([
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 82,
            'notes' => 'محمد وجد آل واضحان، وقراءة الكثير مرجحة.',
        ]);

        ChartReading::where('source_key', 'yellow-y024')->update([
            'provisional_name' => 'هاشم جد آل قائم',
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 76,
            'notes' => 'هاشم وجد آل واضحان، وضبط قائم يحتاج مراجعة.',
        ]);
    }
};
