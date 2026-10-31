#!/usr/bin/env python3
"""Convert the verified Excel-v10 importer to the newly uploaded timestamped workbook.

Applies only after strict validation, a SQLite backup and an import dry run.
Any missing/looping father reference aborts rather than inventing a relationship.
"""
from pathlib import Path
import subprocess

old=Path('/tmp/apply_excel_v10_private.py')
new=Path('/tmp/apply_excel_v13_private.py')
if not old.is_file():raise RuntimeError('Source importer missing; no database changes have been made')
s=old.read_text(encoding='utf-8')
def change(a,b):
    global s
    found=s.count(a)
    if found!=1:raise RuntimeError('Changed importer structure for '+a[:65]+' count='+str(found))
    s=s.replace(a,b,1)

change("INPUT=Path('/tmp/shajara-v10.normalized.json')", "INPUT=Path('/tmp/shajara-v13.normalized.json')")
change("OLD_NORMALIZED=PRIVATE/'shajara-source-v9-normalized.json.gz'", "OLD_NORMALIZED=PRIVATE/'shajara-source-v10-normalized.json.gz'")
change("PREV_IMPORT=Path('/tmp/shajara_excel_only_import_v9.php')", "PREV_IMPORT=Path('/tmp/shajara_excel_only_import_v10.php')")
change("IMPORT=Path('/tmp/shajara_excel_only_import_v10.php')", "IMPORT=Path('/tmp/shajara_excel_only_import_v13.php')")
change("OLD_SOURCE='الشجرة_مع_الجذع_المربوط(9).xlsx'; NEW_SOURCE='الشجرة_مع_الجذع_المربوط(10).xlsx'", "OLD_SOURCE='الشجرة_مع_الجذع_المربوط(10).xlsx'; NEW_SOURCE='الشجرة_مع_الجذع_المربوط(20261031-160557).xlsx'")
change("OLD_SHA='f9785e1b8af5b8c52fe02fdc7600a0c400e148751ffb0bd48a43a1f2f8b6caad'", "OLD_SHA='13e85cacfcc1e0025533fd0f64c408788a515313e17defe0a2c1745af1d1c3a0'")
change("NEW_SHA='13e85cacfcc1e0025533fd0f64c408788a515313e17defe0a2c1745af1d1c3a0'", "NEW_SHA='14d797c281b4a180593d9d5fb5631112e7dd8aa9c30a311927abc66050a6d5ff'")
change("SHEETS={'مواضع الشجرة الكبيرة':507", "SHEETS={'مواضع الشجرة الكبيرة':503")
change("check(len(indices)==506 and len(parent)==521 and decor==['P005']", "check(len(indices)==502 and len(parent)==517 and decor==['P005']")
change("len(book.get('__normalized_numeric_fathers',{}))==67", "len(book.get('__normalized_numeric_fathers',{}))==133")
change("check(book.get('__held_edges')==[],'The source must not contain any circular parent relationships')", "check(book.get('__held_edges')==[],'There are unresolved or circular parent relationships')")
change("    p362=next(x for x in positions if cell(x,'A')=='P362')\n    check(cell(p362,'K')=='P361','Expected new P362 father reference')", "    p003=next(x for x in positions if cell(x,'A')=='P003')\n    p146=next(x for x in positions if cell(x,'A')=='P146')\n    p538=next(x for x in positions if cell(x,'A')=='P538')\n    check(cell(p003,'K')=='P020' and cell(p146,'K')=='P118' and cell(p538,'J')=='حسن','Expected corrected fathers and spelling in latest Excel')")
change("check(edges==447 and connected==443", "check(edges==516 and connected==517")
change("==87,'Excel review coloring", "==101,'Excel review coloring")
change("'numeric_father_ids_normalized':67,'held_links':[]", "'numeric_father_ids_normalized':133,'held_links':[]")
change("s=swap(s,'/tmp/shajara-v9.normalized.json',str(INPUT))", "s=swap(s,'/tmp/shajara-v10.normalized.json',str(INPUT))")
change("s=swap(s,'$parentRefs!==421','$parentRefs!==447')", """s=swap(s,'$parentRefs!==447','$parentRefs!==516')
    s=swap(s,"'مواضع الشجرة الكبيرة'=>507","'مواضع الشجرة الكبيرة'=>503")
    s=swap(s,'count($data)!==521','count($data)!==517')
    s=swap(s,"'people_excel']!==521","'people_excel']!==517")
    s=swap(s,"'chart_readings_excel']!==657","'chart_readings_excel']!==653")
    s=swap(s,"'workbook_reviews_total']<506","'workbook_reviews_total']<502")""")
change("""    s=swap(s,"'parent_ref'=>($key==='P362'?'':$C($r,'K')),'kind'=>'position'",
             "'parent_ref'=>$C($r,'K'),'kind'=>'position'")""", """    # Keep all parent references exactly as entered in the latest workbook.
    s=swap(s,"'parent_ref'=>$C($r,'K'),'kind'=>'position'",
             "'parent_ref'=>$C($r,'K'),'kind'=>'position'") if False else s""")
change("s=swap(s,'Excel-only:v9:','Excel-only:v10:')", "s=swap(s,'Excel-only:v10:','Excel-only:v13:')")
change("""    old_notice="if($key==='P362')$note.=' | ورد معرف الأب P362 في Excel مطابقا لمعرف الشخص؛ الرابط معلّق للمراجعة لتجنّب علاقة ذاتية.';"
    check(old_notice in s,'Importer still contains an unexpected pending edge hold')
    s=s.replace(old_notice,'')""", "")
change("preview.get('people')==521 and preview.get('parent_edges')==447", "preview.get('people')==517 and preview.get('parent_edges')==516")
change("'pre-v10-safe-backup-'", "'pre-v13-safe-backup-'")
change("obj.get('people')==521 and obj.get('chart_readings')==657 and obj.get('chart_edges')==447", "obj.get('people')==517 and obj.get('chart_readings')==653 and obj.get('chart_edges')==516")
change("check(len(people)==521,'Expected 521 v10 people for offline bundle", "check(len(people)==517,'Expected 517 latest workbook people for offline bundle")
change("user's Excel v10.", "user's latest timestamped Excel.")
change("'Excel-only:v9:%' in code or 'Excel-only:v10:%' in code", "'Excel-only:v10:%' in code or 'Excel-only:v13:%' in code")
change("code.replace('Excel-only:v9:%','Excel-only:v10:%')", "code.replace('Excel-only:v10:%','Excel-only:v13:%')")
change("stat.get('total')==521 and stat.get('connected_to_prophet')==443 and stat.get('disconnected_from_prophet')==78", "stat.get('total')==517 and stat.get('connected_to_prophet')==517 and stat.get('disconnected_from_prophet')==0")
change("archive=PRIVATE/'shajara-source-v10-normalized.json.gz'", "archive=PRIVATE/'shajara-source-v13-normalized.json.gz'")
change("manifest=PRIVATE/'shajara-v10-changes.json'", "manifest=PRIVATE/'shajara-v13-changes.json'")
change('SHAJARA_V10_DEPLOYED', 'SHAJARA_V13_DEPLOYED')
new.write_text(s,encoding='utf-8')
check=subprocess.run(['python3','-m','py_compile',str(new)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True)
if check.returncode:raise RuntimeError('Generated importer failed Python syntax check '+check.stderr[-1500:])
print('SHJ_V13_IMPORTER_READY',len(s),flush=True)
result=subprocess.run(['python3',str(new)],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True)
print(result.stdout,flush=True)
if result.returncode:raise RuntimeError('v13 deployment failed; status='+str(result.returncode))