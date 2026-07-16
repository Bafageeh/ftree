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

import { GenealogyTree } from '../../src/components/GenealogyTree';
import { PersonCard } from '../../src/components/PersonCard';
import { getPeople } from '../../src/lib/api';
import { colors, radius, shadow } from '../../src/theme';
import type { ApprovalStatus, Person, ReadingStatus } from '../../src/types';

type ViewMode = 'tree' | 'index' | 'confirmed';
type ApprovalFilter = '' | ApprovalStatus;

const branchLabels: Record<string, string> = {
  central_trunk: 'الجذع الأوسط',
  alawi_faqih: 'فرع علوي بن الفقيه المقدم',
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
  const [mode, setMode] = useState<ViewMode>('tree');
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [readingStatus, setReadingStatus] = useState<ReadingStatus | ''>('');
  const [approvalStatus, setApprovalStatus] = useState<ApprovalFilter>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      setPeople(await getPeople());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmedPeople = useMemo(
    () => people.filter((person) => person.approval_status === 'supervisor_confirmed' && !person.is_provisional),
    [people],
  );

  const linkedCount = useMemo(() => {
    const ids = new Set(people.map((person) => person.id));
    return people.filter((person) => person.lineage_parent_id && ids.has(person.lineage_parent_id)).length;
  }, [people]);

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

  if (loading && people.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (mode === 'index') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <FlatList
          data={filteredPeople}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
          ListHeaderComponent={
            <>
              <Header mode={mode} onModeChange={setMode} allCount={people.length} confirmedCount={confirmedPeople.length} />
              <View style={styles.notice}>
                <Ionicons name="list" size={22} color="#8A661E" />
                <Text style={styles.noticeText}>هذا فهرس للبحث والمراجعة فقط. للعرض الترابطي انتقل إلى «الشجرة».</Text>
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
              <FilterRow items={approvalFilters} selected={approvalStatus} onSelect={(value) => setApprovalStatus(value as ApprovalFilter)} />
              <FilterRow items={readingFilters} selected={readingStatus} onSelect={(value) => setReadingStatus(value as ReadingStatus | '')} />
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>فهرس الأسماء المرمزة</Text>
                <Text style={styles.resultsCount}>{filteredPeople.length} من {people.length}</Text>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.cardGap}>
              <PersonCard person={item} onPress={() => router.push(`/person/${item.id}`)} />
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>لا توجد نتائج مطابقة.</Text>}
        />
      </SafeAreaView>
    );
  }

  const treePeople = mode === 'confirmed' ? confirmedPeople : people;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      >
        <Header mode={mode} onModeChange={setMode} allCount={people.length} confirmedCount={confirmedPeople.length} />

        {mode === 'tree' && (
          <View style={styles.notice}>
            <Ionicons name="git-network" size={22} color="#8A661E" />
            <Text style={styles.noticeText}>
              هذه هي الشجرة الترابطية. افتح أي فرع ثم وسّع الأبناء. العقد غير المربوطة تبقى ظاهرة للمشرف حتى يحدد أباها.
            </Text>
          </View>
        )}

        {mode === 'confirmed' && (
          <View style={styles.noticeGreen}>
            <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
            <Text style={styles.noticeGreenText}>يعرض هذا القسم العلاقات التي اعتمدها المشرف فقط.</Text>
          </View>
        )}

        <View style={styles.linkStatusCard}>
          <View style={styles.linkStatusItem}>
            <Text style={styles.linkStatusNumber}>{treePeople.length}</Text>
            <Text style={styles.linkStatusLabel}>عقد ظاهرة</Text>
          </View>
          <View style={styles.linkStatusItem}>
            <Text style={styles.linkStatusNumber}>{mode === 'confirmed' ? Math.max(0, confirmedPeople.length - 1) : linkedCount}</Text>
            <Text style={styles.linkStatusLabel}>علاقات أبوة</Text>
          </View>
          <View style={styles.linkStatusItem}>
            <Text style={styles.linkStatusNumber}>{mode === 'confirmed' ? 0 : Math.max(0, people.length - linkedCount - 1)}</Text>
            <Text style={styles.linkStatusLabel}>تحتاج ربطًا</Text>
          </View>
        </View>

        <GenealogyTree people={treePeople} branchLabels={branchLabels} />
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
        <Text style={styles.description}>انتقل بين الشجرة الترابطية، فهرس الأسماء، والعلاقات المعتمدة.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeSwitcher}>
        <ModeButton active={mode === 'tree'} label={`الشجرة (${allCount})`} icon="git-network" onPress={() => onModeChange('tree')} />
        <ModeButton active={mode === 'index'} label="فهرس الأسماء" icon="list" onPress={() => onModeChange('index')} />
        <ModeButton active={mode === 'confirmed'} label={`المعتمدة (${confirmedCount})`} icon="shield-checkmark" onPress={() => onModeChange('confirmed')} />
      </ScrollView>
    </>
  );
}

function ModeButton({ active, label, icon, onPress }: { active: boolean; label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.modeButton, active && styles.modeButtonActive]}>
      <Ionicons name={icon} size={18} color={active ? colors.white : colors.primary} />
      <Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text>
    </Pressable>
  );
}

function FilterRow({ items, selected, onSelect }: { items: Array<{ value: string; label: string }>; selected: string; onSelect: (value: string) => void }) {
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

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 110 },
  header: { marginBottom: 14 },
  title: { color: colors.primary, fontSize: 30, fontWeight: '900', textAlign: 'right' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 24, marginTop: 8, textAlign: 'right' },
  modeSwitcher: { flexDirection: 'row-reverse', gap: 8, paddingBottom: 14 },
  modeButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row-reverse', gap: 7, minHeight: 46, paddingHorizontal: 15 },
  modeButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  modeTextActive: { color: colors.white },
  notice: { alignItems: 'center', backgroundColor: colors.goldSoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 10, marginBottom: 14, padding: 14 },
  noticeText: { color: '#765714', flex: 1, fontSize: 13, lineHeight: 22, textAlign: 'right' },
  noticeGreen: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 10, marginBottom: 14, padding: 14 },
  noticeGreenText: { color: colors.primary, flex: 1, fontSize: 13, lineHeight: 22, textAlign: 'right' },
  linkStatusCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', marginBottom: 14, paddingVertical: 14, ...shadow },
  linkStatusItem: { alignItems: 'center', flex: 1 },
  linkStatusNumber: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  linkStatusLabel: { color: colors.muted, fontSize: 11, marginTop: 4 },
  searchBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 9, marginBottom: 14, minHeight: 58, paddingHorizontal: 16, ...shadow },
  searchInput: { color: colors.text, flex: 1, fontSize: 15 },
  filters: { flexDirection: 'row-reverse', gap: 8, paddingBottom: 9 },
  filterChip: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, minHeight: 42, paddingHorizontal: 14, justifyContent: 'center' },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: colors.white },
  resultsHeader: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12, marginTop: 9 },
  resultsTitle: { color: colors.primary, fontSize: 21, fontWeight: '900' },
  resultsCount: { color: colors.muted, fontSize: 12 },
  cardGap: { marginBottom: 10 },
  empty: { color: colors.muted, paddingVertical: 34, textAlign: 'center' },
});
