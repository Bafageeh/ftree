<?php

use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $updates = [
            'green-g001-1196-212' => [
                'provisional_name' => 'عمر الملقب بالمحجوب',
                'normalized_name' => 'عمر الملقب بالمحجوب',
                'reading_status' => 'readable',
                'confidence' => 97,
                'notes' => 'العبارة كاملة أصبحت مقروءة بعد التكبير: عمر الملقب بالمحجوب.',
            ],
            'green-g008-1713-385' => [
                'provisional_name' => 'أبو بكر خربشان',
                'normalized_name' => null,
                'reading_status' => 'review',
                'confidence' => 82,
                'notes' => 'أبو بكر واضح، وقراءة خربشان مرجحة من شكل الحروف وتحتاج مطابقة على الأصل.',
            ],
            'green-g009-1639-395' => [
                'provisional_name' => 'عمر الهندوان',
                'normalized_name' => null,
                'reading_status' => 'review',
                'confidence' => 90,
                'notes' => 'عمر واضح، وقراءة الهندوان قوية لكنها تحتاج مراجعة حرفية نهائية.',
            ],
            'green-g018-1110-501' => [
                'provisional_name' => 'فرع عمر جد آل [اسم غير محسوم] باعمر',
                'normalized_name' => null,
                'reading_status' => 'unclear',
                'confidence' => 64,
                'notes' => 'أصبحت بداية العبارة ونهايتها مقروءتين، لكن اسم الأسرة الأوسط لا يزال غير محسوم.',
            ],
            'green-g020-1183-520' => [
                'provisional_name' => 'عبد الرحمن زحوم',
                'normalized_name' => null,
                'reading_status' => 'review',
                'confidence' => 82,
                'notes' => 'عبد الرحمن واضح، وقراءة زحوم أقرب من القراءة السابقة زقوم.',
            ],
            'green-g023-911-546' => [
                'provisional_name' => 'محمد جد آل مقيبل',
                'normalized_name' => null,
                'reading_status' => 'review',
                'confidence' => 91,
                'notes' => 'اللقب يظهر أقرب إلى مقيبل لا مقبل، ويحتاج مطابقة أخيرة على الصورة الكاملة.',
            ],
        ];

        foreach ($updates as $sourceKey => $values) {
            ChartReading::where('source_key', $sourceKey)->update($values);
        }
    }

    public function down(): void
    {
        // لا تُرجع هذه الهجرة القراءات الأضعف السابقة حتى لا تضيع المراجعة اليدوية الأحدث.
    }
};
