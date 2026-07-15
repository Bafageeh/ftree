import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonCard } from '../../src/components/PersonCard';
import { getPeople, getStats } from '../../src/lib/api';
import { colors, radius, shadow } from '../../src/theme';
import type { Person, Stats } from '../../src/types';

const emptyStats: Stats = { total: 0, readable: 0, review: 0, unclear: 0, generations: 0 };

export default function HomeScreen() {
  const [people, setPeople] = useState<Person[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const [peopleResult, statsResult] = await Promise.all([getPeople(search), getStats()]);
    setPeople(peopleResult);
    setStats(statsResult);
    setLoading(false);
    setRefreshing(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={people.slice(0, 8)}
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
              <Text style={styles.subtitle}>ابحث في الأسماء، تتبع مسار النسب، وراجع البيانات التي تحتاج إلى توثيق.</Text>
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
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="الأسماء" value={stats.total} icon="people" />
              <StatCard label="الأجيال" value={stats.generations} icon="git-branch" />
              <StatCard label="واضحة" value={stats.readable} icon="checkmark-circle" />
              <StatCard label="للمراجعة" value={stats.review} icon="time" />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{search ? 'نتائج البحث' : 'أبرز الأسماء'}</Text>
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
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  statCard: { alignItems: 'flex-end', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexBasis: '47%', flexGrow: 1, padding: 15 },
  statValue: { color: colors.primary, fontSize: 24, fontWeight: '900', marginTop: 8 },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12, marginTop: 24 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  sectionMeta: { color: colors.muted, fontSize: 13 },
  cardGap: { marginBottom: 10 },
  empty: { color: colors.muted, padding: 30, textAlign: 'center' },
});
