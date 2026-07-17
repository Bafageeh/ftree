import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow } from '../../theme';

type Props = {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

export function TreeZoomToolbar({
  zoom,
  minZoom,
  maxZoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
  onExpandAll,
  onCollapseAll,
}: Props) {
  return (
    <>
      <View style={styles.actionsRow}>
        <Pressable onPress={onExpandAll} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
          <Ionicons name="expand" size={18} color={colors.primary} />
          <Text style={styles.actionText}>فتح الجميع</Text>
        </Pressable>
        <Pressable onPress={onCollapseAll} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
          <Ionicons name="contract" size={18} color={colors.primary} />
          <Text style={styles.actionText}>إغلاق الجميع</Text>
        </Pressable>
      </View>

      <View style={styles.zoomBar}>
        <Pressable
          accessibilityLabel="تكبير الشجرة"
          disabled={zoom >= maxZoom}
          onPress={onZoomIn}
          style={({ pressed }) => [styles.zoomButton, pressed && styles.pressed, zoom >= maxZoom && styles.disabled]}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>

        <Pressable accessibilityLabel="إعادة التكبير إلى مئة بالمئة" onPress={onReset} style={({ pressed }) => [styles.zoomValue, pressed && styles.pressed]}>
          <Text style={styles.zoomValueText}>{Math.round(zoom * 100)}%</Text>
          <Text style={styles.zoomValueHint}>إعادة</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="تصغير الشجرة"
          disabled={zoom <= minZoom}
          onPress={onZoomOut}
          style={({ pressed }) => [styles.zoomButton, pressed && styles.pressed, zoom <= minZoom && styles.disabled]}
        >
          <Ionicons name="remove" size={24} color={colors.primary} />
        </Pressable>

        <Pressable accessibilityLabel="ملاءمة الشجرة لعرض الشاشة" onPress={onFit} style={({ pressed }) => [styles.fitButton, pressed && styles.pressed]}>
          <Ionicons name="scan-outline" size={18} color={colors.primary} />
          <Text style={styles.fitText}>ملاءمة</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row-reverse', gap: 9, marginBottom: 9 },
  actionButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flex: 1, flexDirection: 'row-reverse', gap: 7, justifyContent: 'center', minHeight: 44, ...shadow },
  actionText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  zoomBar: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 7, marginBottom: 11, padding: 6, ...shadow },
  zoomButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 15, height: 42, justifyContent: 'center', width: 48 },
  zoomValue: { alignItems: 'center', backgroundColor: colors.goldSoft, borderRadius: 14, height: 42, justifyContent: 'center', minWidth: 74, paddingHorizontal: 10 },
  zoomValueText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  zoomValueHint: { color: colors.muted, fontSize: 8, marginTop: 1 },
  fitButton: { alignItems: 'center', backgroundColor: '#F3EFE4', borderRadius: 14, flex: 1, flexDirection: 'row-reverse', gap: 6, height: 42, justifyContent: 'center' },
  fitText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.32 },
});
