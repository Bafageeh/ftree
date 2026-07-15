import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonCard } from '../../src/components/PersonCard';
import { getPeople } from '../../src/lib/api';
import { colors, radius, shadow } from '../../src/theme';
import type { Person } from '../../src/types';

const branchLabels: Record<string, string> = {
  alawi_faqih: 'بداية فرع علوي بن الفقيه المقدم',
  ali_alawi_faqih: 'آل علي بن علوي بن الفقيه المقدم',
  abdullah_alawi_faqih: 'آل عبد الله بن علوي بن الفقيه المقدم',
  ahmad_faqih: 'آل أحمد بن الفقيه المقدم',
  ali_faqih: 'آل علي بن الفقيه المقدم',
  abdulrahman_faqih: 'آل عبد الرحمن بن الفقيه المقدم',
};

export default function TreeScreen() {
  const [people, setPeople] = useState<Person[]>([]);
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

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>المشجرة الرقمية</Text>
          <Text style={styles.description}>
            الجذع الأوسط والفروع الخمسة الملوّنة كما تظهر في مشجرة أصول السادة آل باعلوي.
          </Text>
        </View>

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
              <Text style={styles.sectionTitle}>الفروع الرئيسية</Text>
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
                      <Text style={styles.branchMeta}>{branch.nodes.length} سجل مدخل</Text>
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

function byChartOrder(left: Person, right: Person) {
  return (left.chart_order ?? left.generation ?? 9999) - (right.chart_order ?? right.generation ?? 9999);
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 18, paddingBottom: 110 },
  header: { marginBottom: 22 },
  title: { color: colors.primary, fontSize: 28, fontWeight: '900', textAlign: 'right' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 24, marginTop: 8, textAlign: 'right' },
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
});
