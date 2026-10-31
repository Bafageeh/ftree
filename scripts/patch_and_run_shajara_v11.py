#!/usr/bin/env python3
"""Patch a known, previously validated Shajara v10 importer for the newer workbook.

The latest workbook data is encrypted until transfer, and the source's missing
P727 father reference is held without inventing another relationship.
"""
from pathlib import Path
import subprocess

old = Path('/tmp/apply_excel_v10_private.py')
new = Path('/tmp/apply_excel_v11_private.py')
if not old.is_file():
    raise RuntimeError('Missing approved v10 import script')
s = old.read_text(encoding='utf-8')
def change(a,b):
    global s
    n=s.count(a)
    if n!=1:
        raise RuntimeError('Unexpected source version while updating '+a[:75]+' count='+str(n))
    s=s.replace(a,b,1)

change("INPUT=Path('/tmp/shajara-v10.normalized.json')", "INPUT=Path('/tmp/shajara-v11.normalized.json')")
change("OLD_NORMALIZED=PRIVATE/'shajara-source-v9-normalized.json.gz'", "OLD_NORMALIZED=PRIVATE/'shajara-source-v10-normalized.json.gz'")
change("PREV_IMPORT=Path('/tmp/shajara_excel_only_import_v9.php')", "PREV_IMPORT=Path('/tmp/shajara_excel_only_import_v10.php')")
change("IMPORT=Path('/tmp/shajara_excel_only_import_v10.php')", "IMPORT=Path('/tmp/shajara_excel_only_import_v11.php')")
change("OLD_SOURCE='الشجرة_مع_الجذع_المربوط(9).xlsx'; NEW_SOURCE='الشجرة_مع_الجذع_المربوط(10).xlsx'", "OLD_SOURCE='الشجرة_مع_الجذع_المربوط(10).xlsx'; NEW_SOURCE='الشجرة_مع_الجذع_المربوط(20261031-152345).xlsx'")
change("OLD_SHA='f9785e1b8af5b8c52fe02fdc7600a0c400e148751ffb0bd48a43a1f2f8b6caad'", "OLD_SHA='13e85cacfcc1e0025533fd0f64c408788a515313e17defe0a2c1745af1d1c3a0'")
change("NEW_SHA='13e85cacfcc1e0025533fd0f64c408788a515313e17defe0a2c1745af1d1c3a0'", "NEW_SHA='c43a1b42bcc2f5baf5e78aa80fef19263b8b396281bc79536a3a2db069ac4861'")
change("SHEETS={'مواضع الشجرة الكبيرة':507", "SHEETS={'مواضع الشجرة الكبيرة':499")
change("check(len(indices)==506 and len(parent)==521 and decor==['P005']", "check(len(indices)==498 and len(parent)==513 and decor==['P005']")
change("len(book.get('__normalized_numeric_fathers',{}))==67", "len(book.get('__normalized_numeric_fathers',{}))==131")
change("check(book.get('__held_edges')==[],'The source must not contain any circular parent relationships')", "check(book.get('__held_edges')==['P439'],'Only missing P727 edge may be held')")
change("    p362=next(x for x in positions if cell(x,'A')=='P362')\n    check(cell(p362,'K')=='P361','Expected new P362 father reference')", "    p439=next(x for x in positions if cell(x,'A')=='P439')\n    check(cell(p439,'K')=='P727' and 'P727' not in parent,'Expected missing father P727 for review')\n    parent['P439']=''")
change("check(edges==447 and connected==443", "check(edges==509 and connected==488")
change("==87,'Excel review coloring", "==101,'Excel review coloring")
change("'numeric_father_ids_normalized':67,'held_links':[]", "'numeric_father_ids_normalized':131,'held_links':['P439->P727']")
change("s=swap(s,'/tmp/shajara-v9.normalized.json',str(INPUT))", "s=swap(s,'/tmp/shajara-v10.normalized.json',str(INPUT))")
change("s=swap(s,'$parentRefs!==421','$parentRefs!==447')", """s=swap(s,'$parentRefs!==447','$parentRefs!==509')
    s=swap(s,"'مواضع الشجرة الكبيرة'=>507","'مواضع الشجرة الكبيرة'=>499")
    s=swap(s,'count($data)!==521','count($data)!==513')
    s=swap(s,"'people_excel']!==521","'people_excel']!==513")
    s=swap(s,"'chart_readings_excel']!==657","'chart_readings_excel']!==649")
    s=swap(s,"'workbook_reviews_total']<506","'workbook_reviews_total']<498")""")
