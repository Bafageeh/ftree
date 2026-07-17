import type { Person } from '../types';

const sourceReference = 'مشجرة أصول السادة آل باعلوي - النسخة المقسمة المكبرة';

export const bundledPeopleBatch3: Person[] = [
  review(2312, 'حسن بن علي بن محمد جمل الليل', 'JAMAL-ALI-HASAN', 2309, 25, 'ali_faqih'),
  review(2313, 'عبد الرحمن بن علي بن محمد جمل الليل', 'JAMAL-ALI-ABDULRAHMAN', 2309, 25, 'ali_faqih'),
  review(2314, 'أحمد بن علي بن محمد جمل الليل', 'JAMAL-ALI-AHMAD', 2309, 25, 'ali_faqih', 'جد آل الغرور'),
  review(2315, 'هارون بن حسن بن علي بن محمد جمل الليل', 'JAMAL-HASAN-HARUN', 2312, 26, 'ali_faqih'),
  review(2316, 'عبد الله الصالح بن هارون', 'JAMAL-HARUN-ABDULLAH-ALSALIH', 2315, 27, 'ali_faqih'),
  review(2317, 'أحمد بن هارون', 'JAMAL-HARUN-AHMAD', 2315, 27, 'ali_faqih'),
  review(2318, 'حسين بن عبد الله الصالح', 'JAMAL-ABDULLAH-ALSALIH-HUSAYN', 2316, 28, 'ali_faqih'),
  review(2319, 'عبد الرحمن بن عبد الله الصالح', 'JAMAL-ABDULLAH-ALSALIH-ABDULRAHMAN', 2316, 28, 'ali_faqih'),
  review(2320, 'محمد بن عبد الله الصالح', 'JAMAL-ABDULLAH-ALSALIH-MUHAMMAD', 2316, 28, 'ali_faqih'),
  review(2321, 'أحمد بن عبد الله الصالح', 'JAMAL-ABDULLAH-ALSALIH-AHMAD', 2316, 28, 'ali_faqih'),
  unclear(2322, 'S03-04-U002', 2316, 28, 'ali_faqih'),
  unclear(2323, 'S03-04-U003', 2315, 27, 'ali_faqih'),
  unclear(2324, 'S03-04-U004', 2309, 25, 'ali_faqih'),
  unclear(2325, 'S04-04-GROOT-U001', 20, 21, 'ali_alawi_faqih'),
  review(2326, 'عبد الله', 'ALI-ALAWI-BRANCH-ABDULLAH', 2325, 22, 'ali_alawi_faqih'),
  review(2327, 'سالم بن عبد الله', 'ALI-ALAWI-BRANCH-SALIM', 2326, 23, 'ali_alawi_faqih'),
  review(2328, 'محمد بن عبد الله', 'ALI-ALAWI-BRANCH-MUHAMMAD', 2326, 23, 'ali_alawi_faqih'),
  review(2329, 'محمد الفقيري بن سالم', 'ALI-ALAWI-MUHAMMAD-ALFAQIRI', 2327, 24, 'ali_alawi_faqih'),
  review(2330, 'عقيل الفقيري بن عبد الله', 'ALI-ALAWI-AQIL-ALFAQIRI', 2326, 23, 'ali_alawi_faqih'),
  unclear(2331, 'S04-04-U002', 2326, 23, 'ali_alawi_faqih'),
  unclear(2332, 'S04-04-U003', 2327, 24, 'ali_alawi_faqih'),
];

function review(
  id: number,
  fullName: string,
  sourceCode: string,
  parentId: number,
  generation: number,
  branch: string,
  honorific?: string,
): Person {
  return {
    id,
    full_name: fullName,
    source_code: sourceCode,
    node_type: 'person',
    honorific: honorific ?? null,
    lineage_parent_id: parentId,
    status: 'readable',
    approval_status: 'pending_supervisor',
    is_provisional: true,
    supervisor_note: 'الاسم مقروء من القسم المكبر والعلاقة متاحة للمراجعة والتعديل.',
    approved_at: null,
    chart_branch: branch,
    chart_color: chartColor(branch),
    generation,
    summary: 'استيراد سريع من المشجرة المكبرة مع إبقاء السجل قابلًا للتعديل والمراجعة.',
    source_reference: sourceReference,
    source_locator: sourceCode,
    chart_order: id,
    is_living: false,
  };
}

function unclear(
  id: number,
  sourceCode: string,
  parentId: number,
  generation: number,
  branch: string,
): Person {
  return {
    id,
    full_name: sourceCode,
    source_code: sourceCode,
    node_type: 'person',
    honorific: null,
    lineage_parent_id: parentId,
    status: 'unclear',
    approval_status: 'pending_supervisor',
    is_provisional: true,
    supervisor_note: 'رمز مؤقت؛ العلاقة مقروءة والاسم يحتاج استبدالًا.',
    approved_at: null,
    chart_branch: branch,
    chart_color: chartColor(branch),
    generation,
    summary: 'عقدة نسب صحيحة موضعيًا باسم مؤقت حتى تصحيح القراءة.',
    source_reference: sourceReference,
    source_locator: sourceCode,
    chart_order: id,
    is_living: false,
  };
}

function chartColor(branch: string): string {
  return branch === 'ali_alawi_faqih' ? '#8EDB79' : '#DFF3D4';
}
