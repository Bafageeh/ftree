import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { formatLineageSearchPath, searchPeopleByLineage } from '../lib/lineageSearch';
import { colors } from '../theme';
import type { ChartEdge, Person } from '../types';
import { lineageTreeStyles as styles } from './LineageAwareSvgGenealogyTree.styles';
import type { TreeStatusFilter } from './ModernGenealogyTree';
import { createSvgTreeLayout } from './svg-tree/layout';
import { TreeNodeCard } from './svg-tree/TreeNodeCard';
import { TreeZoomToolbar } from './svg-tree/TreeZoomToolbar';
import {
  collectExpandableIds,
  collectGenerationWindow,
  defaultExpandedPath,
  pathToRoot,
} from './svg-tree/treeWindow';

type Props = {
  people: Person[];
  edges: ChartEdge[];
  branchLabels: Record<string, string>;
  statusFilter?: TreeStatusFilter;
};

const rootCode = 'CORE-001';
const maxGenerations = 5;
const minZoom = 0.5;
const maxZoom = 2;
const zoomStep = 0.15;

export function LineageAwareSvgGenealogyTree({
  people,
  branchLabels,
  statusFilter = 'all',
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [focusedRootId, setFocusedRootId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [zoom, setZoom] = useState(1);
  const initializedRootId = useRef<number | null>(null);
  const treeScrollRef = useRef<ScrollView>(null);
  const viewportWidth = Math.max(screenWidth - 36, 320);

  const graph = useMemo(() => buildGraph(people), [people]);

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
    setFocusedRootId(graph.root.id);
    setExpandedIds(defaultExpandedPath(graph.root, graph.childrenByParent, visibleIds, maxGenerations));
  }, [graph, visibleIds]);

  const focusedRoot = useMemo(() => {
    if (!graph.root) return null;
    return focusedRootId ? graph.byId.get(focusedRootId) ?? graph.root : graph.root;
  }, [focusedRootId, graph]);

  const window = useMemo(() => focusedRoot
    ? collectGenerationWindow(focusedRoot, graph.childrenByParent, visibleIds, maxGenerations)
    : { ids: new Set<number>(), depthById: new Map<number, number>() },
  [focusedRoot, graph.childrenByParent, visibleIds]);

  const layout = useMemo(() => focusedRoot
    ? createSvgTreeLayout(
      focusedRoot,
      graph.childrenByParent,
      window.ids,
      expandedIds,
      viewportWidth,
    )
    : { width: viewportWidth, height: 220, nodes: [], connectors: [] },
  [expandedIds, focusedRoot, graph.childrenByParent, viewportWidth, window.ids]);

  const matches = useMemo(() => {
    const text = query.trim();
    if (!text) return [];
    const connected = graph.people.filter((person) => visibleIds.has(person.id));
    return searchPeopleByLineage(connected, text, 20);
  }, [graph.people, query, visibleIds]);

  const selected = selectedId ? graph.byId.get(selectedId) ?? null : null;
  const selectedPath = selected ? pathToRoot(selected, graph.byId) : [];
  const focusedParent = focusedRoot?.lineage_parent_id
    ? graph.byId.get(focusedRoot.lineage_parent_id) ?? null
    : null;
  const canvasWidth = Math.max(1, layout.width * zoom);
  const canvasHeight = Math.max(1, layout.height * zoom);

  const centerTree = (targetZoom: number, animated = true) => {
    const scaledWidth = layout.width * targetZoom;
    const centerX = Math.max(0, (scaledWidth - viewportWidth) / 2);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => treeScrollRef.current?.scrollTo({ x: centerX, y: 0, animated }));
    });
  };

  const setSafeZoom = (value: number, animated = true) => {
    const bounded = Math.max(minZoom, Math.min(maxZoom, value));
    const nextZoom = Math.round(bounded * 100) / 100;
    setZoom(nextZoom);
    centerTree(nextZoom, animated);
  };

  const fitAndCenter = (animated = true) => {
    const fittedZoom = Math.min(1, viewportWidth / Math.max(layout.width, 1));
    setSafeZoom(fittedZoom, animated);
  };

  useEffect(() => {
    const fittedZoom = Math.max(minZoom, Math.min(1, viewportWidth / Math.max(layout.width, 1)));
    const nextZoom = Math.round(fittedZoom * 100) / 100;
    setZoom(nextZoom);

    const timer = setTimeout(() => {
      const scaledWidth = layout.width * nextZoom;
      const centerX = Math.max(0, (scaledWidth - viewportWidth) / 2);
      treeScrollRef.current?.scrollTo({ x: centerX, y: 0, animated: false });
    }, 80);

    return () => clearTimeout(timer);
  }, [focusedRootId, layout.width, viewportWidth]);

  const focusOn = (person: Person) => {
    setFocusedRootId(person.id);
    setSelectedId(person.id);
    setExpandedIds(collectExpandableIds(
      person,
      graph.childrenByParent,
      visibleIds,
      maxGenerations,
    ));
  };

  const handleNodePress = (person: Person) => {
    const children = (graph.childrenByParent.get(person.id) ?? []).filter((child) => visibleIds.has(child.id));
    setSelectedId(person.id);

    if (person.id !== focusedRoot?.id) {
      focusOn(person);
      return;
    }
    if (!children.length) return;

    setExpandedIds((current) => {
      const next = new Set(current);
      next.has(person.id) ? next.delete(person.id) : next.add(person.id);
      return next;
    });
  };

  if (!graph.root || !focusedRoot) {
    return (
      <View style={styles.emptyBox}>
        <Ionicons name="warning-outline" size={40} color={colors.gold} />
        <Text style={styles.emptyTitle}>تعذر العثور على أصل الشجرة</Text>
        <Text style={styles.emptyText}>يجب أن تبدأ الشجرة من السجل الأساسي لسيد البشر محمد ﷺ.</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.focusBar}>
        <View style={styles.focusIdentity}>
          <Text style={styles.focusLabel}>بداية العرض الحالية</Text>
          <Text numberOfLines={1} style={styles.focusName}>{focusedRoot.full_name}</Text>
        </View>
        <View style={styles.focusActions}>
          {!!focusedParent && (
            <Pressable onPress={() => focusOn(focusedParent)} style={({ pressed }) => [styles.focusButton, pressed && styles.pressed]}>
              <Ionicons name="arrow-up" size={17} color={colors.primary} />
              <Text style={styles.focusButtonText}>الأب</Text>
            </Pressable>
          )}
          {focusedRoot.source_code !== rootCode && (
            <Pressable onPress={() => graph.root && focusOn(graph.root)} style={({ pressed }) => [styles.focusButton, pressed && styles.pressed]}>
              <Ionicons name="home" size={17} color={colors.primary} />
              <Text style={styles.focusButtonText}>الأصل</Text>
            </Pressable>
          )}
        </View>
      </View>

      <TreeZoomToolbar
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        onZoomIn={() => setSafeZoom(zoom + zoomStep)}
        onZoomOut={() => setSafeZoom(zoom - zoomStep)}
        onReset={() => setSafeZoom(1)}
        onFit={() => fitAndCenter()}
        onExpandAll={() => setExpandedIds(collectExpandableIds(focusedRoot, graph.childrenByParent, visibleIds, maxGenerations))}
        onCollapseAll={() => { setExpandedIds(new Set()); setSelectedId(null); }}
      />

      <View style={styles.search}>
        <Ionicons name="search" size={21} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="مثال: أحمد علوي هاشم — الاسم ثم الأب ثم الجد"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          textAlign="right"
        />
        {!!query && <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={21} color={colors.muted} /></Pressable>}
      </View>
      <Text style={styles.searchHint}>يدعم الأسماء المركبة؛ اكتب كل جيل بعد الذي قبله دون الحاجة إلى كلمة «بن».</Text>

      {!!query && (
        <View style={styles.results}>
          {matches.length ? matches.map((person) => (
            <Pressable key={person.id} onPress={() => focusOn(person)} style={styles.resultRow}>
              <Ionicons name="locate-outline" size={18} color={colors.gold} />
              <View style={styles.flex}>
                <Text style={styles.resultName}>{person.full_name}</Text>
                <Text numberOfLines={1} style={styles.resultLineage}>{formatLineageSearchPath(person, graph.byId, 4)}</Text>
              </View>
            </Pressable>
          )) : <Text style={styles.emptySearch}>لا توجد سلسلة نسب مطابقة بهذا الترتيب.</Text>}
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
          ref={treeScrollRef}
          horizontal
          bounces
          showsHorizontalScrollIndicator
          contentContainerStyle={[styles.canvasContent, { minWidth: viewportWidth }]}
        >
          <View style={{ width: canvasWidth, height: canvasHeight }}>
            <Svg pointerEvents="none" width={canvasWidth} height={canvasHeight} viewBox={`0 0 ${layout.width} ${layout.height}`} preserveAspectRatio="xMinYMin meet" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="branchGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#D8B55B" stopOpacity="0.95" />
                  <Stop offset="1" stopColor="#A97A22" stopOpacity="0.72" />
                </LinearGradient>
              </Defs>
              {layout.connectors.map((connector) => (
                <Path key={connector.id} d={connector.path} fill="none" stroke="url(#branchGradient)" strokeLinecap="round" strokeWidth={3} />
              ))}
            </Svg>

            {layout.nodes.map((node) => {
              const person = node.person;
              const children = (graph.childrenByParent.get(person.id) ?? []).filter((child) => visibleIds.has(child.id));
              const depth = window.depthById.get(person.id) ?? 0;
              const expanded = depth < maxGenerations - 1 && children.length > 0 && expandedIds.has(person.id);
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
                  onPress={() => handleNodePress(person)}
                  onLongPress={() => router.push(`/person/${person.id}`)}
                />
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.tip}>
        <Ionicons name="information-circle" size={19} color={colors.gold} />
        <Text style={styles.tipText}>تُنفذ الملاءمة والتوسيط تلقائيًا عند اختيار أي شخص، مع بقاء التكبير والتصغير متاحين يدويًا.</Text>
      </View>
    </View>
  );
}

function buildGraph(people: Person[]) {
  const active = people.filter((person) => person.approval_status !== 'rejected').sort(order);
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
    root: active.find((person) => person.source_code === rootCode) ?? null,
  };
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
