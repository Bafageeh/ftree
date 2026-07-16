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
import { getPeople } from '../../src/lib/api';
import { colors, radius, shadow } from '../../src/theme';
import type { ApprovalStatus, Person, ReadingStatus } from '../../src/types';

type ViewMode = 'all' | 'confirmed';
type ApprovalFilter = '' | ApprovalStatus;

const branchLabels: Record<string, string> = {
  central_trunk: 'الجذع الأوسط',
  alawi_faqih: 'بداية فرع علوي بن الفقيه المقدم',
  ali_alawi_faqih: 'فرع علي بن علوي بن الفقيه المقدم',
  abdullah_alawi_faqih: 'فرع عبد الله بن علوي بن الفقيه المقدم',
  ahmad_faqih: 'فرع أحمد بن الفقيه المقدم',
  ali_faqih: 'فرع علي بن الفقيه المقدم',
  abdulrahman_faqih: 'فرع عبد الرحمن بن الفقيه المقدم',
};

const readingFilters: Array<{ value: ReadingStatus | ''; label: string }> = [
  { value: '', label: 'كل القراءات' },
  { value: 'readable', label: 'واضحة' },
  { value: 'review', label: 'للمراجعة' },
  { value: 'unclear', label: 'غير محسومة' },
];

const approvalFilters: Array<{ value: ApprovalFilter; label: string }> = [
  { value: '', label: 'الكل' },
  { value: 'pending_supervisor', label: 'بانتظار المشرف' },
  { value: 'supervisor_confirmed', label: 'معتمدة' },
];

