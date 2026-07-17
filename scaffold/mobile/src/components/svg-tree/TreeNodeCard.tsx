import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, shadow } from '../../theme';
import type { Person } from '../../types';
import type { PositionedNode } from './layout';

type Props = {
  node: PositionedNode;
  zoom: number;
  selected: boolean;
  expanded: boolean;
  childCount: number;
  branchLabel?: string | null;
  onPress: () => void;
  onLongPress: () => void;
};

export function TreeNodeCard({
  node,
  zoom,
  selected,
  expanded,
  childCount,
  branchLabel,
  onPress,
  onLongPress,
}: Props) {
  const person = node.person;
  const prophet = person.source_code === 'CORE-001';
  const accent = person.chart_color || colors.gold;
  const status = nodeStatus(person);
  const hasChildren = childCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: hasChildren ? expanded : undefined }}
      accessibilityLabel={`${person.full_name}${hasChildren ? `، ${childCount} أبناء` : ''}`}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.node,
        {
          left: node.x * zoom,
          top: node.y * zoom,
          width: node.width * zoom,
          height: node.height * zoom,
          borderTopColor: accent,
          borderRadius: 20 * zoom,
          borderTopWidth: Math.max(3, 5 * zoom),
          padding: 12 * zoom,
        },
        prophet && styles.prophetNode,
        selected && styles.selectedNode,
        pressed && styles.nodePressed,
      ]}
    >
      <View style={[styles.header, { gap: 9 * zoom }]}>
        <View style={[
          styles.personIcon,
          {
            borderRadius: 17 * zoom,
            height: 34 * zoom,
            width: 34 * zoom,
          },
          prophet && styles.prophetIcon,
        ]}>
          <Ionicons
            name={prophet ? 'star' : 'person'}
            size={18 * zoom}
            color={prophet ? colors.primary : colors.white}
          />
        </View>

        <View style={styles.identity}>
          {prophet && <Text style={[styles.prophetLabel, { fontSize: 9 * zoom }]}>أصل الشجرة</Text>}
          <Text
            numberOfLines={2}
            style={[
              styles.name,
              { fontSize: 15 * zoom, lineHeight: 21 * zoom },
              prophet && styles.prophetName,
              prophet && { fontSize: 18 * zoom },
            ]}
          >
            {person.full_name}
          </Text>
          <Text style={[styles.code, { fontSize: 9 * zoom, marginTop: 2 * zoom }, prophet && styles.prophetMeta]}>
            {person.source_code ?? `#${person.id}`}
          </Text>
        </View>

        <View style={[
          styles.expandButton,
          {
            borderRadius: 18 * zoom,
            height: 36 * zoom,
            width: 36 * zoom,
          },
          expanded && styles.expandButtonOpen,
          !hasChildren && styles.expandButtonLeaf,
        ]}>
          <Ionicons
            name={!hasChildren ? 'ellipse' : expanded ? 'chevron-up' : 'chevron-down'}
            size={(hasChildren ? 20 : 9) * zoom}
            color={expanded ? colors.white : prophet ? colors.white : colors.primary}
          />
        </View>
      </View>

      <View style={[styles.footer, { gap: 8 * zoom, marginTop: 9 * zoom }]}>
        <View style={[
          styles.statusPill,
          {
            backgroundColor: status.soft,
            paddingHorizontal: 9 * zoom,
            paddingVertical: 5 * zoom,
          },
        ]}>
          <Text style={[styles.statusText, { color: status.color, fontSize: 9 * zoom }]}>{status.label}</Text>
        </View>

        {hasChildren ? (
          <Text style={[styles.childrenText, { fontSize: 9 * zoom }, prophet && styles.prophetMeta]}>
            {childCount} {childCount === 1 ? 'ابن' : 'أبناء'} · {expanded ? 'إخفاء' : 'استعراض'}
          </Text>
        ) : (
          <Text style={[styles.leafText, { fontSize: 9 * zoom }, prophet && styles.prophetMeta]}>نهاية الفرع</Text>
        )}
      </View>

      {!!branchLabel && branchLabel !== 'الجذع الأوسط' && (
        <Text
          numberOfLines={1}
          style={[styles.branch, { fontSize: 9 * zoom, marginTop: 5 * zoom }, prophet && styles.prophetMeta]}
        >
          {branchLabel}
        </Text>
      )}
    </Pressable>
  );
}

function nodeStatus(person: Person) {
  if (person.status === 'unclear') {
    return { label: 'غير محسومة', color: '#686E69', soft: '#ECEDEA' };
  }
  if (person.approval_status === 'supervisor_confirmed' && !person.is_provisional) {
    return { label: 'معتمد', color: colors.success, soft: '#E4F2E8' };
  }
  return { label: 'بانتظار المشرف', color: '#A87518', soft: '#F8EDCF' };
}

const styles = StyleSheet.create({
  node: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, position: 'absolute', ...shadow },
  nodePressed: { opacity: 0.82 },
  prophetNode: { backgroundColor: colors.primary, borderColor: colors.gold },
  selectedNode: { borderColor: colors.gold, borderWidth: 2.5 },
  header: { alignItems: 'center', flexDirection: 'row-reverse' },
  personIcon: { alignItems: 'center', backgroundColor: colors.primary, justifyContent: 'center' },
  prophetIcon: { backgroundColor: colors.goldSoft },
  identity: { flex: 1 },
  prophetLabel: { color: '#E8C977', fontWeight: '900', textAlign: 'right' },
  name: { color: colors.primary, fontWeight: '900', textAlign: 'right' },
  prophetName: { color: colors.white },
  code: { color: '#8A661E', fontWeight: '800', textAlign: 'right' },
  prophetMeta: { color: '#DDE8E4' },
  expandButton: { alignItems: 'center', backgroundColor: colors.primarySoft, justifyContent: 'center' },
  expandButtonOpen: { backgroundColor: colors.primary },
  expandButtonLeaf: { backgroundColor: '#EEF0EB' },
  footer: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  statusPill: { borderRadius: 999 },
  statusText: { fontWeight: '900' },
  childrenText: { color: colors.primary, fontWeight: '900' },
  leafText: { color: colors.muted },
  branch: { color: '#8A661E', fontWeight: '800', textAlign: 'right' },
});
