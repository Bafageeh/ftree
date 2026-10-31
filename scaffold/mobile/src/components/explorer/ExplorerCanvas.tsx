import { Ionicons } from '@expo/vector-icons';
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';
import type { ExplorerLayout, ExplorerNode } from '../../lib/treeExplorer';
import { NODE_H, NODE_W } from '../../lib/treeExplorer';
import { colors } from '../../theme';
import type { Person } from '../../types';

export type CanvasHandle = { fit: () => void; focus: (id: number) => void; zoom: (factor: number) => void };
type Props = {
  layout: ExplorerLayout; generationDepth: number; selectedId: number | null; focusId: number; onSelect: (person: Person) => void;
  onToggle: (node: ExplorerNode) => void; onFullscreen: () => void; fullscreen: boolean;
};
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const clamp = (value: number, min: number, max: number) => { 'worklet'; return Math.min(max, Math.max(min, value)); };

export const ExplorerCanvas = forwardRef<CanvasHandle, Props>(function ExplorerCanvas({ layout, generationDepth, selectedId, focusId, onSelect, onToggle, onFullscreen, fullscreen }, ref) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [zoomLabel, setZoomLabel] = useState(100);
  const tx = useSharedValue(0); const ty = useSharedValue(0); const scale = useSharedValue(1);
  const startX = useSharedValue(0); const startY = useSharedValue(0);
  const startScale = useSharedValue(1); const anchorX = useSharedValue(0); const anchorY = useSharedValue(0);
  const pinching = useSharedValue(false);
  const panning = useSharedValue(false);
  const lastGestureAt = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 0 : 230;
  const lastFocus = useRef<number | null>(null);
  const lastGenerationDepth = useRef(generationDepth);

  const setCamera = useCallback((x: number, y: number, nextScale: number) => {
    tx.value = withTiming(x, { duration }); ty.value = withTiming(y, { duration }); scale.value = withTiming(nextScale, { duration });
    setZoomLabel(Math.round(nextScale * 100));
  }, [duration, tx, ty, scale]);
  const centerNode = useCallback((id: number) => {
    const n = layout.nodes.find(n => n.person.id === id);
    if (!n || !viewport.width) return;
    const s = clamp(Math.min(1, (viewport.width - 40) / (NODE_W * 2 + 28)), 0.72, 1);
    setCamera(viewport.width / 2 - (n.x + NODE_W / 2) * s, 36 - n.y * s, s);
  }, [layout.nodes, viewport.width, setCamera]);
  const fit = useCallback(() => {
    if (!viewport.width || !layout.nodes.length) return;
    const s = clamp(Math.min((viewport.width - 32) / layout.width, (viewport.height - 92) / layout.height), 0.16, 1.15);
    setCamera((viewport.width - layout.width * s) / 2, Math.max(16, (viewport.height - 72 - layout.height * s) / 2), s);
  }, [viewport, layout, setCamera]);
  const zoom = useCallback((factor: number) => {
    const s = clamp(scale.value * factor, 0.16, 2.5);
    const ratio = s / scale.value;
    setCamera(viewport.width / 2 - (viewport.width / 2 - tx.value) * ratio, viewport.height / 2 - (viewport.height / 2 - ty.value) * ratio, s);
  }, [scale, tx, ty, setCamera, viewport]);
  useImperativeHandle(ref, () => ({ fit, focus: centerNode, zoom }), [fit, centerNode, zoom]);
  useEffect(() => {
    if (!viewport.width || !layout.nodes.length || lastFocus.current === focusId) return;
    lastFocus.current = focusId;
    centerNode(focusId);
  }, [focusId, viewport.width, layout.nodes.length, centerNode]);
  // Changing the generation count changes the graph dimensions, but not
  // the focusId. Re-fit the newly drawn tree so users can SEE the change.
  useEffect(() => {
    if (!viewport.width || !viewport.height || !layout.nodes.length) return;
    if (lastGenerationDepth.current === generationDepth) return;
    lastGenerationDepth.current = generationDepth;
    const frame = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(frame);
  }, [generationDepth, layout.nodes.length, viewport.width, viewport.height, fit]);

  // Recenter after a viewport change (rotation / resizing) without touching tree data.
  useEffect(() => { lastFocus.current = null; }, [viewport.width, viewport.height]);

  const pan = usePanGesture({
    minDistance: 7, maxPointers: 1,
    onActivate: () => { panning.value = true; startX.value = tx.value; startY.value = ty.value; },
    onUpdate: e => { lastGestureAt.value = Date.now(); if (!pinching.value) { tx.value = startX.value + e.translationX; ty.value = startY.value + e.translationY; } },
    onDeactivate: () => { lastGestureAt.value = Date.now(); panning.value = false; },
  });
  const pinch = usePinchGesture({
    onActivate: e => {
      pinching.value = true; startScale.value = scale.value;
      anchorX.value = (e.focalX - tx.value) / scale.value; anchorY.value = (e.focalY - ty.value) / scale.value;
    },
    onUpdate: e => {
      lastGestureAt.value = Date.now();
      const s = clamp(startScale.value * e.scale, 0.16, 2.5);
      scale.value = s; tx.value = e.focalX - anchorX.value * s; ty.value = e.focalY - anchorY.value * s;
    },
    onDeactivate: () => { lastGestureAt.value = Date.now(); },
    onFinalize: () => { pinching.value = false; runOnJS(setZoomLabel)(Math.round(scale.value * 100)); },
  });
  const gestures = useSimultaneousGestures(pan, pinch);
  const selectPerson = useCallback((person: Person) => {
    if (!panning.value && !pinching.value && Date.now() - lastGestureAt.value > 200) onSelect(person);
  }, [lastGestureAt, panning, pinching, onSelect]);
  const togglePerson = useCallback((node: ExplorerNode) => {
    if (!panning.value && !pinching.value && Date.now() - lastGestureAt.value > 200) onToggle(node);
  }, [lastGestureAt, panning, pinching, onToggle]);
  const camera = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }] }));
  const miniW = 108; const miniH = 76;
  const miniScale = Math.min((miniW - 12) / layout.width, (miniH - 12) / layout.height);
  const mx = (miniW - layout.width * miniScale) / 2; const my = (miniH - layout.height * miniScale) / 2;
  const miniViewport = useAnimatedProps(() => ({
    x: mx - tx.value / scale.value * miniScale, y: my - ty.value / scale.value * miniScale,
    width: viewport.width / scale.value * miniScale, height: viewport.height / scale.value * miniScale,
  }));
  const wheel = Platform.OS === 'web' ? {
    onWheel: (event: { nativeEvent: { deltaY: number; deltaX: number; ctrlKey?: boolean }; preventDefault?: () => void }) => {
      event.preventDefault?.();
      if (event.nativeEvent.ctrlKey) zoom(event.nativeEvent.deltaY > 0 ? 0.9 : 1.1);
      else { tx.value -= event.nativeEvent.deltaX || 0; ty.value -= event.nativeEvent.deltaY; }
    },
  } : {};

  const onLayout = (e: LayoutChangeEvent) => setViewport({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
  return <View style={s.canvas} onLayout={onLayout}>
    <Svg pointerEvents="none" width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs><Pattern id="explorer-dots" width={24} height={24} patternUnits="userSpaceOnUse"><Circle cx={2} cy={2} r={1} fill="#DCE3DC" /></Pattern></Defs>
      <Rect width="100%" height="100%" fill="url(#explorer-dots)" />
    </Svg>
    <GestureDetector gesture={gestures} touchAction="none">
      <Animated.View style={s.touchSurface} {...wheel}>
        <Animated.View style={[s.world, { width: layout.width, height: layout.height }, camera]}>
          <Svg width={layout.width} height={layout.height} style={StyleSheet.absoluteFill} pointerEvents="none">
            {layout.edges.map(edge => {
              const x1 = edge.from.x + NODE_W / 2; const y1 = edge.from.y + NODE_H;
              const x2 = edge.to.x + NODE_W / 2; const y2 = edge.to.y;
              const mid = (y1 + y2) / 2;
              return <Path key={`${edge.from.person.id}-${edge.to.person.id}`} d={`M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`}
                stroke={edge.maternal ? '#8C739C' : edge.confirmed ? '#6B9580' : '#B7A377'} strokeWidth={2}
                strokeDasharray={edge.confirmed || edge.maternal ? undefined : '6 5'} fill="none" />;
            })}
          </Svg>
          {layout.nodes.map(node => <NodeCard key={node.person.id} node={node} selected={selectedId === node.person.id}
            root={node.person.id === focusId} onSelect={selectPerson} onToggle={togglePerson} />)}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
    <View pointerEvents="box-none" style={s.topOverlay}>
      <View style={s.statusPill}><View style={s.statusDot} /><Text style={s.statusText}>{layout.nodes.length.toLocaleString('ar-SA')} اسمًا في العرض</Text></View>
      <CanvasButton icon={fullscreen ? 'contract-outline' : 'expand-outline'} label={fullscreen ? 'إغلاق ملء الشاشة' : 'ملء الشاشة'} onPress={onFullscreen} />
    </View>
    <View style={s.zoomControls}>
      <CanvasButton icon="add" label="تكبير الشجرة" onPress={() => zoom(1.25)} />
      <Text style={s.zoomNumber}>{zoomLabel}%</Text>
      <CanvasButton icon="remove" label="تصغير الشجرة" onPress={() => zoom(0.8)} />
      <View style={s.divider} />
      <CanvasButton icon="scan-outline" label="احتواء الفرع كاملًا" onPress={fit} />
      <CanvasButton icon="locate-outline" label="الانتقال إلى الاسم المحدد" onPress={() => centerNode(selectedId ?? focusId)} />
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="خريطة الشجرة المصغرة، اضغط للتنقل" style={s.minimap}
      onPress={e => {
        const x = (e.nativeEvent.locationX - mx) / miniScale; const y = (e.nativeEvent.locationY - my) / miniScale;
        setCamera(viewport.width / 2 - x * scale.value, viewport.height / 2 - y * scale.value, scale.value);
      }}>
      <Svg width={miniW} height={miniH}>
        {layout.edges.map(e => <Path key={e.to.person.id} d={`M${mx + (e.from.x + NODE_W / 2) * miniScale},${my + (e.from.y + NODE_H) * miniScale} L${mx + (e.to.x + NODE_W / 2) * miniScale},${my + e.to.y * miniScale}`} stroke="#C4CCBF" strokeWidth={1} />)}
        {layout.nodes.map(n => <Rect key={n.person.id} x={mx + n.x * miniScale} y={my + n.y * miniScale} width={Math.max(3, NODE_W * miniScale)} height={Math.max(2, NODE_H * miniScale)} rx={2} fill={n.person.id === selectedId ? colors.gold : '#6F9680'} />)}
        <AnimatedRect animatedProps={miniViewport} fill="rgba(21,60,51,0.06)" stroke={colors.primary} strokeWidth={1.2} rx={3} />
      </Svg>
      <Text style={s.minimapText}>خريطة الفرع</Text>
    </Pressable>
    <View pointerEvents="none" style={s.legend}><View style={s.legendDash} /><Text style={s.legendText}>صلة بانتظار المراجعة</Text><View style={s.maternalDot} /><Text style={s.legendText}>أمومة</Text></View>
  </View>;
});

