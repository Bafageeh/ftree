#!/usr/bin/env python3
"""One-shot, validated import of the user-provided Shajara Excel v8 normalized data.

The input JSON is transferred privately via SSH. Previous DB rows are retained
for rollback and only rows tagged with this Excel version are made visible.
"""
import gzip
import hashlib
import json
import os
import re
import shutil
import signal
import sqlite3
import subprocess
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

APP = Path(os.environ.get('APP_PATH') or '/mnt/home-storage/home/pmsa/apps/shajara').resolve()
API = APP / 'shajara-api'
MOBILE = APP / 'shajara-mobile'
PRIVATE = API / 'storage/app/private/source_workbooks'
INPUT = Path('/tmp/shajara-v8.normalized.json')
PREVIOUS = PRIVATE / 'shajara-source-v6-20261031.xlsx'
PREV_IMPORT = Path('/tmp/shajara_excel_only_import_v6.php')
IMPORT = Path('/tmp/shajara_excel_only_import_v8.php')
ORIGINAL_SOURCE = 'الشجرة_مع_الجذع_المربوط(6).xlsx'
NEW_SOURCE = 'الشجرة_مع_الجذع_المربوط(8).xlsx'
OLD_HASH = 'cc7ed3b2273a974720c3dcafdc65e574d2cf1c6221f31377928a9b35891517ba'
NEW_HASH = '9c98d259cf409c844acb2a351110d28e8a0a64b2a4ce21b3aae8fcd8b5f92deb'


def require(test, why):
    if not test:
        raise RuntimeError(why)


def replace_exact(contents, old, new):
    require(old in contents, 'Importer or API format has changed: ' + old[:80])
    return contents.replace(old, new)


def row_c(row, col):
    return str(row['cells'].get(col) or '').strip()


def validate_book():
    require(INPUT.is_file(), 'Private workbook data is missing')
    b = json.loads(INPUT.read_text())
    require(b.get('__source_sha256') == NEW_HASH, 'The workbook digest does not match v8')
    require(b.get('__source_filename') == NEW_SOURCE, 'Unexpected source filename')
    require(b.get('__held_edges') == ['P282'], 'Parent-link safety rule mismatch')
    counts = {'مواضع الشجرة الكبيرة': 502, 'الجذع الرئيسي': 17,
              'القراءات السابقة 152': 153, 'عناوين الفروع 36': 37}
    require(all(len(b.get(k, [])) == v for k, v in counts.items()), 'Worksheet row counts are inconsistent')
    first = b['مواضع الشجرة الكبيرة'][0]['cells']
    require(first.get('A') == 'رقم الموضع' and first.get('K') == 'معرف الأب المقترح', 'Incorrect position header')
    parent = {}
    trunks = b['الجذع الرئيسي'][1:]
    trunk_aliases = {row_c(r,'A'):row_c(r,'F') for r in trunks}
    for row in trunks:
        key = row_c(row, 'F')
        require(re.fullmatch('CORE-[0-9]{3}',key) and key not in parent, 'Duplicate trunk key')
        ref = row_c(row, 'G')
        parent[key] = trunk_aliases.get(ref,ref)
    seen = set()
    omitted = []
    for row in b['مواضع الشجرة الكبيرة'][1:]:
        key = row_c(row,'A')
        require(re.fullmatch('P[0-9]{3,6}',key) and key not in seen, 'Bad/duplicate source ID')
        seen.add(key)
        if row_c(row,'D') == 'زخرفة محتملة' and not row_c(row,'J'):
            omitted.append(key)
            continue
        ref = row_c(row, 'K')
        parent[key] = '' if key == 'P282' else trunk_aliases.get(ref,ref)
    require(omitted == ['P005'], 'Ornament classification changed')
    require(len(parent) == 516, 'Expected 516 Excel names including trunk')
    require(len(seen) == 501, 'Expected 501 numbered position records')
    require(sum(bool(ref) for ref in parent.values()) == 347, 'Expected 347 safe parent links')
    require(row_c(next(x for x in b['مواضع الشجرة الكبيرة'] if row_c(x,'A') == 'P282'),'K') == 'P272',
            'Original conflicting P282 father reference must remain preserved for review')
    connected = 0
    for key, ref in parent.items():
        require(not ref or ref in parent, 'Missing father: ' + key + ' -> ' + ref)
        chain = set()
        cursor = key
        while cursor:
            require(cursor not in chain, 'A circular relationship remains at ' + cursor)
            chain.add(cursor)
            cursor = parent[cursor]
        cursor = key
        seen_path = set()
        while cursor and cursor not in seen_path:
            if cursor == 'CORE-001':
                connected += 1
                break
            seen_path.add(cursor)
            cursor = parent[cursor]
    require(connected == 334, f'Connected people mismatch: {connected}')
    print('VALIDATED_BOOK',json.dumps({'people':len(parent),'links':347,'connected':connected,
                                        'pending_unlinked':len(parent)-connected,'hold':'P282->P272'},ensure_ascii=False),flush=True)
    return b


