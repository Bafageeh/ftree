import type { Person } from '../types';
import { bundledPeopleBatch3 } from './bundledPeopleBatch3';

const sourceReference = 'مشجرة أصول السادة آل باعلوي - الصفحة الوحيدة';

/**
 * نسخة احتياطية صحيحة للشجرة الأساسية عند تعذر الاتصال بالـ API.
 * لا تُبنى كسلسلة خطية؛ كل ابن مرتبط بأبيه الحقيقي كما يظهر في المشجرة.
 */
export const bundledPeople: Person[] = [
  core(1, 'محمد ﷺ', 'CORE-001', null, 1, 'central_trunk', 'رسول الله ﷺ'),
  core(2, 'فاطمة الزهراء', 'CORE-002', 1, 2, 'central_trunk', 'رضي الله عنها'),
  core(3, 'الحسين السبط', 'CORE-003', 2, 3, 'central_trunk', 'رضي الله عنه'),
  core(4, 'علي زين العابدين', 'CORE-004', 3, 4, 'central_trunk'),
  core(5, 'محمد الباقر', 'CORE-005', 4, 5, 'central_trunk'),
  core(6, 'جعفر الصادق', 'CORE-006', 5, 6, 'central_trunk'),
  core(7, 'علي العريضي', 'CORE-007', 6, 7, 'central_trunk'),
  core(8, 'محمد النقيب', 'CORE-008', 7, 8, 'central_trunk'),
  core(9, 'عيسى النقيب', 'CORE-009', 8, 9, 'central_trunk'),
  core(10, 'أحمد المهاجر', 'CORE-010', 9, 10, 'central_trunk'),
  core(11, 'عبيد الله', 'CORE-011', 10, 11, 'central_trunk'),
  core(12, 'علوي', 'CORE-012', 11, 12, 'central_trunk'),
  core(13, 'محمد', 'CORE-013', 12, 13, 'central_trunk'),
  core(14, 'علوي', 'CORE-014', 13, 14, 'central_trunk'),
  core(15, 'علي خالع قسم', 'CORE-015', 14, 15, 'central_trunk'),
  core(16, 'محمد صاحب مرباط', 'CORE-016', 15, 16, 'central_trunk'),

  // ابنا محمد صاحب مرباط.
  core(17, 'علي بن محمد صاحب مرباط', 'CORE-017', 16, 17, 'central_trunk', 'والد الفقيه المقدم'),
  core(1602, 'علوي بن محمد صاحب مرباط', 'MIRBAT-ALAWI-001', 16, 17, 'alawi_mirbat', 'عم الفقيه المقدم', 1702),

  core(18, 'محمد الفقيه المقدم', 'CORE-018', 17, 18, 'central_trunk'),

  // أبناء محمد الفقيه المقدم الظاهرون في مفتاح فروع المشجرة.
  core(19, 'علوي بن محمد الفقيه المقدم', 'CORE-019', 18, 19, 'alawi_faqih'),
  core(22, 'أحمد بن محمد الفقيه المقدم', 'CORE-022', 18, 19, 'ahmad_faqih'),
  core(23, 'علي بن محمد الفقيه المقدم', 'CORE-023', 18, 19, 'ali_faqih'),
  core(24, 'عبد الرحمن بن محمد الفقيه المقدم', 'CORE-024', 18, 19, 'abdulrahman_faqih'),

  // ابنا علوي بن محمد الفقيه المقدم.
  core(20, 'علي بن علوي بن محمد الفقيه المقدم', 'CORE-020', 19, 20, 'ali_alawi_faqih'),
  core(21, 'عبد الله بن علوي بن محمد الفقيه المقدم', 'CORE-021', 19, 20, 'abdullah_alawi_faqih'),

  // الدفعة الأولى المقروءة من القسمين المكبرين S02-03 و S03-03.
  core(2301, 'حسن الترابي', 'ALI-FAQIH-HASAN-TURABI', 23, 20, 'ali_faqih', undefined, 2301),
  core(2302, 'محمد أسد الله', 'ALI-FAQIH-MUHAMMAD-ASAD-ALLAH', 2301, 21, 'ali_faqih', undefined, 2302),
  core(2303, 'حسن المعلم', 'ALI-FAQIH-HASAN-MUALLIM', 2302, 22, 'ali_faqih', undefined, 2303),
  core(2304, 'أحمد بن محمد أسد الله', 'ALI-FAQIH-AHMAD-ASAD-ALLAH', 2302, 22, 'ali_faqih', undefined, 2304),
  core(2305, 'محمد جمل الليل بن حسن المعلم', 'ALI-FAQIH-MUHAMMAD-HASAN-MUALLIM', 2303, 23, 'ali_faqih', 'جمل الليل', 2305),
  core(2306, 'علوي بن أحمد بن محمد أسد الله', 'ALI-FAQIH-ALAWI-AHMAD', 2304, 23, 'ali_faqih', undefined, 2306),
  unclear(2307, 'S03-03-U001', 2302, 22, 'ali_faqih', 2307),

  // الدفعة الثانية: ذرية حسن المعلم ومحمد جمل الليل.
  core(2308, 'أحمد بن حسن المعلم', 'ALI-FAQIH-AHMAD-HASAN-MUALLIM', 2303, 23, 'ali_faqih', undefined, 2308),
  core(2309, 'علي بن محمد جمل الليل', 'JAMAL-ALLAYL-ALI', 2305, 24, 'ali_faqih', undefined, 2309),
  core(2310, 'عبد الله بن محمد جمل الليل', 'JAMAL-ALLAYL-ABDULLAH', 2305, 24, 'ali_faqih', undefined, 2310),
  core(2311, 'أحمد بن عبد الله بن محمد جمل الليل', 'JAMAL-ALLAYL-AHMAD-BIN-ABDULLAH', 2310, 25, 'ali_faqih', 'جد آل باحسن', 2311),

  ...bundledPeopleBatch3,
];

