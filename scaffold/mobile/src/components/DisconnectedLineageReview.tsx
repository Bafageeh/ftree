import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow } from '../theme';
import type { ChartEdge, ChartReading, Person } from '../types';

export type DisconnectedLineageItem = {
  id: number;
  person: Person;
  paths: Person[][];
  candidates: Array<{
    sourceKey: string;
    name: string;
    confidence: number;
    sourceLocator?: string | null;
    status: string;
  }>;
};

export function buildDisconnectedLineages(
  people: Person[],
  edges: ChartEdge[],
  readings: ChartReading[],
): DisconnectedLineageItem[] {
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const names = new Map<string, string>();
  people.forEach((person) => person.source_code && names.set(person.source_code, person.full_name));
  readings.forEach((reading) => names.set(reading.source_key, reading.provisional_name));
  const readingBySource = new Map(readings.map((reading) => [reading.source_key, reading]));
  const childrenByParentId = new Map<number, Person[]>();

  people.forEach((person) => {
    if (!person.lineage_parent_id || person.approval_status === 'rejected') return;
    const list = childrenByParentId.get(person.lineage_parent_id) ?? [];
    list.push(person);
    childrenByParentId.set(person.lineage_parent_id, list);
  });

  return people
    .filter((person) => {
      if (person.approval_status === 'rejected' || person.source_code === 'CORE-001') return false;
      if (!person.lineage_parent_id) return true;
      const parent = peopleById.get(person.lineage_parent_id);
      return !parent || parent.approval_status === 'rejected';
    })
    .map((person) => {
      const candidates = new Map<string, DisconnectedLineageItem['candidates'][number]>();
      if (person.source_code) {
        edges
          .filter((edge) => edge.to_source_key === person.source_code && edge.approval_status !== 'rejected')
          .forEach((edge) => candidates.set(edge.from_source_key, {
            sourceKey: edge.from_source_key,
            name: names.get(edge.from_source_key) ?? edge.from_source_key,
            confidence: edge.confidence,
            sourceLocator: edge.source_locator,
            status: edge.approval_status === 'supervisor_confirmed' ? 'معتمد' : 'مقترح من السهم',
          }));

        const reading = readingBySource.get(person.source_code);
        if (reading?.parent_source_key && !candidates.has(reading.parent_source_key)) {
          candidates.set(reading.parent_source_key, {
            sourceKey: reading.parent_source_key,
            name: names.get(reading.parent_source_key) ?? reading.parent_source_key,
            confidence: reading.confidence,
            sourceLocator: reading.source_locator,
            status: 'مقترح من موضع القراءة',
          });
        }
      }

      return {
        id: person.id,
        person,
        paths: collectPaths(person, childrenByParentId),
        candidates: [...candidates.values()].sort((a, b) => b.confidence - a.confidence),
      };
    })
    .sort((a, b) => b.candidates.length - a.candidates.length || (a.person.chart_order ?? a.id) - (b.person.chart_order ?? b.id));
}

export function DisconnectedLineageCard({ item }: { item: DisconnectedLineageItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}><Text style={styles.badgeText}>النسب منقطع هنا</Text></View>
        <Text style={styles.code}>{item.person.source_code ?? `#${item.person.id}`}</Text>
      </View>
      <Text style={styles.name}>{item.person.full_name}</Text>
      <Text style={styles.branch}>{branchLabel(item.person.chart_branch)}</Text>

      <View style={styles.breakBox}>
        <Text style={styles.missing}>الأب غير محدد</Text>
        <Ionicons name="arrow-down" size={22} color={colors.danger} />
        <Text style={styles.person}>{item.person.full_name}</Text>
      </View>

      <Text style={styles.subTitle}>السلسلة المعروفة بعد موضع الانقطاع</Text>
      {item.paths.map((path, index) => (
        <Text key={`${item.id}-path-${index}`} style={styles.path}>
          {path.map((person) => `${person.full_name} [${person.source_code ?? `#${person.id}`}]`).join('  ←  ')}
        </Text>
      ))}

      <Text style={styles.subTitle}>اقتراح الأب</Text>
      {item.candidates.length ? item.candidates.map((candidate) => (
        <View key={`${item.id}-${candidate.sourceKey}`} style={styles.candidate}>
          <Ionicons name="document-text" size={21} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.candidateName}>{candidate.name}</Text>
            <Text style={styles.candidateCode}>{candidate.sourceKey}</Text>
            <Text style={styles.candidateStatus}>{candidate.status} · الثقة {candidate.confidence}%</Text>
            {!!candidate.sourceLocator && <Text style={styles.locator}>{candidate.sourceLocator}</Text>}
          </View>
        </View>
      )) : (
        <View style={styles.pdfBox}>
          <Ionicons name="document-attach" size={22} color="#8A661E" />
          <Text style={styles.pdfText}>لا يوجد سهم مقروء يحدد الأب. يحتاج هذا الاسم إلى مراجعة ملف PDF الأصلي أو صورة مكبرة من موضعه.</Text>
        </View>
      )}

      {!!item.person.source_locator && <Text style={styles.locator}>الموضع: {item.person.source_locator}</Text>}
      <Pressable onPress={() => router.push(`/person/${item.person.id}`)} style={styles.openButton}>
        <Ionicons name="git-network" size={19} color={colors.white} />
        <Text style={styles.openText}>فتح الاسم ومراجعة موضعه</Text>
      </Pressable>
    </View>
  );
}

