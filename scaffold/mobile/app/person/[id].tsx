import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonLineageContextCard } from '../../src/components/PersonLineageContextCard';
import { PersonManagementCard } from '../../src/components/PersonManagementCard';
import { getLineage } from '../../src/lib/api';
import { reviewPerson, type SupervisorDecision } from '../../src/lib/supervisor';
import { colors, radius, shadow } from '../../src/theme';
import type { LineageResponse, Person } from '../../src/types';

export default function PersonDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<LineageResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadDetails = async () => {
    const personId = Number(id);
    if (!Number.isFinite(personId)) {
      setLoadError('رقم الاسم غير صحيح.');
      return;
    }

    setLoadError(null);
    try {
      const result = await getLineage(personId);
      setData(result);
      setName(result.person.full_name);
      setNote(result.person.supervisor_note ?? '');
    } catch (error) {
      setData(null);
      setLoadError(error instanceof Error ? error.message : 'تعذر تحميل مسار النسب.');
    }
  };

  useEffect(() => { void loadDetails(); }, [id]);

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.blocked}>
          <Ionicons name="close-circle" size={56} color={colors.danger} />
          <Text style={styles.blockedTitle}>أُلغي هذا النسب من التطبيق</Text>
          <Text style={styles.blockedText}>{loadError}</Text>
          <Text style={styles.blockedNote}>لا يظهر في شجرة النسب الشريف إلا الاسم الذي يمكن تتبع آبائه حتى سيد البشر محمد ﷺ.</Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-forward" size={19} color={colors.white} />
            <Text style={styles.backButtonText}>الرجوع</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) return <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View>;

  const person = data.person;
  const rejected = person.approval_status === 'rejected';
  const pending = person.approval_status === 'pending_supervisor' || person.is_provisional;
  const approval = rejected ? 'مرفوض من المشرف' : pending ? 'بانتظار اعتماد المشرف' : 'معتمد من المشرف';
  const children = data.children ?? person.children ?? [];
  const childrenCount = data.children_count ?? children.length;
  const descendantsCount = data.descendants_count ?? childrenCount;

  const save = async (decision: SupervisorDecision) => {
    if (saving) return;
    if (decision === 'approve' && !name.trim()) return Alert.alert('الاسم مطلوب', 'اكتب الاسم الصحيح.');
    setSaving(true);
    try {
      const updated = await reviewPerson(person.id, {
        decision,
        full_name: name.trim() || person.full_name,
        reading_status: person.status,
        note: note.trim() || undefined,
      });
      setData((current) => current ? updateLineage(current, updated) : current);
      setName(updated.full_name);
      setNote(updated.supervisor_note ?? '');
      setEditing(false);
      Alert.alert(decision === 'approve' ? 'تم الاعتماد' : decision === 'reject' ? 'تم الرفض' : 'بقي للمراجعة');
    } catch (error) {
      Alert.alert('تعذر حفظ القرار', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.');
    } finally {
      setSaving(false);
    }
  };

  const confirm = (decision: SupervisorDecision) => {
    const title = decision === 'approve' ? 'اعتماد الاسم' : decision === 'reject' ? 'رفض القراءة' : 'إبقاء للمراجعة';
    const message = decision === 'approve'
      ? `هل تعتمد «${name.trim() || person.full_name}» بعد مراجعة كامل مساره حتى محمد ﷺ؟`
      : decision === 'reject' ? 'سيختفي الاسم من الشجرة العامة ويبقى في السجل.' : 'سيبقى الاسم للمراجعة لاحقًا.';
    Alert.alert(title, message, [
      { text: 'إلغاء', style: 'cancel' },
      { text: decision === 'reject' ? 'رفض' : 'تأكيد', style: decision === 'reject' ? 'destructive' : 'default', onPress: () => void save(decision) },
    ]);
  };

  const shareText = `${person.full_name} (${person.source_code ?? `#${person.id}`})\n${data.path_text}`;
  const contribute = () => router.push({ pathname: '/(tabs)/contribute', params: { personId: String(person.id), personName: person.full_name } });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.profile}>
          <Ionicons name={pending ? 'hourglass' : rejected ? 'close-circle' : 'person'} size={38} color={colors.primarySoft} />
          <Text style={styles.name}>{person.full_name}</Text>
          <Text style={styles.approval}>{approval}</Text>
        </View>

        {pending && <View style={styles.warning}><Ionicons name="information-circle" size={21} color="#8A661E" /><Text style={styles.warningText}>لا تعتمد الاسم وحده؛ راجع كامل صلته بسيد البشر محمد ﷺ أولًا.</Text></View>}

        <PersonLineageContextCard person={person} path={data.path} />

        <PersonManagementCard
          person={person}
          children={children}
          childrenCount={childrenCount}
          descendantsCount={descendantsCount}
          onUpdated={(updated) => {
            setData((current) => current ? updateLineage(current, updated) : current);
            setName(updated.full_name);
            setNote(updated.supervisor_note ?? '');
          }}
          onReload={loadDetails}
        />

        {pending && (
          <View style={styles.card}>
            <Title icon="shield-checkmark" text="قرار المشرف" />
            {editing && <View><Label text="الاسم بعد التصحيح" /><TextInput value={name} onChangeText={setName} style={styles.input} textAlign="right" /><Label text="ملاحظة المشرف" /><TextInput value={note} onChangeText={setNote} style={[styles.input, styles.note]} multiline textAlign="right" /></View>}
            <Pressable disabled={saving} onPress={() => confirm('approve')} style={styles.approve}>{saving ? <ActivityIndicator color={colors.white} /> : <Ionicons name="checkmark-circle" size={21} color={colors.white} />}<Text style={styles.approveText}>{editing ? 'حفظ التعديل واعتماد' : 'اعتماد الاسم'}</Text></Pressable>
            <View style={styles.row}>
              <SmallButton icon="create" text={editing ? 'إغلاق التعديل' : 'تعديل قبل الاعتماد'} onPress={() => setEditing((value) => !value)} />
              <SmallButton icon="time" text="إبقاء للمراجعة" onPress={() => confirm('pending')} />
            </View>
            <Pressable onPress={() => confirm('reject')} style={styles.reject}><Ionicons name="close-circle" size={19} color={colors.danger} /><Text style={styles.rejectText}>رفض القراءة</Text></Pressable>
          </View>
        )}

        <View style={styles.row}>
          <SmallButton icon="share-social" text="مشاركة" onPress={() => void Share.share({ message: shareText })} />
          <SmallButton icon="create" text="اقترح تصحيحًا" onPress={contribute} primary />
        </View>

        <View style={styles.card}>
          <Title icon="document-text" text="بيانات القراءة" />
          <Detail label="رمز المشجرة" value={person.source_code ?? 'غير محدد'} />
          <Detail label="حالة الاعتماد" value={approval} />
          <Detail label="حالة القراءة" value={statusLabel(person.status)} />
          <Detail label="الموضع في الصورة" value={person.source_locator ?? 'غير محدد'} />
          <Detail label="المصدر" value={person.source_reference ?? 'غير محدد'} />
          <Detail label="ملاحظات" value={person.supervisor_note ?? person.summary ?? 'لا توجد ملاحظات.'} />
        </View>

        <View style={styles.card}>
          <Title icon="git-network" text="سلسلة النسب النصية" />
          <Text style={styles.path}>{data.path_text}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function updateLineage(current: LineageResponse, person: Person): LineageResponse {
  const path = current.path.map((item) => item.id === person.id ? person : item);
  return { ...current, person, path, path_text: path.map((item) => item.full_name).join(' ← ') };
}

