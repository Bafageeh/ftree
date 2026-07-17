import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildDisconnectedLineages, DisconnectedLineageCard } from '../src/components/DisconnectedLineageReview';
import { getChartEdges, getChartReadings, getPeople } from '../src/lib/api';
import { colors, radius } from '../src/theme';
import type { ChartEdge, ChartReading, Person } from '../src/types';

export default function LineageGapsScreen() {
  const [people, setPeople] = useState<Person[]>([]);
  const [edges, setEdges] = useState<ChartEdge[]>([]);
  const [readings, setReadings] = useState<ChartReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [nextPeople, nextEdges, nextReadings] = await Promise.all([
        getPeople(), getChartEdges(), getChartReadings(),
      ]);
      setPeople(nextPeople);
      setEdges(nextEdges);
      setReadings(nextReadings);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const gaps = useMemo(
    () => buildDisconnectedLineages(people, edges, readings),
    [edges, people, readings],
  );

  if (loading && !people.length) {
    return <SafeAreaView style={styles.safe}><View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.loadingText}>جاري تحليل مواضع انقطاع النسب...</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={gaps}
        keyExtractor={(item) => `gap-${item.id}`}
        renderItem={({ item }) => <DisconnectedLineageCard item={item} />}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <View style={styles.topBar}>
              <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-forward" size={24} color={colors.primary} /></Pressable>
              <Text style={styles.pageTitle}>منقطعة النسب</Text>
              <View style={styles.back} />
            </View>
            <View style={styles.notice}>
              <Ionicons name="warning" size={28} color="#A56A18" />
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>{gaps.length} موضع انقطاع</Text>
                <Text style={styles.noticeText}>كل بطاقة تمثل اسمًا لم يُحدد أبوه بعد. تُعرض السلسلة المعروفة تحته، والأب المقترح من الأسهم المقروءة إن وُجد.</Text>
              </View>
            </View>
            <View style={styles.rule}>
              <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
              <Text style={styles.ruleText}>لا يمكن اعتماد أي اسم في هذه القائمة قبل اعتماد علاقة الأب والابن، باستثناء أصل الشجرة CORE-001.</Text>
            </View>
          </>
        }
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="checkmark-circle" size={42} color={colors.success} /><Text style={styles.emptyTitle}>الشجرة متصلة بالكامل</Text><Text style={styles.emptyText}>لا توجد أسماء منقطعة عن أصل الشجرة.</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 18, paddingBottom: 90 },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  loadingText: { color: colors.muted, fontSize: 13, marginTop: 12 },
  topBar: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 15 },
  back: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  pageTitle: { color: colors.primary, fontSize: 26, fontWeight: '900' },
  notice: { alignItems: 'flex-start', backgroundColor: colors.goldSoft, borderRadius: radius.lg, flexDirection: 'row-reverse', gap: 12, marginBottom: 10, padding: 17 },
  noticeTitle: { color: colors.primary, fontSize: 20, fontWeight: '900', textAlign: 'right' },
  noticeText: { color: colors.text, fontSize: 12, lineHeight: 20, marginTop: 4, textAlign: 'right' },
  rule: { alignItems: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 9, marginBottom: 15, padding: 13 },
  ruleText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 20, textAlign: 'right' },
  empty: { alignItems: 'center', padding: 50 },
  emptyTitle: { color: colors.primary, fontSize: 19, fontWeight: '900', marginTop: 10 },
  emptyText: { color: colors.muted, fontSize: 12, marginTop: 5, textAlign: 'center' },
});
