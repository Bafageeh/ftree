import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { getChartReadingStats, getPeople, getStats } from '../../src/lib/api';
import { colors, radius, shadow } from '../../src/theme';
import type { ChartReadingStats, Person, ReadingStatus, Stats } from '../../src/types';

const emptyStats: Stats = { total: 0, readable: 0, review: 0, unclear: 0, generations: 0 };
const emptyReadingStats: ChartReadingStats = { total: 0, readable: 0, review: 0, unclear: 0, promoted: 0 };

const filters: Array<{ value: ReadingStatus | ''; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: '', label: 'الكل', icon: 'apps' },
  { value: 'readable', label: 'واضحة', icon: 'checkmark-circle' },
  { value: 'review', label: 'للمراجعة', icon: 'time' },
  { value: 'unclear', label: 'غير مقروءة', icon: 'alert-circle' },
];

export default function HomeScreen() {
  const [people, setPeople] = useState<Person[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [readingStats, setReadingStats] = useState<ChartReadingStats>(emptyReadingStats);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReadingStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);

    const [peopleResult, statsResult, readingStatsResult] = await Promise.all([
      getPeople(search, status),
      getStats(),
      getChartReadingStats().catch(() => emptyReadingStats),
    ]);

    setPeople(peopleResult);
    setStats(statsResult);
    setReadingStats(readingStatsResult);
    setLoading(false);
    setRefreshing(false);
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  const visiblePeople = search || status ? people : people.slice(0, 10);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={visiblePeople}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <View style={styles.logo}>
                <Ionicons name="leaf" size={30} color={colors.white} />
              </View>
              <Text style={styles.kicker}>نحفظ النسب ونوثّق التاريخ</Text>
              <Text style={styles.title}>شجرة النسب الشريف</Text>
              <Text style={styles.subtitle}>ابحث في الأسماء، تتبع مسار النسب، وشارك في مراجعة المعلومات والمصادر.</Text>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={21} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="ابحث بالاسم أو اللقب"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                textAlign="right"
                returnKeyType="search"
              />
              {!!search && (
                <Pressable onPress={() => setSearch('')} hitSlop={12}>
                  <Ionicons name="close-circle" size={20} color={colors.muted} />
                </Pressable>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {filters.map((filter) => {
                const selected = status === filter.value;
                return (
                  <Pressable
                    key={filter.label}
                    onPress={() => setStatus(filter.value)}
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                  >
                    <Ionicons
                      name={filter.icon}
                      size={16}
                      color={selected ? colors.white : colors.primary}
                    />
                    <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.statsSectionHeader}>
              <Text style={styles.statsSectionTitle}>الشجرة المعتمدة</Text>
              <Text style={styles.statsSectionHint}>علاقات نسب مرتبطة ومراجعة مبدئيًا</Text>
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="الأسماء المعتمدة" value={stats.total} icon="people" />
              <StatCard label="الأجيال" value={stats.generations} icon="git-branch" />
            </View>

            <Pressable
              onPress={() => router.push('/(tabs)/review')}
              style={({ pressed }) => [styles.readingPanel, pressed && styles.pressed]}
            >
              <View style={styles.readingPanelHeader}>
                <View style={styles.readingPanelIcon}>
                  <Ionicons name="scan" size={25} color={colors.gold} />
                </View>
                <View style={styles.readingPanelTitleWrap}>
                  <Text style={styles.readingPanelTitle}>تقدم قراءة المشجرة</Text>
                  <Text style={styles.readingPanelSubtitle}>القراءات الجديدة محفوظة للمراجعة قبل ربطها بالنسب</Text>
                </View>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </View>

              <View style={styles.readingStatsRow}>
                <MiniStat label="إجمالي القراءات" value={readingStats.total} />
                <MiniStat label="واضحة" value={readingStats.readable} />
                <MiniStat label="تحتاج مراجعة" value={readingStats.review} />
                <MiniStat label="غير محسومة" value={readingStats.unclear} />
              </View>
            </Pressable>

            <View style={styles.contributionBanner}>
              <View style={styles.contributionIcon}>
                <Ionicons name="people-circle" size={27} color={colors.gold} />
              </View>
              <View style={styles.contributionTextWrap}>
                <Text style={styles.contributionTitle}>هل لديك تصحيح أو وثيقة؟</Text>
                <Text style={styles.contributionText}>أرسلها من تبويب مساهمة مع رقم متابعة خاص بطلبك.</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/contribute')} style={styles.contributionButton}>
                <Ionicons name="arrow-back" size={18} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{search || status ? 'النتائج' : 'أبرز الأسماء المعتمدة'}</Text>
              <Text style={styles.sectionMeta}>{people.length} اسم</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.cardGap}>
            <PersonCard person={item} onPress={() => router.push(`/person/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} size="large" /> : <Text style={styles.empty}>لا توجد نتائج مطابقة.</Text>}
      />
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={colors.gold} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 110 },
  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 24, ...shadow },
  logo: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,.13)', borderRadius: 20, height: 58, justifyContent: 'center', marginBottom: 18, width: 58 },
  kicker: { color: '#E9C87E', fontSize: 13, fontWeight: '800', textAlign: 'right' },
  title: { color: colors.white, fontSize: 32, fontWeight: '900', marginTop: 6, textAlign: 'right' },
  subtitle: { color: '#D8E4DC', fontSize: 14, lineHeight: 24, marginTop: 10, textAlign: 'right' },
  searchBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 10, marginTop: 16, paddingHorizontal: 16, ...shadow },
  searchInput: { color: colors.text, flex: 1, fontSize: 16, height: 56 },
  filters: { flexDirection: 'row-reverse', gap: 8, paddingTop: 12 },
  filterChip: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row-reverse', gap: 6, paddingHorizontal: 13, paddingVertical: 9 },
  filterChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  filterTextSelected: { color: colors.white },
  statsSectionHeader: { marginTop: 18 },
  statsSectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900', textAlign: 'right' },
  statsSectionHint: { color: colors.muted, fontSize: 12, marginTop: 3, textAlign: 'right' },
  statsGrid: { flexDirection: 'row-reverse', gap: 10, marginTop: 10 },
  statCard: { alignItems: 'flex-end', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flex: 1, padding: 15 },
  statValue: { color: colors.primary, fontSize: 24, fontWeight: '900', marginTop: 8 },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  readingPanel: { backgroundColor: colors.surface, borderColor: colors.goldSoft, borderRadius: radius.lg, borderWidth: 1, marginTop: 14, padding: 15, ...shadow },
  pressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
  readingPanelHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 10 },
  readingPanelIcon: { alignItems: 'center', backgroundColor: colors.goldSoft, borderRadius: 18, height: 46, justifyContent: 'center', width: 46 },
  readingPanelTitleWrap: { flex: 1 },
  readingPanelTitle: { color: colors.primary, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  readingPanelSubtitle: { color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 3, textAlign: 'right' },
  readingStatsRow: { flexDirection: 'row-reverse', gap: 6, marginTop: 14 },
  miniStat: { alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.md, flex: 1, minHeight: 72, paddingHorizontal: 4, paddingVertical: 10 },
  miniStatValue: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  miniStatLabel: { color: colors.muted, fontSize: 9, marginTop: 4, textAlign: 'center' },
  contributionBanner: { alignItems: 'center', backgroundColor: colors.goldSoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 10, marginTop: 14, padding: 14 },
  contributionIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, height: 46, justifyContent: 'center', width: 46 },
  contributionTextWrap: { flex: 1 },
  contributionTitle: { color: colors.primary, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  contributionText: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 3, textAlign: 'right' },
  contributionButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, height: 38, justifyContent: 'center', width: 38 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12, marginTop: 24 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  sectionMeta: { color: colors.muted, fontSize: 13 },
  cardGap: { marginBottom: 10 },
  empty: { color: colors.muted, padding: 30, textAlign: 'center' },
});
