import type { Person } from '../types';

const branch = 'ahmad_faqih';
const color = '#DCEEF2';
const sourceReference = 'مشجرة أصول السادة آل باعلوي - النسخة المقسمة المكبرة';

export const bundledPeopleBatch4a: Person[] = [
  temp(2400, 'S03-04-A-ROOT-U001', 22, 20),
  person(2401, 'أحمد', 'S03-04-A-AHMAD-001', 2400, 21),
  person(2402, 'أبو بكر', 'S03-04-A-ABUBAKR-001', 2401, 22),
  person(2403, 'محمد', 'S03-04-A-MUHAMMAD-001', 2402, 23),
  person(2404, 'أبو بكر', 'S03-04-A-ABUBAKR-002', 2403, 24),
  person(2405, 'محمد الوصال', 'S03-04-A-MUHAMMAD-ALWISAL', 2404, 25),
  person(2406, 'عبد الله', 'S03-04-A-ABDULLAH-001', 2401, 22),
  person(2407, 'أبو بكر', 'S03-04-A-ABUBAKR-003', 2406, 23, 'بقية اللقب غير واضحة'),
  person(2408, 'محمد', 'S03-04-A-MUHAMMAD-002', 2401, 22),
  person(2409, 'عمر', 'S03-04-A-UMAR-001', 2408, 23),
  person(2410, 'أحمد', 'S03-04-A-AHMAD-002', 2409, 24, 'بقية الاسم غير واضحة'),
  person(2411, 'أحمد', 'S03-04-A-AHMAD-003', 2400, 21),
  person(2412, 'علوي', 'S03-04-A-ALAWI-001', 2411, 22),
  temp(2413, 'S03-04-B-ROOT-U001', 22, 20),
  person(2414, 'محمد', 'S03-04-B-MUHAMMAD-001', 2413, 21),
  person(2415, 'علي', 'S03-04-B-ALI-001', 2414, 22),
  person(2416, 'جمان', 'S03-04-B-JUMAN-001', 2415, 23),
  person(2417, 'حسن', 'S03-04-B-HASAN-001', 2416, 24),
  person(2418, 'أحمد', 'S03-04-B-AHMAD-001', 2415, 23),
  person(2419, 'عبد الله', 'S03-04-B-ABDULLAH-001', 2418, 24),
  person(2420, 'عبد الرحمن السقاف', 'S03-04-B-ABDULRAHMAN-ALSAQQAF', 2419, 25),
  person(2421, 'محمد', 'S03-04-B-MUHAMMAD-002', 2415, 23),
  person(2422, 'أبو بكر الجفري', 'S03-04-B-ABUBAKR-ALJIFRI', 2421, 24),
  person(2423, 'علي الخواص', 'S03-04-B-ALI-ALKHAWAS', 2422, 25),
  person(2424, 'عبد الرحمن', 'S03-04-B-ABDULRAHMAN-001', 2421, 24),
];

function person(id: number, fullName: string, sourceCode: string, parentId: number, generation: number, honorific?: string): Person {
  return node(id, fullName, sourceCode, parentId, generation, 'readable', honorific);
}

function temp(id: number, sourceCode: string, parentId: number, generation: number): Person {
  return node(id, sourceCode, sourceCode, parentId, generation, 'unclear');
}

function node(id: number, fullName: string, sourceCode: string, parentId: number, generation: number, status: 'readable' | 'unclear', honorific?: string): Person {
  return {
    id,
    full_name: fullName,
    source_code: sourceCode,
    node_type: 'person',
    honorific: honorific ?? null,
    lineage_parent_id: parentId,
    status,
    approval_status: 'pending_supervisor',
    is_provisional: true,
    supervisor_note: status === 'unclear' ? 'رمز مؤقت من القسم S03-04.' : 'قراءة أولية من القسم S03-04 قابلة للمراجعة.',
    approved_at: null,
    chart_branch: branch,
    chart_color: color,
    generation,
    summary: 'قراءة موسعة من المشجرة المكبرة.',
    source_reference: sourceReference,
    source_locator: sourceCode,
    chart_order: id,
    is_living: false,
  };
}
