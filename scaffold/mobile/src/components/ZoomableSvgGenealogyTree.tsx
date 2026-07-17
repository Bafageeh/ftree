import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors, radius, shadow } from '../theme';
import type { ChartEdge, Person } from '../types';
import type { TreeStatusFilter } from './ModernGenealogyTree';
import { createSvgTreeLayout } from './svg-tree/layout';
import { TreeNodeCard } from './svg-tree/TreeNodeCard';
import { TreeZoomToolbar } from './svg-tree/TreeZoomToolbar';

type Props = {
  people: Person[];
  edges: ChartEdge[];
  branchLabels: Record<string, string>;
  statusFilter?: TreeStatusFilter;
};

const ROOT_CODE = 'CORE-001';
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.15;

export function ZoomableSvgGenealogyTree({
  people,
  branchLabels,
  statusFilter = 'all',
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [zoom, setZoom] = useState(1);
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
      root: active.find((person) => person.source_code === ROOT_CODE) ?? null,
    };
  }, [people]);

  const visibleIds = useMemo(() => {
    const visible = new Set<number>();
    if (!graph.root) return visible;

    const visit = (person: Person, visiting: Set<number>): boolean => {
      if (visiting.has(person.id)) return false;
      const next = new Set(visiting).add(person.id);
      let childVisible = false;

      (graph.childrenByParent.get(person.id) ?? []).forEach((child) => {
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

  const layout = useMemo(() => {
    if (!graph.root) return { width: Math.max(screenWidth - 36, 320), height: 220, nodes: [], connectors: [] };
    return createSvgTreeLayout(
      graph.root,
      graph.childrenByParent,
      visibleIds,
      expandedIds,
      Math.max(screenWidth - 36, 320),
    );
  }, [expandedIds, graph, screenWidth, visibleIds]);

  const matches = useMemo(() => {
    const normalized = query.trim();
    if (!normalized) return [];
    return graph.people
      .filter((person) => visibleIds.has(person.id))
      .filter((person) => `${person.full_name} ${person.source_code ?? ''}`.includes(normalized))
      .slice(0, 12);
  }, [graph.people, query, visibleIds]);

  const selected = selectedId ? graph.byId.get(selectedId) ?? null : null;
  const selectedPath = selected ? pathToRoot(selected, graph.byId) : [];
  const canvasWidth = Math.max(1, layout.width * zoom);
  const canvasHeight = Math.max(1, layout.height * zoom);

  const setSafeZoom = (value: number) => {
    const bounded = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
    setZoom(Math.round(bounded * 100) / 100);
  };

  const toggleNode = (person: Person) => {
    const hasChildren = (graph.childrenByParent.get(person.id) ?? []).some((child) => visibleIds.has(child.id));
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
          <Text style={styles.noticeTitle}>مخطط SVG تفاعلي</Text>
          <Text style={styles.noticeText}>اضغط على الأب لاستعراض أبنائه. كبّر وصغّر الشجرة كاملة من 50% إلى 200% أو استخدم الملاءمة التلقائية.</Text>
        </View>
      </View>

      <TreeZoomToolbar
        zoom={zoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onZoomIn={() => setSafeZoom(zoom + ZOOM_STEP)}
        onZoomOut={() => setSafeZoom(zoom - ZOOM_STEP)}
        onReset={() => setSafeZoom(1)}
        onFit={() => setSafeZoom(Math.min(1, Math.max(screenWidth - 54, 280) / layout.width))}
        onExpandAll={() => setExpandedIds(new Set(graph.childrenByParent.keys()))}
        onCollapseAll={() => { setExpandedIds(new Set()); setSelectedId(null); }}
      />

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
        {!!query && <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={21} color={colors.muted} /></Pressable>}
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
            <Pressable onPress={() => setSelectedId(null)}><Ionicons name="close" size={21} color={colors.muted} /></Pressable>
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
          contentContainerStyle={[styles.canvasContent, { minWidth: Math.max(screenWidth - 36, 320) }]}
        >
          <View style={{ width: canvasWidth, height: canvasHeight }}>
            <Svg
              pointerEvents="none"
              width={canvasWidth}
              height={canvasHeight}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              preserveAspectRatio="xMinYMin meet"
              style={StyleSheet.absoluteFill}
            >
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
              const children = (graph.childrenByParent.get(person.id) ?? []).filter((child) => visibleIds.has(child.id));
              const expanded = children.length > 0 && expandedIds.has(person.id);
              const branchLabel = person.chart_branch ? branchLabels[person.chart_branch] : null;

              return (
                <TreeNodeCard
                  key={person.id}
                  node={node}
                  zoom={zoom}
                  selected={selectedId === person.id}
                  expanded={expanded}
                  childCount={children.length}
                  branchLabel={branchLabel}
                  onPress={() => toggleNode(person)}
                  onLongPress={() => router.push(`/person/${person.id}`)}
                />
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.tip}>
        <Ionicons name="information-circle" size={19} color={colors.gold} />
        <Text style={styles.tipText}>يعرض زر «ملاءمة» أكبر قدر ممكن من الشجرة داخل الشاشة، وتبقى إمكانية التحريك الأفقي متاحة للفروع الواسعة.</Text>
      </View>
    </View>
  );
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

function order(a: Person, b: Person) {
  return (a.chart_order ?? a.generation ?? 9999) - (b.chart_order ?? b.generation ?? 9999);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notice: { alignItems: 'flex-start', backgroundColor: colors.primarySoft, borderColor: colors.gold, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row-reverse', gap: 10, marginBottom: 12, padding: 14 },
  noticeTitle: { color: colors.primary, fontSize: 17, fontWeight: '900', textAlign: 'right' },
  noticeText: { color: colors.text, fontSize: 11, lineHeight: 19, marginTop: 4, textAlign: 'right' },
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
  canvasContent: { alignItems: 'flex-start', justifyContent: 'center' },
  tip: { alignItems: 'center', backgroundColor: colors.goldSoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 7, marginTop: 12, padding: 11 },
  tipText: { color: '#765714', flex: 1, fontSize: 10, lineHeight: 18, textAlign: 'right' },
  emptyBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, padding: 35 },
  emptyTitle: { color: colors.primary, fontSize: 17, fontWeight: '900', marginTop: 10 },
  emptyText: { color: colors.muted, fontSize: 11, lineHeight: 19, marginTop: 5, textAlign: 'center' },
});
