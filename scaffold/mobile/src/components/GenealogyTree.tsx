import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, shadow } from '../theme';
import type { Person } from '../types';

type BranchGroup = {
  key: string;
  label: string;
  color: string;
  roots: Person[];
  unlinked: Person[];
  total: number;
  linked: number;
};

type Props = {
  people: Person[];
  branchLabels: Record<string, string>;
};

export function GenealogyTree({ people, branchLabels }: Props) {
  const [query, setQuery] = useState('');
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set(['central_trunk']));
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const byId = useMemo(() => new Map(people.map((person) => [person.id, person])), [people]);

  const childrenByParent = useMemo(() => {
    const map = new Map<number, Person[]>();
    people.forEach((person) => {
      if (!person.lineage_parent_id || !byId.has(person.lineage_parent_id)) return;
      map.set(person.lineage_parent_id, [...(map.get(person.lineage_parent_id) ?? []), person]);
    });
    map.forEach((items) => items.sort(byOrder));
    return map;
  }, [byId, people]);

  const groups = useMemo<BranchGroup[]>(() => {
    const grouped = new Map<string, Person[]>();
    people.forEach((person) => {
      const key = person.chart_branch || 'unclassified';
      grouped.set(key, [...(grouped.get(key) ?? []), person]);
    });

    return [...grouped.entries()]
      .map(([key, nodes]) => {
        const sorted = nodes.sort(byOrder);
        const nodeIds = new Set(sorted.map((node) => node.id));
        const roots = sorted.filter((node) => !node.lineage_parent_id || !nodeIds.has(node.lineage_parent_id));
        const linked = sorted.filter((node) => node.lineage_parent_id && byId.has(node.lineage_parent_id)).length;
        const unlinked = sorted.filter((node) => {
          if (key === 'central_trunk') return false;
          return !node.lineage_parent_id || !byId.has(node.lineage_parent_id);
        });

        return {
          key,
          label: branchLabels[key] ?? (key === 'unclassified' ? 'غير مصنف' : key),
          color: sorted.find((node) => node.chart_color)?.chart_color || colors.primarySoft,
          roots,
          unlinked,
          total: sorted.length,
          linked,
        };
      })
      .sort((a, b) => {
        if (a.key === 'central_trunk') return -1;
        if (b.key === 'central_trunk') return 1;
        return a.label.localeCompare(b.label, 'ar');
      });
  }, [branchLabels, byId, people]);

  const matches = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return people
      .filter((person) => `${person.full_name} ${person.source_code ?? ''}`.includes(trimmed))
      .slice(0, 20);
  }, [people, query]);

  const selected = selectedId ? byId.get(selectedId) ?? null : null;
  const selectedPath = useMemo(() => {
    if (!selected) return [];
    const path: Person[] = [];
    const visited = new Set<number>();
    let current: Person | undefined = selected;
    while (current && !visited.has(current.id)) {
      path.unshift(current);
      visited.add(current.id);
      current = current.lineage_parent_id ? byId.get(current.lineage_parent_id) : undefined;
    }
    return path;
  }, [byId, selected]);

  const linkedCount = people.filter((person) => person.lineage_parent_id && byId.has(person.lineage_parent_id)).length;
  const unlinkedCount = people.length - linkedCount - 1;

  const toggleBranch = (key: string) => {
    setExpandedBranches((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleNode = (id: number) => {
    setExpandedNodes((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const focusPerson = (person: Person) => {
    setSelectedId(person.id);
    setQuery('');
  };

  return (
    <View>
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{people.length}</Text>
          <Text style={styles.summaryLabel}>إجمالي العقد</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{linkedCount}</Text>
          <Text style={styles.summaryLabel}>علاقات مرتبطة</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{Math.max(0, unlinkedCount)}</Text>
          <Text style={styles.summaryLabel}>تحتاج ربطًا</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={21} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ابحث عن اسم لرؤية موقعه في الشجرة"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          textAlign="right"
        />
        {!!query && (
          <Pressable onPress={() => setQuery('')} hitSlop={12}>
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {!!query && (
        <View style={styles.searchResults}>
          <Text style={styles.sectionTitle}>نتائج البحث</Text>
          {matches.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد نتيجة مطابقة.</Text>
          ) : matches.map((person) => (
            <Pressable key={person.id} onPress={() => focusPerson(person)} style={styles.searchResultRow}>
              <Ionicons name="locate" size={19} color={colors.gold} />
              <View style={styles.flexOne}>
                <Text style={styles.personName}>{person.full_name}</Text>
                <Text style={styles.personCode}>{person.source_code ?? 'دون رمز'}</Text>
              </View>
              <Ionicons name="chevron-back" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      )}

      {selected && (
        <View style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <Pressable onPress={() => setSelectedId(null)} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
            <View style={styles.flexOne}>
              <Text style={styles.focusTitle}>موقع الاسم في الشجرة</Text>
              <Text style={styles.focusName}>{selected.full_name}</Text>
            </View>
            <View style={styles.codePill}><Text style={styles.codeText}>{selected.source_code ?? '—'}</Text></View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pathRow}>
            {selectedPath.map((person, index) => (
              <View key={person.id} style={styles.pathItemWrap}>
                <Pressable onPress={() => setSelectedId(person.id)} style={styles.pathItem}>
                  <Text style={styles.pathName}>{person.full_name}</Text>
                </Pressable>
                {index < selectedPath.length - 1 && <Ionicons name="chevron-back" size={16} color={colors.gold} />}
              </View>
            ))}
          </ScrollView>

          <View style={styles.focusMetaRow}>
            <Text style={styles.focusMeta}>الأبناء: {(childrenByParent.get(selected.id) ?? []).length}</Text>
            <Text style={styles.focusMeta}>{selected.lineage_parent_id ? 'مرتبط بأب' : 'لم يُربط بأب بعد'}</Text>
          </View>

          <Pressable onPress={() => router.push(`/person/${selected.id}`)} style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>فتح التفاصيل الكاملة</Text>
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
                <Text style={styles.branchMeta}>{group.total} عقدة · {group.linked} علاقة داخلية</Text>
              </View>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={21} color={colors.primary} />
            </Pressable>

            {expanded && (
              <View style={styles.branchBody}>
                {group.roots.map((root) => (
                  <TreeNode
                    key={root.id}
                    person={root}
                    depth={0}
                    childrenByParent={childrenByParent}
                    expandedNodes={expandedNodes}
                    onToggle={toggleNode}
                    onOpen={(person) => setSelectedId(person.id)}
                  />
                ))}

                {group.unlinked.length > 0 && group.key !== 'central_trunk' && (
                  <View style={styles.unlinkedBox}>
                    <View style={styles.unlinkedHeader}>
                      <Ionicons name="unlink" size={18} color="#8A661E" />
                      <Text style={styles.unlinkedTitle}>عقد تحتاج ربطًا بالمشرف ({group.unlinked.length})</Text>
                    </View>
                    <Text style={styles.unlinkedHint}>هذه الأسماء مقروءة من الفرع، لكن سهم الأب لم يُحسم بعد.</Text>
                    <View style={styles.unlinkedChips}>
                      {group.unlinked.slice(0, 12).map((person) => (
                        <Pressable key={person.id} onPress={() => setSelectedId(person.id)} style={styles.unlinkedChip}>
                          <Text style={styles.unlinkedChipText}>{person.full_name}</Text>
                        </Pressable>
                      ))}
                    </View>
                    {group.unlinked.length > 12 && <Text style={styles.moreText}>و{group.unlinked.length - 12} أسماء أخرى</Text>}
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

function TreeNode({
  person,
  depth,
  childrenByParent,
  expandedNodes,
  onToggle,
  onOpen,
}: {
  person: Person;
  depth: number;
  childrenByParent: Map<number, Person[]>;
  expandedNodes: Set<number>;
  onToggle: (id: number) => void;
  onOpen: (person: Person) => void;
}) {
  const children = childrenByParent.get(person.id) ?? [];
  const expanded = expandedNodes.has(person.id) || depth < 2;

  return (
    <View style={[styles.nodeWrap, { marginRight: Math.min(depth * 18, 72) }]}>
      <View style={styles.nodeRow}>
        <View style={styles.nodeConnectorColumn}>
          {depth > 0 && <View style={styles.nodeVerticalLine} />}
          <View style={[styles.nodeDot, { backgroundColor: person.chart_color || colors.primarySoft }]} />
        </View>

        <Pressable onPress={() => onOpen(person)} style={styles.nodeCard}>
          <View style={styles.flexOne}>
            <Text style={styles.nodeName}>{person.full_name}</Text>
            <Text style={styles.nodeMeta}>{person.source_code ?? 'دون رمز'} · {approvalLabel(person)}</Text>
          </View>
          {children.length > 0 ? (
            <Pressable onPress={() => onToggle(person.id)} hitSlop={10} style={styles.childrenButton}>
              <Text style={styles.childrenCount}>{children.length}</Text>
              <Ionicons name={expanded ? 'remove' : 'add'} size={17} color={colors.primary} />
            </Pressable>
          ) : (
            <Ionicons name="ellipse" size={9} color={colors.gold} />
          )}
        </Pressable>
      </View>

      {expanded && children.map((child) => (
        <TreeNode
          key={child.id}
          person={child}
          depth={depth + 1}
          childrenByParent={childrenByParent}
          expandedNodes={expandedNodes}
          onToggle={onToggle}
          onOpen={onOpen}
        />
      ))}
    </View>
  );
}

function approvalLabel(person: Person) {
  return person.approval_status === 'supervisor_confirmed' && !person.is_provisional
    ? 'معتمد'
    : 'بانتظار المشرف';
}

function byOrder(a: Person, b: Person) {
  return (a.chart_order ?? a.generation ?? 9999) - (b.chart_order ?? b.generation ?? 9999);
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  summaryCard: { alignItems: 'stretch', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', marginBottom: 14, paddingVertical: 15, ...shadow },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryNumber: { color: colors.primary, fontSize: 24, fontWeight: '900' },
  summaryLabel: { color: colors.muted, fontSize: 11, marginTop: 4 },
  summaryDivider: { backgroundColor: colors.line, width: StyleSheet.hairlineWidth },
  searchBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 9, marginBottom: 14, minHeight: 56, paddingHorizontal: 16, ...shadow },
  searchInput: { color: colors.text, flex: 1, fontSize: 15 },
  searchResults: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginBottom: 14, padding: 14 },
  searchResultRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row-reverse', gap: 10, paddingVertical: 11 },
  emptyText: { color: colors.muted, paddingVertical: 18, textAlign: 'center' },
  personName: { color: colors.text, fontSize: 15, fontWeight: '800', textAlign: 'right' },
  personCode: { color: colors.muted, fontSize: 11, marginTop: 3, textAlign: 'right' },
  sectionTitle: { color: colors.primary, fontSize: 20, fontWeight: '900', marginBottom: 12, marginTop: 4, textAlign: 'right' },
  focusCard: { backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: radius.md, borderWidth: 1, marginBottom: 16, padding: 16, ...shadow },
  focusHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 10 },
  focusTitle: { color: colors.muted, fontSize: 11, textAlign: 'right' },
  focusName: { color: colors.primary, fontSize: 19, fontWeight: '900', marginTop: 2, textAlign: 'right' },
  codePill: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 7 },
  codeText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  pathRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: 7, paddingVertical: 15 },
  pathItemWrap: { alignItems: 'center', flexDirection: 'row-reverse', gap: 7 },
  pathItem: { backgroundColor: colors.goldSoft, borderRadius: radius.pill, maxWidth: 190, paddingHorizontal: 10, paddingVertical: 7 },
  pathName: { color: colors.text, fontSize: 12, fontWeight: '800' },
  focusMetaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12 },
  focusMeta: { color: colors.muted, fontSize: 12 },
  detailsButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, justifyContent: 'center', minHeight: 46 },
  detailsButtonText: { color: colors.white, fontSize: 14, fontWeight: '900' },
  branchCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginBottom: 12, overflow: 'hidden', ...shadow },
  branchHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 11, minHeight: 68, padding: 14 },
  branchColor: { borderRadius: 9, height: 44, width: 8 },
  branchTitle: { color: colors.primary, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  branchMeta: { color: colors.muted, fontSize: 11, marginTop: 4, textAlign: 'right' },
  branchBody: { borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth, padding: 12 },
  nodeWrap: { position: 'relative' },
  nodeRow: { alignItems: 'stretch', flexDirection: 'row-reverse', minHeight: 58 },
  nodeConnectorColumn: { alignItems: 'center', width: 24 },
  nodeVerticalLine: { backgroundColor: colors.gold, height: '100%', opacity: 0.45, position: 'absolute', width: 2 },
  nodeDot: { borderColor: colors.surface, borderRadius: 8, borderWidth: 2, height: 14, marginTop: 22, width: 14 },
  nodeCard: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, flex: 1, flexDirection: 'row-reverse', gap: 9, marginBottom: 8, minHeight: 54, paddingHorizontal: 12, paddingVertical: 9 },
  nodeName: { color: colors.text, fontSize: 14, fontWeight: '900', textAlign: 'right' },
  nodeMeta: { color: colors.muted, fontSize: 10, marginTop: 3, textAlign: 'right' },
  childrenButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, flexDirection: 'row-reverse', gap: 3, paddingHorizontal: 8, paddingVertical: 6 },
  childrenCount: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  unlinkedBox: { backgroundColor: colors.goldSoft, borderRadius: radius.sm, marginTop: 10, padding: 12 },
  unlinkedHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 7 },
  unlinkedTitle: { color: '#765714', flex: 1, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  unlinkedHint: { color: '#8A723D', fontSize: 11, lineHeight: 19, marginTop: 6, textAlign: 'right' },
  unlinkedChips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  unlinkedChip: { backgroundColor: colors.surface, borderColor: '#DFC985', borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 7 },
  unlinkedChipText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  moreText: { color: '#765714', fontSize: 11, marginTop: 8, textAlign: 'right' },
});
