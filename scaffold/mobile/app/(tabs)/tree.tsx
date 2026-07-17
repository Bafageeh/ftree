import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GenealogyTree } from '../../src/components/GenealogyTree';
import { PersonCard } from '../../src/components/PersonCard';
import { getChartEdges, getPeople } from '../../src/lib/api';
import { colors, radius, shadow } from '../../src/theme';
import type { ChartEdge, Person } from '../../src/types';

type ViewMode = 'diagram' | 'list';

const branchLabels: Record<string, string> = {
  central_trunk: 'الجذع الأوسط',
  alawi_mirbat: 'فرع علوي بن محمد صاحب مرباط',
  alawi_faqih: 'فرع علوي بن الفقيه المقدم',
  ali_alawi_faqih: 'فرع علي بن علوي بن الفقيه المقدم',
  abdullah_alawi_faqih: 'فرع عبد الله بن علوي بن الفقيه المقدم',
  ahmad_faqih: 'فرع أحمد بن الفقيه المقدم',
  ali_faqih: 'فرع علي بن الفقيه المقدم',
  abdulrahman_faqih: 'فرع عبد الرحمن بن الفقيه المقدم',
};

export default function TreeScreen() {
  const [mode, setMode] = useState<ViewMode>('diagram');
  const [people, setPeople] = useState<Person[]>([]);
  const [edges, setEdges] = useState<ChartEdge[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [nextPeople, nextEdges] = await Promise.all([getPeople(), getChartEdges()]);
      setPeople(nextPeople);
      setEdges(nextEdges);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const listPeople = useMemo(() => {
    const query = search.trim();
    return people.filter((person) => {
      const text = `${person.full_name} ${person.source_code ?? ''} ${person.honorific ?? ''} ${person.source_locator ?? ''}`;
      return !query || text.includes(query);
    });
  }, [people, search]);

  if (loading && people.length === 0) {
    return <SafeAreaView style={styles.safe} edges={['bottom']}><View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View></SafeAreaView>;
  }

  if (mode === 'list') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <FlatList
          data={listPeople}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
          ListHeaderComponent={<>
            <Header mode={mode} onModeChange={setMode} />
            <View style={styles.searchBox}>
              <Ionicons name="search" size={22} color={colors.muted} />
              <TextInput value={search} onChangeText={setSearch} placeholder="ابحث بالاسم أو رمز القراءة" placeholderTextColor={colors.muted} style={styles.searchInput} textAlign="right" />
              {!!search && <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={21} color={colors.muted} /></Pressable>}
            </View>
            <View style={styles.resultsHeader}><Text style={styles.resultsTitle}>فهرس الأسماء</Text><Text style={styles.resultsCount}>{listPeople.length} من {people.length}</Text></View>
          </>}
          renderItem={({ item }) => <View style={styles.cardGap}><PersonCard person={item} onPress={() => router.push(`/person/${item.id}`)} /></View>}
          ListEmptyComponent={<Text style={styles.empty}>لا توجد نتائج مطابقة.</Text>}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
      >
        <Header mode={mode} onModeChange={setMode} />
        <GenealogyTree people={people} edges={edges} branchLabels={branchLabels} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ mode, onModeChange }: { mode: ViewMode; onModeChange: (mode: ViewMode) => void }) {
  const shareTree = () => void Share.share({ message: 'شجرة النسب الشريف – عرض رقمي تفاعلي للنسب والعلاقات.' });
  return <>
    <View style={styles.headerRow}>
      <View style={styles.headerSpacer} />
      <View style={styles.headerText}><Text style={styles.title}>الشجرة</Text><Text style={styles.description}>عرض مرئي تفاعلي يوضح تفرع الأسماء والعلاقات</Text></View>
      <Pressable onPress={shareTree} style={styles.headerIcon}><Ionicons name="share-social-outline" size={23} color={colors.primary} /></Pressable>
    </View>
    <View style={styles.switcher}>
      <ModeButton active={mode === 'diagram'} label="المخطط" icon="git-network-outline" onPress={() => onModeChange('diagram')} />
      <ModeButton active={mode === 'list'} label="القائمة" icon="list-outline" onPress={() => onModeChange('list')} />
    </View>
  </>;
}

function ModeButton({ active, label, icon, onPress }: { active: boolean; label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.modeButton, active && styles.modeActive]}><Ionicons name={icon} size={20} color={active ? colors.white : colors.primary} /><Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 110 },
  headerRow: { alignItems: 'flex-start', flexDirection: 'row-reverse', gap: 10, marginBottom: 18 },
  headerSpacer: { height: 48, width: 48 },
  headerText: { alignItems: 'center', flex: 1 },
  title: { color: colors.primary, fontSize: 31, fontWeight: '900', textAlign: 'center' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 6, textAlign: 'center' },
  headerIcon: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 16, borderWidth: 1, height: 48, justifyContent: 'center', width: 48, ...shadow },
  switcher: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', marginBottom: 14, overflow: 'hidden', padding: 4, ...shadow },
  modeButton: { alignItems: 'center', borderRadius: 15, flex: 1, flexDirection: 'row-reverse', gap: 7, justifyContent: 'center', minHeight: 52 },
  modeActive: { backgroundColor: colors.primary },
  modeText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  modeTextActive: { color: colors.white },
  searchBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 9, marginBottom: 14, minHeight: 60, paddingHorizontal: 16, ...shadow },
  searchInput: { color: colors.text, flex: 1, fontSize: 15 },
  resultsHeader: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12 },
  resultsTitle: { color: colors.primary, fontSize: 21, fontWeight: '900' },
  resultsCount: { color: colors.muted, fontSize: 12 },
  cardGap: { marginBottom: 10 },
  empty: { color: colors.muted, paddingVertical: 34, textAlign: 'center' },
});
