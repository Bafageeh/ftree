#!/usr/bin/env python3
"""Restore the verified modern Explorer tree without changing genealogical data or admin auth."""
import os, pathlib, shutil, subprocess, time
root=pathlib.Path(os.environ['APP_PATH']).resolve()
mobile=root/'shajara-mobile'
private=root/'shajara-api/storage/app/private'
active=mobile/'app/(tabs)/tree.tsx'
backup=private/'mobile-generation-backups/20261031-185444/tree-orig.tsx'
canvas=mobile/'src/components/explorer/ExplorerCanvas.tsx'
treeengine=mobile/'src/lib/treeExplorer.ts'
styles=mobile/'src/components/explorer/explorerStyles.ts'
admin=mobile/'src/lib/adminSession.ts'
about=mobile/'app/(tabs)/about.tsx'
assert backup.is_file() and backup.stat().st_size>20000, 'Modern tree backup not found'
for p in (active,canvas,treeengine,styles,admin,about):
    assert p.is_file(),str(p)
original=active.read_text()
src=backup.read_text()
assert 'ExplorerCanvas' in src and 'شجرة النسب الشريف' in src and 'الشجرة التفاعلية' in src
assert 'generationDepth' in canvas.read_text(), 'Generation-aware canvas missing'
assert 'الإدارة' in about.read_text(), 'Admin entry was lost; refusing restore'
assert 'useAdminSession' in (mobile/'app/person/[id].tsx').read_text(), 'Admin permissions were lost'
assert 'getExplorerSnapshot' in (mobile/'src/lib/api.ts').read_text(), 'Modern data source not available'
assert 'src/components/GenealogyTree' in original or 'ExplorerCanvas' in original, 'Unexpected current tree'
src=src.replace('layout={layout} selectedId={selectedId}', 'layout={layout} generationDepth={depth} selectedId={selectedId}')
old="""    if (node.hiddenCount > 0 && !node.collapsed) {
      if (node.level >= depth - 1 && depth < 8) setDepth(d => Math.min(8, d + 1)); else navigate(node.person.id);
    } else setCollapsed(old => { const next = new Set(old); next.has(node.person.id) ? next.delete(node.person.id) : next.add(node.person.id); return next; });"""
new="""    if (node.collapsed) {
      setCollapsed(old => { const next = new Set(old); next.delete(node.person.id); return next; });
    } else if (node.hiddenCount > 0) {
      if (node.level >= depth - 1 && depth < 8) setDepth(d => Math.min(8, d + 1));
      else navigate(node.person.id);
    } else {
      setCollapsed(old => new Set(old).add(node.person.id));
    }"""
assert src.count(old)==1,'Modern generation toggle changed; refuse unknown patch'
src=src.replace(old,new)
src=src.replace('  const path = useMemo(() => focusId == null ? [] : ancestorPath(graph, focusId), [graph, focusId]);',
"""  const displayedGenerations = useMemo(() => layout?.nodes.length
    ? Math.max(...layout.nodes.map(node => node.level)) + 1 : 0, [layout]);
  const path = useMemo(() => focusId == null ? [] : ancestorPath(graph, focusId), [graph, focusId]);""")
src=src.replace('{layout?.limited && <Text style={s.limitNotice}>يظهر أول ١٨٠ اسمًا؛ افتح فرعًا أصغر أو قلّل عدد الأجيال لعرض أوضح.</Text>}',"""{
      layout?.limited
        ? <Text style={s.limitNotice}>الفرع كبير؛ الحد الأقصى للعرض ١٨٠ اسمًا ضمن {number(depth)} أجيال. افتح فرعًا أصغر لعرض بقيتها.</Text>
        : displayedGenerations > 0 && displayedGenerations < depth
          ? <Text style={s.limitNotice}>المتاح لهذا الفرع {number(displayedGenerations)} من {number(depth)} أجيال.</Text> : null
    }""")
src=src.replace("onPress={() => { setDepth(d); setCollapsed(new Set()); setPanel(null); }}","onPress={() => { if (depth === d) canvas.current?.fit(); setDepth(d); setCollapsed(new Set()); setPanel(null); }}")
src=src.replace("onPress={() => { setDepth(2); setCollapsed(new Set()); setPanel(null); }}","onPress={() => { if (depth === 2) canvas.current?.fit(); setDepth(2); setCollapsed(new Set()); setPanel(null); }}")
assert src.count('generationDepth={depth}')==1
assert 'displayedGenerations' in src and 'if (node.collapsed)' in src
store=private/('before-modern-tree-restore-'+time.strftime('%Y%m%d-%H%M%S'))
store.mkdir(parents=True,mode=0o700)
shutil.copy2(active,store/'tree-old.tsx')
active.write_text(src)
try:
    from pwd import getpwnam
    pmsa=getpwnam('pmsa')
    os.chown(str(active),pmsa.pw_uid,pmsa.pw_gid)
    cmd=['node_modules/.bin/expo','export','--platform','android','--output-dir','/tmp/shajara-modern-tree-export-verified','--clear']
    env=os.environ.copy();env['CI']='1';env['EXPO_PUBLIC_API_URL']='https://shajara.pm.sa/api/v1'
    check=subprocess.run(cmd,cwd=str(mobile),env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True,timeout=220)
    if check.returncode:
        raise RuntimeError('Modern Expo Android bundling failed: '+check.stdout[-5000:])
    print('MODERN_EXPO_ANDROID_BUNDLE_VERIFIED',flush=True)
    print('MODERN_TREE_RESTORED',str(active),flush=True)
    print('SAFE_OLD_SCREEN_BACKUP',str(store),flush=True)
except Exception:
    shutil.copy2(store/'tree-old.tsx',active)
    raise
