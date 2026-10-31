#!/usr/bin/env python3
"""Fix Expo 58 genealogy generation controls in the LIVE deployed mobile project."""
import os, pathlib, shutil, subprocess, datetime, re
root=pathlib.Path(os.environ.get('APP_PATH') or '/mnt/home-storage/home/pmsa/apps/shajara').resolve()/'shajara-mobile'
screen=root/'app/(tabs)/tree.tsx'
canvas=root/'src/components/explorer/ExplorerCanvas.tsx'
engine=root/'src/lib/treeExplorer.ts'
for f in (screen,canvas,engine):
    assert f.is_file(), f'Missing expected source: {f}'
old_screen=screen.read_text()
old_canvas=canvas.read_text()
old_engine=engine.read_text()
assert 'const [depth, setDepth] = useState(3);' in old_screen
assert 'layoutExplorer(graph, focusId, depth, collapsed)' in old_screen
assert 'generationDepth' not in old_canvas
assert 'lastFocus.current === focusId' in old_canvas
assert 'node.hiddenCount > 0 && !node.collapsed' in old_screen
assert 'limit = 180' in old_engine

# TypeScript includes all *.tsx files in the mobile tree; backups must live outside it.
private=root.parent/'shajara-api/storage/app/private/mobile-generation-backups'
private.mkdir(parents=True,exist_ok=True,mode=0o700)
legacy=root/'generation-fix-backups'
if legacy.exists():
    import time
    shutil.move(str(legacy),str(private/('prior-failed-patch-'+str(int(time.time())))))
backup=private/datetime.datetime.utcnow().strftime('%Y%m%d-%H%M%S')
backup.mkdir(parents=True,mode=0o700)
for f in (screen,canvas,engine,root/'app.json'):
    if f.exists():shutil.copy2(f,backup/f.name.replace('.tsx','-orig.tsx'))

def replace_once(text,old,new,label):
    assert text.count(old)==1,(label,text.count(old))
    return text.replace(old,new,1)

screen_text=old_screen
# The old label reports the configured limit, not necessarily what fits the branch.
screen_text=replace_once(screen_text,
 '  const path = useMemo(() => focusId == null ? [] : ancestorPath(graph, focusId), [graph, focusId]);',
 """  const displayedGenerations = useMemo(() => layout?.nodes.length
    ? Math.max(...layout.nodes.map(node => node.level)) + 1
    : 0, [layout]);
  const path = useMemo(() => focusId == null ? [] : ancestorPath(graph, focusId), [graph, focusId]);""",
 'displayed depth count')
screen_text=replace_once(screen_text,
 """    if (node.hiddenCount > 0 && !node.collapsed) {
      if (node.level >= depth - 1 && depth < 8) setDepth(d => Math.min(8, d + 1)); else navigate(node.person.id);
    } else setCollapsed(old => { const next = new Set(old); next.has(node.person.id) ? next.delete(node.person.id) : next.add(node.person.id); return next; });""",
 """    if (node.collapsed) {
      setCollapsed(old => { const next = new Set(old); next.delete(node.person.id); return next; });
    } else if (node.hiddenCount > 0) {
      // At the edge of the selected generation window, expand by one level.
      // At the maximum depth (or display node cap), open this person's own
      // branch instead of silently leaving the "+" button unchanged.
      if (node.level >= depth - 1 && depth < 8) setDepth(d => Math.min(8, d + 1));
      else navigate(node.person.id);
    } else {
      setCollapsed(old => new Set(old).add(node.person.id));
    }""",
 'expand/collapse branch behavior')
screen_text=replace_once(screen_text,
 '<ExplorerCanvas ref={canvas} layout={layout} selectedId={selectedId} focusId={focusId}',
 '<ExplorerCanvas ref={canvas} layout={layout} generationDepth={depth} selectedId={selectedId} focusId={focusId}',
 'canvas depth binding')
