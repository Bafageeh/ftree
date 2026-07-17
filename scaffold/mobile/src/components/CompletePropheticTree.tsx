import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors, radius, shadow } from '../theme';
import type { ChartEdge, Person } from '../types';
import type { TreeStatusFilter } from './ModernGenealogyTree';

type Props = {
  people: Person[];
  edges: ChartEdge[];
  branchLabels: Record<string, string>;
  statusFilter?: TreeStatusFilter;
};

type PositionedNode = {
  person: Person;
  x: number;
  y: number;
  width: number;
  height: number;
  children: PositionedNode[];
};

type Connector = {
  id: string;
  path: string;
};

type LayoutResult = {
  width: number;
  height: number;
  nodes: PositionedNode[];
  connectors: Connector[];
};

const PROPHET_CODE = 'CORE-001';
const NODE_WIDTH = 224;
const NODE_HEIGHT = 118;
const HORIZONTAL_GAP = 36;
const VERTICAL_GAP = 78;
const CANVAS_PADDING = 28;

export function CompletePropheticTree({
  people,
  branchLabels,
  statusFilter = 'all',
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const initializedRootId = useRef<number | null>(null);

  const graph = useMemo(() => {
    const active = people
      .filter((person) => person.approval_status !== 'rejected')
      .sort(order);
    const byId = new Map(active.map((person) => [person.id, person]));
    const childrenByParent = new Map<number, Person[]>();

    active.forEach((person) => {
      if (!person.lineage_parent_id || !byId.has(person.lineage_parent_id)) return;
      const children = childrenByParent.get(person.lineage_parent_id) ?? [];
      children.push(person);
      childrenByParent.set(person.lineage_parent_id, children);
    });

    childrenByParent.forEach((children) => children.sort(order));

    return {
      people: active,
      byId,
      childrenByParent,
      root: active.find((person) => person.source_code === PROPHET_CODE) ?? null,
    };
  }, [people]);

  const visibleIds = useMemo(() => {
    const visible = new Set<number>();
    if (!graph.root) return visible;

    const visit = (person: Person, visiting: Set<number>): boolean => {
      if (visiting.has(person.id)) return false;
      const next = new Set(visiting).add(person.id);
      const children = graph.childrenByParent.get(person.id) ?? [];
      let childVisible = false;

      children.forEach((child) => {
        if (visit(child, next)) childVisible = true;
      });

      const selfVisible = matchesStatus(person, statusFilter);
      if (selfVisible || childVisible || statusFilter === 'all') visible.add(person.id);
      return selfVisible || childVisible || statusFilter === 'all';
    };

    visit(graph.root, new Set());
    return visible;
  }, [graph, statusFilter]);

  useEffect(() => {
    if (!graph.root || initializedRootId.current === graph.root.id) return;
    initializedRootId.current = graph.root.id;
    setExpandedIds(defaultExpandedPath(graph.root, graph.childrenByParent));
  }, [graph]);

  const matches = useMemo(() => {
    const normalized = query.trim();
    if (!normalized) return [];
    return graph.people
      .filter((person) => visibleIds.has(person.id))
      .filter((person) => `${person.full_name} ${person.source_code ?? ''}`.includes(normalized))
      .slice(0, 12);
  }, [graph.people, query, visibleIds]);

  const selected = selectedId ? graph.byId.get(selectedId) ?? null : null;
  const selectedPath = useMemo(
    () => selected ? pathToRoot(selected, graph.byId) : [],
    [graph.byId, selected],
  );

  const layout = useMemo(() => {
    if (!graph.root) return emptyLayout(Math.max(screenWidth - 36, 320));
    return createTreeLayout(
      graph.root,
      graph.childrenByParent,
      visibleIds,
      expandedIds,
      Math.max(screenWidth - 36, 320),
    );
  }, [expandedIds, graph, screenWidth, visibleIds]);

  const toggleNode = (person: Person) => {
    const hasChildren = (graph.childrenByParent.get(person.id) ?? [])
      .some((child) => visibleIds.has(child.id));
    setSelectedId(person.id);
    if (!hasChildren) return;

    setExpandedIds((current) => {
      const next = new Set(current);
      next.has(person.id) ? next.delete(person.id) : next.add(person.id);
      return next;
    });
  };

  const revealPerson = (person: Person) => {
    const path = pathToRoot(person, graph.byId);
    setExpandedIds((current) => {
      const next = new Set(current);
      path.slice(0, -1).forEach((ancestor) => next.add(ancestor.id));
      return next;
    });
    setSelectedId(person.id);
  };

  const expandAll = () => {
    setExpandedIds(new Set(graph.childrenByParent.keys()));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
    setSelectedId(null);
  };

  if (!graph.root) {
    return (
      <View style={styles.emptyBox}>
        <Ionicons name="warning-outline" size={40} color={colors.gold} />
        <Text style={styles.emptyTitle}>تعذر العثور على أصل الشجرة</Text>
        <Text style={styles.emptyText}>يجب أن تبدأ الشجرة من السجل CORE-001 لسيد البشر محمد ﷺ.</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.notice}>
        <Ionicons name="git-network" size={24} color={colors.gold} />
        <View style={styles.flex}>
          <Text style={styles.noticeTitle}>مخطط شجرة تفاعلي</Text>
          <Text style={styles.noticeText}>مرسوم بتقنية SVG الحديثة. اضغط على الأب لفتح أبنائه أو إغلاقهم، وحرّك المخطط أفقيًا لاستعراض الفروع.</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable onPress={expandAll} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}>
          <Ionicons name="expand" size={18} color={colors.primary} />
          <Text style={styles.actionText}>فتح الجميع</Text>
        </Pressable>
        <Pressable onPress={collapseAll} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}>
          <Ionicons name="contract" size={18} color={colors.primary} />
          <Text style={styles.actionText}>إغلاق الجميع</Text>
        </Pressable>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={21} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ابحث داخل الشجرة المتصلة"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          textAlign="right"
        />
        {!!query && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={21} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {!!query && (
        <View style={styles.results}>
          {matches.length ? matches.map((person) => (
            <Pressable key={person.id} onPress={() => revealPerson(person)} style={styles.resultRow}>
              <Ionicons name="locate-outline" size={18} color={colors.gold} />
              <View style={styles.flex}>
                <Text style={styles.resultName}>{person.full_name}</Text>
                <Text style={styles.resultCode}>{person.source_code ?? 'دون رمز'}</Text>
              </View>
            </Pressable>
          )) : <Text style={styles.emptySearch}>لا توجد نتيجة مطابقة.</Text>}
        </View>
      )}

      {!!selected && (
        <View style={styles.selectedCard}>
          <View style={styles.selectedHeader}>
            <Pressable onPress={() => setSelectedId(null)}>
              <Ionicons name="close" size={21} color={colors.muted} />
            </Pressable>
            <View style={styles.flex}>
              <Text style={styles.selectedLabel}>المسار الكامل إلى النبي ﷺ</Text>
              <Text style={styles.selectedName}>{selected.full_name}</Text>
            </View>
            <Pressable onPress={() => router.push(`/person/${selected.id}`)} style={styles.openButton}>
              <Text style={styles.openButtonText}>التفاصيل</Text>
            </Pressable>
          </View>
          <Text style={styles.pathText}>{selectedPath.map((person) => person.full_name).join(' ← ')}</Text>
        </View>
      )}

      <View style={styles.canvasShell}>
        <ScrollView
          horizontal
          bounces
          showsHorizontalScrollIndicator
          contentContainerStyle={{ minWidth: layout.width }}
        >
          <View style={{ width: layout.width, height: layout.height }}>
            <Svg pointerEvents="none" width={layout.width} height={layout.height} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="branchGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#D8B55B" stopOpacity="0.95" />
                  <Stop offset="1" stopColor="#A97A22" stopOpacity="0.72" />
                </LinearGradient>
              </Defs>
              {layout.connectors.map((connector) => (
                <Path
                  key={connector.id}
                  d={connector.path}
                  fill="none"
                  stroke="url(#branchGradient)"
                  strokeLinecap="round"
                  strokeWidth={3}
                />
              ))}
            </Svg>

            {layout.nodes.map((node) => {
              const person = node.person;
              const children = (graph.childrenByParent.get(person.id) ?? [])
                .filter((child) => visibleIds.has(child.id));
              const hasChildren = children.length > 0;
              const expanded = hasChildren && expandedIds.has(person.id);
              const prophet = person.source_code === PROPHET_CODE;
              const selectedNode = person.id === selectedId;
              const status = nodeStatus(person);
              const branch = person.chart_branch ? branchLabels[person.chart_branch] : null;
              const accent = person.chart_color || colors.gold;

              return (
                <Pressable
                  key={person.id}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: hasChildren ? expanded : undefined }}
                  accessibilityLabel={`${person.full_name}${hasChildren ? `، ${children.length} أبناء` : ''}`}
                  onPress={() => toggleNode(person)}
                  onLongPress={() => router.push(`/person/${person.id}`)}
                  style={({ pressed }) => [
                    styles.node,
                    {
                      left: node.x,
                      top: node.y,
                      width: node.width,
                      height: node.height,
                      borderTopColor: accent,
                    },
                    prophet && styles.prophetNode,
                    selectedNode && styles.selectedNode,
                    pressed && styles.nodePressed,
                  ]}
                >
                  <View style={styles.nodeHeader}>
                    <View style={[styles.personIcon, prophet && styles.prophetIcon]}>
                      <Ionicons name={prophet ? 'star' : 'person'} size={18} color={prophet ? colors.primary : colors.white} />
                    </View>
                    <View style={styles.nodeIdentity}>
                      {prophet && <Text style={styles.prophetLabel}>أصل الشجرة</Text>}
                      <Text numberOfLines={2} style={[styles.nodeName, prophet && styles.prophetName]}>{person.full_name}</Text>
                      <Text style={[styles.nodeCode, prophet && styles.prophetMeta]}>{person.source_code ?? `#${person.id}`}</Text>
                    </View>
                    <View style={[styles.expandButton, expanded && styles.expandButtonOpen, !hasChildren && styles.expandButtonLeaf]}>
                      <Ionicons
                        name={!hasChildren ? 'ellipse' : expanded ? 'chevron-up' : 'chevron-down'}
                        size={hasChildren ? 20 : 9}
                        color={expanded ? colors.white : prophet ? colors.white : colors.primary}
                      />
                    </View>
                  </View>

                  <View style={styles.nodeFooter}>
                    <View style={[styles.statusPill, { backgroundColor: status.soft }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                    {hasChildren ? (
                      <Text style={[styles.childrenText, prophet && styles.prophetMeta]}>
                        {children.length} {children.length === 1 ? 'ابن' : 'أبناء'} · {expanded ? 'إخفاء' : 'استعراض'}
                      </Text>
                    ) : (
                      <Text style={[styles.leafText, prophet && styles.prophetMeta]}>نهاية الفرع</Text>
                    )}
                  </View>

                  {!!branch && branch !== 'الجذع الأوسط' && (
                    <Text numberOfLines={1} style={[styles.branch, prophet && styles.prophetMeta]}>{branch}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.tip}>
        <Ionicons name="information-circle" size={19} color={colors.gold} />
        <Text style={styles.tipText}>عند اختيار نتيجة بحث يُفتح مسار آبائها تلقائيًا حتى موضعها في المخطط.</Text>
      </View>
    </View>
  );
}

function createTreeLayout(
  root: Person,
  childrenByParent: Map<number, Person[]>,
  visibleIds: Set<number>,
  expandedIds: Set<number>,
  minimumWidth: number,
): LayoutResult {
  type Measured = {
    person: Person;
    subtreeWidth: number;
    children: Measured[];
  };

  const measuring = new Set<number>();

  const measure = (person: Person): Measured => {
    if (measuring.has(person.id)) {
      return { person, subtreeWidth: NODE_WIDTH, children: [] };
    }

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

    return {
      person,
      children,
      subtreeWidth: Math.max(NODE_WIDTH, childrenWidth),
    };
  };

  const measuredRoot = measure(root);
  const naturalWidth = measuredRoot.subtreeWidth + CANVAS_PADDING * 2;
  const width = Math.max(minimumWidth, naturalWidth);
  const nodes: PositionedNode[] = [];
  const connectors: Connector[] = [];
  let maxDepth = 0;

  const place = (measured: Measured, left: number, depth: number): PositionedNode => {
    maxDepth = Math.max(maxDepth, depth);
    const centerX = left + measured.subtreeWidth / 2;
    const node: PositionedNode = {
      person: measured.person,
      x: centerX - NODE_WIDTH / 2,
      y: CANVAS_PADDING + depth * (NODE_HEIGHT + VERTICAL_GAP),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      children: [],
    };
    nodes.push(node);

    if (measured.children.length) {
      const totalChildrenWidth = measured.children.reduce((sum, child) => sum + child.subtreeWidth, 0)
        + HORIZONTAL_GAP * (measured.children.length - 1);
      let childLeft = left + (measured.subtreeWidth - totalChildrenWidth) / 2;

      measured.children.forEach((child) => {
        const childNode = place(child, childLeft, depth + 1);
        node.children.push(childNode);

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
    }

    return node;
  };

  const rootLeft = (width - measuredRoot.subtreeWidth) / 2;
  place(measuredRoot, rootLeft, 0);

  return {
    width,
    height: CANVAS_PADDING * 2 + (maxDepth + 1) * NODE_HEIGHT + maxDepth * VERTICAL_GAP,
    nodes,
    connectors,
  };
}

function emptyLayout(width: number): LayoutResult {
  return { width, height: 220, nodes: [], connectors: [] };
}

function defaultExpandedPath(root: Person, childrenByParent: Map<number, Person[]>): Set<number> {
  const expanded = new Set<number>();
  const visited = new Set<number>();
  let current: Person | undefined = root;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    const children = childrenByParent.get(current.id) ?? [];
    if (!children.length) break;

    expanded.add(current.id);
    if (children.length !== 1) break;
    current = children[0];
  }

  return expanded;
}

function pathToRoot(person: Person, byId: Map<number, Person>): Person[] {
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

function matchesStatus(person: Person, filter: TreeStatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'confirmed') return person.approval_status === 'supervisor_confirmed' && !person.is_provisional;
  if (filter === 'pending') return person.approval_status === 'pending_supervisor' || !!person.is_provisional;
  return person.status === 'unclear';
}

function nodeStatus(person: Person): {
  label: string;
  color: string;
  soft: string;
} {
  if (person.status === 'unclear') {
    return { label: 'غير محسومة', color: '#686E69', soft: '#ECEDEA' };
  }
  if (person.approval_status === 'supervisor_confirmed' && !person.is_provisional) {
    return { label: 'معتمد', color: colors.success, soft: '#E4F2E8' };
  }
  return { label: 'بانتظار المشرف', color: '#A87518', soft: '#F8EDCF' };
}

function order(a: Person, b: Person) {
  return (a.chart_order ?? a.generation ?? 9999) - (b.chart_order ?? b.generation ?? 9999);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notice: { alignItems: 'flex-start', backgroundColor: colors.primarySoft, borderColor: colors.gold, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row-reverse', gap: 10, marginBottom: 12, padding: 14 },
  noticeTitle: { color: colors.primary, fontSize: 17, fontWeight: '900', textAlign: 'right' },
  noticeText: { color: colors.text, fontSize: 11, lineHeight: 19, marginTop: 4, textAlign: 'right' },
  actionsRow: { flexDirection: 'row-reverse', gap: 9, marginBottom: 11 },
  actionButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flex: 1, flexDirection: 'row-reverse', gap: 7, justifyContent: 'center', minHeight: 44, ...shadow },
  actionPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  actionText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  search: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 9, marginBottom: 12, minHeight: 58, paddingHorizontal: 15, ...shadow },
  searchInput: { color: colors.text, flex: 1, fontSize: 15 },
  results: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginBottom: 12, paddingHorizontal: 12 },
  resultRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row-reverse', gap: 9, paddingVertical: 10 },
  resultName: { color: colors.primary, fontSize: 14, fontWeight: '900', textAlign: 'right' },
  resultCode: { color: colors.muted, fontSize: 10, marginTop: 2, textAlign: 'right' },
  emptySearch: { color: colors.muted, paddingVertical: 18, textAlign: 'center' },
  selectedCard: { backgroundColor: colors.goldSoft, borderColor: colors.gold, borderRadius: radius.md, borderWidth: 1, marginBottom: 13, padding: 13 },
  selectedHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 9 },
  selectedLabel: { color: colors.muted, fontSize: 10, textAlign: 'right' },
  selectedName: { color: colors.primary, fontSize: 16, fontWeight: '900', marginTop: 2, textAlign: 'right' },
  openButton: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
  openButtonText: { color: colors.white, fontSize: 10, fontWeight: '900' },
  pathText: { color: colors.text, fontSize: 12, lineHeight: 22, marginTop: 10, textAlign: 'right' },
  canvasShell: { backgroundColor: '#F8F5EC', borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden', ...shadow },
  node: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 20, borderTopWidth: 5, borderWidth: 1, padding: 12, position: 'absolute', ...shadow },
  nodePressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  prophetNode: { backgroundColor: colors.primary, borderColor: colors.gold },
  selectedNode: { borderColor: colors.gold, borderWidth: 2.5 },
  nodeHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 9 },
  personIcon: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 17, height: 34, justifyContent: 'center', width: 34 },
  prophetIcon: { backgroundColor: colors.goldSoft },
  nodeIdentity: { flex: 1 },
  prophetLabel: { color: '#E8C977', fontSize: 9, fontWeight: '900', textAlign: 'right' },
  nodeName: { color: colors.primary, fontSize: 15, fontWeight: '900', lineHeight: 21, textAlign: 'right' },
  prophetName: { color: colors.white, fontSize: 18 },
  nodeCode: { color: '#8A661E', fontSize: 9, fontWeight: '800', marginTop: 2, textAlign: 'right' },
  prophetMeta: { color: '#DDE8E4' },
  expandButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  expandButtonOpen: { backgroundColor: colors.primary },
  expandButtonLeaf: { backgroundColor: '#EEF0EB' },
  nodeFooter: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8, justifyContent: 'space-between', marginTop: 9 },
  statusPill: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 9, fontWeight: '900' },
  childrenText: { color: colors.primary, fontSize: 9, fontWeight: '900' },
  leafText: { color: colors.muted, fontSize: 9 },
  branch: { color: '#8A661E', fontSize: 9, fontWeight: '800', marginTop: 5, textAlign: 'right' },
  tip: { alignItems: 'center', backgroundColor: colors.goldSoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 7, marginTop: 12, padding: 11 },
  tipText: { color: '#765714', flex: 1, fontSize: 10, lineHeight: 18, textAlign: 'right' },
  emptyBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, padding: 35 },
  emptyTitle: { color: colors.primary, fontSize: 17, fontWeight: '900', marginTop: 10 },
  emptyText: { color: colors.muted, fontSize: 11, lineHeight: 19, marginTop: 5, textAlign: 'center' },
});
