import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { getChartEdges, getChartReadings, getPendingPeople, getPeople } from '../lib/api';
import { colors, radius, shadow } from '../theme';
import type { ChartEdge, ChartReading, Person } from '../types';
import { SupervisorEdgeReviewCard } from './SupervisorEdgeReviewCard';

type Mode = 'readings' | 'edges' | 'people';
type Item = ChartReading | ChartEdge | Person;

export function SupervisorReviewBoard() {
  const [mode, setMode] = useState<Mode>('readings');
  const [readings, setReadings] = useState<ChartReading[]>([]);
  const [edges, setEdges] = useState<ChartEdge[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    setRefreshing(refresh);
    const [nextReadings, nextEdges, nextPeople, nextAllPeople] = await Promise.all([
      getChartReadings(), getChartEdges(), getPendingPeople(), getPeople(),
    ]);
    setReadings(nextReadings);
    setEdges(nextEdges.filter((edge) => edge.approval_status === 'pending_supervisor'));
    setPeople(nextPeople);
    setAllPeople(nextAllPeople);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const peopleById = useMemo(
    () => new Map(allPeople.map((person) => [person.id, person])),
    [allPeople],
  );

  const peopleBySource = useMemo(() => {
    const map = new Map<string, Person>();
    allPeople.forEach((person) => {
      if (person.source_code) map.set(person.source_code, person);
    });
    readings.forEach((reading) => {
      const person = reading.person_id ? peopleById.get(reading.person_id) : undefined;
      if (person) map.set(reading.source_key, person);
    });
    return map;
  }, [allPeople, peopleById, readings]);

  const childrenByParentId = useMemo(() => {
    const map = new Map<number, Person[]>();
    allPeople.forEach((person) => {
      if (!person.lineage_parent_id) return;
      const list = map.get(person.lineage_parent_id) ?? [];
      list.push(person);
      map.set(person.lineage_parent_id, list);
    });
    return map;
  }, [allPeople]);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    readings.forEach((item) => map.set(item.source_key, item.provisional_name));
    allPeople.forEach((item) => item.source_code && map.set(item.source_code, item.full_name));
    return map;
  }, [allPeople, readings]);

  const onEdgeReviewed = useCallback((updated: ChartEdge) => {
    setEdges((current) => updated.approval_status === 'pending_supervisor'
      ? current.map((edge) => edge.id === updated.id ? updated : edge)
      : current.filter((edge) => edge.id !== updated.id));
    if (updated.approval_status === 'supervisor_confirmed') load(false);
  }, [load]);

  const data: Item[] = mode === 'readings' ? readings : mode === 'edges' ? edges : people;

  return (
    <FlatList<Item>
      data={data}
      keyExtractor={(item) => `${mode}-${item.id}`}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      ListHeaderComponent={
        <>
          <View style={styles.notice}>
            <Ionicons name="shield-checkmark" size={28} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>مجلس مراجعة النسب</Text>
              <Text style={styles.description}>كل القراءات والأسماء والأسهم المعلقة تظهر هنا، حتى عند تعذر الاتصال بالخادم.</Text>
            </View>
          </View>
          <View style={styles.counts}>
            <Count value={readings.length} label="قراءة مرمزة" />
            <Count value={edges.length} label="علاقة معلقة" />
            <Count value={people.length} label="اسم بانتظارك" />
          </View>
          <View style={styles.tabs}>
            <Tab active={mode === 'readings'} label={`القراءات ${readings.length}`} onPress={() => setMode('readings')} />
            <Tab active={mode === 'edges'} label={`العلاقات ${edges.length}`} onPress={() => setMode('edges')} />
            <Tab active={mode === 'people'} label={`الأسماء ${people.length}`} onPress={() => setMode('people')} />
          </View>
        </>
      }
      renderItem={({ item }) => mode === 'readings'
        ? <ReadingCard item={item as ChartReading} />
        : mode === 'edges'
          ? <SupervisorEdgeReviewCard
              item={item as ChartEdge}
              names={names}
              peopleById={peopleById}
              peopleBySource={peopleBySource}
              childrenByParentId={childrenByParentId}
              onReviewed={onEdgeReviewed}
            />
          : <PersonReviewCard item={item as Person} />}
      ListEmptyComponent={<Text style={styles.empty}>لا توجد عناصر في هذا القسم.</Text>}
    />
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return <View style={styles.count}><Text style={styles.countValue}>{value}</Text><Text style={styles.small}>{label}</Text></View>;
}

