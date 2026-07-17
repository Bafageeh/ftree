import type { ComponentProps } from 'react';

import { ModernGenealogyTree } from './ModernGenealogyTree';
import type { ChartEdge, Person } from '../types';

type Props = ComponentProps<typeof ModernGenealogyTree>;

export function ConnectedGenealogyTree(props: Props) {
  const people = connectedToCanonicalRoot(props.people);
  const codes = new Set(people.map((person) => person.source_code).filter((code): code is string => !!code));
  const edges = props.edges.filter((edge: ChartEdge) => codes.has(edge.from_source_key) && codes.has(edge.to_source_key));

  return <ModernGenealogyTree {...props} people={people} edges={edges} />;
}

function connectedToCanonicalRoot(source: Person[]): Person[] {
  const byId = new Map(source.map((person) => [person.id, person]));
  const root = source.find((person) => person.source_code === 'CORE-001');
  if (!root) return source.filter((person) => person.approval_status !== 'rejected');

  const connected = new Set<number>([root.id]);

  const reachesRoot = (person: Person) => {
    if (connected.has(person.id)) return true;
    const visited = new Set<number>();
    const chain: number[] = [];
    let current: Person | undefined = person;

    while (current && !visited.has(current.id)) {
      if (connected.has(current.id)) {
        chain.forEach((id) => connected.add(id));
        return true;
      }
      visited.add(current.id);
      chain.push(current.id);
      current = current.lineage_parent_id ? byId.get(current.lineage_parent_id) : undefined;
    }

    return false;
  };

  source.forEach(reachesRoot);
  return source.filter((person) => connected.has(person.id) && person.approval_status !== 'rejected');
}
