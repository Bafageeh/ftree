<?php

use App\Models\ChartReading;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $rows = [
            [25, 1549, 599, 'عبد الله عبود', 'review', 84, 'person', 'قراءة الاسم واضحة، وضبط عبود يحتاج مطابقة نهائية.'],
            [26, 1624, 609, 'حسن الروع', 'review', 82, 'person', 'حسن واضح، وقراءة الروع مرجحة.'],
            [27, 654, 609, 'عقيل', 'readable', 99, 'person', null],
            [28, 361, 591, 'عبد الرحمن العطاس', 'readable', 98, 'branch_label', 'الاسم واللقب واضحان.'],
            [29, 730, 612, 'أحمد', 'readable', 99, 'person', null],
            [30, 577, 616, 'عمر العطاس', 'readable', 97, 'person', null],
            [31, 1221, 622, 'علي جد آل حسين', 'readable', 93, 'branch_label', 'عنوان فرع واضح في الصورة.'],
            [32, 811, 633, 'علي', 'readable', 99, 'person', null],
            [33, 1298, 633, 'سهيل', 'readable', 98, 'person', null],
            [34, 1475, 647, 'شيخ', 'readable', 98, 'person', null],
            [35, 1095, 650, 'زين جد آل عقيل بن عمر', 'review', 68, 'branch_label', 'قراءة زين وجد آل وعقيل بن عمر مرجحة، وتحتاج مراجعة حرفية.'],
            [36, 1401, 688, 'علي', 'readable', 99, 'person', null],
            [37, 1258, 738, 'حسين', 'readable', 99, 'person', null],
            [38, 587, 751, 'عيسى', 'readable', 97, 'person', null],
            [39, 973, 751, 'علي', 'readable', 99, 'person', null],
            [40, 502, 761, 'أبو بكر', 'readable', 98, 'person', null],
            [41, 1340, 754, 'أحمد', 'readable', 99, 'person', null],
            [42, 1506, 757, 'علي', 'readable', 99, 'person', null],
            [43, 1046, 759, 'حسن', 'readable', 99, 'person', null],
            [44, 1134, 774, 'شيخ', 'readable', 98, 'person', null],
            [45, 710, 777, 'أحمد', 'readable', 99, 'person', null],
            [46, 269, 776, 'محمد جد آل أبو فطيم', 'readable', 95, 'branch_label', 'العبارة واضحة، وهي عنوان فرع أسري.'],
            [47, 788, 796, 'صالح', 'readable', 99, 'person', null],
            [48, 1436, 807, 'عبد الرحمن', 'readable', 99, 'person', null],
            [49, 853, 844, 'شيخ بن يحيى', 'readable', 95, 'person', 'الاسم مركب ومقروء بوضوح جيد.'],
            [50, 926, 848, 'حسين', 'readable', 99, 'person', null],
            [51, 1370, 876, 'محمد جبر', 'review', 88, 'person', 'محمد واضح، وقراءة جبر تحتاج مطابقة أخيرة.'],
            [52, 1095, 891, 'محمد', 'readable', 99, 'person', null],
            [53, 1203, 884, 'حسن', 'readable', 99, 'person', null],
            [54, 996, 888, 'عقيل', 'readable', 99, 'person', null],
            [55, 1297, 896, 'علي', 'readable', 99, 'person', null],
            [56, 562, 910, 'أحمد', 'readable', 99, 'person', null],
            [57, 667, 908, 'أحمد', 'readable', 99, 'person', null],
            [58, 1439, 916, 'شيخ', 'readable', 98, 'person', null],
            [59, 743, 917, 'أحمد عبيد [اللقب غير محسوم]', 'unclear', 52, 'person', 'أحمد عبيد واضحان، أما الكلمة الثالثة فلا يمكن اعتمادها من الصورة الحالية.'],
            [60, 441, 956, 'عمر العطاس', 'readable', 96, 'person', 'الاسم واللقب مقروءان.'],
            [61, 900, 978, 'حسين', 'readable', 99, 'person', null],
            [62, 821, 983, 'علوي', 'readable', 99, 'person', null],
            [63, 1135, 987, 'شيخ', 'readable', 98, 'person', null],
            [64, 1041, 995, 'سالم', 'readable', 99, 'person', null],
            [65, 221, 981, 'الشيخ أبو بكر', 'readable', 96, 'branch_label', 'عنوان فرع أو لقب مركب ظاهر على ورقة كبيرة.'],
            [66, 1376, 1000, 'علي', 'readable', 99, 'person', null],
            [67, 502, 1026, 'محمد', 'readable', 99, 'person', null],
            [68, 1292, 1032, 'علوي', 'readable', 99, 'person', null],
            [69, 1205, 1035, 'عبد الله', 'readable', 99, 'person', null],
            [70, 965, 1041, 'هاشم', 'review', 78, 'person', 'القراءة الأقرب هاشم، وتحتاج تأكيد شكل الشين.'],
            [71, 399, 1070, 'عبد الرحمن', 'readable', 99, 'person', null],
            [72, 1450, 1063, 'علوي الغيور', 'review', 86, 'person', 'علوي واضح، وقراءة الغيور مرجحة.'],
            [73, 640, 1069, 'محمد', 'readable', 99, 'person', null],
            [74, 713, 1078, 'حسين جد آل حسين', 'readable', 93, 'branch_label', 'عنوان فرع واضح إجمالًا.'],
            [75, 563, 1090, 'عبد الرحمن', 'readable', 99, 'person', null],
            [76, 1099, 1091, 'عبد الله', 'readable', 99, 'person', null],
            [77, 1023, 1111, 'شيخ', 'readable', 98, 'person', null],
            [78, 880, 1115, 'عقيل جد آل باعوي', 'review', 70, 'branch_label', 'عقيل وجد آل واضحان، وضبط باعوي يحتاج مراجعة.'],
            [79, 472, 1130, 'عبد الله عبود', 'review', 84, 'person', 'تكرار موضع لاسم عبد الله عبود، وضبط اللقب يحتاج مراجعة.'],
            [80, 1516, 1131, 'عبد الله', 'readable', 99, 'person', null],
            [81, 1328, 1139, 'محمد بن علي [اللقب غير محسوم]', 'unclear', 50, 'person', 'محمد بن علي واضح، والكلمة الأخيرة غير مقروءة بما يكفي.'],
            [82, 1247, 1142, 'محمد', 'readable', 99, 'person', null],
            [83, 1595, 1144, 'عبد الرحمن', 'readable', 99, 'person', null],
            [84, 785, 1153, 'علي', 'readable', 99, 'person', null],
            [85, 1172, 1156, 'عبد الرحمن', 'readable', 99, 'person', null],
            [86, 385, 1175, 'عبد الرحمن الأبيض', 'readable', 94, 'person', 'الاسم واللقب مقروءان بوضوح جيد.'],
            [87, 1425, 1179, 'علي', 'readable', 99, 'person', null],
            [88, 602, 1186, 'محمد', 'readable', 99, 'person', null],
            [89, 681, 1199, 'علي', 'readable', 99, 'person', null],
            [90, 192, 1179, 'أبو بكر فقيه جد آل بن بكر للسقاف بن عقيل', 'unclear', 45, 'branch_label', 'عبارة طويلة متعددة الأسطر؛ أجزاء منها ظاهرة لكن ترتيبها الحرفي يحتاج مراجعة مكبرة.'],
            [91, 1106, 1215, 'حسن', 'readable', 99, 'person', null],
            [92, 515, 1221, 'عبد الرحمن', 'readable', 99, 'person', null],
            [93, 857, 1226, 'حسين', 'readable', 99, 'person', null],
            [94, 1035, 1227, 'أبو بكر بن محمد', 'review', 88, 'person', 'الاسم المركب مرجح بقوة ويحتاج مطابقة نهائية.'],
            [95, 1485, 1256, 'علي الفقيه 590هـ', 'review', 84, 'person', 'علي الفقيه واضح، والرقم يبدو 590هـ ويحتاج تأكيد نوع التاريخ.'],
            [96, 1572, 1261, 'محمد الفقيه المقدم 653هـ', 'readable', 92, 'person', 'محمد الفقيه المقدم واضح، والرقم 653هـ ظاهر بوضوح جيد.'],
        ];

        foreach ($rows as [$number, $x, $y, $name, $status, $confidence, $type, $notes]) {
            $sourceKey = sprintf('green-g%03d-%d-%d', $number, $x, $y);

            ChartReading::updateOrCreate(
                ['source_key' => $sourceKey],
                [
                    'provisional_name' => $name,
                    'normalized_name' => $status === 'readable' ? $name : null,
                    'parent_source_key' => null,
                    'chart_branch' => 'ali_alawi_faqih',
                    'chart_color' => '#8EDB79',
                    'node_type' => $type,
                    'reading_status' => $status,
                    'confidence' => $confidence,
                    'source_locator' => sprintf('الفرع الأخضر - G%03d - الإحداثي %d,%d', $number, $x, $y),
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
            ->where('source_key', '>=', 'green-g025-')
            ->where('source_key', '<=', 'green-g096-~')
            ->delete();
    }
};
