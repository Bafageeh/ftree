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
    if (Number.isFinite(personId)) getLineage(personId).then(setData);
  }, [id]);

  if (!data) {
    return <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const pending = data.person.approval_status === 'pending_supervisor' || data.person.is_provisional;
  const openContribution = () => router.push({
    pathname: '/(tabs)/contribute',
    params: { personId: String(data.person.id), personName: data.person.full_name },
  });

  const shareText = [
    `${data.person.full_name} (${data.person.source_code ?? `#${data.person.id}`})`,
    pending ? 'قراءة أولية بانتظار اعتماد المشرف.' : 'اسم معتمد من المشرف.',
    data.path_text ? `المسار المسجل: ${data.path_text}` : null,
  ].filter(Boolean).join('\n');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Ionicons name={pending ? 'hourglass' : 'person'} size={34} color={colors.primary} /></View>
          <Text style={styles.code}>{data.person.source_code ?? `#${data.person.id}`}</Text>
          <Text style={styles.name}>{data.person.full_name}</Text>
          {!!data.person.honorific && <Text style={styles.honorific}>{data.person.honorific}</Text>}
          <View style={[styles.approvalPill, pending ? styles.pendingPill : styles.confirmedPill]}>
            <Text style={[styles.approvalText, { color: pending ? '#8A661E' : colors.success }]}>
              {pending ? 'بانتظار اعتماد المشرف' : 'معتمد من المشرف'}
            </Text>
          </View>
        </View>

        {pending && (
          <View style={styles.warningCard}>
            <Ionicons name="information-circle" size={22} color="#8A661E" />
            <Text style={styles.warningText}>هذا الاسم معروض بقراءته ورمزه كما ظهر في المشجرة، ولا تُعد علاقته نهائية قبل اعتماد المشرف.</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <Pressable onPress={() => Share.share({ message: shareText })} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
            <Ionicons name="share-social" size={19} color={colors.primary} />
            <Text style={styles.actionButtonText}>مشاركة</Text>
          </Pressable>
          <Pressable onPress={openContribution} style={({ pressed }) => [styles.correctionButton, pressed && styles.pressed]}>
            <Ionicons name="create" size={19} color={colors.white} />
            <Text style={styles.correctionButtonText}>اقترح تصحيحًا</Text>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={22} color={colors.gold} />
            <Text style={styles.sectionTitle}>بيانات القراءة</Text>
          </View>
          <Detail label="رمز المشجرة" value={data.person.source_code ?? 'غير محدد'} />
          <Detail label="حالة اعتماد المشرف" value={pending ? 'بانتظار الاعتماد' : 'معتمد'} />
          <Detail label="حالة القراءة" value={statusLabel(data.person.status)} />
          <Detail label="الموضع في الصورة" value={data.person.source_locator ?? 'غير محدد'} />
          <Detail label="المصدر" value={data.person.source_reference ?? 'غير محدد'} />
          <Detail label="ملاحظات" value={data.person.summary ?? 'لا توجد ملاحظات.'} />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-network" size={22} color={colors.gold} />
            <Text style={styles.sectionTitle}>{pending ? 'العلاقة المسجلة مبدئيًا' : 'مسار النسب المعتمد'}</Text>
          </View>
          <Text selectable style={styles.pathText}>{data.path_text || 'لم تُربط العلاقة بعد.'}</Text>
        </View>

        {!!data.path.length && (
          <View style={styles.pathList}>
            {data.path.map((person, index) => (
              <View key={person.id} style={styles.pathNode}>
                <View style={styles.pathDot}><Text style={styles.pathDotText}>{index + 1}</Text></View>
                <Text style={styles.pathName}>{person.full_name}</Text>
                {!!person.source_code && <Text style={styles.pathCode}>{person.source_code}</Text>}
                {index < data.path.length - 1 && <View style={styles.pathConnector} />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function statusLabel(status: string) {
  if (status === 'readable') return 'مقروء بوضوح';
  if (status === 'unclear') return 'غير مقروء أو غير محسوم';
  return 'يحتاج مراجعة';
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  loading: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 70 },
  profileCard: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.lg, padding: 26, ...shadow },
  avatar: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 30, height: 72, justifyContent: 'center', width: 72 },
  code: { color: '#E9C87E', fontSize: 12, fontWeight: '900', marginTop: 13 },
  name: { color: colors.white, fontSize: 27, fontWeight: '900', marginTop: 7, textAlign: 'center' },
  honorific: { color: '#D8E5DC', fontSize: 14, marginTop: 5 },
  approvalPill: { borderRadius: radius.pill, marginTop: 14, paddingHorizontal: 13, paddingVertical: 7 },
  pendingPill: { backgroundColor: colors.goldSoft },
  confirmedPill: { backgroundColor: '#E4F1E7' },
  approvalText: { fontSize: 12, fontWeight: '900' },
  warningCard: { alignItems: 'flex-start', backgroundColor: colors.goldSoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, marginTop: 14, padding: 13 },
  warningText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 20, textAlign: 'right' },
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
  pathCode: { color: colors.muted, fontSize: 10, marginTop: 3 },
  pathConnector: { backgroundColor: colors.gold, height: 24, marginVertical: 7, opacity: 0.65, width: 2 },
});
