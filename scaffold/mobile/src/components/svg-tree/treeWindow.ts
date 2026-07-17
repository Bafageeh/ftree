import type { Person } from '../../types';

export type GenerationWindow = {
  ids: Set<number>;
  depthById: Map<number, number>;
};

export function collectGenerationWindow(
  root: Person,
  childrenByParent: Map<number, Person[]>,
  allowedIds: Set<number>,
  maxGenerations: number,
): GenerationWindow {
  const ids = new Set<number>();
  const depthById = new Map<number, number>();
  const visited = new Set<number>();

  const visit = (person: Person, depth: number) => {
    if (depth >= maxGenerations || visited.has(person.id) || !allowedIds.has(person.id)) return;
    visited.add(person.id);
    ids.add(person.id);
    depthById.set(person.id, depth);
    if (depth === maxGenerations - 1) return;
    (childrenByParent.get(person.id) ?? []).forEach((child) => visit(child, depth + 1));
  };

  visit(root, 0);
  return { ids, depthById };
}

export function collectExpandableIds(
  root: Person,
  childrenByParent: Map<number, Person[]>,
  allowedIds: Set<number>,
  maxGenerations: number,
): Set<number> {
  const expanded = new Set<number>();
  const visited = new Set<number>();

  const visit = (person: Person, depth: number) => {
    if (depth >= maxGenerations - 1 || visited.has(person.id) || !allowedIds.has(person.id)) return;
    visited.add(person.id);
    const children = (childrenByParent.get(person.id) ?? []).filter((child) => allowedIds.has(child.id));
    if (!children.length) return;
    expanded.add(person.id);
    children.forEach((child) => visit(child, depth + 1));
  };

  visit(root, 0);
  return expanded;
}

export function defaultExpandedPath(
  root: Person,
  childrenByParent: Map<number, Person[]>,
  allowedIds: Set<number>,
  maxGenerations: number,
): Set<number> {
  const expanded = new Set<number>();
  const visited = new Set<number>();
  let current: Person | undefined = root;
  let depth = 0;

  while (current && depth < maxGenerations - 1 && !visited.has(current.id)) {
    visited.add(current.id);
    const children = (childrenByParent.get(current.id) ?? []).filter((child) => allowedIds.has(child.id));
    if (!children.length) break;
    expanded.add(current.id);
    if (children.length !== 1) break;
    current = children[0];
    depth += 1;
  }

  return expanded;
}

export function pathToRoot(person: Person, byId: Map<number, Person>): Person[] {
  const path: Person[] = [];
  const visited = new Set<number>();
  let current: Person | undefined = person;

  while (current && !visited.has(current.id)) {
    path.unshift(current);
    visited.add(current.id);
    current = current.lineage_parent_id ? byId.get(current.lineage_parent_id) : undefined;
  }

  return path;
}
