import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getLineage } from '../../src/lib/api';
import { colors, radius, shadow } from '../../src/theme';
import type { LineageResponse } from '../../src/types';

export default function PersonDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<LineageResponse | null>(null);

  useEffect(() => {
    const personId = Number(id);
    if (Number.isFinite(personId)) {
      getLineage(personId).then(setData);
    }
  }, [id]);

  if (!data) {
    return <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const openContribution = () => {
    router.push({
      pathname: '/(tabs)/contribute',
      params: {
        personId: String(data.person.id),
        personName: data.person.full_name,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Ionicons name="person" size={34} color={colors.primary} /></View>
          <Text style={styles.name}>{data.person.full_name}</Text>
          {!!data.person.honorific && <Text style={styles.honorific}>{data.person.honorific}</Text>}
          <View style={styles.generationPill}>
            <Text style={styles.generationText}>الجيل {data.person.generation}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => Share.share({ message: data.path_text })}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Ionicons name="share-social" size={19} color={colors.primary} />
            <Text style={styles.actionButtonText}>مشاركة</Text>
          </Pressable>
          <Pressable
            onPress={openContribution}
            style={({ pressed }) => [styles.correctionButton, pressed && styles.pressed]}
          >
            <Ionicons name="create" size={19} color={colors.white} />
            <Text style={styles.correctionButtonText}>اقترح تصحيحًا</Text>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-network" size={22} color={colors.gold} />
            <Text style={styles.sectionTitle}>مسار النسب</Text>
          </View>
          <Text selectable style={styles.pathText}>{data.path_text}</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={22} color={colors.gold} />
            <Text style={styles.sectionTitle}>حالة التوثيق</Text>
          </View>
          <Detail label="حالة القراءة" value={statusLabel(data.person.status)} />
          <Detail label="المصدر" value={data.person.source_reference ?? 'غير محدد'} />
          <Detail label="ملاحظات" value={data.person.summary ?? 'لا توجد ملاحظات.'} />
        </View>

        <View style={styles.pathList}>
          {data.path.map((person, index) => (
            <View key={person.id} style={styles.pathNode}>
              <View style={styles.pathDot}><Text style={styles.pathDotText}>{index + 1}</Text></View>
              <Text style={styles.pathName}>{person.full_name}</Text>
              {index < data.path.length - 1 && <View style={styles.pathConnector} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function statusLabel(status: string) {
  if (status === 'readable') return 'مقروء بوضوح';
  if (status === 'unclear') return 'غير مقروء';
  return 'يحتاج مراجعة';
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  loading: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 70 },
  profileCard: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.lg, padding: 26, ...shadow },
  avatar: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 30, height: 72, justifyContent: 'center', width: 72 },
  name: { color: colors.white, fontSize: 28, fontWeight: '900', marginTop: 16, textAlign: 'center' },
  honorific: { color: '#D8E5DC', fontSize: 14, marginTop: 5 },
  generationPill: { backgroundColor: 'rgba(255,255,255,.13)', borderRadius: radius.pill, marginTop: 14, paddingHorizontal: 13, paddingVertical: 7 },
  generationText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  actionsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 14 },
  actionButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md, flex: 1, flexDirection: 'row-reverse', gap: 8, justifyContent: 'center', minHeight: 52 },
  actionButtonText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  correctionButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, flex: 1.35, flexDirection: 'row-reverse', gap: 8, justifyContent: 'center', minHeight: 52 },
  correctionButtonText: { color: colors.white, fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  sectionCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginTop: 14, padding: 18 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  pathText: { color: colors.text, fontSize: 16, lineHeight: 30, textAlign: 'right' },
  detailRow: { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  detailLabel: { color: colors.muted, fontSize: 12, textAlign: 'right' },
  detailValue: { color: colors.text, fontSize: 15, lineHeight: 24, marginTop: 4, textAlign: 'right' },
  pathList: { marginTop: 20 },
  pathNode: { alignItems: 'center' },
  pathDot: { alignItems: 'center', backgroundColor: colors.goldSoft, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  pathDotText: { color: colors.primary, fontWeight: '900' },
  pathName: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 8 },
  pathConnector: { backgroundColor: colors.gold, height: 24, marginVertical: 7, opacity: 0.65, width: 2 },
});
