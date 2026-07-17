import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow } from '../src/theme';

const SOURCE_URL = 'https://shajara.pm.sa/sources/sada-tree-source.jpg.b64';
const SOURCE_RATIO = 1979 / 1400;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3.5;
const ZOOM_STEP = 0.35;

export default function SourceChartScreen() {
  const { width } = useWindowDimensions();
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [base64, setBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(SOURCE_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((value) => {
        if (!active) return;
        setBase64(value.trim());
      })
      .catch(() => {
        if (!active) return;
        setError('تعذر تحميل صورة المشجرة الأصلية. اسحب الشاشة أو أعد فتحها بعد التأكد من الاتصال.');
      });

    return () => {
      active = false;
    };
  }, []);

  const imageSize = useMemo(() => {
    const baseWidth = Math.max(width - 24, 760);
    const imageWidth = baseWidth * zoom;
    return { width: imageWidth, height: imageWidth * SOURCE_RATIO };
  }, [width, zoom]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Ionicons name="document-attach" size={25} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>المشجرة الأصلية: السادة</Text>
            <Text style={styles.description}>
              استخدم التكبير والتحريك لمراجعة الاسم والسهم عند موضع انقطاع النسب. لا يعتمد أي ربط حتى يظهر الأب متصلًا بالاسم في المشجرة.
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable
            accessibilityLabel="تصغير المشجرة"
            disabled={zoom <= MIN_ZOOM}
            onPress={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
            style={({ pressed }) => [styles.controlButton, pressed && styles.pressed, zoom <= MIN_ZOOM && styles.disabled]}
          >
            <Ionicons name="remove" size={23} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => setZoom(MIN_ZOOM)} style={({ pressed }) => [styles.zoomValue, pressed && styles.pressed]}>
            <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="تكبير المشجرة"
            disabled={zoom >= MAX_ZOOM}
            onPress={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
            style={({ pressed }) => [styles.controlButton, pressed && styles.pressed, zoom >= MAX_ZOOM && styles.disabled]}
          >
            <Ionicons name="add" size={23} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {!base64 && !error ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>جاري تحميل المشجرة…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Ionicons name="alert-circle" size={34} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView horizontal bounces contentContainerStyle={styles.horizontalContent}>
          <ScrollView bounces contentContainerStyle={styles.verticalContent}>
            <Image
              accessibilityLabel="صورة مشجرة السادة الأصلية"
              resizeMode="contain"
              source={{ uri: `data:image/jpeg;base64,${base64}` }}
              style={imageSize}
            />
          </ScrollView>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  headerCard: { backgroundColor: colors.surface, borderRadius: radius.lg, margin: 12, padding: 14, ...shadow },
  headerRow: { alignItems: 'flex-start', flexDirection: 'row-reverse', gap: 10 },
  title: { color: colors.primary, fontSize: 18, fontWeight: '900', textAlign: 'right' },
  description: { color: colors.muted, fontSize: 11, lineHeight: 19, marginTop: 4, textAlign: 'right' },
  controls: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 12 },
  controlButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 54 },
  zoomValue: { alignItems: 'center', backgroundColor: colors.goldSoft, borderRadius: radius.pill, justifyContent: 'center', minHeight: 44, minWidth: 78, paddingHorizontal: 14 },
  zoomText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  stateBox: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center', padding: 28 },
  stateText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 22, textAlign: 'center' },
  horizontalContent: { alignItems: 'flex-start', paddingHorizontal: 12, paddingBottom: 20 },
  verticalContent: { alignItems: 'flex-start' },
});
