import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL } from '../../src/lib/api';
import { colors, radius, shadow } from '../../src/theme';

const features = [
  ['git-network', 'شجرة تفاعلية', 'تصفح الأجيال وافتح ملف كل شخص ومسار نسبه.'],
  ['search', 'بحث عربي', 'ابحث بالاسم أو اللقب مع نتائج سريعة وواضحة.'],
  ['document-text', 'توثيق المصادر', 'ربط الأسماء بالمشجرات والوثائق والمراجع المعتمدة.'],
  ['shield-checkmark', 'مراجعة محكمة', 'تمييز البيانات المؤكدة عن القراءات التي تحتاج إلى مراجعة.'],
] as const;

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandCard}>
          <View style={styles.logo}><Ionicons name="leaf" size={34} color={colors.white} /></View>
          <Text style={styles.title}>شجرة النسب الشريف</Text>
          <Text style={styles.subtitle}>منصة عائلية رقمية تحفظ النسب، وتوثق التاريخ، وتعين على صلة الرحم.</Text>
        </View>

        <Text style={styles.sectionTitle}>مميزات النسخة الأولى</Text>
        {features.map(([icon, title, description]) => (
          <View key={title} style={styles.featureCard}>
            <View style={styles.iconBox}><Ionicons name={icon} size={23} color={colors.primary} /></View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureDescription}>{description}</Text>
            </View>
          </View>
        ))}

        <View style={styles.technicalCard}>
          <Text style={styles.technicalTitle}>البيئة التقنية</Text>
          <Text style={styles.technicalText}>React Native + Expo SDK 57</Text>
          <Text style={styles.technicalText}>Laravel 13 API</Text>
          <Text selectable style={styles.apiText}>{API_URL}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 18, paddingBottom: 110 },
  brandCard: { alignItems: 'flex-end', backgroundColor: colors.primary, borderRadius: radius.lg, padding: 24, ...shadow },
  logo: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,.12)', borderRadius: 22, height: 64, justifyContent: 'center', width: 64 },
  title: { color: colors.white, fontSize: 28, fontWeight: '900', marginTop: 18, textAlign: 'right' },
  subtitle: { color: '#D9E5DD', fontSize: 14, lineHeight: 24, marginTop: 8, textAlign: 'right' },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: 12, marginTop: 24, textAlign: 'right' },
  featureCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 14, marginBottom: 10, padding: 16 },
  iconBox: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 16, height: 48, justifyContent: 'center', width: 48 },
  featureText: { flex: 1 },
  featureTitle: { color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'right' },
  featureDescription: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 3, textAlign: 'right' },
  technicalCard: { backgroundColor: colors.goldSoft, borderRadius: radius.md, marginTop: 14, padding: 18 },
  technicalTitle: { color: colors.primary, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  technicalText: { color: colors.text, marginTop: 7, textAlign: 'right' },
  apiText: { color: colors.muted, fontSize: 12, marginTop: 10, textAlign: 'left' },
});
