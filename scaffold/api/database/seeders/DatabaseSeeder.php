<?php

namespace Database\Seeders;

use App\Models\Person;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['محمد ﷺ', 'رسول الله ﷺ', null, 'readable'],
            ['فاطمة الزهراء', 'رضي الله عنها', 1, 'readable'],
            ['الحسين السبط', 'رضي الله عنه', 2, 'readable'],
            ['علي زين العابدين', null, 3, 'readable'],
            ['محمد الباقر', null, 4, 'readable'],
            ['جعفر الصادق', null, 5, 'readable'],
            ['علي العريضي', null, 6, 'review'],
            ['محمد النقيب', null, 7, 'review'],
            ['عيسى النقيب', null, 8, 'review'],
            ['أحمد المهاجر', null, 9, 'readable'],
            ['عبيد الله', null, 10, 'review'],
            ['علوي', null, 11, 'review'],
            ['محمد', null, 12, 'review'],
            ['علوي', null, 13, 'review'],
            ['علي خالع قسم', null, 14, 'review'],
            ['محمد صاحب مرباط', null, 15, 'review'],
        ];

        $ids = [];

        foreach ($rows as $index => [$name, $honorific, $parentGeneration, $status]) {
            $generation = $index + 1;
            $person = Person::updateOrCreate(
                ['full_name' => $name, 'generation' => $generation],
                [
                    'honorific' => $honorific,
                    'lineage_parent_id' => $parentGeneration ? ($ids[$parentGeneration] ?? null) : null,
                    'status' => $status,
                    'summary' => 'قراءة تأسيسية من السلسلة الوسطى للمشجرة، وتحتاج إلى ربطها بالمصدر المعتمد.',
                    'source_reference' => 'المشجرة الأصلية المرفقة',
                    'is_living' => false,
                ]
            );

            $ids[$generation] = $person->id;
        }
    }
}
