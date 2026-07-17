import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SupervisorReviewBoard } from '../../src/components/SupervisorReviewBoard';
import { colors, radius } from '../../src/theme';

export default function ReviewScreen() {
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
