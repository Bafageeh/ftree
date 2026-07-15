import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonCard } from '../../src/components/PersonCard';
import { getPeople } from '../../src/lib/api';
import { colors, radius } from '../../src/theme';
import type { Person } from '../../src/types';

export default function ReviewScreen() {
  const [people, setPeople] = useState<Person[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    setRefreshing(refresh);
    setPeople(await getPeople('', 'review'));
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={people}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.notice}>
            <Ionicons name="shield-checkmark" size={28} color={colors.gold} />
            <View style={styles.noticeText}>
              <Text style={styles.title}>مجلس مراجعة النسب</Text>
              <Text style={styles.description}>هذه الأسماء مقروءة مبدئيًا، لكنها تحتاج إلى مطابقة مع المشجرة الأصلية وربطها بوثيقة أو مرجع معتمد.</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardGap}>
            <PersonCard person={item} onPress={() => router.push(`/person/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>لا توجد أسماء قيد المراجعة.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 18, paddingBottom: 100 },
  notice: { alignItems: 'flex-start', backgroundColor: colors.goldSoft, borderRadius: radius.lg, flexDirection: 'row-reverse', gap: 14, marginBottom: 18, padding: 20 },
  noticeText: { flex: 1 },
  title: { color: colors.primary, fontSize: 22, fontWeight: '900', textAlign: 'right' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 24, marginTop: 6, textAlign: 'right' },
  cardGap: { marginBottom: 10 },
  empty: { color: colors.muted, padding: 30, textAlign: 'center' },
});
