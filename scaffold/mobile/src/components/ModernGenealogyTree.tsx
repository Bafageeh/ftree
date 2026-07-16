import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';

import { buildGenealogyGraph, getPreferredPath, type GenealogyGraph } from '../lib/genealogyGraph';
import { colors, radius, shadow } from '../theme';
import type { ChartEdge, Person } from '../types';

export type TreeStatusFilter = 'all' | 'confirmed' | 'pending' | 'unclear';

type Props = {
  people: Person[];
  edges: ChartEdge[];
  branchLabels: Record<string, string>;
  statusFilter?: TreeStatusFilter;
};

type Draft = { person: Person; depth: number; children: Draft[]; hidden: number; x?: number; y?: number };
type NodeBox = { person: Person; x: number; y: number; hidden: number; childCount: number };
type Link = { from: NodeBox; to: NodeBox; pending: boolean };
type Diagram = { width: number; height: number; nodeW: number; nodeH: number; nodes: NodeBox[]; links: Link[] };

const MIN_ZOOM = 0.65;
const MAX_ZOOM = 1.2;
const MAX_NODES = 32;
const MAX_DEPTH = 5;
const DEFAULT_ROOT_CODE = 'CORE-018';

export function ModernGenealogyTree({ people, edges, branchLabels, statusFilter = 'all' }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(0.82);
  const [rootId, setRootId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const graph = useMemo(() => buildGenealogyGraph(people, edges), [people, edges]);
  const roots = useMemo(() => rootOptions(people, graph, statusFilter), [people, graph, statusFilter]);

  useEffect(() => {
    if (!people.length) {
      setRootId(null);
      return;
    }

    if (rootId && graph.byId.has(rootId)) return;

    const preferred = graph.byCode.get(DEFAULT_ROOT_CODE)
      ?? graph.byCode.get('CORE-001')
      ?? roots[0]
      ?? people[0];
    setRootId(preferred?.id ?? null);
  }, [graph, people, rootId, roots]);

  const root = (rootId ? graph.byId.get(rootId) : null) ?? roots[0] ?? null;
  const diagram = useMemo(
    () => root ? buildDiagram(root, graph, statusFilter, zoom, Math.max(320, screenWidth - 36)) : null,
    [root, graph, statusFilter, zoom, screenWidth],
  );
  const selected = selectedId ? graph.byId.get(selectedId) ?? null : null;
  const path = selected ? getPreferredPath(selected, graph) : [];
  const rootPath = root ? getPreferredPath(root, graph) : [];

  const matches = useMemo(() => {
    const q = query.trim();
    return q
      ? people.filter((person) => `${person.full_name} ${person.source_code ?? ''}`.includes(q)).slice(0, 16)
      : [];
  }, [people, query]);

  const focusPerson = (person: Person) => {
    const ancestry = getPreferredPath(person, graph);
    const anchor = ancestry[Math.max(0, ancestry.length - 3)] ?? person;
    setRootId(anchor.id);
    setSelectedId(person.id);
    setQuery('');
  };

  const openBranch = (person: Person) => {
    setRootId(person.id);
    setSelectedId(person.id);
    setZoom(0.82);
  };

  const goUpOneLevel = () => {
    if (rootPath.length < 2) return;
    const parent = rootPath[rootPath.length - 2];
    setRootId(parent.id);
    setSelectedId(root?.id ?? null);
  };

  const reset = () => {
    const preferred = graph.byCode.get(DEFAULT_ROOT_CODE) ?? graph.byCode.get('CORE-001') ?? roots[0];
    setRootId(preferred?.id ?? null);
    setSelectedId(null);
    setZoom(0.82);
  };

  const showFromBeginning = () => {
    const first = graph.byCode.get('CORE-001') ?? roots[0];
    setRootId(first?.id ?? null);
    setSelectedId(null);
    setZoom(0.76);
  };

  return (
    <View>
      <View style={styles.search}>
        <Ionicons name="search" size={22} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ابحث بالاسم أو رمز القراءة"
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
            <Pressable key={person.id} onPress={() => focusPerson(person)} style={styles.resultRow}>
              <Ionicons name="locate-outline" size={18} color={colors.gold} />
              <View style={styles.flex}>
                <Text style={styles.resultName}>{person.full_name}</Text>
                <Text style={styles.meta}>{person.source_code ?? 'دون رمز'}</Text>
              </View>
              <Ionicons name="chevron-back" size={18} color={colors.muted} />
            </Pressable>
          )) : <Text style={styles.empty}>لا توجد نتيجة مطابقة.</Text>}
        </View>
      )}

      {roots.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rootRow}>
          {roots.slice(0, 16).map((item) => {
            const active = item.id === root?.id;
            const branch = item.chart_branch ? branchLabels[item.chart_branch] : null;
            const label = item.source_code?.startsWith('CORE-0') ? item.full_name : (branch ?? item.full_name);
            return (
              <Pressable
                key={item.id}
                onPress={() => { setRootId(item.id); setSelectedId(null); }}
                style={[styles.rootChip, active && styles.rootActive]}
              >
                <Text numberOfLines={1} style={[styles.rootText, active && styles.rootTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.toolbar}>
        <View style={styles.zoomBox}>
          <Pressable style={styles.tool} onPress={() => setZoom((value) => Math.max(MIN_ZOOM, +(value - 0.1).toFixed(2)))}>
            <Ionicons name="remove" size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
          <Pressable style={styles.tool} onPress={() => setZoom((value) => Math.min(MAX_ZOOM, +(value + 0.1).toFixed(2)))}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
          {rootPath.length > 1 && (
            <Pressable onPress={goUpOneLevel} style={styles.actionButton}>
              <Ionicons name="arrow-up" size={18} color={colors.primary} />
              <Text style={styles.actionText}>مستوى أعلى</Text>
            </Pressable>
          )}
          <Pressable onPress={showFromBeginning} style={styles.actionButton}>
            <Ionicons name="git-commit-outline" size={18} color={colors.primary} />
            <Text style={styles.actionText}>من الأصل</Text>
          </Pressable>
          <Pressable onPress={reset} style={styles.actionButton}>
            <Ionicons name="scan-outline" size={18} color={colors.primary} />
            <Text style={styles.actionText}>التفرع الرئيسي</Text>
          </Pressable>
        </ScrollView>
      </View>

      {diagram && root ? (
        <View style={styles.shell}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.canvasScroll}>
            <View style={[styles.canvas, { width: diagram.width, height: diagram.height }]}>
              <Svg width={diagram.width} height={diagram.height} style={StyleSheet.absoluteFill}>
                {diagram.links.map((link) => (
                  <DiagramLink
                    key={`${link.from.person.id}-${link.to.person.id}`}
                    link={link}
                    nodeW={diagram.nodeW}
                    nodeH={diagram.nodeH}
                    zoom={zoom}
                  />
                ))}
              </Svg>

              {diagram.nodes.map((node) => (
                <PersonNode
                  key={node.person.id}
                  node={node}
                  width={diagram.nodeW}
                  height={diagram.nodeH}
                  zoom={zoom}
                  root={node.person.id === root.id}
                  selected={node.person.id === selectedId}
                  onPress={() => setSelectedId(node.person.id)}
                  onOpen={() => openBranch(node.person)}
                />
              ))}
            </View>
          </ScrollView>

          <Pressable onPress={reset} style={styles.centerButton}>
            <Ionicons name="locate-outline" size={23} color={colors.gold} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.noDiagram}>
          <Ionicons name="git-network-outline" size={42} color={colors.muted} />
          <Text style={styles.noTitle}>لا توجد علاقات مطابقة</Text>
          <Text style={styles.noText}>تظهر الأسماء غير المرتبطة في تبويب القائمة.</Text>
        </View>
      )}

      <View style={styles.tipCard}>
        <Ionicons name="information-circle" size={20} color={colors.gold} />
        <Text style={styles.tipText}>اضغط على علامة + لفتح الفرع المخفي كاملًا، واضغط على العقدة لعرض مسار نسبها.</Text>
      </View>

      <View style={styles.legend}>
        <Legend color={colors.success} label="معتمد" />
        <Legend color={colors.gold} label="بانتظار المشرف" />
        <Legend color="#777D78" label="غير محسومة" />
        <View style={styles.legendItem}><View style={styles.lineSample} /><Text style={styles.legendText}>نسب معتمد</Text></View>
        <View style={styles.legendItem}><View style={[styles.lineSample, styles.pendingSample]} /><Text style={styles.legendText}>سهم مقروء</Text></View>
      </View>

      {selected && (
        <View style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <Pressable onPress={() => setSelectedId(null)}><Ionicons name="close" size={22} color={colors.muted} /></Pressable>
            <View style={styles.flex}>
              <Text style={styles.meta}>العقدة المحددة</Text>
              <Text style={styles.focusName}>{selected.full_name}</Text>
            </View>
            <View style={styles.codePill}><Text style={styles.code}>{selected.source_code ?? '—'}</Text></View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pathRow}>
            {path.map((person, index) => (
              <View key={person.id} style={styles.pathWrap}>
                <Pressable onPress={() => focusPerson(person)} style={styles.pathPill}>
                  <Text style={styles.pathText}>{person.full_name}</Text>
                </Pressable>
                {index < path.length - 1 && <Ionicons name="chevron-back" size={15} color={colors.gold} />}
              </View>
            ))}
          </ScrollView>

          <View style={styles.focusStats}>
            <Text style={styles.meta}>الأبناء: {(graph.childrenByParent.get(selected.id) ?? []).length}</Text>
            <Text style={styles.meta}>{statusLabel(selected)}</Text>
          </View>

          {(graph.childrenByParent.get(selected.id) ?? []).length > 0 && (
            <Pressable onPress={() => openBranch(selected)} style={styles.openBranchButton}>
              <Ionicons name="git-branch-outline" size={18} color={colors.white} />
              <Text style={styles.openBranchText}>فتح فرع هذا الاسم</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function DiagramLink({ link, nodeW, nodeH, zoom }: { link: Link; nodeW: number; nodeH: number; zoom: number }) {
  const sx = link.from.x + nodeW / 2;
  const sy = link.from.y + nodeH;
  const ex = link.to.x + nodeW / 2;
  const ey = link.to.y;
  const mid = sy + Math.max(28 * zoom, (ey - sy) * 0.5);
  const stroke = link.pending ? colors.gold : colors.primary;
  const arrow = Math.max(5, 6 * zoom);

  return (
    <>
      <Path
        d={`M ${sx} ${sy} V ${mid} H ${ex} V ${ey - arrow}`}
        fill="none"
        stroke={stroke}
        strokeWidth={Math.max(1.8, 2.3 * zoom)}
        strokeDasharray={link.pending ? `${7 * zoom} ${5 * zoom}` : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polygon points={`${ex},${ey} ${ex - arrow},${ey - arrow * 1.45} ${ex + arrow},${ey - arrow * 1.45}`} fill={stroke} />
    </>
  );
}

function PersonNode({
  node,
  width,
  height,
  zoom,
  root,
  selected,
  onPress,
  onOpen,
}: {
  node: NodeBox;
  width: number;
  height: number;
  zoom: number;
  root: boolean;
  selected: boolean;
  onPress: () => void;
  onOpen: () => void;
}) {
  const status = nodeStatus(node.person);

  return (
    <View style={[styles.absolute, { left: node.x, top: node.y, width, height }]}>
      <Pressable
        onPress={onPress}
        style={[
          styles.node,
          {
            backgroundColor: root ? colors.primary : colors.surface,
            borderColor: selected || root ? colors.gold : status.border,
            borderWidth: selected || root ? 2.2 : 1.3,
            borderRadius: 20 * zoom,
            padding: 10 * zoom,
          },
          selected && styles.selected,
        ]}
      >
        <Text
          numberOfLines={3}
          style={[
            styles.nodeName,
            {
              color: root ? colors.white : colors.text,
              fontSize: Math.max(10.5, 14.5 * zoom),
              lineHeight: Math.max(16, 20 * zoom),
            },
          ]}
        >
          {node.person.full_name}
        </Text>

        <View style={[styles.statusPill, { backgroundColor: status.soft }]}>
          <Ionicons name={status.icon} size={Math.max(11, 13 * zoom)} color={status.color} />
          <Text style={[styles.statusText, { color: status.color, fontSize: Math.max(8, 9.5 * zoom) }]}>{status.label}</Text>
        </View>

        <View style={styles.nodeFooter}>
          <View style={styles.nodeCodePill}>
            <Text numberOfLines={1} style={[styles.nodeCode, { fontSize: Math.max(8, 9.5 * zoom) }]}>{node.person.source_code ?? 'دون رمز'}</Text>
          </View>
          {node.childCount > 0 && <Text style={styles.childCount}>{node.childCount} أبناء</Text>}
        </View>
      </Pressable>

      {node.hidden > 0 && (
        <Pressable onPress={onOpen} hitSlop={8} style={styles.hidden}>
          <Text style={styles.hiddenText}>+{node.hidden}</Text>
        </Pressable>
      )}
    </View>
  );
}

function buildDiagram(root: Person, graph: GenealogyGraph, filter: TreeStatusFilter, zoom: number, minWidth: number): Diagram {
  const nodeW = 164 * zoom;
  const nodeH = 142 * zoom;
  const gapX = 26 * zoom;
  const gapY = 74 * zoom;
  const pad = 30 * zoom;
  const memo = new Map<number, boolean>();
  let count = 0;

  const draft = makeDraft(root, 0, new Set<number>());

  function makeDraft(person: Person, depth: number, visited: Set<number>): Draft {
    count += 1;
    const next = new Set(visited);
    next.add(person.id);

    const all = (graph.childrenByParent.get(person.id) ?? [])
      .filter((child) => !next.has(child.id))
      .filter((child) => filter === 'all' || relevant(child, graph, filter, memo, next));

    const children: Draft[] = [];
    if (depth < MAX_DEPTH) {
      for (const child of all) {
        if (count >= MAX_NODES) break;
        children.push(makeDraft(child, depth + 1, next));
      }
    }

    return { person, depth, children, hidden: Math.max(0, all.length - children.length) };
  }

  let leaf = 0;
  let deepest = 0;

  const place = (item: Draft) => {
    deepest = Math.max(deepest, item.depth);
    item.y = pad + item.depth * (nodeH + gapY);

    if (!item.children.length) {
      item.x = pad + leaf * (nodeW + gapX);
      leaf += 1;
      return;
    }

    item.children.forEach(place);
    item.x = ((item.children[0].x ?? pad) + (item.children[item.children.length - 1].x ?? pad)) / 2;
  };

  place(draft);

  const used = pad * 2 + Math.max(1, leaf) * nodeW + Math.max(0, leaf - 1) * gapX;
  const width = Math.max(minWidth, used);
  const shift = Math.max(0, (width - used) / 2);
  const height = pad * 2 + (deepest + 1) * nodeH + deepest * gapY;
  const nodes: NodeBox[] = [];
  const links: Link[] = [];

  const flatten = (item: Draft, parent?: NodeBox) => {
    const box: NodeBox = {
      person: item.person,
      x: (item.x ?? pad) + shift,
      y: item.y ?? pad,
      hidden: item.hidden,
      childCount: (graph.childrenByParent.get(item.person.id) ?? []).length,
    };
    nodes.push(box);

    if (parent) {
      const relation = graph.relationByPair.get(`${parent.person.id}>${item.person.id}`);
      links.push({
        from: parent,
        to: box,
        pending: !!relation?.edge && relation.edge.approval_status !== 'supervisor_confirmed',
      });
    }

    item.children.forEach((child) => flatten(child, box));
  };

  flatten(draft);
  return { width, height, nodeW, nodeH, nodes, links };
}

function rootOptions(people: Person[], graph: GenealogyGraph, filter: TreeStatusFilter) {
  const memo = new Map<number, boolean>();
  const preferredCodes = ['CORE-018', 'CORE-019', 'CORE-020', 'CORE-021', 'CORE-022', 'CORE-023', 'CORE-024', 'CORE-001'];

  const candidates = people.filter((person) => {
    const hasChildren = (graph.childrenByParent.get(person.id) ?? []).length > 0;
    return hasChildren && (filter === 'all' || relevant(person, graph, filter, memo, new Set<number>()));
  });

  const result: Person[] = [];
  preferredCodes.forEach((code) => {
    const person = graph.byCode.get(code);
    if (person && candidates.some((candidate) => candidate.id === person.id) && !result.some((item) => item.id === person.id)) {
      result.push(person);
    }
  });

  candidates
    .filter((person) => (graph.incomingByChild.get(person.id) ?? []).length === 0)
    .sort(order)
    .forEach((person) => {
      if (!result.some((item) => item.id === person.id)) result.push(person);
    });

  candidates.sort(order).forEach((person) => {
    if (!result.some((item) => item.id === person.id)) result.push(person);
  });

  if (!result.length) {
    const match = people.find((person) => matchesFilter(person, filter));
    if (match) result.push(match);
  }

  return result;
}

function relevant(person: Person, graph: GenealogyGraph, filter: TreeStatusFilter, memo: Map<number, boolean>, visiting: Set<number>): boolean {
  if (filter === 'all' || matchesFilter(person, filter)) return true;
  const saved = memo.get(person.id);
  if (saved !== undefined) return saved;
  if (visiting.has(person.id)) return false;

  const next = new Set(visiting);
  next.add(person.id);
  const value = (graph.childrenByParent.get(person.id) ?? []).some((child) => relevant(child, graph, filter, memo, next));
  memo.set(person.id, value);
  return value;
}

function matchesFilter(person: Person, filter: TreeStatusFilter) {
  if (filter === 'all') return true;
  if (filter === 'confirmed') return person.approval_status === 'supervisor_confirmed' && !person.is_provisional;
  if (filter === 'pending') return person.approval_status === 'pending_supervisor';
  return person.status === 'unclear';
}

function nodeStatus(person: Person): { label: string; color: string; soft: string; border: string; icon: keyof typeof Ionicons.glyphMap } {
  if (person.status === 'unclear') {
    return { label: 'غير محسومة', color: '#686E69', soft: '#ECEDEA', border: '#C7CBC6', icon: 'help-circle' };
  }
  if (person.approval_status === 'supervisor_confirmed' && !person.is_provisional) {
    return { label: 'معتمد', color: colors.success, soft: '#E4F2E8', border: colors.success, icon: 'shield-checkmark' };
  }
  return { label: 'بانتظار المشرف', color: '#A87518', soft: '#F8EDCF', border: '#D8B24D', icon: 'time' };
}

function statusLabel(person: Person) {
  if (person.status === 'unclear') return 'غير محسومة';
  return person.approval_status === 'supervisor_confirmed' && !person.is_provisional
    ? 'معتمد من المشرف'
    : 'بانتظار اعتماد المشرف';
}

function order(a: Person, b: Person) {
  return (a.chart_order ?? a.generation ?? 9999) - (b.chart_order ?? b.generation ?? 9999);
}

function Legend({ color, label }: { color: string; label: string }) {
  return <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  meta: { color: colors.muted, fontSize: 10, marginTop: 2, textAlign: 'right' },
  empty: { color: colors.muted, paddingVertical: 18, textAlign: 'center' },
  search: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 9, marginBottom: 12, minHeight: 60, paddingHorizontal: 16, ...shadow },
  searchInput: { color: colors.text, flex: 1, fontSize: 15 },
  results: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginBottom: 12, paddingHorizontal: 12 },
  resultRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row-reverse', gap: 9, paddingVertical: 11 },
  resultName: { color: colors.text, fontSize: 14, fontWeight: '900', textAlign: 'right' },
  rootRow: { flexDirection: 'row-reverse', gap: 7, paddingBottom: 11 },
  rootChip: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, maxWidth: 220, minHeight: 38, paddingHorizontal: 12, justifyContent: 'center' },
  rootActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  rootText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  rootTextActive: { color: colors.white },
  toolbar: { alignItems: 'center', flexDirection: 'row-reverse', gap: 9, marginBottom: 12 },
  actionRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: 7, paddingLeft: 4 },
  actionButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row-reverse', gap: 5, minHeight: 44, paddingHorizontal: 11, ...shadow },
  actionText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  zoomBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row-reverse', minHeight: 44, paddingHorizontal: 4, ...shadow },
  tool: { alignItems: 'center', height: 38, justifyContent: 'center', width: 38 },
  zoomText: { color: colors.primary, fontSize: 11, fontWeight: '900', minWidth: 42, textAlign: 'center' },
  shell: { backgroundColor: '#FAF7EF', borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, marginBottom: 12, minHeight: 520, overflow: 'hidden', position: 'relative', ...shadow },
  canvasScroll: { alignItems: 'flex-start', minWidth: '100%' },
  canvas: { position: 'relative' },
  centerButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 18, borderWidth: 1, bottom: 15, height: 50, justifyContent: 'center', left: 15, position: 'absolute', width: 50, ...shadow },
  absolute: { position: 'absolute' },
  node: { alignItems: 'center', flex: 1, justifyContent: 'center', position: 'relative', ...shadow },
  selected: { elevation: 8, shadowOpacity: 0.18 },
  nodeName: { fontWeight: '900', textAlign: 'center' },
  statusPill: { alignItems: 'center', borderRadius: radius.pill, flexDirection: 'row-reverse', gap: 4, marginTop: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontWeight: '900' },
  nodeFooter: { alignItems: 'center', flexDirection: 'row-reverse', gap: 5, marginTop: 6 },
  nodeCodePill: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, maxWidth: 94, paddingHorizontal: 8, paddingVertical: 4 },
  nodeCode: { color: colors.primary, fontWeight: '900', textAlign: 'center' },
  childCount: { color: colors.muted, fontSize: 8, fontWeight: '800' },
  hidden: { alignItems: 'center', backgroundColor: colors.gold, borderColor: colors.surface, borderRadius: radius.pill, borderWidth: 2, height: 31, justifyContent: 'center', left: -10, position: 'absolute', top: -10, width: 31, zIndex: 4, ...shadow },
  hiddenText: { color: colors.white, fontSize: 10, fontWeight: '900' },
  noDiagram: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, justifyContent: 'center', marginBottom: 12, minHeight: 340, padding: 25 },
  noTitle: { color: colors.primary, fontSize: 16, fontWeight: '900', marginTop: 12 },
  noText: { color: colors.muted, fontSize: 12, marginTop: 7 },
  tipCard: { alignItems: 'center', backgroundColor: colors.goldSoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, marginBottom: 12, padding: 11 },
  tipText: { color: '#765714', flex: 1, fontSize: 10, lineHeight: 18, textAlign: 'right' },
  legend: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, marginBottom: 12, padding: 11 },
  legendItem: { alignItems: 'center', flexDirection: 'row-reverse', gap: 5 },
  dot: { borderRadius: 6, height: 10, width: 10 },
  legendText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  lineSample: { backgroundColor: colors.primary, height: 2, width: 20 },
  pendingSample: { backgroundColor: colors.gold, borderStyle: 'dashed' },
  focusCard: { backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: radius.md, borderWidth: 1, marginBottom: 12, padding: 14, ...shadow },
  focusHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 9 },
  focusName: { color: colors.primary, fontSize: 18, fontWeight: '900', textAlign: 'right' },
  codePill: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6 },
  code: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  pathRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: 6, paddingVertical: 13 },
  pathWrap: { alignItems: 'center', flexDirection: 'row-reverse', gap: 6 },
  pathPill: { backgroundColor: colors.goldSoft, borderRadius: radius.pill, maxWidth: 190, paddingHorizontal: 9, paddingVertical: 6 },
  pathText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  focusStats: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  openBranchButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.pill, flexDirection: 'row-reverse', gap: 7, justifyContent: 'center', marginTop: 12, minHeight: 44 },
  openBranchText: { color: colors.white, fontSize: 12, fontWeight: '900' },
});