function core(
  id: number,
  full_name: string,
  source_code: string,
  lineage_parent_id: number | null,
  generation: number,
  chart_branch: string,
  honorific?: string,
  chart_order = id,
): Person {
  return {
    id,
    full_name,
    source_code,
    node_type: 'person',
    honorific: honorific ?? null,
    lineage_parent_id,
    status: 'readable',
    approval_status: 'supervisor_confirmed',
    is_provisional: false,
    supervisor_note: null,
    approved_at: null,
    chart_branch,
    chart_color: chartColor(chart_branch),
    generation,
    summary: 'قراءة مباشرة من المشجرة الأصلية، مع ربط الابن بأبيه في سلم النسب.',
    source_reference: sourceReference,
    source_locator: source_code,
    chart_order,
    is_living: false,
  };
}

function unclear(
  id: number,
  source_code: string,
  lineage_parent_id: number,
  generation: number,
  chart_branch: string,
  chart_order = id,
): Person {
  return {
    id,
    full_name: source_code,
    source_code,
    node_type: 'person',
    honorific: null,
    lineage_parent_id,
    status: 'unclear',
    approval_status: 'pending_supervisor',
    is_provisional: true,
    supervisor_note: 'رمز مؤقت؛ العلاقة مقروءة والاسم يحتاج استبدالًا.',
    approved_at: null,
    chart_branch,
    chart_color: chartColor(chart_branch),
    generation,
    summary: 'عقدة نسب صحيحة موضعيًا باسم مؤقت حتى تصحيح القراءة.',
    source_reference: 'مشجرة أصول السادة آل باعلوي - النسخة المقسمة المكبرة',
    source_locator: 'S03-03',
    chart_order,
    is_living: false,
  };
}

function chartColor(branch: string): string {
  const colors: Record<string, string> = {
    central_trunk: '#B98249',
    alawi_mirbat: '#F3E7A1',
    alawi_faqih: '#DFF3D4',
    ali_alawi_faqih: '#8EDB79',
    abdullah_alawi_faqih: '#FFFFFF',
    ahmad_faqih: '#DCEEF2',
    ali_faqih: '#DFF3D4',
    abdulrahman_faqih: '#F3E7A1',
  };

  return colors[branch] ?? '#FFFFFF';
}
