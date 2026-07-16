import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonCard } from '../../src/components/PersonCard';
import { getChartReadings, getPeople } from '../../src/lib/api';
import { colors, radius, shadow } from '../../src/theme';
import type { ChartReading, Person, ReadingStatus } from '../../src/types';

type ViewMode = 'readings' | 'approved';

const branchLabels: Record<string, string> = {
  central_trunk: 'الجذع الأوسط',
  alawi_faqih: 'بداية فرع علوي بن الفقيه المقدم',
  ali_alawi_faqih: 'فرع علي بن علوي بن الفقيه المقدم',
  abdullah_alawi_faqih: 'فرع عبد الله بن علوي بن الفقيه المقدم',
  ahmad_faqih: 'فرع أحمد بن الفقيه المقدم',
  ali_faqih: 'فرع علي بن الفقيه المقدم',
  abdulrahman_faqih: 'فرع عبد الرحمن بن الفقيه المقدم',
};

const statusFilters: Array<{ value: ReadingStatus | ''; label: string }> = [
  { value: '', label: 'الكل' },
  { value: 'readable', label: 'واضحة' },
  { value: 'review', label: 'للمراجعة' },
  { value: 'unclear', label: 'غير محسومة' },
];

export default function TreeScreen() {
  const [mode, setMode] = useState<ViewMode>('readings');
  const [people, setPeople] = useState<Person[]>([]);
  const [readings, setReadings] = useState<ChartReading[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReadingStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    const [peopleResult, readingResult] = await Promise.all([
      getPeople(),
      getChartReadings().catch(() => []),
    ]);
    setPeople(peopleResult);
    setReadings(readingResult);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredReadings = useMemo(() => {
    const query = search.trim();
    return readings.filter((reading) => {
      const matchesStatus = !status || reading.reading_status === status;
      const haystack = `${reading.provisional_name} ${reading.normalized_name ?? ''} ${reading.source_locator ?? ''} ${branchLabels[reading.chart_branch ?? ''] ?? ''}`;
      const matchesSearch = !query || haystack.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [readings, search, status]);

  const centralTrunk = useMemo(
    () => people
      .filter((person) => person.chart_branch === 'central_trunk' || !person.chart_branch)
      .sort(byChartOrder),
    [people],
  );

  const branches = useMemo(() => {
    const grouped = new Map<string, Person[]>();
    people.forEach((person) => {
      if (!person.chart_branch || person.chart_branch === 'central_trunk') return;
      const existing = grouped.get(person.chart_branch) ?? [];
      existing.push(person);
      grouped.set(person.chart_branch, existing);
    });

    return [...grouped.entries()]
      .map(([key, nodes]) => ({ key, nodes: nodes.sort(byChartOrder) }))
      .sort((left, right) => (left.nodes[0]?.chart_order ?? 9999) - (right.nodes[0]?.chart_order ?? 9999));
  }, [people]);

  if (mode === 'readings') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <FlatList
          data={filteredReadings}
          keyExtractor={(item) => `reading-${item.id}`}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
          ListHeaderComponent={
            <>
              <Header mode={mode} onModeChange={setMode} approvedCount={people.length} readingCount={readings.length} />

              <View style={styles.searchBox}>
                <Ionicons name="search" size={21} color={colors.muted} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="ابحث في جميع الأسماء والقراءات"
                  placeholderTextColor={colors.muted}
                  style={styles.searchInput}
                  textAlign="right"
                />
                {!!search && (
                  <Pressable onPress={() => setSearch('')} hitSlop={12}>
                    <Ionicons name="close-circle" size={20} color={colors.muted} />
                  </Pressable>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                {statusFilters.map((filter) => {
                  const active = status === filter.value;
                  return (
                    <Pressable
                      key={filter.label}
                      onPress={() => setStatus(filter.value)}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>كل قراءات المشجرة</Text>
                <Text style={styles.resultsCount}>{filteredReadings.length} من {readings.length}</Text>
              </View>
            </>
          }
          renderItem={({ item }) => <ReadingCard reading={item} />}
          ListEmptyComponent={loading
            ? <ActivityIndicator color={colors.primary} size="large" />
            : <Text style={styles.empty}>لا توجد نتائج مطابقة.</Text>}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      >
        <Header mode={mode} onModeChange={setMode} approvedCount={people.length} readingCount={readings.length} />

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.colorDot, { backgroundColor: '#B98249' }]} />
              <Text style={styles.sectionTitle}>الجذع الأوسط</Text>
              <Text style={styles.countText}>{centralTrunk.length}</Text>
            </View>

            <View style={styles.trunkCard}>
              {centralTrunk.map((person, index) => (
                <View key={person.id} style={styles.nodeWrap}>
                  <PersonCard
                    person={person}
                    onPress={() => router.push(`/person/${person.id}`)}
                    compact
                  />
                  {index < centralTrunk.length - 1 && <View style={styles.connector} />}
                </View>
              ))}
            </View>

            <View style={styles.sectionHeaderBranches}>
              <Text style={styles.sectionTitle}>الفروع الرئيسية المعتمدة</Text>
              <Text style={styles.countText}>{branches.length}</Text>
            </View>

            {branches.map((branch) => {
              const first = branch.nodes[0];
              const expanded = expandedBranch === branch.key;
              return (
                <View key={branch.key} style={styles.branchCard}>
                  <Pressable
                    onPress={() => setExpandedBranch(expanded ? null : branch.key)}
                    style={({ pressed }) => [styles.branchHeader, pressed && styles.pressed]}
                  >
                    <View
                      style={[
                        styles.branchColor,
                        {
                          backgroundColor: first?.chart_color || colors.primarySoft,
                          borderColor: first?.chart_color === '#FFFFFF' ? colors.line : 'transparent',
                        },
                      ]}
                    />
                    <View style={styles.branchTextWrap}>
                      <Text style={styles.branchTitle}>{branchLabels[branch.key] ?? branch.key}</Text>
                      <Text style={styles.branchMeta}>{branch.nodes.length} اسم معتمد</Text>
                    </View>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.muted}
                    />
                  </Pressable>

                  {expanded && (
                    <View style={styles.branchNodes}>
                      {branch.nodes.map((person) => (
                        <View key={person.id} style={styles.branchNodeGap}>
                          <PersonCard
                            person={person}
                            onPress={() => router.push(`/person/${person.id}`)}
                            compact
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({
  mode,
  onModeChange,
  approvedCount,
  readingCount,
}: {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  approvedCount: number;
  readingCount: number;
}) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>المشجرة الرقمية</Text>
        <Text style={styles.description}>
          اعرض جميع الأسماء المقروءة من الصورة، أو انتقل إلى العلاقات التي تم اعتمادها وربطها حتى الآن.
        </Text>
      </View>

      <View style={styles.switcher}>
        <Pressable
          onPress={() => onModeChange('readings')}
          style={[styles.modeButton, mode === 'readings' && styles.modeButtonActive]}
        >
          <Text style={[styles.modeText, mode === 'readings' && styles.modeTextActive]}>
            جميع القراءات ({readingCount})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onModeChange('approved')}
          style={[styles.modeButton, mode === 'approved' && styles.modeButtonActive]}
        >
          <Text style={[styles.modeText, mode === 'approved' && styles.modeTextActive]}>
            الشجرة المعتمدة ({approvedCount})
          </Text>
        </Pressable>
      </View>
    </>
  );
}

function ReadingCard({ reading }: { reading: ChartReading }) {
  const statusInfo = reading.reading_status === 'readable'
    ? { label: 'واضحة', color: colors.success, background: '#E5F1E8', icon: 'checkmark-circle' as const }
    : reading.reading_status === 'unclear'
      ? { label: 'غير محسومة', color: colors.danger, background: '#F8E6E6', icon: 'alert-circle' as const }
      : { label: 'تحتاج مراجعة', color: '#8A661E', background: colors.goldSoft, icon: 'time' as const };

  return (
    <View style={styles.readingCard}>
      <View style={styles.readingHeader}>
        <View style={[styles.statusPill, { backgroundColor: statusInfo.background }]}>
          <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
        <Text style={styles.confidence}>{reading.confidence}%</Text>
      </View>

      <Text selectable style={styles.readingName}>{reading.provisional_name}</Text>
      <Text style={styles.branchLabel}>{branchLabels[reading.chart_branch ?? ''] ?? 'فرع غير محدد'}</Text>
      {!!reading.source_locator && <Text style={styles.locator}>{reading.source_locator}</Text>}
      {!!reading.notes && <Text style={styles.notes}>{reading.notes}</Text>}

      <View style={styles.readingFooter}>
        <Text style={styles.nodeType}>
          {reading.node_type === 'branch_label' ? 'عنوان فرع أو أسرة' : 'اسم شخص'}
        </Text>
        <View style={[styles.sourceColor, { backgroundColor: reading.chart_color || colors.primarySoft }]} />
      </View>
    </View>
  );
}

function byChartOrder(left: Person, right: Person) {
  return (left.chart_order ?? left.generation ?? 9999) - (right.chart_order ?? right.generation ?? 9999);
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 18, paddingBottom: 110 },
  header: { marginBottom: 16 },
  title: { color: colors.primary, fontSize: 28, fontWeight: '900', textAlign: 'right' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 24, marginTop: 8, textAlign: 'right' },
  switcher: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 5, marginBottom: 14, padding: 5 },
  modeButton: { alignItems: 'center', borderRadius: radius.md, flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 8 },
  modeButtonActive: { backgroundColor: colors.primary },
  modeText: { color: colors.primary, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  modeTextActive: { color: colors.white },
  searchBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 10, paddingHorizontal: 15, ...shadow },
  searchInput: { color: colors.text, flex: 1, fontSize: 15, height: 54 },
  filters: { flexDirection: 'row-reverse', gap: 8, paddingBottom: 4, paddingTop: 12 },
  filterChip: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 9 },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: colors.white },
  resultsHeader: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12, marginTop: 18 },
  resultsTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  resultsCount: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  readingCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginBottom: 10, padding: 16, ...shadow },
  readingHeader: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  statusPill: { alignItems: 'center', borderRadius: radius.pill, flexDirection: 'row-reverse', gap: 5, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 11, fontWeight: '900' },
  confidence: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  readingName: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 13, textAlign: 'right' },
  branchLabel: { color: colors.success, fontSize: 12, fontWeight: '800', marginTop: 7, textAlign: 'right' },
  locator: { color: colors.muted, fontSize: 11, lineHeight: 19, marginTop: 6, textAlign: 'right' },
  notes: { color: colors.text, fontSize: 13, lineHeight: 22, marginTop: 7, textAlign: 'right' },
  readingFooter: { alignItems: 'center', borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 12, paddingTop: 10 },
  nodeType: { color: colors.muted, fontSize: 11 },
  sourceColor: { borderColor: colors.line, borderRadius: 8, borderWidth: 1, height: 16, width: 28 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 12 },
  sectionHeaderBranches: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 12, marginTop: 24 },
  sectionTitle: { color: colors.text, flex: 1, fontSize: 19, fontWeight: '900', textAlign: 'right' },
  countText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  colorDot: { borderRadius: 8, height: 14, width: 14 },
  trunkCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, padding: 12, ...shadow },
  nodeWrap: { alignItems: 'center', width: '100%' },
  connector: { backgroundColor: colors.gold, height: 22, opacity: 0.65, width: 2 },
  branchCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  branchHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 11, minHeight: 72, padding: 14 },
  branchColor: { borderRadius: 16, borderWidth: 1, height: 42, width: 42 },
  branchTextWrap: { flex: 1 },
  branchTitle: { color: colors.text, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  branchMeta: { color: colors.muted, fontSize: 12, marginTop: 3, textAlign: 'right' },
  branchNodes: { backgroundColor: colors.background, borderTopColor: colors.line, borderTopWidth: 1, padding: 10 },
  branchNodeGap: { marginBottom: 8 },
  pressed: { opacity: 0.72 },
  empty: { color: colors.muted, padding: 30, textAlign: 'center' },
});
