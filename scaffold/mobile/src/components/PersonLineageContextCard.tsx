import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme';
import type { Person } from '../types';

export function PersonLineageContextCard({ person, path }: { person: Person; path: Person[] }) {
  const connected = path[0]?.source_code === 'CORE-001' && path[path.length - 1]?.id === person.id;

  if (!connected) {
    return (
      <View style={[styles.card, styles.blockedCard]}>
        <View style={styles.header}>
          <Ionicons name="close-circle" size={22} color={colors.danger} />
          <Text style={[styles.title, styles.blockedTitle]}>النسب غير معروض</Text>
        </View>
        <Text style={styles.blockedText}>أُلغي هذا الاسم من الشجرة لأنه لا يملك مسار آباء متصلًا بسيد البشر محمد ﷺ.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="git-network" size={22} color={colors.gold} />
        <Text style={styles.title}>صلته بسيد البشر محمد ﷺ</Text>
      </View>

      <Text style={styles.branch}>{branchLabel(person.chart_branch)}</Text>
      <View style={styles.chain}>
        {path.map((node, index) => {
          const prophet = node.source_code === 'CORE-001';
          const selected = node.id === person.id;
          const pending = node.approval_status !== 'supervisor_confirmed';

          return (
            <View key={node.id} style={styles.stepWrap}>
              <View style={[styles.node, prophet && styles.prophet, selected && styles.selected, pending && !prophet && styles.pending]}>
                {prophet && <Text style={styles.prophetLabel}>الأصل النبوي</Text>}
                {selected && !prophet && <Text style={styles.selectedLabel}>الشخص المختار</Text>}
                <Text style={[styles.name, (prophet || selected) && styles.highlightedName]}>{node.full_name}</Text>
                <Text style={[styles.status, (prophet || selected) && styles.highlightedStatus]}>
                  {pending ? 'تحتاج اعتماد المشرف' : 'علاقة معتمدة'}
                </Text>
              </View>
              {index < path.length - 1 && <Ionicons name="arrow-down" size={22} color={colors.gold} />}
            </View>
          );
        })}
      </View>

      <Text style={styles.note}>هذه هي السلسلة الكاملة المسجلة من محمد ﷺ حتى {person.full_name}. ولا يظهر في التطبيق أي اسم لا يصل مساره إلى الأصل النبوي.</Text>
    </View>
  );
}

function branchLabel(branch?: string | null) {
  const labels: Record<string, string> = {
    central_trunk: 'الجذع الأوسط',
    alawi_faqih: 'فرع علوي بن الفقيه المقدم',
    ali_alawi_faqih: 'فرع علي بن علوي بن الفقيه المقدم',
    abdullah_alawi_faqih: 'فرع عبد الله بن علوي بن الفقيه المقدم',
    ahmad_faqih: 'فرع أحمد بن الفقيه المقدم',
    ali_faqih: 'فرع علي بن الفقيه المقدم',
    abdulrahman_faqih: 'فرع عبد الرحمن بن الفقيه المقدم',
  };

  return branch ? labels[branch] ?? `الفرع: ${branch}` : 'الفرع غير محدد';
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: radius.lg, borderWidth: 1.5, marginTop: 14, padding: 18 },
  header: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 12 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  branch: { color: '#8A661E', fontSize: 13, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  chain: { alignItems: 'center', backgroundColor: '#FAF7EF', borderRadius: radius.md, padding: 12 },
  stepWrap: { alignItems: 'center', width: '100%' },
  node: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, padding: 10, width: '90%' },
  prophet: { backgroundColor: colors.primary, borderColor: colors.gold },
  selected: { backgroundColor: colors.primary, borderColor: colors.gold },
  pending: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  prophetLabel: { color: '#E8C977', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  selectedLabel: { color: '#E8C977', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  name: { color: colors.primary, fontSize: 17, fontWeight: '900', marginTop: 3, textAlign: 'center' },
  highlightedName: { color: colors.white },
  status: { color: colors.muted, fontSize: 10, marginTop: 4 },
  highlightedStatus: { color: '#DDE8E4' },
  note: { color: colors.text, fontSize: 12, lineHeight: 20, marginTop: 10, textAlign: 'right' },
  blockedCard: { borderColor: colors.danger },
  blockedTitle: { color: colors.danger },
  blockedText: { color: colors.text, fontSize: 13, lineHeight: 22, textAlign: 'right' },
});
