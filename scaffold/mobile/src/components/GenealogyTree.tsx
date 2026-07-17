import { CompletePropheticTree } from './CompletePropheticTree';
import type { TreeStatusFilter } from './ModernGenealogyTree';
import type { ChartEdge, Person } from '../types';

type Props = {
  people: Person[];
  edges: ChartEdge[];
  branchLabels: Record<string, string>;
  statusFilter?: TreeStatusFilter;
};

const MIRBAT_CODE = 'CORE-016';
const ALAWI_MIRBAT_CODE = 'MIRBAT-ALAWI-001';

export function GenealogyTree(props: Props) {
  return <CompletePropheticTree {...props} people={withVerifiedMirbatChildren(props.people)} />;
}

function withVerifiedMirbatChildren(source: Person[]): Person[] {
  const mirbat = source.find((person) => person.source_code === MIRBAT_CODE);
  if (!mirbat) return source;

  const corrected = source.map((person) => {
    if (person.source_code !== 'CORE-017') return person;

    return {
      ...person,
      full_name: 'علي بن محمد صاحب مرباط',
      honorific: 'والد الفقيه المقدم',
      lineage_parent_id: mirbat.id,
    };
  });

  if (corrected.some((person) => person.source_code === ALAWI_MIRBAT_CODE)) {
    return corrected;
  }

  const alawi: Person = {
    id: -1602,
    full_name: 'علوي بن محمد صاحب مرباط',
    source_code: ALAWI_MIRBAT_CODE,
    node_type: 'person',
    honorific: 'عم الفقيه المقدم',
    lineage_parent_id: mirbat.id,
    status: 'readable',
    approval_status: 'supervisor_confirmed',
    is_provisional: false,
    generation: (mirbat.generation || 16) + 1,
    chart_branch: 'alawi_mirbat',
    chart_color: '#F3E7A1',
    chart_order: 1702,
    summary: 'الابن الثاني لمحمد صاحب مرباط، وعم محمد الفقيه المقدم.',
    source_reference: 'مشجرة أصول السادة آل باعلوي - الصفحة الوحيدة',
    source_locator: 'مركز المشجرة فوق محمد صاحب مرباط - علوي عم الفقيه المقدم',
    is_living: false,
  };

  return [...corrected, alawi];
}

export type { TreeStatusFilter };
