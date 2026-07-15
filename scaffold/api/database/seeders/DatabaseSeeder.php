<?php

namespace Database\Seeders;

use App\Models\ChartReading;
use App\Models\Person;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $nodes = [
            // السلسلة الوسطى المقروءة في الجذع.
            ['key' => 'prophet', 'name' => 'محمد ﷺ', 'honorific' => 'رسول الله ﷺ', 'parent' => null, 'generation' => 1, 'order' => 1, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط - الدائرة الكبرى'],
            ['key' => 'fatimah', 'name' => 'فاطمة الزهراء', 'honorific' => 'رضي الله عنها', 'parent' => 'prophet', 'generation' => 2, 'order' => 2, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط - فوق الدائرة الكبرى'],
            ['key' => 'husayn', 'name' => 'الحسين السبط', 'honorific' => 'رضي الله عنه', 'parent' => 'fatimah', 'generation' => 3, 'order' => 3, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط'],
            ['key' => 'zayn', 'name' => 'علي زين العابدين', 'honorific' => null, 'parent' => 'husayn', 'generation' => 4, 'order' => 4, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط'],
            ['key' => 'baqir', 'name' => 'محمد الباقر', 'honorific' => null, 'parent' => 'zayn', 'generation' => 5, 'order' => 5, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط'],
            ['key' => 'sadiq', 'name' => 'جعفر الصادق', 'honorific' => null, 'parent' => 'baqir', 'generation' => 6, 'order' => 6, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط'],
            ['key' => 'uraydi', 'name' => 'علي العريضي', 'honorific' => null, 'parent' => 'sadiq', 'generation' => 7, 'order' => 7, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط'],
            ['key' => 'muhammad_naqib', 'name' => 'محمد النقيب', 'honorific' => null, 'parent' => 'uraydi', 'generation' => 8, 'order' => 8, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط'],
            ['key' => 'isa_naqib', 'name' => 'عيسى النقيب', 'honorific' => null, 'parent' => 'muhammad_naqib', 'generation' => 9, 'order' => 9, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط'],
            ['key' => 'ahmad_muhajir', 'name' => 'أحمد المهاجر', 'honorific' => null, 'parent' => 'isa_naqib', 'generation' => 10, 'order' => 10, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط'],
            ['key' => 'ubaydillah', 'name' => 'عبيد الله', 'honorific' => null, 'parent' => 'ahmad_muhajir', 'generation' => 11, 'order' => 11, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط'],
            ['key' => 'alawi_1', 'name' => 'علوي', 'honorific' => null, 'parent' => 'ubaydillah', 'generation' => 12, 'order' => 12, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط - علوي الأول'],
            ['key' => 'muhammad_2', 'name' => 'محمد', 'honorific' => null, 'parent' => 'alawi_1', 'generation' => 13, 'order' => 13, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط - محمد الثاني'],
            ['key' => 'alawi_2', 'name' => 'علوي', 'honorific' => null, 'parent' => 'muhammad_2', 'generation' => 14, 'order' => 14, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط - علوي الثاني'],
            ['key' => 'khali_qasam', 'name' => 'علي خالع قسم', 'honorific' => null, 'parent' => 'alawi_2', 'generation' => 15, 'order' => 15, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'الجذع الأوسط'],
            ['key' => 'sahib_mirbat', 'name' => 'محمد صاحب مرباط', 'honorific' => null, 'parent' => 'khali_qasam', 'generation' => 16, 'order' => 16, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'رأس الجذع الأوسط'],

            // بداية التفرع الملوّن كما يظهر في مركز المشجرة ومفتاح الألوان.
            ['key' => 'ali_father_faqih', 'name' => 'علي بن محمد صاحب مرباط', 'honorific' => 'والد الفقيه المقدم', 'parent' => 'sahib_mirbat', 'generation' => 17, 'order' => 17, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'مركز المشجرة - علي والد الفقيه'],
            ['key' => 'faqih_muqaddam', 'name' => 'محمد الفقيه المقدم', 'honorific' => null, 'parent' => 'ali_father_faqih', 'generation' => 18, 'order' => 18, 'branch' => 'central_trunk', 'color' => '#B98249', 'status' => 'readable', 'locator' => 'مركز المشجرة - محمد الفقيه المقدم'],
            ['key' => 'alawi_faqih', 'name' => 'علوي بن الفقيه المقدم', 'honorific' => null, 'parent' => 'faqih_muqaddam', 'generation' => 19, 'order' => 19, 'branch' => 'alawi_faqih', 'color' => '#DFF3D4', 'status' => 'readable', 'locator' => 'مركز المشجرة ومفتاح الألوان'],
            ['key' => 'ali_alawi_faqih', 'name' => 'علي بن علوي بن الفقيه المقدم', 'honorific' => null, 'parent' => 'alawi_faqih', 'generation' => 20, 'order' => 20, 'branch' => 'ali_alawi_faqih', 'color' => '#8EDB79', 'status' => 'readable', 'locator' => 'مفتاح الألوان - الفرع الأخضر'],
            ['key' => 'abdullah_alawi_faqih', 'name' => 'عبد الله بن علوي بن الفقيه المقدم', 'honorific' => null, 'parent' => 'alawi_faqih', 'generation' => 20, 'order' => 21, 'branch' => 'abdullah_alawi_faqih', 'color' => '#FFFFFF', 'status' => 'readable', 'locator' => 'مفتاح الألوان - الفرع الأبيض'],
            ['key' => 'ahmad_faqih', 'name' => 'أحمد بن الفقيه المقدم', 'honorific' => null, 'parent' => 'faqih_muqaddam', 'generation' => 19, 'order' => 22, 'branch' => 'ahmad_faqih', 'color' => '#DCEEF2', 'status' => 'readable', 'locator' => 'مفتاح الألوان - الفرع الأزرق الفاتح'],
            ['key' => 'ali_faqih', 'name' => 'علي بن الفقيه المقدم', 'honorific' => null, 'parent' => 'faqih_muqaddam', 'generation' => 19, 'order' => 23, 'branch' => 'ali_faqih', 'color' => '#DFF3D4', 'status' => 'readable', 'locator' => 'مفتاح الألوان - الفرع الأخضر الفاتح'],
            ['key' => 'abdulrahman_faqih', 'name' => 'عبد الرحمن بن الفقيه المقدم', 'honorific' => null, 'parent' => 'faqih_muqaddam', 'generation' => 19, 'order' => 24, 'branch' => 'abdulrahman_faqih', 'color' => '#F3E7A1', 'status' => 'readable', 'locator' => 'مفتاح الألوان - الفرع الأصفر'],
        ];

        $records = [];

        foreach ($nodes as $node) {
            $parentId = $node['parent'] ? ($records[$node['parent']]->id ?? null) : null;

            $query = Person::query()
                ->where('full_name', $node['name'])
                ->where('generation', $node['generation']);

            $person = $query->first() ?? new Person();
            $person->fill([
                'full_name' => $node['name'],
                'node_type' => 'person',
                'honorific' => $node['honorific'],
                'lineage_parent_id' => $parentId,
                'status' => $node['status'],
                'chart_branch' => $node['branch'],
                'chart_color' => $node['color'],
                'generation' => $node['generation'],
                'summary' => 'قراءة مباشرة من مشجرة أصول السادة آل باعلوي المرفقة، وتخضع للمراجعة العلمية وربط المصادر.',
                'source_reference' => 'مشجرة أصول السادة آل باعلوي - الصفحة الوحيدة',
                'source_locator' => $node['locator'],
                'chart_order' => $node['order'],
                'is_living' => false,
            ]);
            $person->save();

            $records[$node['key']] = $person;
        }

        // قراءات الفروع تحفظ أولًا في طابور مستقل حتى لا تُعتمد علاقة نسب غير محسومة.
        $readings = [
            ['source_key' => 'g-attas-abdulrahman', 'name' => 'عبد الرحمن العطاس', 'parent' => null, 'type' => 'branch_label', 'status' => 'readable', 'confidence' => 99, 'locator' => 'الفرع الأخضر الأيسر - الورقة الأولى - الورقة الكبيرة الوسطى', 'notes' => 'الاسم واللقب واضحان.'],
            ['source_key' => 'g-attas-omar', 'name' => 'عمر العطاس', 'parent' => 'g-attas-abdulrahman', 'type' => 'person', 'status' => 'readable', 'confidence' => 97, 'locator' => 'الفرع الأخضر الأيسر - الورقة الأولى - البيضاوي الأيمن', 'notes' => 'السهم يتجه نحو عبد الرحمن العطاس.'],
            ['source_key' => 'g-attas-aqil', 'name' => 'عقيل', 'parent' => 'g-attas-abdulrahman', 'type' => 'person', 'status' => 'readable', 'confidence' => 94, 'locator' => 'الفرع الأخضر الأيسر - الورقة الأولى - البيضاوي الأوسط', 'notes' => 'الاسم واضح، ويحتاج تأكيد ترتيب العلاقة.'],
            ['source_key' => 'g-attas-ahmad', 'name' => 'أحمد', 'parent' => 'g-attas-abdulrahman', 'type' => 'person', 'status' => 'readable', 'confidence' => 94, 'locator' => 'الفرع الأخضر الأيسر - الورقة الأولى - البيضاوي الأيمن الخارجي', 'notes' => 'الاسم واضح، ويحتاج تأكيد ترتيب العلاقة.'],

            ['source_key' => 'g-abu-futaym-muhammad', 'name' => 'محمد جد آل أبو فطيم', 'parent' => null, 'type' => 'branch_label', 'status' => 'review', 'confidence' => 82, 'locator' => 'الفرع الأخضر الأيسر - الورقة الثانية - الورقة الكبيرة العليا', 'notes' => 'محمد وجد آل واضحان؛ ضبط لقب أبو فطيم يحتاج مراجعة على الأصل.'],
            ['source_key' => 'g-abu-futaym-abubakr', 'name' => 'أبو بكر', 'parent' => 'g-abu-futaym-muhammad', 'type' => 'person', 'status' => 'readable', 'confidence' => 96, 'locator' => 'الفرع الأخضر الأيسر - الورقة الثانية - البيضاوي العلوي', 'notes' => null],
            ['source_key' => 'g-abu-futaym-abdullah', 'name' => 'عبد الله', 'parent' => 'g-abu-futaym-muhammad', 'type' => 'person', 'status' => 'readable', 'confidence' => 96, 'locator' => 'الفرع الأخضر الأيسر - الورقة الثانية - البيضاوي المجاور', 'notes' => null],

            ['source_key' => 'g-masawi-ahmad', 'name' => 'أحمد المساوي', 'parent' => null, 'type' => 'branch_label', 'status' => 'review', 'confidence' => 86, 'locator' => 'الفرع الأخضر الأيسر - الورقة الرابعة - الورقة الكبيرة العليا', 'notes' => 'قراءة المساوي مرجحة وتحتاج مطابقة حرفية.'],
            ['source_key' => 'g-masawi-taha', 'name' => 'طه', 'parent' => 'g-masawi-ahmad', 'type' => 'person', 'status' => 'readable', 'confidence' => 98, 'locator' => 'الفرع الأخضر الأيسر - الورقة الرابعة - البيضاوي أسفل الورقة', 'notes' => null],
            ['source_key' => 'g-masawi-alawi-saqaf', 'name' => 'علوي بن السقاف', 'parent' => 'g-masawi-ahmad', 'type' => 'person', 'status' => 'review', 'confidence' => 88, 'locator' => 'الفرع الأخضر الأيسر - الورقة الرابعة - البيضاوي العلوي الأوسط', 'notes' => 'الاسم ظاهر، وتحتاج الباء في بن إلى تأكيد.'],

            ['source_key' => 'g-baaqil-omar', 'name' => 'عمر جد آل باعقيل', 'parent' => null, 'type' => 'branch_label', 'status' => 'readable', 'confidence' => 95, 'locator' => 'الفرع الأخضر الأيسر - الورقة الخامسة - الورقة الكبيرة', 'notes' => 'العبارة واضحة في الصورة.'],
            ['source_key' => 'g-shihab-ahmad', 'name' => 'أحمد جد آل شهاب', 'parent' => null, 'type' => 'branch_label', 'status' => 'review', 'confidence' => 84, 'locator' => 'الفرع الأخضر الأيسر - الورقة الخامسة - البيضاوي المؤرخ 996', 'notes' => 'العبارة مرجحة؛ الرقم 996 ظاهر ويحتاج تحديد نوع التاريخ.'],

            ['source_key' => 'g-binsumayt-aqil', 'name' => 'عقيل جد آل بن سميط', 'parent' => null, 'type' => 'branch_label', 'status' => 'readable', 'confidence' => 96, 'locator' => 'الفرع الأخضر الأيسر - الورقة السادسة - الورقة الكبيرة العليا', 'notes' => 'العبارة واضحة.'],
            ['source_key' => 'g-binsumayt-shaykh-saqaf', 'name' => 'شيخ السقاف', 'parent' => 'g-binsumayt-aqil', 'type' => 'person', 'status' => 'readable', 'confidence' => 94, 'locator' => 'الفرع الأخضر الأيسر - الورقة السادسة - البيضاوي العلوي الأوسط', 'notes' => null],
            ['source_key' => 'g-binsumayt-abdulrahman', 'name' => 'عبد الرحمن', 'parent' => 'g-binsumayt-aqil', 'type' => 'person', 'status' => 'readable', 'confidence' => 94, 'locator' => 'الفرع الأخضر الأيسر - الورقة السادسة - البيضاوي العلوي الأيمن', 'notes' => 'العلاقة تحتاج متابعة السهم في الصورة الكاملة.'],
        ];

        foreach ($readings as $reading) {
            ChartReading::updateOrCreate(
                ['source_key' => $reading['source_key']],
                [
                    'provisional_name' => $reading['name'],
                    'normalized_name' => $reading['status'] === 'readable' ? $reading['name'] : null,
                    'parent_source_key' => $reading['parent'],
                    'chart_branch' => 'ali_alawi_faqih',
                    'chart_color' => '#8EDB79',
                    'node_type' => $reading['type'],
                    'reading_status' => $reading['status'],
                    'confidence' => $reading['confidence'],
                    'source_locator' => $reading['locator'],
                    'notes' => $reading['notes'],
                    'is_promoted' => false,
                    'person_id' => null,
                ]
            );
        }
    }
}
