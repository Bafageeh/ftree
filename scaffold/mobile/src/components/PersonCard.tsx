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

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}
    >
      <View style={styles.generation}>
        <Text style={styles.generationText}>{person.generation}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{person.full_name}</Text>
        {!!person.honorific && <Text style={styles.honorific}>{person.honorific}</Text>}
        {!compact && (
          <View style={[styles.status, { backgroundColor: status.background }]}>
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        )}
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
    gap: 12,
    padding: 16,
    ...shadow,
  },
  compact: {
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  generation: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  generationText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  content: {
    alignItems: 'flex-end',
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  honorific: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'right',
  },
  status: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row-reverse',
    gap: 5,
    marginTop: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
