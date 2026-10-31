import type { Person } from '../types';
import { searchPeopleByLineage } from './lineageSearch';

export type ExplorerGraph = {
  people: Person[];
  byId: Map<number, Person>;
  children: Map<number, Person[]>;
  parents: Map<number, number>;
  connected: Set<number>;
  rootId: number | null;
  defaultFocusId: number | null;
  linkCount: number;
};

/** Only explicit parent IDs from the current source form relationships. */
export function createExplorerGraph(source: Person[]): ExplorerGraph {
  const people = source.filter(p => p.approval_status !== 'rejected');
  const byId = new Map(people.map(p => [p.id, p]));
  const parents = new Map<number, number>();
  const children = new Map<number, Person[]>();
  for (const p of people) {
    const parent = p.lineage_parent_id;
    if (parent == null || parent === p.id || !byId.has(parent)) continue;
    parents.set(p.id, parent);
    const siblings = children.get(parent) ?? [];
    siblings.push(p);
    children.set(parent, siblings);
  }
  children.forEach(list => list.sort((a, b) => (a.chart_order ?? a.id) - (b.chart_order ?? b.id)));
  const rootId = people.find(p => p.source_code === 'CORE-001')?.id ?? null;
  const connected = new Set<number>();
  if (rootId != null) {
    const queue = [rootId];
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      if (connected.has(id)) continue;
      connected.add(id);
      queue.push(...(children.get(id) ?? []).map(p => p.id));
    }
  }
  // Start at the documented branching point; the complete trunk is one tap away.
  const defaultFocusId = people.find(p => p.source_code === 'CORE-016')?.id ?? rootId ?? people[0]?.id ?? null;
  return { people, byId, children, parents, connected, rootId, defaultFocusId, linkCount: parents.size };
}

export function ancestorPath(graph: ExplorerGraph, id: number): Person[] {
  const result: Person[] = [];
  const visited = new Set<number>();
  let current: number | undefined = id;
  while (current != null && !visited.has(current) && graph.byId.has(current)) {
    result.unshift(graph.byId.get(current)!);
    visited.add(current);
    current = graph.parents.get(current);
  }
  return result;
}

export function descendantCount(graph: ExplorerGraph, id: number): number {
  const seen = new Set([id]);
  const queue = [id];
  for (let i = 0; i < queue.length; i++) {
    for (const child of graph.children.get(queue[i]) ?? []) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      queue.push(child.id);
    }
  }
  return seen.size - 1;
}

export function maternalLink(person: Person, parent?: Person): boolean {
  return parent?.gender === 'female' || /أمومة|ابنها|أمه/.test(person.summary ?? '');
}

export function normalizeTreeText(text: string): string {
  return text.toLowerCase().replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^a-z0-9ء-ي\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function searchExplorerPeople(graph: ExplorerGraph, query: string): Person[] {
  const q = normalizeTreeText(query);
  if (!q) return graph.people;
  const lineage = searchPeopleByLineage(graph.people, query);
  const seen = new Set(lineage.map(p => p.id));
  const matches = graph.people.filter(p => !seen.has(p.id) &&
    normalizeTreeText(`${p.full_name} ${p.honorific ?? ''} ${p.source_code ?? ''}`).includes(q));
  return [...lineage, ...matches].sort((a, b) => {
    const rank = (p: Person) => normalizeTreeText(p.source_code ?? '') === q ? 2 : normalizeTreeText(p.full_name) === q ? 1 : 0;
    return rank(b) - rank(a);
  });
}

export const NODE_W = 190;
export const NODE_H = 94;
const GAP_X = 28;
const GAP_Y = 64;
const PADDING = 36;
export type ExplorerNode = { person: Person; x: number; y: number; level: number; childCount: number; hiddenCount: number; collapsed: boolean };
export type ExplorerEdge = { from: ExplorerNode; to: ExplorerNode; maternal: boolean; confirmed: boolean };
export type ExplorerLayout = { nodes: ExplorerNode[]; edges: ExplorerEdge[]; width: number; height: number; limited: boolean };

/** A bounded, cycle-safe tidy tree. Unconnected branches never receive synthetic edges. */
export function layoutExplorer(graph: ExplorerGraph, rootId: number, depth: number, collapsed: ReadonlySet<number>, limit = 180): ExplorerLayout {
  type Branch = { person: Person; kids: Branch[]; span: number; level: number };
  const seen = new Set<number>();
  let limited = false;
  const visit = (id: number, level: number): Branch | null => {
    const person = graph.byId.get(id);
    if (!person || seen.has(id)) return null;
    if (seen.size >= limit) { limited = true; return null; }
    seen.add(id);
    const kids: Branch[] = [];
    if (level < Math.max(1, depth) - 1 && !collapsed.has(id)) {
      for (const child of graph.children.get(id) ?? []) {
        const branch = visit(child.id, level + 1);
        if (branch) kids.push(branch);
      }
    }
    const span = Math.max(NODE_W + GAP_X, kids.reduce((sum, k) => sum + k.span, 0));
    return { person, kids, span, level };
  };
  const root = visit(rootId, 0);
  if (!root) return { nodes: [], edges: [], width: 320, height: 240, limited: false };
  const nodes: ExplorerNode[] = [];
  const edges: ExplorerEdge[] = [];
  const place = (branch: Branch, left: number, parent?: ExplorerNode) => {
    const kids = graph.children.get(branch.person.id) ?? [];
    const node: ExplorerNode = {
      person: branch.person, x: left + (branch.span - NODE_W) / 2,
      y: PADDING + branch.level * (NODE_H + GAP_Y), level: branch.level,
      childCount: kids.length, hiddenCount: Math.max(0, kids.length - branch.kids.length), collapsed: collapsed.has(branch.person.id),
    };
    nodes.push(node);
    if (parent) edges.push({ from: parent, to: node, maternal: maternalLink(node.person, parent.person), confirmed: node.person.approval_status === 'supervisor_confirmed' && !node.person.is_provisional });
    let offset = left + branch.span;
    for (const child of branch.kids) { offset -= child.span; place(child, offset, node); }
  };
  place(root, PADDING);
  return { nodes, edges, width: root.span + PADDING * 2, height: Math.max(...nodes.map(n => n.y)) + NODE_H + PADDING + 20, limited };
}
