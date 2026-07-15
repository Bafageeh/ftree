import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonCard } from '../../src/components/PersonCard';
import { getPeople } from '../../src/lib/api';
import { colors } from '../../src/theme';
import type { Person } from '../../src/types';

export default function TreeScreen() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setPeople(await getPeople());
    setLoading(false);
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
          <View style={styles.header}>
            <Text style={styles.title}>السلسلة الوسطى</Text>
            <Text style={styles.description}>اضغط على أي اسم لعرض مساره الكامل ومصدر القراءة وحالة التوثيق.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.nodeWrap}>
            <PersonCard person={item} onPress={() => router.push(`/person/${item.id}`)} compact />
            {index < people.length - 1 && <View style={styles.connector} />}
          </View>
        )}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} size="large" /> : <Text style={styles.empty}>لم تُحمّل بيانات الشجرة.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 18, paddingBottom: 100 },
  header: { marginBottom: 22 },
  title: { color: colors.primary, fontSize: 28, fontWeight: '900', textAlign: 'right' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 24, marginTop: 8, textAlign: 'right' },
  nodeWrap: { alignItems: 'center' },
  connector: { backgroundColor: colors.gold, height: 26, opacity: 0.65, width: 2 },
  empty: { color: colors.muted, padding: 30, textAlign: 'center' },
});