change("""    s=swap(s,"'parent_ref'=>($key==='P362'?'':$C($r,'K')),'kind'=>'position'",
             "'parent_ref'=>$C($r,'K'),'kind'=>'position'")""", """    s=swap(s,"'parent_ref'=>$C($r,'K'),'kind'=>'position'",
             "'parent_ref'=>($key==='P439'?'':$C($r,'K')),'kind'=>'position'")
    s=swap(s,'$summary=$trunk?',"if($key==='P439')$note.=' | معرف الأب P727 مذكور في Excel ولكنه غير موجود ضمن الأشخاص؛ الرابط معلق حتى مراجعة المصدر.';\\n    $summary=$trunk?")
    s=swap(s,'$branch=$trunk?',"if($key==='P439')$status='review';\\n    $branch=$trunk?")""")
change("s=swap(s,'Excel-only:v9:','Excel-only:v10:')", "s=swap(s,'Excel-only:v10:','Excel-only:v11:')")
change("""    old_notice="if($key==='P362')$note.=' | ورد معرف الأب P362 في Excel مطابقا لمعرف الشخص؛ الرابط معلّق للمراجعة لتجنّب علاقة ذاتية.';"
    check(old_notice in s,'Importer still contains an unexpected pending edge hold')
    s=s.replace(old_notice,'')""", "")
change("preview.get('people')==521 and preview.get('parent_edges')==447", "preview.get('people')==513 and preview.get('parent_edges')==509")
change("'pre-v10-safe-backup-'", "'pre-v11-safe-backup-'")
change("obj.get('people')==521 and obj.get('chart_readings')==657 and obj.get('chart_edges')==447", "obj.get('people')==513 and obj.get('chart_readings')==649 and obj.get('chart_edges')==509")
change("check(len(people)==521,'Expected 521 v10 people for offline bundle", "check(len(people)==513,'Expected 513 latest-workbook people for offline bundle")
change("user's Excel v10.", "user's latest Excel.")
change("'Excel-only:v9:%' in code or 'Excel-only:v10:%' in code", "'Excel-only:v10:%' in code or 'Excel-only:v11:%' in code")
change("code.replace('Excel-only:v9:%','Excel-only:v10:%')", "code.replace('Excel-only:v10:%','Excel-only:v11:%')")
change("stat.get('total')==521 and stat.get('connected_to_prophet')==443 and stat.get('disconnected_from_prophet')==78", "stat.get('total')==513 and stat.get('connected_to_prophet')==488 and stat.get('disconnected_from_prophet')==25")
change("archive=PRIVATE/'shajara-source-v10-normalized.json.gz'", "archive=PRIVATE/'shajara-source-v11-normalized.json.gz'")
change("manifest=PRIVATE/'shajara-v10-changes.json'", "manifest=PRIVATE/'shajara-v11-changes.json'")
change("SHAJARA_V10_DEPLOYED", "SHAJARA_V11_DEPLOYED")
new.write_text(s,encoding='utf-8')
p=subprocess.run(['python3','-m','py_compile',str(new)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True)
if p.returncode:
    raise RuntimeError('Generated Python importer invalid: '+p.stderr[-1200:])
print('SHJ_V11_PATCH_VALIDATED',len(s),flush=True)
p=subprocess.run(['python3',str(new)],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True)
print(p.stdout,flush=True)
if p.returncode:
    raise RuntimeError('Workbook import failed, status '+str(p.returncode))