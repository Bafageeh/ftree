import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getReviewRequestStatus, submitReviewRequest } from '../../src/lib/api';
import { colors, radius, shadow } from '../../src/theme';
import type { ReviewRequestStatus, ReviewRequestType } from '../../src/types';

const requestTypes: Array<{
  value: ReviewRequestType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: 'correction', label: 'تصحيح معلومة', icon: 'create' },
  { value: 'addition', label: 'إضافة اسم', icon: 'person-add' },
  { value: 'source', label: 'إضافة مصدر', icon: 'document-attach' },
];

const statusLabels: Record<string, string> = {
  pending: 'بانتظار المراجعة',
  approved: 'تم الاعتماد',
  rejected: 'لم يتم الاعتماد',
  needs_info: 'تحتاج معلومات إضافية',
};

export default function ContributeScreen() {
  const params = useLocalSearchParams<{ personId?: string; personName?: string }>();
  const linkedPersonId = useMemo(() => {
    const parsed = Number(params.personId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [params.personId]);

  const [requestType, setRequestType] = useState<ReviewRequestType>('correction');
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [personName, setPersonName] = useState(params.personName ?? '');
  const [proposedValue, setProposedValue] = useState('');
  const [sourceDetails, setSourceDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState('');
  const [error, setError] = useState('');

  const [trackingCode, setTrackingCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [trackingResult, setTrackingResult] = useState<ReviewRequestStatus | null>(null);

  const submit = async () => {
    setError('');
    setSuccessCode('');

    if (requesterName.trim().length < 2) {
      setError('اكتب اسم مقدم المساهمة.');
      return;
    }
    if (proposedValue.trim().length < 3) {
      setError('اكتب التصحيح أو الإضافة المقترحة.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReviewRequest({
        person_id: linkedPersonId,
        request_type: requestType,
        requester_name: requesterName.trim(),
        requester_phone: requesterPhone.trim() || undefined,
        person_name: personName.trim() || undefined,
        proposed_value: proposedValue.trim(),
        source_details: sourceDetails.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccessCode(result.tracking_code);
      setTrackingCode(result.tracking_code);
      setProposedValue('');
      setSourceDetails('');
      setNotes('');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'تعذر إرسال المساهمة.');
    } finally {
      setSubmitting(false);
    }
  };

  const checkStatus = async () => {
    setError('');
    setTrackingResult(null);
    if (!trackingCode.trim()) {
      setError('اكتب رقم المتابعة أولًا.');
      return;
    }

    setChecking(true);
    try {
      setTrackingResult(await getReviewRequestStatus(trackingCode));
    } catch (trackingError) {
      setError(trackingError instanceof Error ? trackingError.message : 'لم يتم العثور على الطلب.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="people-circle" size={34} color={colors.white} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.title}>ساهم في توثيق النسب</Text>
              <Text style={styles.subtitle}>
                أرسل تصحيحًا أو اسمًا أو مصدرًا، وسيبقى الطلب قيد المراجعة قبل اعتماده.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>نوع المساهمة</Text>
          <View style={styles.typeGrid}>
            {requestTypes.map((item) => {
              const selected = requestType === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setRequestType(item.value)}
                  style={[styles.typeButton, selected && styles.typeButtonSelected]}
                >
                  <Ionicons
                    name={item.icon}
                    size={21}
                    color={selected ? colors.white : colors.primary}
                  />
                  <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.formCard}>
            <Field
              label="اسم مقدم المساهمة *"
              value={requesterName}
              onChangeText={setRequesterName}
              placeholder="الاسم الكامل"
            />
            <Field
              label="رقم التواصل"
              value={requesterPhone}
              onChangeText={setRequesterPhone}
              placeholder="اختياري"
              keyboardType="phone-pad"
            />
            <Field
              label="اسم الشخص المرتبط بالمعلومة"
              value={personName}
              onChangeText={setPersonName}
              placeholder="مثال: أحمد المهاجر"
            />
            <Field
              label="التصحيح أو الإضافة المقترحة *"
              value={proposedValue}
              onChangeText={setProposedValue}
              placeholder="اكتب المعلومة المقترحة بوضوح"
              multiline
            />
            <Field
              label="تفاصيل المصدر"
              value={sourceDetails}
              onChangeText={setSourceDetails}
              placeholder="اسم الوثيقة، المؤلف، الصفحة، أو وصف الصورة"
              multiline
            />
            <Field
              label="ملاحظات إضافية"
              value={notes}
              onChangeText={setNotes}
              placeholder="أي سياق يساعد لجنة المراجعة"
              multiline
            />

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!!successCode && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <View style={styles.successTextWrap}>
                  <Text style={styles.successTitle}>تم استلام مساهمتك</Text>
                  <Text selectable style={styles.successCode}>{successCode}</Text>
                  <Text style={styles.successHint}>احتفظ برقم المتابعة لمعرفة حالة الطلب.</Text>
                </View>
              </View>
            )}

            <Pressable
              disabled={submitting}
              onPress={submit}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                submitting && styles.buttonDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="send" size={19} color={colors.white} />
                  <Text style={styles.primaryButtonText}>إرسال للمراجعة</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>متابعة مساهمة سابقة</Text>
          <View style={styles.trackingCard}>
            <Field
              label="رقم المتابعة"
              value={trackingCode}
              onChangeText={setTrackingCode}
              placeholder="SHJ-000000-XXXXXX"
              autoCapitalize="characters"
            />
            <Pressable
              disabled={checking}
              onPress={checkStatus}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              {checking ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="search" size={18} color={colors.primary} />
                  <Text style={styles.secondaryButtonText}>فحص الحالة</Text>
                </>
              )}
            </Pressable>

            {!!trackingResult && (
              <View style={styles.trackingResult}>
                <Text style={styles.trackingResultTitle}>
                  {statusLabels[trackingResult.status] ?? trackingResult.status}
                </Text>
                <Text selectable style={styles.trackingResultCode}>{trackingResult.tracking_code}</Text>
                {!!trackingResult.person_name && (
                  <Text style={styles.trackingResultText}>{trackingResult.person_name}</Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.multiline]}
        textAlign="right"
        textAlignVertical={multiline ? 'top' : 'center'}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 110 },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: 'row-reverse',
    gap: 14,
    padding: 20,
    ...shadow,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,.12)',
    borderRadius: 22,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  heroText: { flex: 1 },
  title: { color: colors.white, fontSize: 23, fontWeight: '900', textAlign: 'right' },
  subtitle: { color: '#D8E5DC', fontSize: 13, lineHeight: 22, marginTop: 5, textAlign: 'right' },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginBottom: 10, marginTop: 22, textAlign: 'right' },
  typeGrid: { flexDirection: 'row-reverse', gap: 8 },
  typeButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 7,
    justifyContent: 'center',
    minHeight: 84,
    padding: 10,
  },
  typeButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeLabel: { color: colors.primary, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  typeLabelSelected: { color: colors.white },
  formCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, marginTop: 14, padding: 18, ...shadow },
  trackingCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, padding: 18 },
  field: { marginBottom: 14 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800', marginBottom: 6, textAlign: 'right' },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.text, fontSize: 15, minHeight: 52, paddingHorizontal: 14 },
  multiline: { minHeight: 112, paddingTop: 13 },
  errorBox: { alignItems: 'center', backgroundColor: '#F8E6E6', borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, marginBottom: 14, padding: 12 },
  errorText: { color: colors.danger, flex: 1, fontSize: 13, textAlign: 'right' },
  successBox: { alignItems: 'flex-start', backgroundColor: '#E5F1E8', borderRadius: radius.md, flexDirection: 'row-reverse', gap: 10, marginBottom: 14, padding: 14 },
  successTextWrap: { flex: 1 },
  successTitle: { color: colors.success, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  successCode: { color: colors.primary, fontSize: 16, fontWeight: '900', marginTop: 6, textAlign: 'right' },
  successHint: { color: colors.muted, fontSize: 12, marginTop: 4, textAlign: 'right' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, justifyContent: 'center', minHeight: 54 },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 8, justifyContent: 'center', minHeight: 50 },
  secondaryButtonText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  buttonPressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.6 },
  trackingResult: { backgroundColor: colors.goldSoft, borderRadius: radius.md, marginTop: 14, padding: 14 },
  trackingResultTitle: { color: colors.primary, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  trackingResultCode: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 5, textAlign: 'right' },
  trackingResultText: { color: colors.muted, fontSize: 13, marginTop: 5, textAlign: 'right' },
});
