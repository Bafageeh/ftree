import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getLineage } from '../../src/lib/api';
import { reviewPerson, type SupervisorDecision } from '../../src/lib/supervisor';
import { colors, radius, shadow } from '../../src/theme';
import type { LineageResponse, Person } from '../../src/types';

export default function PersonDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<LineageResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const personId = Number(id);
    if (!Number.isFinite(personId)) return;

    getLineage(personId).then((result) => {
      setData(result);
      setNameDraft(result.person.full_name);
      setNoteDraft(result.person.supervisor_note ?? '');
    });
  }, [id]);

  if (!data) {
    return <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const rejected = data.person.approval_status === 'rejected';
  const pending = data.person.approval_status === 'pending_supervisor' || data.person.is_provisional;
  const approvalLabel = rejected ? 'مرفوض من المشرف' : pending ? 'بانتظار اعتماد المشرف' : 'معتمد من المشرف';
  const approvalColor = rejected ? colors.danger : pending ? '#8A661E' : colors.success;
  const approvalBackground = rejected ? '#F8E6E6' : pending ? colors.goldSoft : '#E4F1E7';

  const openContribution = () => router.push({
    pathname: '/(tabs)/contribute',
    params: { personId: String(data.person.id), personName: data.person.full_name },
  });

  const shareText = [
    `${data.person.full_name} (${data.person.source_code ?? `#${data.person.id}`})`,
    rejected ? 'قراءة مرفوضة من المشرف.' : pending ? 'قراءة أولية بانتظار اعتماد المشرف.' : 'اسم معتمد من المشرف.',
    data.path_text ? `المسار المسجل: ${data.path_text}` : null,
  ].filter(Boolean).join('\n');

  const saveDecision = async (decision: SupervisorDecision) => {
    if (saving) return;
    const fullName = nameDraft.trim();
    if (decision === 'approve' && !fullName) {
      Alert.alert('الاسم مطلوب', 'اكتب الاسم الصحيح قبل الاعتماد.');
      return;
    }

    setSaving(true);
    try {
      const updated = await reviewPerson(data.person.id, {
        decision,
        full_name: fullName || data.person.full_name,
        reading_status: data.person.status,
        note: noteDraft.trim() || undefined,
      });

      setData((current) => current ? updateLineage(current, updated) : current);
      setNameDraft(updated.full_name);
      setNoteDraft(updated.supervisor_note ?? '');
      setEditing(false);

      Alert.alert(
        decision === 'approve' ? 'تم الاعتماد' : decision === 'reject' ? 'تم الرفض' : 'بقي للمراجعة',
        decision === 'approve'
          ? 'تم اعتماد الاسم وسيظهر ضمن الأسماء المعتمدة في الشجرة.'
          : decision === 'reject'
            ? 'تم رفض القراءة وإخفاؤها من الشجرة العامة.'
            : 'تم حفظ الاسم بانتظار مراجعة لاحقة.',
      );
    } catch (error) {
      Alert.alert('تعذر حفظ القرار', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDecision = (decision: SupervisorDecision) => {
    if (decision === 'approve') {
      Alert.alert('اعتماد الاسم', `هل تعتمد «${nameDraft.trim() || data.person.full_name}»؟`, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'اعتماد', onPress: () => saveDecision('approve') },
      ]);
      return;
    }

    if (decision === 'reject') {
      Alert.alert('رفض القراءة', 'سيختفي هذا الاسم من الشجرة العامة، مع بقائه محفوظًا في السجل.', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'رفض', style: 'destructive', onPress: () => saveDecision('reject') },
      ]);
      return;
    }

    saveDecision('pending');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Ionicons name={rejected ? 'close-circle' : pending ? 'hourglass' : 'person'} size={34} color={colors.primary} /></View>
          <Text style={styles.code}>{data.person.source_code ?? `#${data.person.id}`}</Text>
          <Text style={styles.name}>{data.person.full_name}</Text>
          {!!data.person.honorific && <Text style={styles.honorific}>{data.person.honorific}</Text>}
          <View style={[styles.approvalPill, { backgroundColor: approvalBackground }]}>
            <Text style={[styles.approvalText, { color: approvalColor }]}>{approvalLabel}</Text>
          </View>
        </View>

        {pending && (
          <View style={styles.warningCard}>
            <Ionicons name="information-circle" size={22} color="#8A661E" />
            <Text style={styles.warningText}>راجع الاسم والموضع والمسار، ثم اختر قرار المشرف من البطاقة التالية.</Text>
          </View>
        )}

        {pending && (
          <View style={styles.supervisorCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={24} color={colors.gold} />
              <Text style={styles.sectionTitle}>قرار المشرف</Text>
            </View>

            {editing && (
              <View style={styles.editor}>
                <Text style={styles.inputLabel}>الاسم بعد التصحيح</Text>
                <TextInput
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="اكتب الاسم الصحيح"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  textAlign="right"
                />
                <Text style={styles.inputLabel}>ملاحظة المشرف</Text>
                <TextInput
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  placeholder="سبب التعديل أو ملاحظة المصدر"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, styles.noteInput]}
                  multiline
                  textAlign="right"
                  textAlignVertical="top"
                />
              </View>
            )}

            <Pressable disabled={saving} onPress={() => confirmDecision('approve')} style={({ pressed }) => [styles.approveButton, pressed && styles.pressed, saving && styles.disabled]}>
              {saving ? <ActivityIndicator color={colors.white} /> : <Ionicons name="checkmark-circle" size={22} color={colors.white} />}
              <Text style={styles.approveButtonText}>{editing ? 'حفظ التعديل واعتماد' : 'اعتماد الاسم'}</Text>
            </Pressable>

            <View style={styles.reviewActions}>
              <Pressable disabled={saving} onPress={() => setEditing((value) => !value)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Ionicons name="create" size={19} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>{editing ? 'إغلاق التعديل' : 'تعديل قبل الاعتماد'}</Text>
              </Pressable>
              <Pressable disabled={saving} onPress={() => confirmDecision('pending')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Ionicons name="time" size={19} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>إبقاء للمراجعة</Text>
              </Pressable>
            </View>

            <Pressable disabled={saving} onPress={() => confirmDecision('reject')} style={({ pressed }) => [styles.rejectButton, pressed && styles.pressed]}>
              <Ionicons name="close-circle" size={20} color={colors.danger} />
              <Text style={styles.rejectButtonText}>رفض القراءة</Text>
            </Pressable>
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
          <Detail label="حالة اعتماد المشرف" value={approvalLabel} />
          <Detail label="حالة القراءة" value={statusLabel(data.person.status)} />
          <Detail label="الموضع في الصورة" value={data.person.source_locator ?? 'غير محدد'} />
          <Detail label="المصدر" value={data.person.source_reference ?? 'غير محدد'} />
          <Detail label="ملاحظات" value={data.person.supervisor_note ?? data.person.summary ?? 'لا توجد ملاحظات.'} />
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

function updateLineage(current: LineageResponse, updated: Person): LineageResponse {
  const path = current.path.map((item) => item.id === updated.id ? updated : item);
  return {
    ...current,
    person: updated,
    path,
    path_text: path.map((item) => item.full_name).join(' ← '),
  };
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
  approvalText: { fontSize: 12, fontWeight: '900' },
  warningCard: { alignItems: 'flex-start', backgroundColor: colors.goldSoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, marginTop: 14, padding: 13 },
  warningText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 20, textAlign: 'right' },
  supervisorCard: { backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: radius.lg, borderWidth: 1.5, marginTop: 14, padding: 18, ...shadow },
  editor: { marginBottom: 12 },
  inputLabel: { color: colors.muted, fontSize: 12, marginBottom: 6, marginTop: 8, textAlign: 'right' },
  input: { backgroundColor: colors.background, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.text, fontSize: 16, minHeight: 50, paddingHorizontal: 14, paddingVertical: 11 },
  noteInput: { minHeight: 95 },
  approveButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, justifyContent: 'center', minHeight: 54, marginTop: 8 },
  approveButtonText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  reviewActions: { flexDirection: 'row-reverse', gap: 8, marginTop: 9 },
  secondaryButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md, flex: 1, flexDirection: 'row-reverse', gap: 6, justifyContent: 'center', minHeight: 50, paddingHorizontal: 7 },
  secondaryButtonText: { color: colors.primary, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  rejectButton: { alignItems: 'center', borderColor: '#E7B8B8', borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 7, justifyContent: 'center', minHeight: 48, marginTop: 9 },
  rejectButtonText: { color: colors.danger, fontSize: 13, fontWeight: '900' },
  disabled: { opacity: 0.55 },
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