const NodeCard = memo(function NodeCard({ node, selected, root, onSelect, onToggle }: { node: ExplorerNode; selected: boolean; root: boolean; onSelect: (p: Person) => void; onToggle: (n: ExplorerNode) => void }) {
  const approved = node.person.approval_status === 'supervisor_confirmed' && !node.person.is_provisional;
  return <View style={[s.nodeWrap, { left: node.x, top: node.y }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${node.person.full_name}، ${node.childCount} من الأبناء، ${approved ? 'معتمد' : 'بانتظار المراجعة'}`}
      accessibilityState={{ selected }} onPress={() => onSelect(node.person)}
      style={({ pressed }) => [s.node, root && s.rootNode, selected && s.selectedNode, pressed && { opacity: 0.85 }]}>
      <View style={s.nodeMeta}><Text style={[s.code, root && s.lightCode]}>{node.person.source_code}</Text><View style={[s.approvalDot, approved && { backgroundColor: '#53A17B' }]} /></View>
      <Text numberOfLines={2} style={[s.nodeName, root && s.rootName]}>{node.person.full_name}</Text>
      <View style={s.nodeFoot}><Text style={[s.childText, root && s.lightCode]}>{node.childCount ? `${node.childCount.toLocaleString('ar-SA')} من الأبناء` : 'لا أبناء مسجلون'}</Text><Ionicons name={root ? 'leaf' : 'person-outline'} size={13} color={root ? '#D4BD82' : '#8CA093'} /></View>
    </Pressable>
    {node.childCount > 0 && <Pressable accessibilityRole="button" accessibilityLabel={node.hiddenCount ? `إظهار أبناء ${node.person.full_name}` : `طي أبناء ${node.person.full_name}`}
      onPress={() => onToggle(node)} hitSlop={10} style={[s.toggle, selected && { borderColor: colors.gold }]}>
      <Ionicons name={node.hiddenCount ? 'add' : 'remove'} size={14} color={colors.primary} />
      {node.hiddenCount > 0 && <Text style={s.toggleText}>{node.childCount.toLocaleString('ar-SA')}</Text>}
    </Pressable>}
  </View>;
});
function CanvasButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.canvasButton, pressed && { backgroundColor: '#EAF0E9' }]}><Ionicons name={icon} size={21} color={colors.primary} /></Pressable>;
}
const s = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: '#F6F8F3', overflow: 'hidden', minHeight: 220 },
  gesture: { flex: 1 }, touchSurface: { flex: 1, overflow: 'hidden' },
  world: { position: 'absolute', left: 0, top: 0, transformOrigin: 'top left', ...(Platform.OS === 'web' ? {} : { direction: 'ltr' as const }) },
  topOverlay: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' },
  statusPill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, borderRadius: 30, paddingVertical: 7, paddingHorizontal: 11, backgroundColor: '#FFFFFFEC', borderWidth: 1, borderColor: '#E4EAE1' },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#567D61' }, statusText: { fontSize: 10, fontWeight: '600', color: '#667362' },
  nodeWrap: { position: 'absolute', width: NODE_W, height: NODE_H, alignItems: 'center' },
  node: { width: NODE_W, height: NODE_H, paddingVertical: 10, paddingHorizontal: 13, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#DAE4D8', shadowColor: '#193C28', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.045, shadowRadius: 8, elevation: 1 },
  rootNode: { backgroundColor: '#173F33', borderColor: '#173F33' }, selectedNode: { borderColor: '#B38C47', borderWidth: 2.5 },
  nodeMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, code: { fontSize: 9, letterSpacing: 0.5, color: '#879182', fontWeight: '500' }, lightCode: { color: '#B8CDC0' },
  approvalDot: { width: 6, height: 6, backgroundColor: '#C8A86B', borderRadius: 4 },
  nodeName: { fontSize: 16, color: '#203D2F', fontWeight: '700', textAlign: 'right', lineHeight: 23, marginTop: 1, flex: 1 }, rootName: { color: '#FFFFFF' },
  nodeFoot: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }, childText: { fontSize: 9, color: '#7F8D7C', textAlign: 'right' },
  toggle: { height: 25, minWidth: 27, paddingHorizontal: 5, borderRadius: 12, borderWidth: 1, borderColor: '#CCD9C9', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2, position: 'absolute', bottom: -13 },
  toggleText: { fontSize: 9, color: colors.primary, fontWeight: '700' },
  zoomControls: { position: 'absolute', bottom: 42, left: 12, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 4, borderWidth: 1, borderColor: '#E1E8DD', shadowColor: '#1D3525', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 2 },
  canvasButton: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  zoomNumber: { color: '#6B7B68', fontSize: 9, fontWeight: '600', paddingVertical: 2 }, divider: { width: 22, height: 1, marginVertical: 4, backgroundColor: '#E8EDE4' },
  minimap: { position: 'absolute', right: 12, bottom: 42, borderWidth: 1, borderColor: '#DEE5D9', borderRadius: 13, backgroundColor: '#FFFFFFEF', overflow: 'hidden' },
  minimapText: { fontSize: 8, color: '#7D8B73', textAlign: 'center', paddingBottom: 6 },
  legend: { position: 'absolute', bottom: 13, right: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  legendDash: { width: 15, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: '#B7A377' }, legendText: { color: '#84907D', fontSize: 9 },
  maternalDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8C739C', marginRight: 7 },
});
