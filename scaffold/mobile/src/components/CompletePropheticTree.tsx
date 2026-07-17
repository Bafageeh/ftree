import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, shadow } from '../theme';
import type { ChartEdge, Person } from '../types';
import type { TreeStatusFilter } from './ModernGenealogyTree';

type Props = {
  people: Person[];
  edges: ChartEdge[];
  branchLabels: Record<string, string>;
  statusFilter?: TreeStatusFilter;
};

const PROPHET_CODE = 'CORE-001';

export function CompletePropheticTree({
  people,
  branchLabels,
  statusFilter = 'all',
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const graph = useMemo(() => {
    const active = people.filter((person) => person.approval_status !== 'rejected');
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
      people: active.sort(order),
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
      const childVisible = children.some((child) => visit(child, next));
      const selfVisible = matchesStatus(person, statusFilter);
      if (selfVisible || childVisible || statusFilter === 'all') visible.add(person.id);
      return selfVisible || childVisible || statusFilter === 'all';
    };

    visit(graph.root, new Set());
    return visible;
  }, [graph, statusFilter]);

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

  if (!graph.root) {
    return (
      <View style={styles.emptyBox}>
        <Ionicons name="warning-outline" size={40} color={colors.gold} />
        <Text style={styles.emptyTitle}>تعذر العثور على أصل الشجرة</Text>
        <Text style={styles.emptyText}>يجب أن تبدأ الشجرة من السجل CORE-001 لسيد البشر محمد ﷺ.</Text>
      </View>
    );
  }

  const renderNode = (person: Person, depth: number, visited: Set<number>): React.ReactNode => {
    if (visited.has(person.id) || !visibleIds.has(person.id)) return null;

    const nextVisited = new Set(visited).add(person.id);
    const children = (graph.childrenByParent.get(person.id) ?? [])
      .filter((child) => visibleIds.has(child.id));
    const prophet = person.source_code === PROPHET_CODE;
    const selectedNode = person.id === selectedId;
    const status = nodeStatus(person);
    const branch = person.chart_branch ? branchLabels[person.chart_branch] : null;

    return (
      <View key={person.id} style={styles.nodeGroup}>
        <Pressable
          onPress={() => setSelectedId(person.id)}
          onLongPress={() => router.push(`/person/${person.id}`)}
          style={[
            styles.node,
            prophet && styles.prophetNode,
            selectedNode && styles.selectedNode,
            { marginHorizontal: Math.min(depth * 5, 30) },
          ]}
        >
          {prophet && <Text style={styles.prophetLabel}>أصل الشجرة</Text>}
          <Text style={[styles.nodeName, prophet && styles.prophetName]}>{person.full_name}</Text>
          <Text style={[styles.nodeCode, prophet && styles.prophetMeta]}>{person.source_code ?? `#${person.id}`}</Text>
          {!!branch && branch !== 'الجذع الأوسط' && (
            <Text style={[styles.branch, prophet && styles.prophetMeta]}>{branch}</Text>
          )}
          <View style={[styles.statusPill, { backgroundColor: status.soft }]}> 
            <Ionicons name={status.icon} size={13} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          {!!children.length && <Text style={[styles.childrenCount, prophet && styles.prophetMeta]}>الأبناء: {children.length}</Text>}
        </Pressable>

        {!!children.length && (
          <View style={styles.descendants}>
            {children.map((child) => (
              <View key={child.id} style={styles.childPath}>
                <View style={styles.connector} />
                <Ionicons name="arrow-down" size={21} color={colors.gold} />
                {renderNode(child, depth + 1, nextVisited)}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View>
      <View style={styles.notice}>
        <Ionicons name="git-network" size={24} color={colors.gold} />
        <View style={styles.flex}>
          <Text style={styles.noticeTitle}>الشجرة الكاملة المتصلة</Text>
          <Text style={styles.noticeText}>تبدأ من سيد البشر محمد ﷺ، وتعرض جميع الأسماء التي يصل مسار آبائها إليه دون تحديد عدد أجيال أو إخفاء مستويات.</Text>
        </View>
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
            <Pressable key={person.id} onPress={() => setSelectedId(person.id)} style={styles.resultRow}>
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

      <View style={styles.treeShell}>
        {renderNode(graph.root, 0, new Set())}
      </View>

      <View style={styles.tip}>
        <Ionicons name="information-circle" size={19} color={colors.gold} />
        <Text style={styles.tipText}>اضغط على الاسم لإظهار مساره كاملًا، واضغط مطولًا لفتح صفحة تفاصيل النسب.</Text>
      </View>
    </View>
  );
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
  icon: keyof typeof Ionicons.glyphMap;
} {
  if (person.status === 'unclear') {
    return { label: 'غير محسومة', color: '#686E69', soft: '#ECEDEA', icon: 'help-circle' };
  }
  if (person.approval_status === 'supervisor_confirmed' && !person.is_provisional) {
    return { label: 'معتمد', color: colors.success, soft: '#E4F2E8', icon: 'shield-checkmark' };
  }
  return { label: 'بانتظار المشرف', color: '#A87518', soft: '#F8EDCF', icon: 'time' };
}

function order(a: Person, b: Person) {
  return (a.chart_order ?? a.generation ?? 9999) - (b.chart_order ?? b.generation ?? 9999);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notice: { alignItems: 'flex-start', backgroundColor: colors.primarySoft, borderColor: colors.gold, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row-reverse', gap: 10, marginBottom: 13, padding: 14 },
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
  treeShell: { backgroundColor: '#FAF7EF', borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, padding: 12, ...shadow },
  nodeGroup: { alignItems: 'stretch', width: '100%' },
  node: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1.2, maxWidth: 620, padding: 12, width: '92%', ...shadow },
  prophetNode: { backgroundColor: colors.primary, borderColor: colors.gold, borderWidth: 2 },
  selectedNode: { borderColor: colors.gold, borderWidth: 2.2 },
  prophetLabel: { color: '#E8C977', fontSize: 10, fontWeight: '900' },
  nodeName: { color: colors.primary, fontSize: 17, fontWeight: '900', marginTop: 3, textAlign: 'center' },
  prophetName: { color: colors.white, fontSize: 20 },
  nodeCode: { color: '#8A661E', fontSize: 10, fontWeight: '800', marginTop: 4 },
  prophetMeta: { color: '#DDE8E4' },
  branch: { color: '#8A661E', fontSize: 10, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  statusPill: { alignItems: 'center', borderRadius: radius.pill, flexDirection: 'row-reverse', gap: 4, marginTop: 7, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 9, fontWeight: '900' },
  childrenCount: { color: colors.muted, fontSize: 9, marginTop: 6 },
  descendants: { alignItems: 'stretch', width: '100%' },
  childPath: { alignItems: 'center', width: '100%' },
  connector: { backgroundColor: colors.gold, height: 18, width: 2 },
  tip: { alignItems: 'center', backgroundColor: colors.goldSoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 7, marginTop: 12, padding: 11 },
  tipText: { color: '#765714', flex: 1, fontSize: 10, lineHeight: 18, textAlign: 'right' },
  emptyBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, padding: 35 },
  emptyTitle: { color: colors.primary, fontSize: 17, fontWeight: '900', marginTop: 10 },
  emptyText: { color: colors.muted, fontSize: 11, lineHeight: 19, marginTop: 5, textAlign: 'center' },
});
