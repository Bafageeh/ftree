import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getPeople } from '../lib/api';
import { colors, radius } from '../theme';
import type { Person } from '../types';

export function PersonLineageContextCard({ person }: { person: Person }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getPeople().then((items) => mounted && setPeople(items)).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const { parent, grandfather, children } = useMemo(() => {
    const byId = new Map(people.map((item) => [item.id, item]));
    const parent = person.lineage_parent_id ? byId.get(person.lineage_parent_id) : undefined;
    const grandfather = parent?.lineage_parent_id ? byId.get(parent.lineage_parent_id) : undefined;
    return {
      parent,
      grandfather,
      children: people.filter((item) => item.lineage_parent_id === person.id),
    };
  }, [people, person]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="git-network" size={22} color={colors.gold} />
        <Text style={styles.title}>موضعه في شجرة النسب</Text>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} /> : (
        <>
          <Text style={styles.branch}>{branchLabel(person.chart_branch)}</Text>
          <View style={styles.chain}>
            {grandfather && <><Node label="الجد" person={grandfather} /><Arrow /></>}
            {parent
              ? <Node label="الأب" person={parent} />
              : <View style={styles.missing}><Text style={styles.missingTitle}>الأب غير محدد بعد</Text><Text style={styles.missingText}>راجع السهم المتصل بهذا الاسم في تبويب العلاقات قبل اعتماد النسب.</Text></View>}
            <Arrow />
            <Node label="الاسم الجاري مراجعته" person={person} selected />
            {!!children.length && <><Arrow /><Text style={styles.childrenTitle}>{children.length === 1 ? 'الابن' : 'الأبناء'}</Text>{children.map((child) => <Node key={child.id} label="" person={child} />)}</>}
          </View>
          <Text style={styles.note}>راجع الأب والرمز والفرع، خصوصًا عند تكرار الاسم في أكثر من جيل.</Text>
        </>
      )}
    </View>
  );
}

function Node({ label, person, selected = false }: { label: string; person: Person; selected?: boolean }) {
  return <View style={[styles.node, selected && styles.selected]}>{!!label && <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>}<Text style={[styles.name, selected && styles.selectedName]}>{person.full_name}</Text><Text style={[styles.code, selected && styles.selectedCode]}>{person.source_code ?? `#${person.id}`}</Text></View>;
}

function Arrow() { return <Ionicons name="arrow-down" size={22} color={colors.gold} />; }

function branchLabel(branch?: string | null) {
  const labels: Record<string, string> = {
    central_trunk: 'الجذع الأوسط', alawi_faqih: 'فرع علوي بن الفقيه المقدم', ali_alawi_faqih: 'فرع علي بن علوي بن الفقيه المقدم',
    abdullah_alawi_faqih: 'فرع عبد الله بن علوي بن الفقيه المقدم', ahmad_faqih: 'فرع أحمد بن الفقيه المقدم', ali_faqih: 'فرع علي بن الفقيه المقدم', abdulrahman_faqih: 'فرع عبد الرحمن بن الفقيه المقدم',
  };
  return branch ? labels[branch] ?? `الفرع: ${branch}` : 'الفرع غير محدد بعد';
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: radius.lg, borderWidth: 1.5, marginTop: 14, padding: 18 },
  header: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 12 }, title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  branch: { color: '#8A661E', fontSize: 13, fontWeight: '900', marginBottom: 10, textAlign: 'center' }, chain: { alignItems: 'center', backgroundColor: '#FAF7EF', borderRadius: radius.md, gap: 5, padding: 12 },
  node: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, padding: 10, width: '88%' }, selected: { backgroundColor: colors.primary, borderColor: colors.gold },
  label: { color: colors.muted, fontSize: 11, fontWeight: '900' }, selectedLabel: { color: '#E8C977' }, name: { color: colors.primary, fontSize: 17, fontWeight: '900', marginTop: 3, textAlign: 'center' }, selectedName: { color: colors.white },
  code: { color: '#8A661E', fontSize: 10, fontWeight: '800', marginTop: 3 }, selectedCode: { color: '#E8C977' },
  missing: { alignItems: 'center', backgroundColor: colors.goldSoft, borderRadius: radius.md, padding: 12, width: '88%' }, missingTitle: { color: '#835D14', fontSize: 15, fontWeight: '900' }, missingText: { color: colors.text, fontSize: 11, lineHeight: 18, marginTop: 5, textAlign: 'center' },
  childrenTitle: { color: colors.muted, fontSize: 11, fontWeight: '900' }, note: { color: colors.text, fontSize: 12, lineHeight: 20, marginTop: 10, textAlign: 'right' },
});
