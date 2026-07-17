import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme';
import type { Person } from '../types';

export function PersonLineageContextCard({ person, path }: { person: Person; path: Person[] }) {
  const [open, setOpen] = useState(false);
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
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      >
        <View style={styles.headerTextWrap}>
          <View style={styles.titleLine}>
            <Ionicons name="git-network" size={22} color={colors.gold} />
            <Text style={styles.title}>صلته بسيد البشر محمد ﷺ</Text>
          </View>
          <Text style={styles.closedHint}>{open ? 'اضغط لإغلاق السلسلة' : 'اضغط لعرض سلسلة النسب الكاملة'}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={23} color={colors.primary} />
      </Pressable>

      {open && (
        <View style={styles.expandedContent}>
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
      )}
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
  card: { backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: radius.lg, borderWidth: 1.5, marginTop: 14, overflow: 'hidden' },
  toggle: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', minHeight: 82, paddingHorizontal: 18, paddingVertical: 15 },
  pressed: { opacity: 0.72 },
  headerTextWrap: { flex: 1 },
  titleLine: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'right' },
  closedHint: { color: colors.muted, fontSize: 11, marginTop: 5, textAlign: 'right' },
  expandedContent: { borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth, padding: 18 },
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
  blockedCard: { borderColor: colors.danger, padding: 18 },
  header: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 12 },
  blockedTitle: { color: colors.danger },
  blockedText: { color: colors.text, fontSize: 13, lineHeight: 22, textAlign: 'right' },
});
