import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { changeAdminPassword, loginAdmin, logoutAdmin, useAdminSession, verifyAdminSession } from '../src/lib/adminSession';
import { colors, radius } from '../src/theme';

export default function AdministrationScreen() {
  const isAdmin = useAdminSession();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useFocusEffect(useCallback(() => {
    void verifyAdminSession();
  }, []));

  async function login() {
    if (busy) return;
    setError('');
    if (!username.trim() || !password) return setError('أدخل اسم المستخدم وكلمة المرور.');
    setBusy(true);
    try {
      await loginAdmin(username, password);
      setPassword('');
      setMessage('تم تسجيل الدخول بصلاحيات الإدارة.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر تسجيل الدخول.');
    } finally { setBusy(false); }
  }

  async function changePassword() {
    if (busy) return;
    setError('');
    if (newPassword.length < 12) return setError('كلمة المرور الجديدة يجب ألا تقل عن 12 حرفًا.');
    setBusy(true);
    try {
      await changeAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordChange(false);
      setMessage('تم تغيير كلمة المرور؛ سجّل الدخول بالكلمة الجديدة.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر تغيير كلمة المرور.');
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await logoutAdmin();
      setMessage('تم تسجيل الخروج من الإدارة.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر تسجيل الخروج.');
    } finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel="العودة إلى حول التطبيق">
            <Ionicons name="arrow-forward-outline" size={21} color={colors.primary} />
            <Text style={styles.backText}>العودة إلى حول التطبيق</Text>
          </Pressable>

          <View style={styles.header}>
            <View style={styles.iconCircle}><Ionicons name="shield-checkmark-outline" size={35} color="#E9D8A7" /></View>
            <Text style={styles.title}>إدارة شجرة النسب الشريف</Text>
            <Text style={styles.subtitle}>الاعتماد والتعديل متاحان لمدير النظام فقط. التصفح وإرسال المقترحات متاحان للجميع.</Text>
          </View>

          {Boolean(error) && <Text style={styles.error}>{error}</Text>}
          {Boolean(message) && <Text style={styles.notice}>{message}</Text>}

          {!isAdmin ? (
            <View style={styles.card}>
              <Text style={styles.section}>تسجيل دخول الإدارة</Text>
              <Text style={styles.label}>اسم المستخدم</Text>
              <TextInput autoCapitalize="none" autoCorrect={false} accessibilityLabel="اسم مستخدم الإدارة"
                value={username} onChangeText={setUsername} style={styles.input} textAlign="right" placeholder="admin" />
              <Text style={styles.label}>كلمة المرور</Text>
              <TextInput secureTextEntry autoCapitalize="none" autoCorrect={false} accessibilityLabel="كلمة مرور الإدارة"
                value={password} onChangeText={setPassword} style={styles.input} textAlign="right"
                placeholder="أدخل كلمة مرور الإدارة" onSubmitEditing={() => void login()} />
              <Pressable disabled={busy} onPress={() => void login()} style={styles.primary}>
                {busy ? <ActivityIndicator color="white" /> : <Ionicons name="log-in-outline" size={20} color="white" />}
                <Text style={styles.primaryText}>دخول الإدارة</Text>
              </Pressable>
              <Text style={styles.hint}>جلسة آمنة ومؤقتة، لا تُحفظ كلمة المرور على الجهاز.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.connected}>
                <Ionicons name="checkmark-circle" size={24} color="#29744E" />
                <Text style={styles.connectedText}>مسجل الدخول: admin — مدير النظام</Text>
              </View>

              <Text style={styles.section}>صلاحيات الإدارة</Text>
              <Text style={styles.hint}>مراجعة واعتماد الأسماء والعلاقات، وتعديل البيانات والصور، وإضافة الأبناء أو حذفهم.</Text>

              <Pressable onPress={() => router.push('/(tabs)/review')} style={styles.primary}>
                <Ionicons name="checkmark-done-outline" size={20} color="white" />
                <Text style={styles.primaryText}>فتح المراجعة والاعتماد</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(tabs)/tree')} style={styles.secondary}>
                <Ionicons name="git-network-outline" size={20} color={colors.primary} />
                <Text style={styles.secondaryText}>الانتقال للشجرة والتعديل</Text>
              </Pressable>

              <Pressable onPress={() => setShowPasswordChange(!showPasswordChange)} style={styles.secondary}>
                <Ionicons name="key-outline" size={20} color={colors.primary} />
                <Text style={styles.secondaryText}>تغيير كلمة المرور</Text>
              </Pressable>

              {showPasswordChange && (
                <View>
                  <Text style={styles.label}>كلمة المرور الحالية</Text>
                  <TextInput secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} style={styles.input} textAlign="right" />
                  <Text style={styles.label}>كلمة المرور الجديدة (12 حرفًا على الأقل)</Text>
                  <TextInput secureTextEntry value={newPassword} onChangeText={setNewPassword} style={styles.input} textAlign="right" />
                  <Pressable disabled={busy} onPress={() => void changePassword()} style={styles.primary}>
                    <Text style={styles.primaryText}>حفظ كلمة المرور الجديدة</Text>
                  </Pressable>
                </View>
              )}

              <Pressable disabled={busy} onPress={() => void logout()} style={styles.logout}>
                <Ionicons name="log-out-outline" size={20} color="#9F3636" />
                <Text style={styles.logoutText}>تسجيل خروج الإدارة</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 80 },
  back: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginBottom: 18 },
  backText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  header: { borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', padding: 24, marginBottom: 20 },
  iconCircle: { width: 74, height: 74, borderRadius: 22, borderWidth: 1, borderColor: '#8EA18E', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { color: 'white', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#D8E4D9', fontSize: 13, lineHeight: 23, textAlign: 'center', marginTop: 12 },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, backgroundColor: colors.surface, padding: 21 },
  section: { color: colors.primary, fontSize: 19, fontWeight: '900', textAlign: 'right', marginBottom: 14 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 7, marginTop: 12 },
  input: { height: 53, paddingHorizontal: 14, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: 'white' },
  primary: { minHeight: 54, borderRadius: 14, backgroundColor: colors.primary, marginTop: 18, flexDirection: 'row-reverse', gap: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  primaryText: { color: 'white', fontSize: 15, fontWeight: '900' },
  secondary: { minHeight: 51, marginTop: 10, flexDirection: 'row-reverse', gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 14, color: colors.primary, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 12, marginTop: 13, lineHeight: 21, textAlign: 'right' },
  error: { backgroundColor: '#FCE8E8', color: '#8C2424', padding: 13, borderRadius: 12, textAlign: 'right', marginBottom: 12 },
  notice: { backgroundColor: '#E6F5EC', color: '#26724B', padding: 13, borderRadius: 12, textAlign: 'right', marginBottom: 12 },
  connected: { alignItems: 'center', flexDirection: 'row-reverse', gap: 10, marginBottom: 17 },
  connectedText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  logout: { marginTop: 22, flexDirection: 'row-reverse', gap: 8, alignItems: 'center', justifyContent: 'center', padding: 15 },
  logoutText: { color: '#9F3636', fontWeight: '800', fontSize: 14 },
});
