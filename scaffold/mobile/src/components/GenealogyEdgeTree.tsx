import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { buildGenealogyGraph, getPreferredPath, type GenealogyGraph } from '../lib/genealogyGraph';
import { colors, radius, shadow } from '../theme';
import type { ChartEdge, Person } from '../types';

type Props = {
  people: Person[];
  edges: ChartEdge[];
  branchLabels: Record<string, string>;
};

type BranchGroup = {
  key: string;
  label: string;
  color: string;
  roots: Person[];
  unlinked: Person[];
  total: number;
  connected: number;
  pendingEdges: number;
};

export function GenealogyEdgeTree({ people, edges, branchLabels }: Props) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set(['central_trunk']));
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  const graph = useMemo(() => buildGenealogyGraph(people, edges), [edges, people]);
  const groups = useMemo(() => buildGroups(people, edges, graph, branchLabels), [branchLabels, edges, graph, people]);
  const selected = selectedId ? graph.byId.get(selectedId) ?? null : null;
  const selectedPath = selected ? getPreferredPath(selected, graph) : [];
  const selectedIncoming = selected ? graph.incomingByChild.get(selected.id) ?? [] : [];
  const unlinkedCount = people.filter((person) => person.source_code !== 'CORE-001' && !graph.connectedIds.has(person.id)).length;

  const matches = useMemo(() => {
    const text = query.trim();
    if (!text) return [];
    return people.filter((person) => `${person.full_name} ${person.source_code ?? ''}`.includes(text)).slice(0, 20);
  }, [people, query]);

  const toggleBranch = (key: string) => setExpandedBranches((current) => {
    const next = new Set(current);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const toggleNode = (id: number) => setExpandedNodes((current) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <View>
      <View style={styles.summaryCard}>
        <Summary value={people.length} label="إجمالي العقد" />
        <Summary value={graph.relationshipCount} label="العلاقات" />
        <Summary value={unlinkedCount} label="تحتاج ربطًا" />
      </View>

      <View style={styles.legend}>
        <Legend icon="shield-checkmark" label="نسب معتمد" color={colors.primary} />
        <Legend icon="git-branch" label="سهم مقروء بانتظار المشرف" color={colors.gold} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={21} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ابحث بالاسم أو الرمز لرؤية موقعه"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          textAlign="right"
        />
        {!!query && <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={20} color={colors.muted} /></Pressable>}
      </View>

      {!!query && (
        <View style={styles.searchResults}>
          {matches.length === 0 ? <Text style={styles.empty}>لا توجد نتيجة مطابقة.</Text> : matches.map((person) => (
            <Pressable key={person.id} onPress={() => { setSelectedId(person.id); setQuery(''); }} style={styles.searchRow}>
              <Ionicons name="locate" size={18} color={colors.gold} />
              <View style={styles.flexOne}>
                <Text style={styles.name}>{person.full_name}</Text>
                <Text style={styles.meta}>{person.source_code ?? 'دون رمز'}</Text>
              </View>
              <Ionicons name="chevron-back" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      )}

      {selected && (
        <View style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <Pressable onPress={() => setSelectedId(null)}><Ionicons name="close" size={21} color={colors.muted} /></Pressable>
            <View style={styles.flexOne}>
              <Text style={styles.focusLabel}>موقع الاسم في المشجرة</Text>
              <Text style={styles.focusName}>{selected.full_name}</Text>
            </View>
            <View style={styles.codePill}><Text style={styles.codeText}>{selected.source_code ?? '—'}</Text></View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pathRow}>
            {selectedPath.map((person, index) => (
              <View key={person.id} style={styles.pathWrap}>
                <Pressable onPress={() => setSelectedId(person.id)} style={styles.pathPill}><Text style={styles.pathText}>{person.full_name}</Text></Pressable>
                {index < selectedPath.length - 1 && <Ionicons name="chevron-back" size={15} color={colors.gold} />}
              </View>
            ))}
          </ScrollView>

          <View style={styles.focusStats}>
            <Text style={styles.meta}>الأبناء/الفروع: {(graph.childrenByParent.get(selected.id) ?? []).length}</Text>
            <Text style={styles.meta}>{selectedIncoming.length ? `${selectedIncoming.length} وصلة داخلة` : 'غير مربوط بعد'}</Text>
          </View>

          {selectedIncoming.length > 1 && (
            <View style={styles.multiBox}>
              <Text style={styles.multiTitle}>المؤسسون أو الآباء المرتبطون بهذه الورقة</Text>
              {selectedIncoming.map(({ parent, meta }) => (
                <Pressable key={parent.id} onPress={() => setSelectedId(parent.id)} style={styles.multiRow}>
                  <Text style={styles.name}>{parent.full_name}</Text>
                  <Text style={styles.meta}>{meta.confirmed ? 'معتمد' : `${meta.edge?.confidence ?? 0}% · بانتظار المشرف`}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable onPress={() => router.push(`/person/${selected.id}`)} style={styles.detailsButton}>
            <Text style={styles.detailsText}>فتح التفاصيل</Text>
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionTitle}>الفروع الترابطية</Text>
      {groups.map((group) => {
        const expanded = expandedBranches.has(group.key);
        return (
          <View key={group.key} style={styles.branchCard}>
            <Pressable onPress={() => toggleBranch(group.key)} style={styles.branchHeader}>
              <View style={[styles.branchColor, { backgroundColor: group.color }]} />
              <View style={styles.flexOne}>
                <Text style={styles.branchTitle}>{group.label}</Text>
                <Text style={styles.meta}>{group.total} عقدة · {group.connected} مرتبطة{group.pendingEdges ? ` · ${group.pendingEdges} أسهم معلقة` : ''}</Text>
              </View>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
            </Pressable>

            {expanded && (
              <View style={styles.branchBody}>
                {group.roots.map((root) => (
                  <TreeNode
                    key={root.id}
                    person={root}
                    parentId={null}
                    depth={0}
                    graph={graph}
                    expandedNodes={expandedNodes}
                    visited={new Set<number>()}
                    onToggle={toggleNode}
                    onOpen={(person) => setSelectedId(person.id)}
                  />
                ))}
                {group.unlinked.length > 0 && group.key !== 'central_trunk' && (
                  <View style={styles.unlinkedBox}>
                    <Text style={styles.unlinkedTitle}>تحتاج ربطًا ({group.unlinked.length})</Text>
                    <Text style={styles.unlinkedHint}>لم يظهر لها سهم محسوم حتى الآن.</Text>
                    <View style={styles.chips}>
                      {group.unlinked.slice(0, 12).map((person) => (
                        <Pressable key={person.id} onPress={() => setSelectedId(person.id)} style={styles.chip}><Text style={styles.chipText}>{person.full_name}</Text></Pressable>
                      ))}
                    </View>
                    {group.unlinked.length > 12 && <Text style={styles.more}>و{group.unlinked.length - 12} أسماء أخرى</Text>}
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function TreeNode({ person, parentId, depth, graph, expandedNodes, visited, onToggle, onOpen }: {
  person: Person;
  parentId: number | null;
  depth: number;
  graph: GenealogyGraph;
  expandedNodes: Set<number>;
  visited: Set<number>;
  onToggle: (id: number) => void;
  onOpen: (person: Person) => void;
}) {
  if (visited.has(person.id)) return null;
  const nextVisited = new Set(visited);
  nextVisited.add(person.id);
  const children = (graph.childrenByParent.get(person.id) ?? []).filter((child) => !nextVisited.has(child.id));
  const expanded = expandedNodes.has(person.id) || depth < 2;
  const relation = parentId ? graph.relationByPair.get(`${parentId}>${person.id}`) : undefined;
  const pending = !!relation?.edge && relation.edge.approval_status !== 'supervisor_confirmed';

  return (
    <View style={[styles.nodeWrap, { marginRight: Math.min(depth * 18, 72) }]}>
      <View style={styles.nodeRow}>
        <View style={styles.connectorCol}>
          {depth > 0 && <View style={[styles.line, pending && styles.pendingLine]} />}
          <View style={[styles.dot, { backgroundColor: pending ? colors.gold : (person.chart_color || colors.primarySoft) }]} />
        </View>
        <Pressable onPress={() => onOpen(person)} style={[styles.nodeCard, pending && styles.pendingCard]}>
          <View style={styles.flexOne}>
            <Text style={styles.name}>{person.full_name}</Text>
            <Text style={styles.meta}>{person.source_code ?? 'دون رمز'} · {person.approval_status === 'supervisor_confirmed' && !person.is_provisional ? 'معتمد' : 'بانتظار المشرف'}</Text>
            {relation?.edge && <Text style={styles.edgeText}>{relation.edge.relation_type === 'lineage' ? 'سهم نسب' : 'صلة مؤسس'} · {relation.edge.confidence}%</Text>}
          </View>
          {children.length > 0 ? (
            <Pressable onPress={() => onToggle(person.id)} style={styles.countPill}>
              <Text style={styles.countText}>{children.length}</Text>
              <Ionicons name={expanded ? 'remove' : 'add'} size={16} color={colors.primary} />
            </Pressable>
          ) : <Ionicons name="ellipse" size={9} color={colors.gold} />}
        </Pressable>
      </View>
      {expanded && children.map((child) => (
        <TreeNode key={`${person.id}-${child.id}`} person={child} parentId={person.id} depth={depth + 1} graph={graph} expandedNodes={expandedNodes} visited={nextVisited} onToggle={onToggle} onOpen={onOpen} />
      ))}
    </View>
  );
}

function buildGroups(people: Person[], edges: ChartEdge[], graph: GenealogyGraph, labels: Record<string, string>): BranchGroup[] {
  const grouped = new Map<string, Person[]>();
  people.forEach((person) => {
    const key = person.chart_branch || 'unclassified';
    grouped.set(key, [...(grouped.get(key) ?? []), person]);
  });

  return [...grouped.entries()].map(([key, nodes]) => {
    const sorted = nodes.slice().sort(byOrder);
    const ids = new Set(sorted.map((node) => node.id));
    const roots = sorted.filter((node) => {
      const incomingInside = (graph.incomingByChild.get(node.id) ?? []).some((item) => ids.has(item.parent.id));
      return !incomingInside && ((graph.childrenByParent.get(node.id) ?? []).length > 0 || key === 'central_trunk');
    });
    const unlinked = sorted.filter((node) => !graph.connectedIds.has(node.id));
    const connected = sorted.filter((node) => graph.connectedIds.has(node.id)).length;
    const pendingEdges = edges.filter((edge) => {
      const parent = graph.byCode.get(edge.from_source_key);
      const child = graph.byCode.get(edge.to_source_key);
      return parent && child && ids.has(parent.id) && ids.has(child.id) && edge.approval_status !== 'supervisor_confirmed';
    }).length;
    return {
      key,
      label: labels[key] ?? (key === 'unclassified' ? 'غير مصنف' : key),
      color: sorted.find((node) => node.chart_color)?.chart_color || colors.primarySoft,
      roots,
      unlinked,
      total: sorted.length,
      connected,
      pendingEdges,
    };
  }).sort((a, b) => a.key === 'central_trunk' ? -1 : b.key === 'central_trunk' ? 1 : a.label.localeCompare(b.label, 'ar'));
}

function Summary({ value, label }: { value: number; label: string }) {
  return <View style={styles.summaryItem}><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>;
}

function Legend({ icon, label, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }) {
  return <View style={styles.legendItem}><Ionicons name={icon} size={17} color={color} /><Text style={styles.meta}>{label}</Text></View>;
}

function byOrder(a: Person, b: Person) {
  return (a.chart_order ?? a.generation ?? 9999) - (b.chart_order ?? b.generation ?? 9999);
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  summaryCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', marginBottom: 10, paddingVertical: 14, ...shadow },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { color: colors.primary, fontSize: 23, fontWeight: '900' },
  summaryLabel: { color: colors.muted, fontSize: 10, marginTop: 3 },
  legend: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, marginBottom: 14, padding: 10 },
  legendItem: { alignItems: 'center', flexDirection: 'row-reverse', gap: 5 },
  searchBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 9, marginBottom: 14, minHeight: 56, paddingHorizontal: 15, ...shadow },
  searchInput: { color: colors.text, flex: 1, fontSize: 15 },
  searchResults: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginBottom: 14, padding: 12 },
  searchRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row-reverse', gap: 9, paddingVertical: 10 },
  empty: { color: colors.muted, paddingVertical: 15, textAlign: 'center' },
  name: { color: colors.text, fontSize: 14, fontWeight: '900', textAlign: 'right' },
  meta: { color: colors.muted, fontSize: 10, marginTop: 3, textAlign: 'right' },
  focusCard: { backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: radius.md, borderWidth: 1, marginBottom: 15, padding: 14, ...shadow },
  focusHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 9 },
  focusLabel: { color: colors.muted, fontSize: 10, textAlign: 'right' },
  focusName: { color: colors.primary, fontSize: 18, fontWeight: '900', marginTop: 2, textAlign: 'right' },
  codePill: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6 },
  codeText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  pathRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: 6, paddingVertical: 13 },
  pathWrap: { alignItems: 'center', flexDirection: 'row-reverse', gap: 6 },
  pathPill: { backgroundColor: colors.goldSoft, borderRadius: radius.pill, maxWidth: 180, paddingHorizontal: 9, paddingVertical: 6 },
  pathText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  focusStats: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 10 },
  multiBox: { backgroundColor: colors.goldSoft, borderRadius: radius.sm, marginBottom: 10, padding: 9 },
  multiTitle: { color: '#765714', fontSize: 11, fontWeight: '900', marginBottom: 5, textAlign: 'right' },
  multiRow: { alignItems: 'center', borderTopColor: '#E5D7A7', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 6 },
  detailsButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 7, justifyContent: 'center', minHeight: 44 },
  detailsText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  sectionTitle: { color: colors.primary, fontSize: 20, fontWeight: '900', marginBottom: 11, textAlign: 'right' },
  branchCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginBottom: 11, overflow: 'hidden', ...shadow },
  branchHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 10, minHeight: 65, padding: 13 },
  branchColor: { borderRadius: 8, height: 41, width: 7 },
  branchTitle: { color: colors.primary, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  branchBody: { borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth, padding: 11 },
  nodeWrap: { position: 'relative' },
  nodeRow: { alignItems: 'stretch', flexDirection: 'row-reverse', minHeight: 56 },
  connectorCol: { alignItems: 'center', width: 23 },
  line: { backgroundColor: colors.primary, height: '100%', opacity: 0.32, position: 'absolute', width: 2 },
  pendingLine: { backgroundColor: colors.gold, opacity: 0.75 },
  dot: { borderColor: colors.surface, borderRadius: 8, borderWidth: 2, height: 13, marginTop: 21, width: 13 },
  nodeCard: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, flex: 1, flexDirection: 'row-reverse', gap: 8, marginBottom: 7, minHeight: 52, paddingHorizontal: 11, paddingVertical: 8 },
  pendingCard: { borderColor: '#D8B24D' },
  edgeText: { alignSelf: 'flex-end', color: '#765714', fontSize: 9, fontWeight: '800', marginTop: 4 },
  countPill: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, flexDirection: 'row-reverse', gap: 2, paddingHorizontal: 7, paddingVertical: 5 },
  countText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  unlinkedBox: { backgroundColor: colors.goldSoft, borderRadius: radius.sm, marginTop: 9, padding: 11 },
  unlinkedTitle: { color: '#765714', fontSize: 12, fontWeight: '900', textAlign: 'right' },
  unlinkedHint: { color: '#8A723D', fontSize: 10, marginTop: 4, textAlign: 'right' },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { backgroundColor: colors.surface, borderColor: '#DFC985', borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 6 },
  chipText: { color: colors.text, fontSize: 10, fontWeight: '700' },
  more: { color: '#765714', fontSize: 10, marginTop: 7, textAlign: 'right' },
});
