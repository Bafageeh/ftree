import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { updatePersonProfile, uploadPersonPhoto } from '../lib/personAdmin';
import { colors, radius, shadow } from '../theme';
import type { Gender, Person } from '../types';

type Props = {
  person: Person;
  onUpdated: (person: Person) => void;
};

export function PersonProfileCard({ person, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [gender, setGender] = useState<Gender | null>(person.gender ?? null);
  const [details, setDetails] = useState(person.general_details ?? '');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setGender(person.gender ?? null);
    setDetails(person.general_details ?? '');
  }, [person.id, person.gender, person.general_details]);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await updatePersonProfile(person.id, {
        gender,
        general_details: details.trim() || null,
      });
      onUpdated(updated);
      setEditing(false);
      Alert.alert('تم الحفظ', 'تم حفظ التفاصيل العامة والجنس.');
    } catch (error) {
      Alert.alert('تعذر الحفظ', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.');
    } finally {
      setBusy(false);
    }
  };

  const choosePhoto = async () => {
    if (uploading) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('السماح بالصور مطلوب', 'اسمح للتطبيق بالوصول إلى الصور لاختيار صورة شخصية.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const updated = await uploadPersonPhoto(person.id, result.assets[0]);
      onUpdated(updated);
      Alert.alert('تم رفع الصورة', 'تم حفظ الصورة الشخصية بنجاح.');
    } catch (error) {
      Alert.alert('تعذر رفع الصورة', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="person-circle" size={23} color={colors.gold} />
        <Text style={styles.title}>الملف الشخصي</Text>
      </View>

      <View style={styles.photoRow}>
        <View style={styles.photoFrame}>
          {person.profile_photo_url ? (
            <Image source={{ uri: person.profile_photo_url }} style={styles.photo} resizeMode="cover" />
          ) : (
            <Ionicons name={person.gender === 'female' ? 'woman' : 'person'} size={48} color={colors.primary} />
          )}
        </View>
        <View style={styles.photoInfo}>
          <Text style={styles.photoTitle}>الصورة الشخصية</Text>
          <Text style={styles.photoHint}>صورة مربعة بصيغة JPG أو PNG أو WEBP، وبحد أقصى 5 ميجابايت.</Text>
          <Pressable disabled={uploading} onPress={() => void choosePhoto()} style={styles.photoButton}>
            {uploading ? <ActivityIndicator color={colors.white} /> : <Ionicons name="image" size={18} color={colors.white} />}
            <Text style={styles.photoButtonText}>{person.profile_photo_url ? 'تغيير الصورة' : 'رفع صورة شخصية'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.divider} />

      {editing ? (
        <View>
          <Text style={styles.label}>الجنس</Text>
          <View style={styles.genderRow}>
            <GenderButton label="ذكر" icon="man" active={gender === 'male'} onPress={() => setGender('male')} />
            <GenderButton label="أنثى" icon="woman" active={gender === 'female'} onPress={() => setGender('female')} />
          </View>

          <Text style={styles.label}>تفاصيل عامة</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            style={[styles.input, styles.detailsInput]}
            multiline
            textAlign="right"
            textAlignVertical="top"
            placeholder="اكتب نبذة عامة، تاريخ الميلاد والوفاة، السيرة، المهنة، مكان الإقامة أو أي معلومات مفيدة..."
            placeholderTextColor={colors.muted}
          />

          <View style={styles.actions}>
            <Pressable disabled={busy} onPress={() => setEditing(false)} style={styles.cancelButton}>
              <Ionicons name="close" size={18} color={colors.primary} />
              <Text style={styles.cancelText}>إلغاء</Text>
            </Pressable>
            <Pressable disabled={busy} onPress={() => void save()} style={styles.saveButton}>
              {busy ? <ActivityIndicator color={colors.white} /> : <Ionicons name="save" size={18} color={colors.white} />}
              <Text style={styles.saveText}>حفظ التفاصيل</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>الجنس</Text>
            <Text style={styles.detailValue}>{gender === 'male' ? 'ذكر' : gender === 'female' ? 'أنثى' : 'غير محدد'}</Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>التفاصيل العامة</Text>
            <Text style={styles.detailsText}>{details.trim() || 'لا توجد تفاصيل عامة مضافة.'}</Text>
          </View>
          <Pressable onPress={() => setEditing(true)} style={styles.editButton}>
            <Ionicons name="create" size={18} color={colors.white} />
            <Text style={styles.editText}>تعديل الملف الشخصي</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function GenderButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: 'man' | 'woman';
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.genderButton, active && styles.genderActive]}>
      <Ionicons name={icon} size={21} color={active ? colors.white : colors.primary} />
      <Text style={[styles.genderText, active && styles.genderTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, marginTop: 14, padding: 18, ...shadow },
  titleRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 14 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  photoRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: 14 },
  photoFrame: { alignItems: 'center', backgroundColor: colors.primarySoft, borderColor: colors.line, borderRadius: 54, borderWidth: 2, height: 108, justifyContent: 'center', overflow: 'hidden', width: 108 },
  photo: { height: '100%', width: '100%' },
  photoInfo: { flex: 1 },
  photoTitle: { color: colors.text, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  photoHint: { color: colors.muted, fontSize: 10, lineHeight: 17, marginTop: 4, textAlign: 'right' },
  photoButton: { alignItems: 'center', alignSelf: 'flex-end', backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 6, justifyContent: 'center', marginTop: 9, minHeight: 42, paddingHorizontal: 13 },
  photoButtonText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  divider: { backgroundColor: colors.line, height: StyleSheet.hairlineWidth, marginVertical: 17 },
  label: { color: colors.muted, fontSize: 12, marginBottom: 7, marginTop: 8, textAlign: 'right' },
  genderRow: { flexDirection: 'row-reverse', gap: 9 },
  genderButton: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flex: 1, flexDirection: 'row-reverse', gap: 7, justifyContent: 'center', minHeight: 48 },
  genderActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  genderTextActive: { color: colors.white },
  input: { backgroundColor: colors.background, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.text, fontSize: 15, padding: 12 },
  detailsInput: { minHeight: 145 },
  actions: { flexDirection: 'row-reverse', gap: 9, marginTop: 12 },
  cancelButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md, flex: 1, flexDirection: 'row-reverse', gap: 6, justifyContent: 'center', minHeight: 49 },
  cancelText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  saveButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, flex: 1, flexDirection: 'row-reverse', gap: 6, justifyContent: 'center', minHeight: 49 },
  saveText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  detailRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 9 },
  detailBlock: { paddingVertical: 11 },
  detailLabel: { color: colors.muted, fontSize: 12, textAlign: 'right' },
  detailValue: { color: colors.text, fontSize: 15, fontWeight: '800' },
  detailsText: { color: colors.text, fontSize: 14, lineHeight: 24, marginTop: 7, textAlign: 'right' },
  editButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 7, justifyContent: 'center', marginTop: 10, minHeight: 50 },
  editText: { color: colors.white, fontSize: 13, fontWeight: '900' },
});