function Tab({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.tab, active && styles.activeTab]}><Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text></Pressable>;
}

function ReadingCard({ item }: { item: ChartReading }) {
  const open = () => item.person_id && router.push(`/person/${item.person_id}`);
  return (
    <Pressable disabled={!item.person_id} onPress={open} style={styles.card}>
      <View style={styles.row}><Badge text={statusLabel(item.reading_status)} /><Text style={styles.confidence}>{item.confidence}%</Text></View>
      <Text style={styles.name}>{item.provisional_name}</Text>
      <Text style={styles.code}>{item.source_key}</Text>
      {!!item.source_locator && <Text style={styles.meta}>{item.source_locator}</Text>}
      {!!item.notes && <Text style={styles.notes}>{item.notes}</Text>}
      {!!item.person_id && <Text style={styles.openHint}>اضغط لفتح قرار المشرف على الاسم</Text>}
    </Pressable>
  );
}

function PersonReviewCard({ item }: { item: Person }) {
  return (
    <Pressable onPress={() => router.push(`/person/${item.id}`)} style={styles.card}>
      <View style={styles.row}><Badge text="بانتظار اعتمادك" /><Ionicons name="chevron-back" size={20} color={colors.primary} /></View>
      <Text style={styles.name}>{item.full_name}</Text>
      {!!item.source_code && <Text style={styles.code}>{item.source_code}</Text>}
      {!!item.source_locator && <Text style={styles.meta}>{item.source_locator}</Text>}
      <Text style={styles.openHint}>اضغط للاعتماد أو التعديل أو الرفض</Text>
    </Pressable>
  );
}

function Badge({ text }: { text: string }) {
  return <View style={styles.badge}><Text style={styles.badgeText}>{text}</Text></View>;
}

function statusLabel(status: string) {
  if (status === 'readable') return 'مقروء بوضوح';
  if (status === 'unclear') return 'غير محسوم';
  return 'يحتاج مراجعة';
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 100 },
  notice: { alignItems: 'flex-start', backgroundColor: colors.goldSoft, borderRadius: radius.lg, flexDirection: 'row-reverse', gap: 14, marginBottom: 12, padding: 20 },
  title: { color: colors.primary, fontSize: 22, fontWeight: '900', textAlign: 'right' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 22, marginTop: 5, textAlign: 'right' },
  counts: { flexDirection: 'row-reverse', gap: 8, marginBottom: 10 },
  count: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flex: 1, padding: 10 },
  countValue: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  small: { color: colors.muted, fontSize: 10, textAlign: 'center' },
  tabs: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 4, marginBottom: 14, padding: 4 },
  tab: { alignItems: 'center', borderRadius: radius.md, flex: 1, minHeight: 42, justifyContent: 'center' },
  activeTab: { backgroundColor: colors.primary },
  tabText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  activeTabText: { color: colors.white },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginBottom: 10, padding: 16, ...shadow },
  row: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  badge: { backgroundColor: colors.goldSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { color: '#8A661E', fontSize: 11, fontWeight: '900' },
  confidence: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  name: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 12, textAlign: 'right' },
  code: { color: colors.primary, fontSize: 10, fontWeight: '800', marginTop: 4, textAlign: 'right' },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 20, marginTop: 7, textAlign: 'right' },
  notes: { color: colors.text, fontSize: 12, lineHeight: 21, marginTop: 6, textAlign: 'right' },
  openHint: { color: colors.gold, fontSize: 11, fontWeight: '800', marginTop: 10, textAlign: 'right' },
  empty: { color: colors.muted, padding: 30, textAlign: 'center' },
});
