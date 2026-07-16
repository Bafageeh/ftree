import type { ChartEdge, Person } from '../types';

export type RelationMeta = {
  edge?: ChartEdge;
  confirmed: boolean;
};

export type IncomingRelation = {
  parent: Person;
  meta: RelationMeta;
};

export type GenealogyGraph = {
  byId: Map<number, Person>;
  byCode: Map<string, Person>;
  childrenByParent: Map<number, Person[]>;
  incomingByChild: Map<number, IncomingRelation[]>;
  relationByPair: Map<string, RelationMeta>;
  relationshipCount: number;
  connectedIds: Set<number>;
};

export function buildGenealogyGraph(people: Person[], edges: ChartEdge[]): GenealogyGraph {
  const byId = new Map(people.map((person) => [person.id, person]));
  const byCode = new Map(
    people
      .filter((person) => person.source_code)
      .map((person) => [person.source_code as string, person]),
  );
  const childrenByParent = new Map<number, Person[]>();
  const incomingByChild = new Map<number, IncomingRelation[]>();
  const relationByPair = new Map<string, RelationMeta>();
  const connectedIds = new Set<number>();

  const addRelation = (parent: Person, child: Person, meta: RelationMeta) => {
    if (parent.id === child.id) return;
    const pair = `${parent.id}>${child.id}`;
    const current = relationByPair.get(pair);
    if (current?.confirmed && !meta.confirmed) return;

    relationByPair.set(pair, meta);
    connectedIds.add(parent.id);
    connectedIds.add(child.id);

    const children = childrenByParent.get(parent.id) ?? [];
    if (!children.some((item) => item.id === child.id)) {
      childrenByParent.set(parent.id, [...children, child].sort(byOrder));
    }

    const incoming = incomingByChild.get(child.id) ?? [];
    incomingByChild.set(child.id, [
      ...incoming.filter((item) => item.parent.id !== parent.id),
      { parent, meta },
    ]);
  };

  people.forEach((child) => {
    if (!child.lineage_parent_id) return;
    const parent = byId.get(child.lineage_parent_id);
    if (parent) addRelation(parent, child, { confirmed: true });
  });

  edges
    .slice()
    .sort((a, b) => b.confidence - a.confidence)
    .forEach((edge) => {
      const parent = byCode.get(edge.from_source_key);
      const child = byCode.get(edge.to_source_key);
      if (parent && child) addRelation(parent, child, { edge, confirmed: false });
    });

  return {
    byId,
    byCode,
    childrenByParent,
    incomingByChild,
    relationByPair,
    relationshipCount: relationByPair.size,
    connectedIds,
  };
}

export function getPreferredPath(person: Person, graph: GenealogyGraph): Person[] {
  const path: Person[] = [];
  const visited = new Set<number>();
  let current: Person | undefined = person;

  while (current && !visited.has(current.id)) {
    path.unshift(current);
    visited.add(current.id);

    if (current.lineage_parent_id && graph.byId.has(current.lineage_parent_id)) {
      current = graph.byId.get(current.lineage_parent_id);
      continue;
    }

    const incoming = (graph.incomingByChild.get(current.id) ?? [])
      .slice()
      .sort((a, b) => {
        if (a.meta.confirmed !== b.meta.confirmed) return a.meta.confirmed ? -1 : 1;
        return (b.meta.edge?.confidence ?? 100) - (a.meta.edge?.confidence ?? 100);
      });
    current = incoming[0]?.parent;
  }

  return path;
}

function byOrder(a: Person, b: Person) {
  return (a.chart_order ?? a.generation ?? 9999) - (b.chart_order ?? b.generation ?? 9999);
}
