<?php

use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $updates = [
            'yellow-y022' => [
                'provisional_name' => 'حسين باقاره',
                'normalized_name' => 'حسين باقاره',
                'reading_status' => 'readable',
                'confidence' => 97,
                'notes' => 'ثبت الاسم واللقب من القصاصة المكبرة. يبقى اعتماد المشرف النهائي.',
            ],
            'yellow-y030' => [
                'provisional_name' => 'محمد موسى عبيد الله',
                'normalized_name' => 'محمد موسى عبيد الله',
                'reading_status' => 'readable',
                'confidence' => 97,
                'notes' => 'ثبت ترتيب الكلمات من القصاصة عالية التباين.',
            ],
            'yellow-y031' => [
                'provisional_name' => 'علوية عروج',
                'normalized_name' => null,
                'reading_status' => 'review',
                'confidence' => 82,
                'notes' => 'علوية واضحة، وقراءة عروج مرجحة من السطر السفلي وتحتاج اعتماد المشرف.',
            ],
            'yellow-y034' => [
                'provisional_name' => 'السيد عبد الله',
                'normalized_name' => 'السيد عبد الله',
                'reading_status' => 'readable',
                'confidence' => 97,
                'notes' => 'ثبتت عبارة السيد عبد الله كاملة من التكبير.',
            ],
            'yellow-y035' => [
                'provisional_name' => 'محمد اليسعي بن سلمة',
                'normalized_name' => 'محمد اليسعي بن سلمة',
                'reading_status' => 'readable',
                'confidence' => 98,
                'notes' => 'ثبت الاسم الكامل من الورقة الكبيرة في أسفل الفرع الأصفر.',
            ],
        ];

        foreach ($updates as $sourceKey => $values) {
            ChartReading::query()->where('source_key', $sourceKey)->update($values);
        }
    }

    public function down(): void
    {
        ChartReading::query()->where('source_key', 'yellow-y022')->update([
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 78,
            'notes' => 'حسين واضح، وقراءة باقاره مرجحة وتحتاج مطابقة حرفية.',
        ]);

        ChartReading::query()->where('source_key', 'yellow-y030')->update([
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 79,
            'notes' => 'محمد وموسى وعبيد الله مرجحة، ويحتاج ترتيب الكلمات إلى مطابقة.',
        ]);

        ChartReading::query()->where('source_key', 'yellow-y031')->update([
            'provisional_name' => 'علوية [صلة النسب غير محسومة]',
            'normalized_name' => null,
            'reading_status' => 'unclear',
            'confidence' => 52,
            'notes' => 'اسم علوية واضح، أما بقية العبارة الصغيرة فغير محسومة.',
        ]);

        ChartReading::query()->where('source_key', 'yellow-y034')->update([
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 83,
            'notes' => 'عبد الله واضح، وقراءة السيد مرجحة من السطر الأعلى.',
        ]);

        ChartReading::query()->where('source_key', 'yellow-y035')->update([
            'normalized_name' => null,
            'reading_status' => 'review',
            'confidence' => 73,
            'notes' => 'محمد وبن سلمة واضحان، وقراءة اليسعي مرجحة وتحتاج مراجعة حرفية.',
        ]);
    }
};
