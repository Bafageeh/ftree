import type { Person } from '../../types';

export type GenerationWindow = {
  ids: Set<number>;
  depthById: Map<number, number>;
};

export type SelectedFamilyWindow = GenerationWindow & {
  root: Person;
  expandedIds: Set<number>;
  ancestorExpandedIds: Set<number>;
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

/**
 * يبني بطاقة شجرة للشخص المختار فقط:
 * - مسار الأب حتى الجد الخامس من دون إظهار الإخوة أو الأعمام.
 * - جميع أبناء الشخص وذريته حتى خمسة أجيال إلى الأسفل.
 *
 * بطاقة المسار إلى النبي مستقلة عن هذه النافذة ولا تستخدم هذه الدالة.
 */
export function collectSelectedFamilyWindow(
  selected: Person,
  byId: Map<number, Person>,
  childrenByParent: Map<number, Person[]>,
  allowedIds: Set<number>,
  maxAncestors = 5,
  maxDescendantGenerations = 5,
): SelectedFamilyWindow {
  const ancestorChain: Person[] = [selected];
  const visitedAncestors = new Set<number>([selected.id]);
  let current: Person | undefined = selected;

  for (let generation = 0; generation < maxAncestors; generation += 1) {
    if (!current.lineage_parent_id) break;
    const parent = byId.get(current.lineage_parent_id);
    if (!parent || visitedAncestors.has(parent.id) || !allowedIds.has(parent.id)) break;
    ancestorChain.unshift(parent);
    visitedAncestors.add(parent.id);
    current = parent;
  }

  const ids = new Set<number>();
  const depthById = new Map<number, number>();
  const expandedIds = new Set<number>();
  const ancestorExpandedIds = new Set<number>();

  ancestorChain.forEach((person, depth) => {
    ids.add(person.id);
    depthById.set(person.id, depth);
    if (depth < ancestorChain.length - 1) {
      expandedIds.add(person.id);
      ancestorExpandedIds.add(person.id);
    }
  });

  const selectedDepth = ancestorChain.length - 1;
  const visitedDescendants = new Set<number>();

  const visitDescendants = (person: Person, descendantDepth: number) => {
    if (visitedDescendants.has(person.id) || descendantDepth >= maxDescendantGenerations) return;
    visitedDescendants.add(person.id);

    const children = (childrenByParent.get(person.id) ?? [])
      .filter((child) => allowedIds.has(child.id));

    if (!children.length || descendantDepth === maxDescendantGenerations - 1) return;
    expandedIds.add(person.id);

    children.forEach((child) => {
      ids.add(child.id);
      depthById.set(child.id, selectedDepth + descendantDepth + 1);
      visitDescendants(child, descendantDepth + 1);
    });
  };

  visitDescendants(selected, 0);

  return {
    root: ancestorChain[0],
    ids,
    depthById,
    expandedIds,
    ancestorExpandedIds,
  };
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
