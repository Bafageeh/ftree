import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonCard } from '../../src/components/PersonCard';
import { getChartReadings, getPeople } from '../../src/lib/api';
import { colors, radius, shadow } from '../../src/theme';
import type { ChartReading, Person } from '../../src/types';

type Mode = 'readings' | 'people';
type ReviewItem = ChartReading | Person;

export default function ReviewScreen() {
  const [mode, setMode] = useState<Mode>('readings');
  const [people, setPeople] = useState<Person[]>([]);
  const [readings, setReadings] = useState<ChartReading[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    setRefreshing(refresh);
    const [peopleResult, readingResult] = await Promise.all([
      getPeople('', 'review'),
      getChartReadings().catch(() => []),
    ]);
    setPeople(peopleResult);
    setReadings(readingResult);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const data: ReviewItem[] = mode === 'readings' ? readings : people;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList<ReviewItem>
        data={data}
        keyExtractor={(item) => `${mode}-${item.id}`}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <View style={styles.notice}>
              <Ionicons name="shield-checkmark" size={28} color={colors.gold} />
              <View style={styles.noticeText}>
                <Text style={styles.title}>مجلس مراجعة النسب</Text>
                <Text style={styles.description}>كل قراءة من الصورة تحفظ مع درجة الثقة وموضعها قبل اعتمادها ضمن شجرة النسب.</Text>
              </View>
            </View>

            <View style={styles.switcher}>
              <ModeButton
                active={mode === 'readings'}
                label={`قراءات الصورة (${readings.length})`}
                onPress={() => setMode('readings')}
              />
              <ModeButton
                active={mode === 'people'}
                label={`أسماء معتمدة للمراجعة (${people.length})`}
                onPress={() => setMode('people')}
              />
            </View>
          </>
        }
        renderItem={({ item }) => {
          if (mode === 'people') {
            const person = item as Person;
            return (
              <View style={styles.cardGap}>
                <PersonCard person={person} onPress={() => router.push(`/person/${person.id}`)} />
              </View>
            );
          }

          return <ReadingCard reading={item as ChartReading} />;
        }}
        ListEmptyComponent={<Text style={styles.empty}>لا توجد عناصر في هذا القسم.</Text>}
      />
    </SafeAreaView>
  );
}

function ModeButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.modeButton, active && styles.modeButtonActive]}>
      <Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ReadingCard({ reading }: { reading: ChartReading }) {
  const status = reading.reading_status === 'readable'
    ? { label: 'مقروء بوضوح', color: colors.success, background: '#E5F1E8' }
    : reading.reading_status === 'unclear'
      ? { label: 'غير مقروء', color: colors.danger, background: '#F8E6E6' }
      : { label: 'يحتاج مراجعة', color: '#8A661E', background: colors.goldSoft };

  return (
    <View style={styles.readingCard}>
      <View style={styles.readingHeader}>
        <View style={[styles.statusPill, { backgroundColor: status.background }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <View style={styles.confidencePill}>
          <Ionicons name="scan" size={14} color={colors.primary} />
          <Text style={styles.confidenceText}>{reading.confidence}%</Text>
        </View>
      </View>

      <Text style={styles.readingName}>{reading.provisional_name}</Text>
      {!!reading.source_locator && <Text style={styles.locator}>{reading.source_locator}</Text>}
      {!!reading.notes && <Text style={styles.notes}>{reading.notes}</Text>}

      <View style={styles.readingFooter}>
        <Text style={styles.nodeType}>{reading.node_type === 'branch_label' ? 'عنوان فرع' : 'اسم شخص'}</Text>
        <Text style={styles.branchName}>الفرع الأخضر</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 18, paddingBottom: 100 },
  notice: { alignItems: 'flex-start', backgroundColor: colors.goldSoft, borderRadius: radius.lg, flexDirection: 'row-reverse', gap: 14, marginBottom: 14, padding: 20 },
  noticeText: { flex: 1 },
  title: { color: colors.primary, fontSize: 22, fontWeight: '900', textAlign: 'right' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 24, marginTop: 6, textAlign: 'right' },
  switcher: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 6, marginBottom: 14, padding: 5 },
  modeButton: { alignItems: 'center', borderRadius: radius.md, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  modeButtonActive: { backgroundColor: colors.primary },
  modeText: { color: colors.primary, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  modeTextActive: { color: colors.white },
  cardGap: { marginBottom: 10 },
  readingCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginBottom: 10, padding: 16, ...shadow },
  readingHeader: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  statusPill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 11, fontWeight: '900' },
  confidencePill: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, flexDirection: 'row-reverse', gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  confidenceText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  readingName: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 13, textAlign: 'right' },
  locator: { color: colors.muted, fontSize: 12, lineHeight: 20, marginTop: 7, textAlign: 'right' },
  notes: { color: colors.text, fontSize: 13, lineHeight: 22, marginTop: 7, textAlign: 'right' },
  readingFooter: { borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 12, paddingTop: 10 },
  nodeType: { color: colors.muted, fontSize: 11 },
  branchName: { color: colors.success, fontSize: 11, fontWeight: '800' },
  empty: { color: colors.muted, padding: 30, textAlign: 'center' },
});
