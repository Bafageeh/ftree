import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Modal, Pressable, ScrollView, Share, Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExplorerCanvas, type CanvasHandle } from '../../src/components/explorer/ExplorerCanvas';
import { explorerStyles as s } from '../../src/components/explorer/explorerStyles';
import { bundledPeople } from '../../src/generated/bundledPeople';
import { API_URL } from '../../src/lib/api';
import { ancestorPath, createExplorerGraph, descendantCount, layoutExplorer, maternalLink, searchExplorerPeople, type ExplorerNode } from '../../src/lib/treeExplorer';
import { colors } from '../../src/theme';
import type { Person } from '../../src/types';

type Panel = 'branches' | 'depth' | 'path' | 'help' | null;
type Filter = 'all' | 'connected' | 'unlinked';
const initialGraph = createExplorerGraph(bundledPeople);
const number = (n: number) => n.toLocaleString('ar-SA');

async function getExplorerSnapshot(): Promise<{ people: Person[]; offline: boolean }> {
  try {
    const byId = new Map<number, Person>();
    for (let page = 1; page <= 8; page++) {
      const response = await fetch(`${API_URL}/people?per_page=250&lineage_status=connected&page=${page}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('تعذر مزامنة الأسماء');
      const payload = await response.json() as { data?: Person[] };
      if (!Array.isArray(payload.data)) throw new Error('قائمة الأسماء غير مكتملة');
      for (const person of payload.data) byId.set(person.id, person);
      if (payload.data.length < 250) break;
    }
    if (byId.size >= bundledPeople.length) {
      return { people: [...byId.values()], offline: false };
    }
  } catch {
    // Preserve the latest validated offline workbook rather than display a
    // partial or older live API response.
  }
  return { people: bundledPeople, offline: true };
}

export function generateMetadata() { return { title: 'شجرة النسب الشريف', description: 'شجرة تفاعلية لتصفح الأسماء والفروع ومسارات النسب المسجلة.' }; }

export default function TreeScreen() {
  const [people, setPeople] = useState(bundledPeople);
  const [sync, setSync] = useState<'loading' | 'online' | 'offline'>('loading');
  const [mode, setMode] = useState<'tree' | 'directory'>('tree');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [filter, setFilter] = useState<Filter>('all');
  const [focusId, setFocusId] = useState(initialGraph.defaultFocusId);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [depth, setDepth] = useState(3);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<number[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [jumpTarget, setJumpTarget] = useState<number | null>(null);
  const canvas = useRef<CanvasHandle>(null);
  const loadSequence = useRef(0);
  const graph = useMemo(() => createExplorerGraph(people), [people]);
  const selected = selectedId == null ? null : graph.byId.get(selectedId) ?? null;
  const focus = focusId == null ? null : graph.byId.get(focusId) ?? null;
  const layout = useMemo(() => focusId == null ? null : layoutExplorer(graph, focusId, depth, collapsed), [graph, focusId, depth, collapsed]);
  const displayedGenerations = useMemo(() => layout?.nodes.length
    ? Math.max(...layout.nodes.map(node => node.level)) + 1 : 0, [layout]);
  const path = useMemo(() => focusId == null ? [] : ancestorPath(graph, focusId), [graph, focusId]);
  const detailPath = useMemo(() => selectedId == null ? path : ancestorPath(graph, selectedId), [graph, selectedId, path]);
  const results = useMemo(() => searchExplorerPeople(graph, deferredQuery), [graph, deferredQuery]);
  const directory = useMemo(() => results.filter(p => filter === 'all' || (filter === 'connected' ? graph.connected.has(p.id) : !graph.connected.has(p.id))), [results, filter, graph]);
  const branches = useMemo(() => graph.people.filter(p => (graph.children.get(p.id)?.length ?? 0) >= 2)
    .sort((a, b) => Number(graph.connected.has(b.id)) - Number(graph.connected.has(a.id)) || (a.chart_order ?? a.id) - (b.chart_order ?? b.id)), [graph]);
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setSync('loading');
    const result = await getExplorerSnapshot();
    if (sequence !== loadSequence.current) return;
    setPeople(result.people); setSync(result.offline ? 'offline' : 'online');
  }, []);
  useFocusEffect(useCallback(() => { void load(); return () => { loadSequence.current++; }; }, [load]));
  const navigate = useCallback((id: number, select = false) => {
    if (!graph.byId.has(id)) return;
    if (focusId !== id && focusId != null) setHistory(h => [...h.slice(-29), focusId]);
    setFocusId(id); setCollapsed(new Set()); setSelectedId(select ? id : null);
    setQuery(''); setMode('tree'); setPanel(null); setJumpTarget(null); Keyboard.dismiss();
  }, [focusId, graph]);
  const reveal = useCallback((p: Person) => {
    navigate(graph.parents.get(p.id) ?? p.id); setSelectedId(p.id); setJumpTarget(p.id);
  }, [graph, navigate]);
  useEffect(() => {
    if (jumpTarget == null || !layout?.nodes.some(n => n.person.id === jumpTarget)) return;
    const timer = setTimeout(() => { canvas.current?.focus(jumpTarget); setJumpTarget(null); }, 120);
    return () => clearTimeout(timer);
  }, [jumpTarget, layout, fullscreen]);
  const goBack = () => {
    const id = history[history.length - 1]; if (id == null) return;
    setHistory(h => h.slice(0, -1)); setFocusId(id); setSelectedId(null); setCollapsed(new Set());
  };
  const toggleNode = useCallback((node: ExplorerNode) => {
    if (node.collapsed) {
      setCollapsed(old => { const next = new Set(old); next.delete(node.person.id); return next; });
    } else if (node.hiddenCount > 0) {
      if (node.level >= depth - 1 && depth < 8) setDepth(d => Math.min(8, d + 1));
      else navigate(node.person.id);
    } else {
      setCollapsed(old => new Set(old).add(node.person.id));
    }
  }, [depth, navigate]);
  const openPerson = (p: Person) => {
    setFullscreen(false); setPanel(null); router.push({ pathname: '/person/[id]', params: { id: String(p.id) } });
  };

  const workspace = <View style={s.workspace}>
    <View style={s.toolbar}>
      <View style={s.toolGroup}><Tool icon="git-branch-outline" label="الفروع" onPress={() => setPanel('branches')} /><Tool icon="layers-outline" label={`${number(depth)} أجيال`} onPress={() => setPanel('depth')} /><Tool icon="leaf-outline" label="الجذع" onPress={() => graph.rootId != null && navigate(graph.rootId)} /></View>
      <View style={s.toolGroup}><IconButton icon="home-outline" label="العودة إلى الفرع الرئيسي" onPress={() => graph.defaultFocusId != null && navigate(graph.defaultFocusId)} /><IconButton icon="arrow-forward" label="الفرع السابق" disabled={!history.length} onPress={goBack} /></View>
    </View>
    <View style={s.breadcrumb}>
      <Pressable accessibilityRole="button" accessibilityLabel="عرض مسار الفرع كاملًا" onPress={() => { setSelectedId(null); setPanel('path'); }} style={s.pathButton}><Ionicons name="trail-sign-outline" size={14} color={colors.gold} /><Text style={s.pathLabel}>المسار</Text></Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.crumbScroll}>
        {[...path.slice(-3)].reverse().map((p, i) => <View key={p.id} style={s.crumbPair}>{i > 0 && <Ionicons name="chevron-back" size={11} color="#B7BFB2" />}<Pressable accessibilityRole="button" onPress={() => navigate(p.id)}><Text numberOfLines={1} style={[s.crumbText, i === 0 && s.crumbCurrent]}>{p.full_name}</Text></Pressable></View>)}
        {path.length > 3 && <Text style={s.crumbText}>…</Text>}
      </ScrollView>
    </View>
    {focus && !graph.connected.has(focus.id) && <View style={s.linkWarning}><Ionicons name="link-outline" size={14} color="#97783C" /><Text style={s.linkWarningText}>هذا الفرع غير مكتمل الربط بالجذع الرئيسي</Text></View>}
    {layout && focusId != null && layout.nodes.length ? <ExplorerCanvas ref={canvas} layout={layout} generationDepth={depth} selectedId={selectedId} focusId={focusId} onSelect={p => { setSelectedId(p.id); Keyboard.dismiss(); }} onToggle={toggleNode} fullscreen={fullscreen} onFullscreen={() => setFullscreen(f => !f)} /> : <Empty title="لا توجد أسماء في هذا الفرع" text="ارجع إلى الفرع الرئيسي أو ابحث في دليل الأسماء." />}
    {
      layout?.limited
        ? <Text style={s.limitNotice}>الفرع كبير؛ الحد الأقصى للعرض ١٨٠ اسمًا ضمن {number(depth)} أجيال. افتح فرعًا أصغر لعرض بقيتها.</Text>
        : displayedGenerations > 0 && displayedGenerations < depth
          ? <Text style={s.limitNotice}>المتاح لهذا الفرع {number(displayedGenerations)} من {number(depth)} أجيال.</Text> : null
    }
    {selected && <View style={s.detailCard}>
      <View style={s.detailHeading}><IconButton icon="close" label="إغلاق بطاقة الاسم" onPress={() => setSelectedId(null)} /><View style={s.detailIdentity}><Text style={s.detailCode}>{selected.source_code} <Text style={s.detailState}>· {selected.approval_status === 'supervisor_confirmed' && !selected.is_provisional ? 'معتمد' : 'بانتظار المراجعة'}</Text></Text><Text style={s.detailName}>{selected.full_name}</Text></View><View style={s.personEmblem}><Ionicons name={selected.gender === 'female' ? 'flower-outline' : 'person-outline'} size={22} color={colors.primary} /></View></View>
      <View style={s.detailInfo}><Text style={s.detailInfoText}>{number(graph.children.get(selected.id)?.length ?? 0)} من الأبناء</Text><View style={s.detailDot} /><Text style={s.detailInfoText}>{number(descendantCount(graph, selected.id))} من الذرية</Text><View style={s.detailDot} /><Text style={[s.detailInfoText, { color: graph.connected.has(selected.id) ? '#3E7659' : '#97783C' }]}>{graph.connected.has(selected.id) ? 'متصل بالجذع' : 'يحتاج ربطًا'}</Text></View>
      <View style={s.detailActions}><Action primary icon="git-branch-outline" label="عرض فرعه" onPress={() => navigate(selected.id)} /><Action icon="trail-sign-outline" label="مسار النسب" onPress={() => setPanel('path')} /><Action icon="create-outline" label="الملف والتعديل" onPress={() => openPerson(selected)} /></View>
    </View>}
  </View>;

  const panelView = <Sheet visible={panel != null} onClose={() => setPanel(null)} title={panel === 'branches' ? 'اختر فرعًا لاستكشافه' : panel === 'depth' ? 'عدد الأجيال الظاهرة' : panel === 'path' ? 'مسار النسب المسجل' : 'استكشف الشجرة بسهولة'}>
      {panel === 'depth' && <><Text style={s.sheetDescription}>اختر عدد الأجيال انطلاقًا من الاسم أعلى الفرع. ويمكن فتح كل فرع من زر + أسفل الاسم.</Text><View style={s.depthOptions}>{[2, 3, 4, 5, 6, 8].map(d => <Pressable key={d} accessibilityRole="radio" accessibilityState={{ checked: depth === d }} style={[s.depthOption, d === depth && s.depthSelected]} onPress={() => { if (depth === d) canvas.current?.fit(); setDepth(d); setCollapsed(new Set()); setPanel(null); }}><Text style={[s.depthNumber, d === depth && { color: 'white' }]}>{number(d)}</Text><Text style={[s.depthLabel, d === depth && { color: '#D7E3D7' }]}>أجيال</Text></Pressable>)}</View><Action icon="remove-circle-outline" label="طي الفروع والبدء بجيلين" onPress={() => { if (depth === 2) canvas.current?.fit(); setDepth(2); setCollapsed(new Set()); setPanel(null); }} /></>}
      {panel === 'branches' && <><Text style={s.sheetDescription}>تظهر الفروع ذات أكثر من ابن. يبقى الفرع غير المتصل مستقلًا حتى اكتمال ربطه.</Text><ScrollView style={s.sheetScroll}>{branches.map(p => <PersonRow key={p.id} person={p} count={graph.children.get(p.id)?.length ?? 0} connected={graph.connected.has(p.id)} onPress={() => navigate(p.id)} />)}</ScrollView></>}
      {panel === 'path' && <><Text style={s.sheetDescription}>{detailPath[0]?.id === graph.rootId ? 'المسار المسجل حتى أصل الشجرة، ويشمل صلة الأمومة حيث وردت.' : 'يبدأ المسار بأعلى اسم مرتبط في هذا الفرع، ولم يكتمل اتصاله بالجذع الرئيسي.'}</Text><ScrollView style={s.sheetScroll} contentContainerStyle={s.pathList}>{detailPath.map((p, i) => <View key={p.id}>{i > 0 && <View style={s.pathRelation}><View style={[s.pathLine, maternalLink(p, detailPath[i - 1]) && { backgroundColor: '#8C739C' }]} /><Text style={s.pathRelationText}>{maternalLink(p, detailPath[i - 1]) ? 'صلة أمومة' : 'صلة أبوة مسجلة'}</Text></View>}<Pressable accessibilityRole="button" onPress={() => navigate(p.id, true)} style={s.pathItem}><Text style={s.pathCode}>{p.source_code}</Text><Text style={s.pathName}>{p.full_name}</Text><View style={s.pathNumber}><Text style={s.pathNumberText}>{number(i + 1)}</Text></View></Pressable></View>)}</ScrollView><Action icon="share-social-outline" label="مشاركة المسار" onPress={() => void Share.share({ message: detailPath.map((p, i) => `${p.full_name}${i > 0 && maternalLink(p, detailPath[i - 1]) ? ' (صلة أمومة)' : ''}`).join(' ← ') + '\nمسار مسجل في شجرة النسب الشريف؛ الاعتماد بحسب حالة كل اسم.' })} /></>}
      {panel === 'help' && <><Help icon="hand-left-outline" title="حرّك الشجرة بحرية" text="اسحب بإصبع واحد، وكبّر وصغّر بإصبعين أو بأزرار + و−." /><Help icon="search-outline" title="انتقل إلى أي اسم" text="ابحث بالاسم أو بتسلسل الآباء أو برقم الموضع، ثم اضغط على النتيجة." /><Help icon="git-branch-outline" title="افتح الفروع تدريجيًا" text="اضغط + أسفل الاسم لإظهار الأبناء، أو اختر «عرض فرعه» للتركيز عليه." /><Help icon="map-outline" title="اعرف مكانك دائمًا" text="الخريطة المصغرة والمسار أعلى الشجرة يساعدانك على التنقل. زر المنزل يعيدك إلى الفرع الرئيسي." /><Help icon="create-outline" title="اعرض البيانات وعدّلها" text="اضغط اسمًا ثم «الملف والتعديل» للوصول إلى بياناته وأدوات الإدارة الموجودة." /><View style={s.helpNote}><Text style={s.helpNoteText}>الخط المتقطع يعني صلة بانتظار المراجعة. البنفسجي يوضح الأمومة، و«متصل بالجذع» يصف اكتمال المسار المسجل.</Text></View></>}
    </Sheet>;

  return <SafeAreaView style={s.safe} edges={['top']}>
    <View style={s.header}>
      <View style={s.headerRow}><View style={s.headerTools}><IconButton icon="help-circle-outline" label="طريقة استخدام الشجرة" onPress={() => setPanel('help')} /><Pressable accessibilityRole="button" accessibilityLabel="تحديث الشجرة" disabled={sync === 'loading'} onPress={() => void load()} style={s.iconButton}>{sync === 'loading' ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="refresh-outline" size={20} color={colors.primary} />}</Pressable></View><View style={s.brand}><View style={s.brandText}><Text style={s.brandEyebrow}>الأصول وصلة الأجيال</Text><Text style={s.brandTitle}>شجرة النسب الشريف</Text></View><View style={s.brandMark}><Ionicons name="git-network" size={23} color="#D6BE83" /></View></View></View>
      <View style={s.overview}><Text style={s.overviewText}>{number(graph.people.length)} اسمًا<Text style={s.overviewDivider}>   /   </Text>{number(graph.linkCount)} صلة مسجلة</Text><View style={s.sourcePill}><View style={s.liveDot} /><Text style={s.sourceText}>{sync === 'offline' ? 'النسخة المحفوظة' : 'السجل الحالي'}</Text></View></View>
      <View style={s.search}><Ionicons name="search-outline" size={21} color="#8B988A" /><TextInput accessibilityLabel="البحث بالاسم أو رقم الموضع أو تسلسل الآباء" value={query} onChangeText={setQuery} placeholder="ابحث عن اسم، أب، جد أو رقم موضع…" placeholderTextColor="#91A08F" style={s.searchInput} textAlign="right" returnKeyType="search" onSubmitEditing={() => { if (results.length === 1) reveal(results[0]); else { setMode('directory'); Keyboard.dismiss(); } }} />{!!query && <Pressable accessibilityRole="button" accessibilityLabel="مسح البحث" onPress={() => setQuery('')} hitSlop={10}><Ionicons name="close-circle" size={19} color="#8B988A" /></Pressable>}</View>
      <View style={s.modeBar}><Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === 'tree' }} onPress={() => setMode('tree')} style={[s.mode, mode === 'tree' && s.modeActive]}><Ionicons name="git-network-outline" size={17} color={mode === 'tree' ? colors.primary : '#8D9789'} /><Text style={[s.modeText, mode === 'tree' && s.modeTextActive]}>الشجرة التفاعلية</Text></Pressable><Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === 'directory' }} onPress={() => setMode('directory')} style={[s.mode, mode === 'directory' && s.modeActive]}><Ionicons name="people-outline" size={18} color={mode === 'directory' ? colors.primary : '#8D9789'} /><Text style={[s.modeText, mode === 'directory' && s.modeTextActive]}>دليل الأسماء</Text></Pressable></View>
    </View>
    {mode === 'tree' ? <View style={s.treeArea}>{!fullscreen && workspace}{!!query.trim() && <View style={s.searchResults}>
      <View style={s.resultsTitleRow}><Text style={s.resultHint}>اضغط للانتقال إلى موقع الاسم</Text><Text style={s.resultCount}>{number(results.length)} نتيجة</Text></View>
      <FlatList data={results.slice(0, 30)} keyExtractor={p => String(p.id)} keyboardShouldPersistTaps="handled" renderItem={({ item }) => <PersonRow person={item} parent={graph.byId.get(graph.parents.get(item.id) ?? -1)} count={graph.children.get(item.id)?.length ?? 0} connected={graph.connected.has(item.id)} onPress={() => reveal(item)} />} ListEmptyComponent={<Empty title="لا توجد نتائج" text="جرّب الاسم الأول أو رقم الموضع مثل P094." />} />
      {results.length > 30 && <Pressable onPress={() => setMode('directory')} style={s.allResults}><Text style={s.allResultsText}>عرض جميع النتائج في دليل الأسماء</Text><Ionicons name="arrow-back" size={14} color={colors.primary} /></Pressable>}
    </View>}</View> : <View style={s.directory}>
      <View style={s.filters}><FilterChip label="الكل" count={graph.people.length} active={filter === 'all'} onPress={() => setFilter('all')} /><FilterChip label="متصل بالجذع" count={graph.connected.size} active={filter === 'connected'} onPress={() => setFilter('connected')} /><FilterChip label="يحتاج ربطًا" count={graph.people.length - graph.connected.size} active={filter === 'unlinked'} onPress={() => setFilter('unlinked')} /></View>
      <View style={s.directoryTitle}><Text style={s.resultHint}>{number(directory.length)} اسمًا</Text><Text style={s.directoryTitleText}>{query.trim() ? 'نتائج البحث' : 'الأسماء المسجلة'}</Text></View>
      <FlatList data={directory} keyExtractor={p => String(p.id)} initialNumToRender={14} maxToRenderPerBatch={16} keyboardShouldPersistTaps="handled" contentContainerStyle={s.directoryContent} renderItem={({ item }) => <PersonRow person={item} parent={graph.byId.get(graph.parents.get(item.id) ?? -1)} count={graph.children.get(item.id)?.length ?? 0} connected={graph.connected.has(item.id)} onPress={() => reveal(item)} />} ListEmptyComponent={<Empty title="لا توجد أسماء مطابقة" text="جرّب تعديل البحث أو اختيار تصنيف آخر." />} />
    </View>}
    <Modal visible={fullscreen} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setFullscreen(false)}><SafeAreaView style={s.safe} edges={['top', 'bottom']}><View style={s.fullscreenHeader}><IconButton icon="close" label="إغلاق ملء الشاشة" onPress={() => setFullscreen(false)} /><Text style={s.fullscreenTitle}>شجرة النسب الشريف</Text><Ionicons name="git-network-outline" size={22} color={colors.primary} /></View>{fullscreen && workspace}{fullscreen && panelView}</SafeAreaView></Modal>
    {!fullscreen && panelView}
  </SafeAreaView>;
}

function IconButton({ icon, label, onPress, disabled = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.iconButton, disabled && { opacity: 0.3 }, pressed && { backgroundColor: '#EAF0E6' }]}><Ionicons name={icon} size={20} color={colors.primary} /></Pressable>;
}
function Tool({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={s.tool}><Ionicons name={icon} size={16} color={colors.primary} /><Text style={s.toolText}>{label}</Text></Pressable>;
}
function Action({ icon, label, onPress, primary = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; primary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.action, primary && s.actionPrimary, pressed && { opacity: 0.7 }]}><Ionicons name={icon} size={16} color={primary ? 'white' : colors.primary} /><Text style={[s.actionText, primary && { color: 'white' }]}>{label}</Text></Pressable>;
}
function FilterChip({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[s.filterChip, active && s.filterActive]}><Text style={[s.filterText, active && { color: 'white' }]}>{label}</Text><Text style={[s.filterCount, active && { color: '#CFDCCB' }]}>{number(count)}</Text></Pressable>;
}
function PersonRow({ person, parent, count, connected, onPress }: { person: Person; parent?: Person; count: number; connected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${person.full_name}، ${person.source_code}، ${connected ? 'متصل بالجذع' : 'يحتاج ربطًا'}`} onPress={onPress} style={({ pressed }) => [s.personRow, pressed && { backgroundColor: '#F0F4EB' }]}><Ionicons name="chevron-back" size={17} color="#9CA795" /><View style={s.rowContent}><View style={s.rowTitle}><Text style={s.rowCode}>{person.source_code}</Text><Text style={s.rowName}>{person.full_name}</Text></View><Text numberOfLines={1} style={s.rowSub}>{parent ? `${maternalLink(person, parent) ? 'الأم' : 'الأب'}: ${parent.full_name}  ·  ` : ''}{number(count)} من الأبناء</Text><Text style={[s.rowStatus, { color: connected ? '#658565' : '#A18A58' }]}>{connected ? 'متصل بالجذع' : 'يحتاج ربطًا'}</Text></View><View style={[s.rowAvatar, !connected && { backgroundColor: '#F5F0E2' }]}><Ionicons name={connected ? 'leaf-outline' : 'link-outline'} size={20} color={connected ? '#4F7759' : '#A18A58'} /></View></Pressable>;
}
function Empty({ title, text }: { title: string; text: string }) { return <View style={s.empty}><Ionicons name="git-network-outline" size={32} color="#A6B399" /><Text style={s.emptyTitle}>{title}</Text><Text style={s.emptyText}>{text}</Text></View>; }
function Help({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) { return <View style={s.helpRow}><View style={s.helpContent}><Text style={s.helpTitle}>{title}</Text><Text style={s.helpText}>{text}</Text></View><View style={s.helpIcon}><Ionicons name={icon} size={23} color={colors.primary} /></View></View>; }
function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) { return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={s.sheetBackdrop}><Pressable accessibilityLabel="إغلاق النافذة" onPress={onClose} style={StyleSheet.absoluteFill} /><SafeAreaView style={s.sheet} edges={['bottom']} accessibilityViewIsModal><View style={s.sheetHandle} /><View style={s.sheetHeader}><IconButton icon="close" label="إغلاق النافذة" onPress={onClose} /><Text style={s.sheetTitle}>{title}</Text></View>{children}</SafeAreaView></View></Modal>; }
