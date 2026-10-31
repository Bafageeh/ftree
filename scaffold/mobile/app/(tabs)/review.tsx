import { router as adminRoute } from 'expo-router';
import { Pressable as AdminPressable, View as AdminView, Text as AdminText } from 'react-native';
import { useAdminSession } from '../../src/lib/adminSession';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SupervisorReviewBoard } from '../../src/components/SupervisorReviewBoard';
import { colors, radius } from '../../src/theme';

function ActualReviewScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>مراجعة الأنساب المتصلة</Text>
        <Text style={styles.noticeText}>تعرض هذه الشاشة فقط الأسماء والعلاقات التي يصل مسارها إلى سيد البشر محمد ﷺ.</Text>
      </View>
      <View style={styles.board}><SupervisorReviewBoard /></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  notice: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, marginHorizontal: 18, marginTop: 8, padding: 14 },
  noticeTitle: { color: colors.primary, fontSize: 17, fontWeight: '900', textAlign: 'right' },
  noticeText: { color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 4, textAlign: 'right' },
  board: { flex: 1 },
});

export default function ReviewScreen() {
  const authenticated = useAdminSession();
  return authenticated ? <ActualReviewScreen /> : (
    <AdminView style={{ flex: 1, padding: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8F3', gap: 18 }}>
      <AdminText style={{ fontSize: 21, fontWeight: '900', color: '#183F32', textAlign: 'center' }}>المراجعة والاعتماد للمدير فقط</AdminText>
      <AdminText style={{ textAlign: 'center', color: '#637568', lineHeight: 24 }}>
        يُسمح للجميع بمشاهدة الشجرة وإرسال مقترحات التصحيح. اعتماد البيانات أو تعديلها يتطلب دخول الإدارة.
      </AdminText>
      <AdminPressable accessibilityRole="button" onPress={() => adminRoute.push('/admin')}
        style={{ borderRadius: 14, backgroundColor: '#183F32', paddingHorizontal: 25, paddingVertical: 16 }}>
        <AdminText style={{ color: 'white', fontWeight: '900' }}>دخول الإدارة</AdminText>
      </AdminPressable>
    </AdminView>
  );
}