export default function TreeScreen() {
  const [mode, setMode] = useState<ViewMode>('all');
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [readingStatus, setReadingStatus] = useState<ReadingStatus | ''>('');
  const [approvalStatus, setApprovalStatus] = useState<ApprovalFilter>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setPeople(await getPeople());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmedPeople = useMemo(
    () => people.filter((person) => person.approval_status === 'supervisor_confirmed' && !person.is_provisional),
    [people],
  );

  const filteredPeople = useMemo(() => {
    const query = search.trim();
    return people.filter((person) => {
      const matchesReading = !readingStatus || person.status === readingStatus;
      const matchesApproval = !approvalStatus || person.approval_status === approvalStatus;
      const haystack = `${person.full_name} ${person.source_code ?? ''} ${person.honorific ?? ''} ${person.source_locator ?? ''}`;
      const matchesSearch = !query || haystack.includes(query);
      return matchesReading && matchesApproval && matchesSearch;
    });
  }, [approvalStatus, people, readingStatus, search]);

  const centralTrunk = useMemo(
    () => confirmedPeople
      .filter((person) => person.chart_branch === 'central_trunk' || !person.chart_branch)
      .sort(byChartOrder),
    [confirmedPeople],
  );

  const branches = useMemo(() => {
    const grouped = new Map<string, Person[]>();
    confirmedPeople.forEach((person) => {
      if (!person.chart_branch || person.chart_branch === 'central_trunk') return;
      grouped.set(person.chart_branch, [...(grouped.get(person.chart_branch) ?? []), person]);
    });

    return [...grouped.entries()]
      .map(([key, nodes]) => ({ key, nodes: nodes.sort(byChartOrder) }))
      .sort((a, b) => (a.nodes[0]?.chart_order ?? 9999) - (b.nodes[0]?.chart_order ?? 9999));
  }, [confirmedPeople]);

  if (mode === 'all') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <FlatList
          data={filteredPeople}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
          ListHeaderComponent={
            <>
              <Header
                mode={mode}
                onModeChange={setMode}
                allCount={people.length}
                confirmedCount={confirmedPeople.length}
              />

              <View style={styles.notice}>
                <Ionicons name="information-circle" size={22} color="#8A661E" />
                <Text style={styles.noticeText}>
                  كل قراءة ظاهرة برمزها كما هي. غير المعتمد منها يحمل شارة «بانتظار اعتماد المشرف» ولا يُعد نسبًا نهائيًا.
                </Text>
              </View>

              <View style={styles.searchBox}>
                <Ionicons name="search" size={21} color={colors.muted} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="ابحث بالاسم أو رمز القراءة"
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

              <FilterRow
                items={approvalFilters}
                selected={approvalStatus}
                onSelect={(value) => setApprovalStatus(value as ApprovalFilter)}
              />
              <FilterRow
                items={readingFilters}
                selected={readingStatus}
                onSelect={(value) => setReadingStatus(value as ReadingStatus | '')}
              />

              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>جميع الأسماء المرمزة</Text>
                <Text style={styles.resultsCount}>{filteredPeople.length} من {people.length}</Text>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.cardGap}>
              <PersonCard person={item} onPress={() => router.push(`/person/${item.id}`)} />
            </View>
          )}
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
        <Header
          mode={mode}
          onModeChange={setMode}
          allCount={people.length}
          confirmedCount={confirmedPeople.length}
        />

        {loading ? <ActivityIndicator color={colors.primary} size="large" /> : (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.colorDot, { backgroundColor: '#B98249' }]} />
              <Text style={styles.sectionTitle}>الجذع الأوسط المعتمد</Text>
              <Text style={styles.resultsCount}>{centralTrunk.length}</Text>
            </View>

            <View style={styles.trunkCard}>
              {centralTrunk.map((person, index) => (
                <View key={person.id} style={styles.nodeWrap}>
                  <PersonCard person={person} onPress={() => router.push(`/person/${person.id}`)} compact />
                  {index < centralTrunk.length - 1 && <View style={styles.connector} />}
                </View>
              ))}
            </View>

            <View style={styles.sectionHeaderBranches}>
              <Text style={styles.sectionTitle}>الفروع المعتمدة</Text>
              <Text style={styles.resultsCount}>{branches.length}</Text>
            </View>

            {branches.map((branch) => {
              const expanded = expandedBranch === branch.key;
              const first = branch.nodes[0];
              return (
                <View key={branch.key} style={styles.branchCard}>
                  <Pressable
                    onPress={() => setExpandedBranch(expanded ? null : branch.key)}
                    style={styles.branchHeader}
                  >
                    <View style={[styles.branchColor, { backgroundColor: first?.chart_color || colors.primarySoft }]} />
                    <View style={styles.branchTextWrap}>
                      <Text style={styles.branchTitle}>{branchLabels[branch.key] ?? branch.key}</Text>
                      <Text style={styles.branchMeta}>{branch.nodes.length} عقدة معتمدة</Text>
                    </View>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
                  </Pressable>

                  {expanded && (
                    <View style={styles.branchNodes}>
                      {branch.nodes.map((person) => (
                        <View key={person.id} style={styles.cardGap}>
                          <PersonCard person={person} onPress={() => router.push(`/person/${person.id}`)} compact />
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
  allCount,
  confirmedCount,
}: {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  allCount: number;
  confirmedCount: number;
}) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>المشجرة الرقمية</Text>
        <Text style={styles.description}>الأسماء المقروءة مرمزة كما ظهرت، وتبقى معلّقة حتى اعتماد المشرف.</Text>
      </View>
      <View style={styles.switcher}>
        <Pressable onPress={() => onModeChange('all')} style={[styles.modeButton, mode === 'all' && styles.modeButtonActive]}>
          <Text style={[styles.modeText, mode === 'all' && styles.modeTextActive]}>جميع الأسماء ({allCount})</Text>
        </Pressable>
        <Pressable onPress={() => onModeChange('confirmed')} style={[styles.modeButton, mode === 'confirmed' && styles.modeButtonActive]}>
          <Text style={[styles.modeText, mode === 'confirmed' && styles.modeTextActive]}>المعتمدة ({confirmedCount})</Text>
        </Pressable>
      </View>
    </>
  );
}

function FilterRow({
  items,
  selected,
  onSelect,
}: {
  items: Array<{ value: string; label: string }>;
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      {items.map((item) => {
        const active = selected === item.value;
        return (
          <Pressable key={`${item.value}-${item.label}`} onPress={() => onSelect(item.value)} style={[styles.filterChip, active && styles.filterChipActive]}>
            <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function byChartOrder(a: Person, b: Person) {
  return (a.chart_order ?? a.generation ?? 9999) - (b.chart_order ?? b.generation ?? 9999);
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
  notice: { alignItems: 'flex-start', backgroundColor: colors.goldSoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, marginBottom: 12, padding: 13 },
  noticeText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 20, textAlign: 'right' },
  searchBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 10, paddingHorizontal: 15, ...shadow },
  searchInput: { color: colors.text, flex: 1, fontSize: 15, height: 54 },
  filters: { flexDirection: 'row-reverse', gap: 8, paddingTop: 10 },
  filterChip: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: colors.white },
  resultsHeader: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12, marginTop: 20 },
  resultsTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  resultsCount: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  cardGap: { marginBottom: 10 },
  empty: { color: colors.muted, padding: 30, textAlign: 'center' },
  sectionHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 12 },
  sectionHeaderBranches: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 12, marginTop: 24 },
  sectionTitle: { color: colors.text, flex: 1, fontSize: 19, fontWeight: '900', textAlign: 'right' },
  colorDot: { borderRadius: 8, height: 14, width: 14 },
  trunkCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, padding: 12, ...shadow },
  nodeWrap: { alignItems: 'center', width: '100%' },
  connector: { backgroundColor: colors.gold, height: 22, opacity: 0.65, width: 2 },
  branchCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  branchHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 11, minHeight: 72, padding: 14 },
  branchColor: { borderColor: colors.line, borderRadius: 16, borderWidth: 1, height: 42, width: 42 },
  branchTextWrap: { flex: 1 },
  branchTitle: { color: colors.text, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  branchMeta: { color: colors.muted, fontSize: 12, marginTop: 3, textAlign: 'right' },
  branchNodes: { backgroundColor: colors.background, borderTopColor: colors.line, borderTopWidth: 1, padding: 10 },
});
