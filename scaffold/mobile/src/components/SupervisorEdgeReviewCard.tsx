import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { reviewEdge, type SupervisorDecision } from '../lib/supervisor';
import { colors, radius, shadow } from '../theme';
import type { ChartEdge } from '../types';

export function SupervisorEdgeReviewCard({
  item,
  names,
  onReviewed,
}: {
  item: ChartEdge;
  names: Map<string, string>;
  onReviewed: (updated: ChartEdge) => void;
}) {
  const [saving, setSaving] = useState(false);
  const from = names.get(item.from_source_key) ?? item.from_source_key;
  const to = names.get(item.to_source_key) ?? item.to_source_key;

  const save = async (decision: SupervisorDecision, reverse = false) => {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await reviewEdge(item.id, {
        decision,
        reverse,
        reading_status: item.reading_status,
      });
      onReviewed(updated);
      Alert.alert(
        decision === 'approve' ? 'تم اعتماد العلاقة' : decision === 'reject' ? 'تم رفض العلاقة' : 'بقيت للمراجعة',
        decision === 'approve'
          ? reverse ? 'تم عكس الاتجاه ثم اعتماد العلاقة.' : 'تم اعتماد اتجاه العلاقة كما ظهر.'
          : decision === 'reject'
            ? 'لن تظهر العلاقة ضمن العلاقات المعتمدة.'
            : 'بقيت العلاقة في قائمة المراجعة.',
      );
    } catch (error) {
      Alert.alert('تعذر حفظ القرار', error instanceof Error ? error.message : 'تحقق من الاتصال بالخادم.');
    } finally {
      setSaving(false);
    }
  };

  const confirmApprove = (reverse = false) => {
    const shownFrom = reverse ? to : from;
    const shownTo = reverse ? from : to;
    Alert.alert(
      reverse ? 'عكس الاتجاه واعتماد' : 'اعتماد العلاقة',
      `هل تعتمد العلاقة من «${shownFrom}» إلى «${shownTo}»؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'اعتماد', onPress: () => save('approve', reverse) },
      ],
    );
  };

  const confirmReject = () => Alert.alert(
    'رفض العلاقة',
    'هل ترفض هذا السهم؟ سيبقى محفوظًا في السجل.',
    [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'رفض', style: 'destructive', onPress: () => save('reject') },
    ],
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}><Text style={styles.badgeText}>{statusLabel(item.reading_status)}</Text></View>
        <Text style={styles.confidence}>{item.confidence}%</Text>
      </View>

      <View style={styles.directionBox}>
        <Text style={styles.label}>من</Text>
        <Text style={styles.name}>{from}</Text>
        <Ionicons name="arrow-down" size={26} color={colors.gold} />
        <Text style={styles.label}>إلى</Text>
        <Text style={styles.name}>{to}</Text>
      </View>

      <Text style={styles.type}>{relationLabel(item.relation_type)}</Text>
      {!!item.source_locator && <Text style={styles.meta}>{item.source_locator}</Text>}
      {!!item.notes && <Text style={styles.notes}>{item.notes}</Text>}

      <Pressable disabled={saving} onPress={() => confirmApprove(false)} style={({ pressed }) => [styles.approve, pressed && styles.pressed, saving && styles.disabled]}>
        {saving ? <ActivityIndicator color={colors.white} /> : <Ionicons name="checkmark-circle" size={20} color={colors.white} />}
        <Text style={styles.approveText}>اعتماد الاتجاه كما هو</Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable disabled={saving} onPress={() => confirmApprove(true)} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Ionicons name="swap-vertical" size={18} color={colors.primary} />
          <Text style={styles.secondaryText}>عكس الاتجاه واعتماد</Text>
        </Pressable>
        <Pressable disabled={saving} onPress={() => save('pending')} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Ionicons name="time" size={18} color={colors.primary} />
          <Text style={styles.secondaryText}>إبقاء للمراجعة</Text>
        </Pressable>
      </View>

      <Pressable disabled={saving} onPress={confirmReject} style={({ pressed }) => [styles.reject, pressed && styles.pressed]}>
        <Ionicons name="close-circle" size={18} color={colors.danger} />
        <Text style={styles.rejectText}>رفض العلاقة</Text>
      </Pressable>
    </View>
  );
}

function statusLabel(status: string) {
  if (status === 'readable') return 'مقروء بوضوح';
  if (status === 'unclear') return 'غير محسوم';
  return 'يحتاج مراجعة';
}

function relationLabel(type: string) {
  if (type === 'lineage') return 'صلة نسب مباشرة';
  if (type === 'branch_membership') return 'انتماء إلى فرع';
  return 'مؤسس أو متصل بفرع';
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: radius.md, borderWidth: 1, marginBottom: 12, padding: 16, ...shadow },
  header: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  badge: { backgroundColor: colors.goldSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { color: '#8A661E', fontSize: 11, fontWeight: '900' },
  confidence: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  directionBox: { alignItems: 'center', backgroundColor: '#FAF7EF', borderRadius: radius.md, gap: 5, marginTop: 14, padding: 13 },
  label: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  name: { color: colors.primary, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  type: { color: '#8A661E', fontSize: 11, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 20, marginTop: 7, textAlign: 'right' },
  notes: { color: colors.text, fontSize: 12, lineHeight: 21, marginTop: 6, textAlign: 'right' },
  approve: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, justifyContent: 'center', marginTop: 14, minHeight: 48 },
  approveText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  actions: { flexDirection: 'row-reverse', gap: 8, marginTop: 8 },
  secondary: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md, flex: 1, flexDirection: 'row-reverse', gap: 5, justifyContent: 'center', minHeight: 46, paddingHorizontal: 6 },
  secondaryText: { color: colors.primary, fontSize: 10, fontWeight: '900', textAlign: 'center' },
  reject: { alignItems: 'center', flexDirection: 'row-reverse', gap: 6, justifyContent: 'center', marginTop: 8, minHeight: 40 },
  rejectText: { color: colors.danger, fontSize: 11, fontWeight: '900' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
});