screen_text=replace_once(screen_text,
 """    {layout?.limited && <Text style={s.limitNotice}>يظهر أول ١٨٠ اسمًا؛ افتح فرعًا أصغر أو قلّل عدد الأجيال لعرض أوضح.</Text>}""",
 """    {layout?.limited
      ? <Text style={s.limitNotice}>تعذر إظهار جميع الأسماء ضمن {number(depth)} أجيال لأن الفرع كبير (حد العرض ١٨٠ اسمًا). افتح فرعًا أصغر لإظهار بقية أبنائه، أو قلّل الأجيال.</Text>
      : displayedGenerations > 0 && displayedGenerations < depth
        ? <Text style={s.limitNotice}>المتاح في هذا الفرع {number(displayedGenerations)} من {number(depth)} أجيال اخترتها. لا توجد أجيال أخرى مسجلة تحته.</Text>
        : null}""",
 'node limit explanation')
screen_text=replace_once(screen_text,
 "onPress={() => { setDepth(d); setCollapsed(new Set()); setPanel(null); }}",
 "onPress={() => { if (depth === d) canvas.current?.fit(); setDepth(d); setCollapsed(new Set()); setPanel(null); }}",
 'press same depth re-fit')
screen_text=replace_once(screen_text,
 "onPress={() => { setDepth(2); setCollapsed(new Set()); setPanel(null); }}",
 "onPress={() => { if (depth === 2) canvas.current?.fit(); setDepth(2); setCollapsed(new Set()); setPanel(null); }}",
 'collapse to two depths')
canvas_text=old_canvas
canvas_text=replace_once(canvas_text,
 '  layout: ExplorerLayout; selectedId: number | null; focusId: number; onSelect: (person: Person) => void;',
 '  layout: ExplorerLayout; generationDepth: number; selectedId: number | null; focusId: number; onSelect: (person: Person) => void;',
 'canvas props')
canvas_text=replace_once(canvas_text,
 'function ExplorerCanvas({ layout, selectedId, focusId, onSelect, onToggle, onFullscreen, fullscreen }, ref)',
 'function ExplorerCanvas({ layout, generationDepth, selectedId, focusId, onSelect, onToggle, onFullscreen, fullscreen }, ref)',
 'canvas destructuring')
canvas_text=replace_once(canvas_text,
 '  const lastFocus = useRef<number | null>(null);',
 '  const lastFocus = useRef<number | null>(null);\n  const lastGenerationDepth = useRef(generationDepth);',
 'depth ref')
canvas_text=replace_once(canvas_text,
 '  // Recenter after a viewport change (rotation / resizing) without touching tree data.',
 """  // Changing the generation count changes the graph dimensions, but not
  // the focusId. Re-fit the newly drawn tree so users can SEE the change.
  useEffect(() => {
    if (!viewport.width || !viewport.height || !layout.nodes.length) return;
    if (lastGenerationDepth.current === generationDepth) return;
    lastGenerationDepth.current = generationDepth;
    const frame = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(frame);
  }, [generationDepth, layout.nodes.length, viewport.width, viewport.height, fit]);

  // Recenter after a viewport change (rotation / resizing) without touching tree data.""",
 'refit when depth changes')
# Avoid fitting below 16% if width too great; node dimensions are kept legible
# and the existing pan, zoom and minimap remain available for larger layouts.
try:
    screen.write_text(screen_text)
    canvas.write_text(canvas_text)
    tsc=root/'node_modules/typescript/bin/tsc'
    assert tsc.is_file(),'Expo SDK58 TypeScript installation unavailable'
    result=subprocess.run(['node',str(tsc),'--noEmit','--pretty','false'],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True,timeout=130)
    assert result.returncode==0,'TypeScript compile failed: '+result.stdout[-3200:]
    assert screen.read_text().count('generationDepth={depth}')==1
    assert 'lastGenerationDepth.current === generationDepth' in canvas.read_text()
    assert 'layout?.limited' in screen.read_text()
except Exception:
    shutil.copy2(backup/'tree-orig.tsx',screen)
    shutil.copy2(backup/'ExplorerCanvas-orig.tsx',canvas)
    raise
print('GENERATION_BUTTON_FIXED',json_safe_output if False else 'Expo58 TypeScript passed',flush=True)
print('BACKUP',backup,flush=True)
print('APP_JSON', (root/'app.json').read_text()[:800],flush=True)
