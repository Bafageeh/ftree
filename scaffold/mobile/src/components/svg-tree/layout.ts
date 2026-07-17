import type { Person } from '../../types';

export type PositionedNode = {
  person: Person;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Connector = {
  id: string;
  path: string;
};

export type TreeLayout = {
  width: number;
  height: number;
  nodes: PositionedNode[];
  connectors: Connector[];
};

const NODE_WIDTH = 224;
const NODE_HEIGHT = 118;
const HORIZONTAL_GAP = 36;
const VERTICAL_GAP = 78;
const CANVAS_PADDING = 28;

type Measured = {
  person: Person;
  subtreeWidth: number;
  children: Measured[];
};

export function createSvgTreeLayout(
  root: Person,
  childrenByParent: Map<number, Person[]>,
  visibleIds: Set<number>,
  expandedIds: Set<number>,
  minimumWidth: number,
): TreeLayout {
  const displayRoot = resolveVisibleAncestorRoot(root, childrenByParent, visibleIds, 5);
  const measuring = new Set<number>();

  const measure = (person: Person): Measured => {
    if (measuring.has(person.id)) return { person, subtreeWidth: NODE_WIDTH, children: [] };

    measuring.add(person.id);
    const children = expandedIds.has(person.id)
      ? (childrenByParent.get(person.id) ?? [])
          .filter((child) => visibleIds.has(child.id))
          .map(measure)
      : [];
    measuring.delete(person.id);

    const childrenWidth = children.length
      ? children.reduce((sum, child) => sum + child.subtreeWidth, 0) + HORIZONTAL_GAP * (children.length - 1)
      : 0;

    return { person, children, subtreeWidth: Math.max(NODE_WIDTH, childrenWidth) };
  };

  const measuredRoot = measure(displayRoot);
  const naturalWidth = measuredRoot.subtreeWidth + CANVAS_PADDING * 2;
  const width = Math.max(minimumWidth, naturalWidth);
  const nodes: PositionedNode[] = [];
  const connectors: Connector[] = [];
  let maxDepth = 0;

  const place = (measured: Measured, left: number, depth: number) => {
    maxDepth = Math.max(maxDepth, depth);
    const centerX = left + measured.subtreeWidth / 2;
    const node: PositionedNode = {
      person: measured.person,
      x: centerX - NODE_WIDTH / 2,
      y: CANVAS_PADDING + depth * (NODE_HEIGHT + VERTICAL_GAP),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };
    nodes.push(node);

    if (!measured.children.length) return node;

    const totalChildrenWidth = measured.children.reduce((sum, child) => sum + child.subtreeWidth, 0)
      + HORIZONTAL_GAP * (measured.children.length - 1);
    let childLeft = left + (measured.subtreeWidth - totalChildrenWidth) / 2;

    measured.children.forEach((child) => {
      const childNode = place(child, childLeft, depth + 1);
      const startX = node.x + node.width / 2;
      const startY = node.y + node.height;
      const endX = childNode.x + childNode.width / 2;
      const endY = childNode.y;
      const controlOffset = Math.max(24, (endY - startY) * 0.48);

      connectors.push({
        id: `${node.person.id}-${childNode.person.id}`,
        path: `M ${startX} ${startY} C ${startX} ${startY + controlOffset}, ${endX} ${endY - controlOffset}, ${endX} ${endY}`,
      });

      childLeft += child.subtreeWidth + HORIZONTAL_GAP;
    });

    return node;
  };

  place(measuredRoot, (width - measuredRoot.subtreeWidth) / 2, 0);

  return {
    width,
    height: CANVAS_PADDING * 2 + (maxDepth + 1) * NODE_HEIGHT + maxDepth * VERTICAL_GAP,
    nodes,
    connectors,
  };
}

function resolveVisibleAncestorRoot(
  root: Person,
  childrenByParent: Map<number, Person[]>,
  visibleIds: Set<number>,
  maxAncestors: number,
): Person {
  const byId = new Map<number, Person>();
  childrenByParent.forEach((children) => children.forEach((person) => byId.set(person.id, person)));

  let current = root;
  for (let index = 0; index < maxAncestors; index += 1) {
    if (!current.lineage_parent_id) break;
    const parent = byId.get(current.lineage_parent_id);
    if (!parent || !visibleIds.has(parent.id)) break;
    current = parent;
  }
  return current;
}
