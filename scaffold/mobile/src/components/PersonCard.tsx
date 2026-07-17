import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow } from '../theme';
import type { Person, ReadingStatus } from '../types';

const statusConfig: Record<ReadingStatus, { label: string; color: string; background: string; icon: keyof typeof Ionicons.glyphMap }> = {
  readable: { label: 'مقروء بوضوح', color: colors.success, background: '#E4F1E7', icon: 'checkmark-circle' },
  review: { label: 'يحتاج مراجعة', color: '#8A661E', background: colors.goldSoft, icon: 'time' },
  unclear: { label: 'غير مقروء', color: colors.danger, background: '#F4DEDE', icon: 'alert-circle' },
};

type Props = {
  person: Person;
  onPress?: () => void;
  compact?: boolean;
};

export function PersonCard({ person, onPress, compact = false }: Props) {
  const status = statusConfig[person.status];
  const pending = person.approval_status === 'pending_supervisor' || person.is_provisional;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={person.full_name}
      onPress={onPress}
      style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        <Ionicons name="person" size={21} color={colors.white} />
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{person.full_name}</Text>
        {!!person.honorific && <Text style={styles.honorific}>{person.honorific}</Text>}

        <View style={styles.badges}>
          <View style={[styles.approval, pending ? styles.approvalPending : styles.approvalConfirmed]}>
            <Ionicons
              name={pending ? 'hourglass' : 'shield-checkmark'}
              size={13}
              color={pending ? '#8A661E' : colors.success}
            />
            <Text style={[styles.approvalText, { color: pending ? '#8A661E' : colors.success }]}>
              {pending ? 'بانتظار اعتماد المشرف' : 'معتمد من المشرف'}
            </Text>
          </View>

          {!compact && (
            <View style={[styles.status, { backgroundColor: status.background }]}>
              <Ionicons name={status.icon} size={13} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-back" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 11,
    padding: 15,
    ...shadow,
  },
  compact: { paddingVertical: 12 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 23,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  content: { alignItems: 'flex-end', flex: 1 },
  name: { color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'right' },
  honorific: { color: colors.muted, fontSize: 13, marginTop: 2, textAlign: 'right' },
  badges: { alignItems: 'flex-end', gap: 6, marginTop: 9 },
  approval: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row-reverse',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  approvalPending: { backgroundColor: colors.goldSoft },
  approvalConfirmed: { backgroundColor: '#E4F1E7' },
  approvalText: { fontSize: 10, fontWeight: '900' },
  status: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row-reverse',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: { fontSize: 10, fontWeight: '800' },
});
