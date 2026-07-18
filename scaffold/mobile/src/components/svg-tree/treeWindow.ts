import type { Person } from '../../types';

export type GenerationWindow = {
  ids: Set<number>;
  depthById: Map<number, number>;
};

const DEFAULT_MAX_WINDOW_NODES = 80;
const DEFAULT_MAX_EXPANDED_NODES = 36;

export function collectGenerationWindow(
  root: Person,
  childrenByParent: Map<number, Person[]>,
  allowedIds: Set<number>,
  maxGenerations: number,
  maxNodes = DEFAULT_MAX_WINDOW_NODES,
): GenerationWindow {
  const ids = new Set<number>();
  const depthById = new Map<number, number>();
  const byId = peopleById(childrenByParent);

  // اعرض الأب والأجداد حتى الجد الخامس، من دون فتح فروع الإخوة والأعمام.
  let ancestor: Person | undefined = root;
  for (let index = 0; index < 5; index += 1) {
    if (!ancestor.lineage_parent_id) break;
    const parent = byId.get(ancestor.lineage_parent_id);
    if (!parent || !allowedIds.has(parent.id)) break;
    ids.add(parent.id);
    depthById.set(parent.id, 0);
    ancestor = parent;
  }

  const visited = new Set<number>();
  const queue: Array<{ person: Person; depth: number }> = [{ person: root, depth: 0 }];

  while (queue.length > 0 && ids.size < maxNodes) {
    const entry = queue.shift();
    if (!entry) break;
    const { person, depth } = entry;

    if (depth >= maxGenerations || visited.has(person.id) || !allowedIds.has(person.id)) continue;
    visited.add(person.id);
    ids.add(person.id);
    depthById.set(person.id, depth);

    if (depth === maxGenerations - 1) continue;
    const children: Person[] = (childrenByParent.get(person.id) ?? [])
      .filter((child: Person) => allowedIds.has(child.id));

    for (const child of children) {
      if (ids.size + queue.length >= maxNodes) break;
      queue.push({ person: child, depth: depth + 1 });
    }
  }

  return { ids, depthById };
}

/**
 * الفتح الآمن عند اختيار نتيجة من البحث:
 * - يفتح مسار الأجداد حتى الجد الخامس.
 * - يفتح الشخص المختار لإظهار أبنائه المباشرين فقط.
 * - لا يفتح كل الأحفاد دفعة واحدة، لأن ذلك قد ينتج لوحة عريضة جدًا
 *   ويؤدي إلى إغلاق تطبيق Android بسبب استهلاك الذاكرة.
 */
export function collectFocusedExpandedIds(
  root: Person,
  childrenByParent: Map<number, Person[]>,
  allowedIds: Set<number>,
  maxAncestors = 5,
): Set<number> {
  const expanded = new Set<number>();
  const byId = peopleById(childrenByParent);
  let ancestor: Person | undefined = root;

  for (let index = 0; index < maxAncestors; index += 1) {
    if (!ancestor.lineage_parent_id) break;
    const parent = byId.get(ancestor.lineage_parent_id);
    if (!parent || !allowedIds.has(parent.id)) break;
    expanded.add(parent.id);
    ancestor = parent;
  }

  const directChildren: Person[] = (childrenByParent.get(root.id) ?? [])
    .filter((child: Person) => allowedIds.has(child.id));
  if (directChildren.length > 0) expanded.add(root.id);

  return expanded;
}

export function collectExpandableIds(
  root: Person,
  childrenByParent: Map<number, Person[]>,
  allowedIds: Set<number>,
  maxGenerations: number,
  maxExpandedNodes = DEFAULT_MAX_EXPANDED_NODES,
): Set<number> {
  const expanded = collectFocusedExpandedIds(root, childrenByParent, allowedIds, 5);
  const visited = new Set<number>();
  const queue: Array<{ person: Person; depth: number }> = [{ person: root, depth: 0 }];

  while (queue.length > 0 && expanded.size < maxExpandedNodes) {
    const entry = queue.shift();
    if (!entry) break;
    const { person, depth } = entry;

    if (depth >= maxGenerations - 1 || visited.has(person.id) || !allowedIds.has(person.id)) continue;
    visited.add(person.id);

    const children: Person[] = (childrenByParent.get(person.id) ?? [])
      .filter((child: Person) => allowedIds.has(child.id));
    if (children.length === 0) continue;

    expanded.add(person.id);
    for (const child of children) {
      if (expanded.size + queue.length >= maxExpandedNodes) break;
      queue.push({ person: child, depth: depth + 1 });
    }
  }

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
    const children: Person[] = (childrenByParent.get(current.id) ?? [])
      .filter((child: Person) => allowedIds.has(child.id));
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

function peopleById(childrenByParent: Map<number, Person[]>): Map<number, Person> {
  const byId = new Map<number, Person>();
  childrenByParent.forEach((children) => children.forEach((person) => byId.set(person.id, person)));
  return byId;
}
