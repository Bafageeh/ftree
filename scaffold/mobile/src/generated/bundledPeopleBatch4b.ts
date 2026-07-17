import type { Person } from '../types';

const branch = 'ahmad_faqih';
const color = '#DCEEF2';
const sourceReference = 'مشجرة أصول السادة آل باعلوي - النسخة المقسمة المكبرة';

export const bundledPeopleBatch4b: Person[] = [
  temp(2425, 'S03-04-C-ROOT-U001', 22, 20),
  person(2426, 'عبد الله', 'S03-04-C-ABDULLAH-001', 2425, 21),
  person(2427, 'سالم', 'S03-04-C-SALIM-001', 2426, 22),
  person(2428, 'بيت بكر', 'S03-04-C-BAYT-BAKR', 2427, 23),
  person(2429, 'محمود', 'S03-04-C-MAHMOUD-001', 2426, 22),
  temp(2430, 'S03-04-C-U001', 2429, 23),
  temp(2431, 'S03-04-D-ROOT-U001', 22, 20),
  person(2432, 'عبد الرحمن', 'S03-04-D-ABDULRAHMAN-001', 2431, 21),
  person(2433, 'عمر', 'S03-04-D-UMAR-ALFAQIRI', 2432, 22, 'جد آل الفقيري'),
  temp(2434, 'S03-04-E-ROOT-U001', 22, 20),
  person(2435, 'محمد البيض', 'S03-04-E-MUHAMMAD-ALBAYD', 2434, 21),
  person(2436, 'عبد الرحمن', 'S03-04-E-ABDULRAHMAN-001', 2435, 22),
  person(2437, 'محروس', 'S03-04-E-MAHROUS-001', 2435, 22),
  temp(2438, 'S03-04-F-ROOT-U001', 22, 20),
  person(2439, 'عبد الرحمن بالفقية', 'S03-04-F-ABDULRAHMAN-BALFAQIH', 2438, 21),
  temp(2440, 'S03-04-G-ROOT-U001', 22, 20),
  person(2441, 'محمد البار', 'S03-04-G-MUHAMMAD-ALBAR', 2440, 21),
  person(2442, 'عبد الرحمن', 'S03-04-G-ABDULRAHMAN-001', 2441, 22),
  person(2443, 'عمر', 'S03-04-G-UMAR-001', 2442, 23),
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