function Title({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return <View style={styles.titleRow}><Ionicons name={icon} size={22} color={colors.gold} /><Text style={styles.title}>{text}</Text></View>;
}
function Label({ text }: { text: string }) { return <Text style={styles.label}>{text}</Text>; }
function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text selectable style={styles.detailValue}>{value}</Text></View>; }
function SmallButton({ icon, text, onPress, primary = false }: { icon: keyof typeof Ionicons.glyphMap; text: string; onPress: () => void; primary?: boolean }) {
  return <Pressable onPress={onPress} style={[styles.small, primary && styles.smallPrimary]}><Ionicons name={icon} size={18} color={primary ? colors.white : colors.primary} /><Text style={[styles.smallText, primary && styles.smallTextPrimary]}>{text}</Text></Pressable>;
}
function statusLabel(status: string) { return status === 'readable' ? 'مقروء بوضوح' : status === 'unclear' ? 'غير محسوم' : 'يحتاج مراجعة'; }

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  loading: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 70 },
  profile: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.lg, padding: 24, ...shadow },
  name: { color: colors.white, fontSize: 27, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  approval: { backgroundColor: colors.goldSoft, borderRadius: radius.pill, color: '#805D17', fontSize: 12, fontWeight: '900', marginTop: 13, paddingHorizontal: 13, paddingVertical: 7 },
  warning: { alignItems: 'flex-start', backgroundColor: colors.goldSoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, marginTop: 14, padding: 13 },
  warningText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 20, textAlign: 'right' },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, marginTop: 14, padding: 18, ...shadow },
  titleRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 11 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  label: { color: colors.muted, fontSize: 12, marginBottom: 5, marginTop: 7, textAlign: 'right' },
  input: { backgroundColor: colors.background, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.text, fontSize: 16, minHeight: 49, padding: 12 },
  note: { minHeight: 88 },
  approve: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, justifyContent: 'center', marginTop: 10, minHeight: 52 },
  approveText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  row: { flexDirection: 'row-reverse', gap: 9, marginTop: 10 },
  small: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md, flex: 1, flexDirection: 'row-reverse', gap: 6, justifyContent: 'center', minHeight: 49, paddingHorizontal: 8 },
  smallPrimary: { backgroundColor: colors.primary },
  smallText: { color: colors.primary, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  smallTextPrimary: { color: colors.white },
  reject: { alignItems: 'center', flexDirection: 'row-reverse', gap: 6, justifyContent: 'center', marginTop: 9, minHeight: 43 },
  rejectText: { color: colors.danger, fontSize: 13, fontWeight: '900' },
  detail: { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 9 },
  detailLabel: { color: colors.muted, fontSize: 12, textAlign: 'right' },
  detailValue: { color: colors.text, fontSize: 15, lineHeight: 24, marginTop: 4, textAlign: 'right' },
  path: { color: colors.text, fontSize: 15, lineHeight: 27, textAlign: 'right' },
  blocked: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 },
  blockedTitle: { color: colors.danger, fontSize: 23, fontWeight: '900', marginTop: 13, textAlign: 'center' },
  blockedText: { color: colors.text, fontSize: 15, lineHeight: 25, marginTop: 9, textAlign: 'center' },
  blockedNote: { color: colors.muted, fontSize: 12, lineHeight: 21, marginTop: 10, textAlign: 'center' },
  backButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 7, justifyContent: 'center', marginTop: 20, minHeight: 50, paddingHorizontal: 26 },
  backButtonText: { color: colors.white, fontSize: 14, fontWeight: '900' },
});