def prepare_importer():
    require(PREVIOUS.is_file() and PREV_IMPORT.is_file(), 'Stored v6 workbook/importer missing; no changes applied')
    require(hashlib.sha256(PREVIOUS.read_bytes()).hexdigest() == OLD_HASH, 'Stored v6 workbook checksum mismatch')
    code = PREV_IMPORT.read_text()
    pairs = [
        ('/tmp/shajara-excel-only-20261031-v6.xlsx',str(PREVIOUS)),
        ('/tmp/shajara-excel-only-v6-data.json',str(INPUT)),
        (ORIGINAL_SOURCE,NEW_SOURCE),
        ("'مواضع الشجرة الكبيرة'=>504","'مواضع الشجرة الكبيرة'=>502"),
        ('count($data)!==506','count($data)!==516'),
        ('count($ornaments)!==13','count($ornaments)!==1'),
        ("'people_excel']!==506","'people_excel']!==516"),
        ("'chart_readings_excel']!==642","'chart_readings_excel']!==652"),
        ("'workbook_reviews_total']<503","'workbook_reviews_total']<501"),
        ('$parentRefs<162 || $parentRefs>475','$parentRefs!==347'),
        ("'parent_ref'=>$C($r,'K'),'kind'=>'position'", "'parent_ref'=>($key==='P282'?'':$C($r,'K')),'kind'=>'position'"),
        ("'بنفسجي فاتح جدا'=>'#DDD6FE'", "'بنفسجي فاتح جدا'=>'#DDD6FE','بمبي'=>'#F9A8D4'"),
        ("str_starts_with($C($r,'D'),'بنفسجي')", "(str_starts_with($C($r,'D'),'بنفسجي') || $C($r,'D')==='بمبي')"),
    ]
    for a, b in pairs:
        code = replace_exact(code,a,b)
    code = replace_exact(code,"'notes'=>'Excel-only: ","'notes'=>'Excel-only:v8: ")
    # Prefix every source read/edge marker, allowing old genealogical rows to remain archived but invisible.
    code = code.replace("->where('notes','like','Excel-only:%')", "->where('notes','like','Excel-only:v8:%')")
    code = replace_exact(code,'$summary=$trunk?',
                         "if($key==='P282')$note.=' | صلة الأب P272 مسجلة في Excel ومعلقة فقط في العرض بسبب دورة P272-P281-P282.';\n    $summary=$trunk?")
    IMPORT.write_text(code)
    check = subprocess.run(['php','-l',str(IMPORT)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True)
    require(check.returncode == 0,check.stdout+check.stderr)
    for name in ('PersonController.php','ChartReadingController.php','ChartEdgeController.php'):
        path = API / 'app/Http/Controllers/Api'/name
        require(path.is_file(), 'Missing API controller: ' + name)
        existing = path.read_text()
        if name == 'PersonController.php':
            require(ORIGINAL_SOURCE in existing or NEW_SOURCE in existing, 'Unexpected API person source filter')
        else:
            require("Excel-only:%" in existing or 'Excel-only:v8:%' in existing,
                    'Unexpected API chart source filter')
    dry = subprocess.run(['php',str(IMPORT),'--dry-run'],cwd=API,stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=60)
    require(dry.returncode == 0, 'Validated import dry run failed: '+(dry.stdout+dry.stderr)[-1400:])
    print('DRY_RUN',dry.stdout.strip(),flush=True)


def backup_files():
    label=datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
    dest=API/'storage/app/private'/f'pre-v8-safe-backup-{label}'
    dest.mkdir(parents=True,exist_ok=False,mode=0o700)
    db=API/'database/database.sqlite'
    require(db.is_file(), 'Expected SQLite database not found')
    sqlite_cli=shutil.which('sqlite3') or '/opt/android-sdk/platform-tools/sqlite3'
    require(Path(sqlite_cli).is_file(), 'SQLite backup utility is unavailable')
    snap=subprocess.run([sqlite_cli,str(db),'.backup '+str(dest/'database.sqlite')],
                        stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=50)
    require(snap.returncode==0 and (dest/'database.sqlite').is_file(),
            'SQLite backup failed: '+(snap.stdout+snap.stderr)[-1000:])
    for relative in ('app/Http/Controllers/Api/PersonController.php',
                     'app/Http/Controllers/Api/ChartReadingController.php',
                     'app/Http/Controllers/Api/ChartEdgeController.php'):
        shutil.copy2(API/relative,dest/Path(relative).name)
    shutil.copy2(MOBILE/'src/generated/bundledPeople.ts',dest/'bundledPeople.ts')
    os.chmod(dest,0o700)
    print('BACKUP',str(dest),flush=True)
    return dest


def import_people():
    result=subprocess.run(['php',str(IMPORT)],cwd=API,stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=150)
    require(result.returncode==0, 'Importer failed: '+(result.stdout+result.stderr)[-1900:])
    try: report=json.loads(result.stdout)
    except json.JSONDecodeError: raise RuntimeError('Malformed importer output: '+result.stdout[-1400:])
    require(report.get('applied') and report.get('people')==516 and report.get('chart_readings')==652
            and report.get('chart_edges')==347, 'Unexpected imported counts: '+result.stdout[-1600:])
    print('IMPORT_COMPLETE',json.dumps(report,ensure_ascii=False),flush=True)


def export_fallback(backup):
    db=API/'database/database.sqlite'
    columns=['id','full_name','source_code','node_type','lineage_parent_id','status','approval_status',
             'is_provisional','generation','chart_branch','chart_color','chart_order',
             'summary','source_reference','source_locator','is_living']
    con=sqlite3.connect(str(db));con.row_factory=sqlite3.Row
    data=[dict(x) for x in con.execute('SELECT '+','.join(columns)+' FROM people WHERE source_reference=? ORDER BY chart_order',(NEW_SOURCE,))]
    con.close()
    require(len(data)==516, 'Only '+str(len(data))+' v8 people were found for offline export')
    for x in data:
        x['is_provisional']=bool(x['is_provisional']); x['is_living']=bool(x['is_living'])
    target=MOBILE/'src/generated/bundledPeople.ts'
    target.write_text("import type { Person } from '../types';\n// Offline records derived solely from workbook v8.\nexport const bundledPeople: Person[] = "+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
    tsc=Path('/opt/shajara-sdk58/node_modules/typescript/bin/tsc')
    if tsc.is_file():
        result=subprocess.run(['node',str(tsc),'--noEmit','--pretty','false'],cwd=MOBILE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=120)
        if result.returncode:
            shutil.copy2(backup/'bundledPeople.ts',target)
            raise RuntimeError('TypeScript verification failed: '+(result.stdout+result.stderr)[-1400:])
    print('OFFLINE_SNAPSHOT_OK',len(data),flush=True)


def publish_api(backup):
    for filename in ('PersonController.php','ChartReadingController.php','ChartEdgeController.php'):
        f=API/'app/Http/Controllers/Api'/filename
        s=f.read_text()
        if filename=='PersonController.php':
            if ORIGINAL_SOURCE in s:
                s=replace_exact(s,ORIGINAL_SOURCE,NEW_SOURCE)
            require(NEW_SOURCE in s,'API person filter not updated')
        else:
            if "Excel-only:%" in s:
                s=s.replace("Excel-only:%","Excel-only:v8:%")
            require('Excel-only:v8:%' in s, 'API chart filter not updated')
        f.write_text(s)
        check=subprocess.run(['php','-l',str(f)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True)
        if check.returncode:
            shutil.copy2(backup/filename,f)
            raise RuntimeError('PHP lint failed: '+check.stdout+check.stderr)
    subprocess.run(['php','artisan','optimize:clear'],cwd=API,stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=40)
    print('API_PUBLISHED',flush=True)


def verify_api():
    from urllib.request import urlopen
    url='https://shajara.pm.sa/api/v1/stats'
    try:
        with urlopen(url, timeout=20) as response:
            status=json.load(response)
    except Exception as exc:
        print('API_VERIFICATION_WARNING',repr(exc),flush=True)
        return
    require(status.get('total')==516 and status.get('connected_to_prophet')==334
            and status.get('disconnected_from_prophet')==182, 'Public API not reflecting v8: '+repr(status))
    print('API_STATS_VERIFIED',json.dumps(status,ensure_ascii=False),flush=True)


def restart_expo():
    result=subprocess.run(['ss','-ltnp','sport = :8091'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True)
    match=re.search(r'pid=(\d+)',result.stdout)
    if match:
        pid=int(match.group(1))
        args=(Path('/proc')/str(pid)/'cmdline').read_bytes().replace(b'\0',b' ')
        require(b'expo' in args and b'8091' in args,'An unrelated process is using Expo port 8091')
        os.kill(pid,signal.SIGTERM)
        time.sleep(2)
    log=MOBILE/'expo-8091.log'
    with log.open('w') as output:
        proc=subprocess.Popen(['/usr/bin/node','node_modules/expo/bin/cli','start','--clear','--go','--tunnel','--port','8091'],
                              cwd=MOBILE,stdin=subprocess.DEVNULL,stdout=output,stderr=subprocess.STDOUT,
                              env={**os.environ,'CI':'1','EXPO_NO_TELEMETRY':'1'},start_new_session=True)
    for _ in range(48):
        time.sleep(1)
        text=log.read_text(errors='replace')
        match=re.search(r'Waiting on http://([^\s]+\.on\.expo\.app)',text)
        if match:return 'exp://'+match.group(1)
        if proc.poll() is not None: raise RuntimeError('Expo process exited: '+text[-1000:])
    return 'Expo startup in progress'


def main():
    validate_book()
    prepare_importer()
    backup=backup_files()
    import_people()
    export_fallback(backup)
    publish_api(backup)
    verify_api()
    PRIVATE.mkdir(mode=0o700,parents=True,exist_ok=True)
    dest=PRIVATE/'shajara-source-v8-normalized.json.gz'
    dest.write_bytes(gzip.compress(INPUT.read_bytes(),compresslevel=8))
    os.chmod(dest,0o600)
    try:
        print('EXPO_LINK',restart_expo(),flush=True)
    except Exception as exc:
        print('EXPO_RESTART_WARNING',str(exc),flush=True)
    print('SHAJARA_V8_DEPLOYED',NEW_HASH,flush=True)

if __name__=='__main__':
    main()