import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SupervisorReviewBoard } from '../../src/components/SupervisorReviewBoard';
import { colors, radius, shadow } from '../../src/theme';

export default function ReviewScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.shortcutWrap}>
        <Pressable onPress={() => router.push('/lineage-gaps')} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}>
          <View style={[styles.iconBox, styles.dangerIconBox]}><Ionicons name="git-compare" size={24} color={colors.danger} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.shortcutTitle, styles.dangerTitle]}>منقطعة النسب</Text>
            <Text style={styles.shortcutText}>عرض الاسم الذي تنقطع عنده الشجرة مع السلسلة المعروفة واقتراح الأب من أسهم المشجرة.</Text>
          </View>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>

        <Pressable onPress={() => router.push('/source-chart')} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}>
          <View style={[styles.iconBox, styles.sourceIconBox]}><Ionicons name="document-attach" size={24} color={colors.gold} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shortcutTitle}>المشجرة الأصلية: السادة</Text>
            <Text style={styles.shortcutText}>فتح صورة الملف المرفوع مع التكبير والتحريك لمراجعة الاسم والسهم قبل اعتماد الأب.</Text>
          </View>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
      </View>
      <View style={styles.board}><SupervisorReviewBoard /></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  shortcutWrap: { gap: 10, paddingHorizontal: 18, paddingTop: 8 },
  shortcut: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#D9CFB4', borderRadius: radius.lg, borderWidth: 1.3, flexDirection: 'row-reverse', gap: 11, padding: 14, ...shadow },
  iconBox: { alignItems: 'center', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  dangerIconBox: { backgroundColor: '#F8E6E6' },
  sourceIconBox: { backgroundColor: colors.goldSoft },
  shortcutTitle: { color: colors.primary, fontSize: 17, fontWeight: '900', textAlign: 'right' },
  dangerTitle: { color: colors.danger },
  shortcutText: { color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 3, textAlign: 'right' },
  board: { flex: 1 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
});
