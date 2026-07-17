import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { addChildrenToPerson, deletePersonSubtree, updatePersonDetails } from '../lib/personAdmin';
import { colors, radius, shadow } from '../theme';
import type { Person, ReadingStatus } from '../types';

type Props = {
  person: Person;
  children: Person[];
  childrenCount: number;
  descendantsCount: number;
  onUpdated: (person: Person) => void;
  onReload: () => Promise<void>;
};

export function PersonManagementCard({ person, children, childrenCount, descendantsCount, onUpdated, onReload }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(person.full_name);
  const [sourceCode, setSourceCode] = useState(person.source_code ?? '');
  const [honorific, setHonorific] = useState(person.honorific ?? '');
  const [note, setNote] = useState(person.supervisor_note ?? '');
  const [status, setStatus] = useState<ReadingStatus>(person.status);
  const [count, setCount] = useState('1');
  const [names, setNames] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    if (!name.trim()) return Alert.alert('الاسم مطلوب', 'اكتب الاسم الصحيح.');
    setBusy(true);
    try {
      const updated = await updatePersonDetails(person.id, {
        full_name: name.trim(),
        source_code: sourceCode.trim() || null,
        honorific: honorific.trim() || null,
        status,
        supervisor_note: note.trim() || null,
      });
      onUpdated(updated);
      setEditing(false);
      Alert.alert('تم التعديل', 'تم حفظ بيانات الاسم.');
    } catch (error) {
      Alert.alert('تعذر حفظ التعديل', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.');
    } finally {
      setBusy(false);
    }
  };

  const addChildren = async () => {
    if (busy) return;
    const number = Number.parseInt(count, 10);
    const parsedNames = names.split('\n').map((value) => value.trim()).filter(Boolean);
    if (!Number.isFinite(number) || number < 1 || number > 50) {
      return Alert.alert('عدد غير صحيح', 'أدخل عددًا من 1 إلى 50.');
    }
    if (parsedNames.length > number) {
      return Alert.alert('عدد الأسماء أكبر', 'اجعل عدد الأبناء مساويًا لعدد الأسماء المكتوبة أو أكبر منه.');
    }

    setBusy(true);
    try {
      const result = await addChildrenToPerson(person.id, number, parsedNames);
      setCount('1');
      setNames('');
      await onReload();
      Alert.alert('تمت الإضافة', `تمت إضافة ${result.created_count} من الأبناء. الأسماء الفارغة أضيفت برموز مؤقتة.`);
    } catch (error) {
      Alert.alert('تعذر إضافة الأبناء', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.');
    } finally {
      setBusy(false);
    }
  };

  const removeBranch = () => {
    if (person.source_code === 'CORE-001') {
      Alert.alert('غير مسموح', 'لا يمكن حذف أصل الشجرة سيد البشر محمد ﷺ.');
      return;
    }

    Alert.alert(
      'حذف الاسم والفرع التابع',
      `سيُحذف «${person.full_name}» وكل الأبناء والأحفاد تحته.\n\nالذرية التابعة: ${descendantsCount}\nإجمالي السجلات: ${descendantsCount + 1}`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائي',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              const result = await deletePersonSubtree(person.id);
              Alert.alert('تم الحذف', `تم حذف ${result.deleted_count} سجلًا.`);
              router.replace('/(tabs)/tree');
            } catch (error) {
              Alert.alert('تعذر الحذف', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <Title icon="settings" text="إدارة الاسم والذرية" />
      <View style={styles.counterRow}>
        <Counter value={childrenCount} label="الأبناء المباشرون" />
        <Counter value={descendantsCount} label="جميع الذرية" />
      </View>

      {editing ? (
        <View>
          <Label text="الاسم" />
          <TextInput value={name} onChangeText={setName} style={styles.input} textAlign="right" />
          <Label text="رمز المشجرة" />
          <TextInput value={sourceCode} onChangeText={setSourceCode} style={styles.input} autoCapitalize="characters" textAlign="right" />
          <Label text="اللقب أو الوصف" />
          <TextInput value={honorific} onChangeText={setHonorific} style={styles.input} textAlign="right" />
          <Label text="حالة القراءة" />
          <StatusPicker value={status} onChange={setStatus} />
          <Label text="الملاحظات" />
          <TextInput value={note} onChangeText={setNote} style={[styles.input, styles.note]} multiline textAlign="right" />
          <View style={styles.row}>
            <Action icon="close" text="إلغاء" onPress={() => setEditing(false)} />
            <Action icon="save" text="حفظ التعديل" onPress={() => void save()} primary />
          </View>
        </View>
      ) : (
        <Action icon="create" text="تعديل بيانات الاسم" onPress={() => setEditing(true)} primary />
      )}

      <View style={styles.divider} />
      <Title icon="people" text="إضافة أبناء" />
      <Label text="عدد الأبناء المراد إضافتهم" />
      <TextInput value={count} onChangeText={setCount} style={styles.input} keyboardType="number-pad" textAlign="center" />
      <Label text="أسماء الأبناء، كل اسم في سطر. يمكن تركها فارغة لإضافة رموز مؤقتة" />
      <TextInput value={names} onChangeText={setNames} style={[styles.input, styles.names]} multiline placeholder={'الابن الأول\nالابن الثاني'} placeholderTextColor={colors.muted} textAlign="right" />
      <Pressable disabled={busy} onPress={() => void addChildren()} style={styles.add}>
        {busy ? <ActivityIndicator color={colors.white} /> : <Ionicons name="person-add" size={21} color={colors.white} />}
        <Text style={styles.addText}>إضافة الأبناء</Text>
      </Pressable>

      {!!children.length && (
        <View style={styles.childrenList}>
          {children.map((child) => (
            <Pressable key={child.id} onPress={() => router.push(`/person/${child.id}`)} style={styles.childRow}>
              <Ionicons name="chevron-back" size={18} color={colors.gold} />
              <Text style={styles.childName}>{child.full_name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.divider} />
      <Pressable disabled={busy || person.source_code === 'CORE-001'} onPress={removeBranch} style={[styles.remove, person.source_code === 'CORE-001' && styles.disabled]}>
        <Ionicons name="trash" size={20} color={colors.white} />
        <Text style={styles.removeText}>حذف الاسم وكل الأبناء والأحفاد</Text>
      </Pressable>
    </View>
  );
}

function Title({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return <View style={styles.titleRow}><Ionicons name={icon} size={22} color={colors.gold} /><Text style={styles.title}>{text}</Text></View>;
}
function Label({ text }: { text: string }) { return <Text style={styles.label}>{text}</Text>; }
function Counter({ value, label }: { value: number; label: string }) { return <View style={styles.counter}><Text style={styles.counterValue}>{value}</Text><Text style={styles.counterLabel}>{label}</Text></View>; }
function Action({ icon, text, onPress, primary = false }: { icon: keyof typeof Ionicons.glyphMap; text: string; onPress: () => void; primary?: boolean }) {
  return <Pressable onPress={onPress} style={[styles.action, primary && styles.actionPrimary]}><Ionicons name={icon} size={18} color={primary ? colors.white : colors.primary} /><Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{text}</Text></Pressable>;
}
function StatusPicker({ value, onChange }: { value: ReadingStatus; onChange: (value: ReadingStatus) => void }) {
  const options: Array<{ value: ReadingStatus; label: string }> = [{ value: 'readable', label: 'واضح' }, { value: 'review', label: 'للمراجعة' }, { value: 'unclear', label: 'غير مقروء' }];
  return <View style={styles.statusRow}>{options.map((option) => <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.statusOption, value === option.value && styles.statusActive]}><Text style={[styles.statusText, value === option.value && styles.statusTextActive]}>{option.label}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, marginTop: 14, padding: 18, ...shadow },
  titleRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 11 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  label: { color: colors.muted, fontSize: 12, marginBottom: 5, marginTop: 9, textAlign: 'right' },
  input: { backgroundColor: colors.background, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.text, fontSize: 16, minHeight: 49, padding: 12 },
  note: { minHeight: 88 },
  names: { minHeight: 110, textAlignVertical: 'top' },
  counterRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 12 },
  counter: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md, flex: 1, padding: 13 },
  counterValue: { color: colors.primary, fontSize: 24, fontWeight: '900' },
  counterLabel: { color: colors.muted, fontSize: 10, marginTop: 3, textAlign: 'center' },
  row: { flexDirection: 'row-reverse', gap: 9, marginTop: 10 },
  action: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md, flex: 1, flexDirection: 'row-reverse', gap: 6, justifyContent: 'center', minHeight: 49, paddingHorizontal: 8 },
  actionPrimary: { backgroundColor: colors.primary },
  actionText: { color: colors.primary, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  actionTextPrimary: { color: colors.white },
  divider: { backgroundColor: colors.line, height: StyleSheet.hairlineWidth, marginVertical: 18 },
  statusRow: { flexDirection: 'row-reverse', gap: 7 },
  statusOption: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flex: 1, minHeight: 42, justifyContent: 'center' },
  statusActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  statusTextActive: { color: colors.white },
  add: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, justifyContent: 'center', marginTop: 12, minHeight: 52 },
  addText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  childrenList: { borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginTop: 12, overflow: 'hidden' },
  childRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row-reverse', gap: 7, minHeight: 45, paddingHorizontal: 11 },
  childName: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  remove: { alignItems: 'center', backgroundColor: colors.danger, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, justifyContent: 'center', minHeight: 52 },
  removeText: { color: colors.white, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  disabled: { opacity: 0.35 },
});
