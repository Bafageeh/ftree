import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getChartEdges, getPeople } from '../lib/api';
import { colors, radius } from '../theme';
import type { ChartEdge, Person } from '../types';

export function PersonLineageContextCard({ person }: { person: Person }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [edges, setEdges] = useState<ChartEdge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getPeople(), getChartEdges()])
      .then(([nextPeople, nextEdges]) => {
        if (!mounted) return;
        setPeople(nextPeople);
        setEdges(nextEdges);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const context = useMemo(() => {
    const byId = new Map(people.map((item) => [item.id, item]));
    const byCode = new Map(people.filter((item) => item.source_code).map((item) => [item.source_code as string, item]));
    const incoming = edges
      .filter((edge) => edge.to_source_key === person.source_code && edge.approval_status !== 'rejected')
      .sort((a, b) => b.confidence - a.confidence)[0];
    const actualParent = person.lineage_parent_id ? byId.get(person.lineage_parent_id) : undefined;
    const parent = actualParent ?? (incoming ? byCode.get(incoming.from_source_key) : undefined);
    const parentPending = !actualParent && !!parent;

    const parentIncoming = parent?.source_code
      ? edges.filter((edge) => edge.to_source_key === parent.source_code && edge.approval_status !== 'rejected').sort((a, b) => b.confidence - a.confidence)[0]
      : undefined;
    const grandfather = parent?.lineage_parent_id
      ? byId.get(parent.lineage_parent_id)
      : parentIncoming ? byCode.get(parentIncoming.from_source_key) : undefined;

    const actualChildren = people.filter((item) => item.lineage_parent_id === person.id);
    const inferredChildren = person.source_code
      ? edges.filter((edge) => edge.from_source_key === person.source_code && edge.approval_status !== 'rejected').map((edge) => byCode.get(edge.to_source_key)).filter((item): item is Person => !!item)
      : [];
    const children = [...new Map([...actualChildren, ...inferredChildren].map((item) => [item.id, item])).values()];

    return { parent, parentPending, grandfather, children, branch: person.chart_branch ?? parent?.chart_branch };
  }, [edges, people, person]);

  return (
    <View style={styles.card}>
      <View style={styles.header}><Ionicons name="git-network" size={22} color={colors.gold} /><Text style={styles.title}>موضعه في شجرة النسب</Text></View>
      {loading ? <ActivityIndicator color={colors.primary} /> : (
        <>
          <Text style={styles.branch}>{branchLabel(context.branch)}</Text>
          <View style={styles.chain}>
            {context.grandfather && <><Node label="الجد" person={context.grandfather} /><Arrow /></>}
            {context.parent
              ? <Node label={context.parentPending ? 'الأب المقترح من السهم — بانتظار الاعتماد' : 'الأب'} person={context.parent} pending={context.parentPending} />
              : <View style={styles.missing}><Text style={styles.missingTitle}>الأب غير محدد بعد</Text><Text style={styles.missingText}>لا تعتمد النسب حتى تُقرأ العلاقة المتصلة بهذا الاسم.</Text></View>}
            <Arrow />
            <Node label="الاسم الجاري مراجعته" person={person} selected />
            {!!context.children.length && <><Arrow /><Text style={styles.childrenTitle}>{context.children.length === 1 ? 'الابن' : 'الأبناء'}</Text>{context.children.map((child) => <Node key={child.id} label="" person={child} />)}</>}
          </View>
          <Text style={styles.note}>راجع اسم الأب ورمزه والفرع قبل اعتماد الاسم، خصوصًا عند تكرار الاسم في أكثر من جيل.</Text>
        </>
      )}
    </View>
  );
}

function Node({ label, person, selected = false, pending = false }: { label: string; person: Person; selected?: boolean; pending?: boolean }) {
  return <View style={[styles.node, selected && styles.selected, pending && styles.pending]}>{!!label && <Text style={[styles.label, selected && styles.selectedLabel, pending && styles.pendingLabel]}>{label}</Text>}<Text style={[styles.name, selected && styles.selectedName]}>{person.full_name}</Text><Text style={[styles.code, selected && styles.selectedCode]}>{person.source_code ?? `#${person.id}`}</Text></View>;
}
function Arrow() { return <Ionicons name="arrow-down" size={22} color={colors.gold} />; }
function branchLabel(branch?: string | null) {
  const labels: Record<string, string> = { central_trunk: 'الجذع الأوسط', alawi_faqih: 'فرع علوي بن الفقيه المقدم', ali_alawi_faqih: 'فرع علي بن علوي بن الفقيه المقدم', abdullah_alawi_faqih: 'فرع عبد الله بن علوي بن الفقيه المقدم', ahmad_faqih: 'فرع أحمد بن الفقيه المقدم', ali_faqih: 'فرع علي بن الفقيه المقدم', abdulrahman_faqih: 'فرع عبد الرحمن بن الفقيه المقدم' };
  return branch ? labels[branch] ?? `الفرع: ${branch}` : 'الفرع غير محدد بعد';
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: radius.lg, borderWidth: 1.5, marginTop: 14, padding: 18 }, header: { alignItems: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 12 }, title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  branch: { color: '#8A661E', fontSize: 13, fontWeight: '900', marginBottom: 10, textAlign: 'center' }, chain: { alignItems: 'center', backgroundColor: '#FAF7EF', borderRadius: radius.md, gap: 5, padding: 12 },
  node: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, padding: 10, width: '88%' }, selected: { backgroundColor: colors.primary, borderColor: colors.gold }, pending: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  label: { color: colors.muted, fontSize: 11, fontWeight: '900', textAlign: 'center' }, selectedLabel: { color: '#E8C977' }, pendingLabel: { color: '#855F15' }, name: { color: colors.primary, fontSize: 17, fontWeight: '900', marginTop: 3, textAlign: 'center' }, selectedName: { color: colors.white },
  code: { color: '#8A661E', fontSize: 10, fontWeight: '800', marginTop: 3 }, selectedCode: { color: '#E8C977' }, missing: { alignItems: 'center', backgroundColor: colors.goldSoft, borderRadius: radius.md, padding: 12, width: '88%' }, missingTitle: { color: '#835D14', fontSize: 15, fontWeight: '900' }, missingText: { color: colors.text, fontSize: 11, lineHeight: 18, marginTop: 5, textAlign: 'center' },
  childrenTitle: { color: colors.muted, fontSize: 11, fontWeight: '900' }, note: { color: colors.text, fontSize: 12, lineHeight: 20, marginTop: 10, textAlign: 'right' },
});