function collectPaths(root: Person, childrenByParentId: Map<number, Person[]>): Person[][] {
  const paths: Person[][] = [];
  const walk = (person: Person, path: Person[], visited: Set<number>) => {
    if (paths.length >= 5 || visited.has(person.id)) return;
    const children = childrenByParentId.get(person.id) ?? [];
    if (!children.length) {
      paths.push(path);
      return;
    }
    const nextVisited = new Set(visited).add(person.id);
    children.forEach((child) => walk(child, [...path, child], nextVisited));
  };
  walk(root, [root], new Set());
  return paths.length ? paths : [[root]];
}

function branchLabel(branch?: string | null) {
  const labels: Record<string, string> = {
    central_trunk: 'الجذع الأوسط',
    alawi_faqih: 'فرع علوي بن الفقيه المقدم',
    ali_alawi_faqih: 'فرع علي بن علوي بن الفقيه المقدم',
    abdullah_alawi_faqih: 'فرع عبد الله بن علوي بن الفقيه المقدم',
    ahmad_faqih: 'فرع أحمد بن الفقيه المقدم',
    ali_faqih: 'فرع علي بن الفقيه المقدم',
    abdulrahman_faqih: 'فرع عبد الرحمن بن الفقيه المقدم',
  };
  return branch ? labels[branch] ?? `الفرع: ${branch}` : 'الفرع غير محدد';
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.danger, borderRadius: radius.lg, borderWidth: 1.2, marginBottom: 13, padding: 17, ...shadow },
  header: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  badge: { backgroundColor: '#F8E6E6', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { color: colors.danger, fontSize: 11, fontWeight: '900' },
  code: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  name: { color: colors.primary, fontSize: 22, fontWeight: '900', marginTop: 12, textAlign: 'right' },
  branch: { color: '#8A661E', fontSize: 12, fontWeight: '800', marginTop: 5, textAlign: 'right' },
  breakBox: { alignItems: 'center', backgroundColor: '#FFF7F7', borderRadius: radius.md, gap: 5, marginTop: 13, padding: 12 },
  missing: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  person: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  subTitle: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 13, textAlign: 'right' },
  path: { backgroundColor: '#FAF7EF', borderRadius: radius.md, color: colors.text, fontSize: 12, lineHeight: 21, marginTop: 6, padding: 10, textAlign: 'right' },
  candidate: { alignItems: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 9, marginTop: 7, padding: 11 },
  candidateName: { color: colors.primary, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  candidateCode: { color: '#8A661E', fontSize: 10, fontWeight: '800', marginTop: 2, textAlign: 'right' },
  candidateStatus: { color: colors.text, fontSize: 11, marginTop: 4, textAlign: 'right' },
  locator: { color: colors.muted, fontSize: 10, lineHeight: 17, marginTop: 4, textAlign: 'right' },
  pdfBox: { alignItems: 'flex-start', backgroundColor: colors.goldSoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, marginTop: 7, padding: 11 },
  pdfText: { color: colors.text, flex: 1, fontSize: 11, lineHeight: 19, textAlign: 'right' },
  openButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 7, justifyContent: 'center', marginTop: 13, minHeight: 48 },
  openText: { color: colors.white, fontSize: 13, fontWeight: '900' },
});
