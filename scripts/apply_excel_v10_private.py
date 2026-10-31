#!/usr/bin/env python3
"""One-time private import of the user's Shajara Excel version 10.

Never publishes genealogy data to GitHub: normalized workbook arrives encrypted,
then is decrypted on a GitHub Actions runner and copied via SSH to the server.
The existing Laravel SQLite data is backed up before changes and prior
source versions are left archived rather than deleted.
"""
import os, re, json, gzip, hashlib, shutil, sqlite3, subprocess, time, signal
from pathlib import Path
from datetime import datetime, timezone

APP=Path(os.environ.get('APP_PATH') or '/mnt/home-storage/home/pmsa/apps/shajara').resolve()
API=APP/'shajara-api'; MOBILE=APP/'shajara-mobile'; PRIVATE=API/'storage/app/private/source_workbooks'
INPUT=Path('/tmp/shajara-v10.normalized.json')
OLD_NORMALIZED=PRIVATE/'shajara-source-v9-normalized.json.gz'
PREV_IMPORT=Path('/tmp/shajara_excel_only_import_v9.php')
IMPORT=Path('/tmp/shajara_excel_only_import_v10.php')
OLD_SOURCE='الشجرة_مع_الجذع_المربوط(9).xlsx'; NEW_SOURCE='الشجرة_مع_الجذع_المربوط(10).xlsx'
OLD_SHA='f9785e1b8af5b8c52fe02fdc7600a0c400e148751ffb0bd48a43a1f2f8b6caad'
NEW_SHA='13e85cacfcc1e0025533fd0f64c408788a515313e17defe0a2c1745af1d1c3a0'
SHEETS={'مواضع الشجرة الكبيرة':507,'الجذع الرئيسي':17,'القراءات السابقة 152':153,'عناوين الفروع 36':37}


def check(ok,msg):
    if not ok:raise RuntimeError(msg)


def cell(row,col):
    return str(row['cells'].get(col) or '').strip()


def swap(text,old,new):
    check(old in text,'Existing application structure differs: '+old[:65])
    return text.replace(old,new)


def validate():
    check(INPUT.is_file(), 'Private v10 input missing')
    book=json.loads(INPUT.read_text(encoding='utf-8'))
    check(book.get('__source_sha256')==NEW_SHA and book.get('__source_filename')==NEW_SOURCE,'Source Excel verification failed')
    for sheet,size in SHEETS.items():
        check(len(book.get(sheet,[]))==size,'Incorrect worksheet: '+sheet)
    positions=book['مواضع الشجرة الكبيرة']
    check(cell(positions[0],'A')=='رقم الموضع' and cell(positions[0],'K')=='معرف الأب المقترح','Incorrect Excel header')
    trunk=book['الجذع الرئيسي'][1:]
    aliases={cell(x,'A'):cell(x,'F') for x in trunk}
    parent={cell(x,'F'):aliases.get(cell(x,'G'),cell(x,'G')) for x in trunk}
    indices=[];decor=[]
    for row in positions[1:]:
        key=cell(row,'A')
        check(bool(re.match(r'^P[0-9]{3,6}$',key)) and key not in indices,'Position duplicated/invalid: '+key)
        indices.append(key)
        if cell(row,'D')=='زخرفة محتملة' and not cell(row,'J'):
            decor.append(key)
            continue
        ref=cell(row,'K')
        parent[key]=aliases.get(ref,ref)
    check(len(indices)==506 and len(parent)==521 and decor==['P005'],'Unexpected names or ornaments')
    check(len(book.get('__normalized_numeric_fathers',{}))==67,'Numeric parent normalization mismatch')
    check(book.get('__held_edges')==[],'The source must not contain any circular parent relationships')
    p362=next(x for x in positions if cell(x,'A')=='P362')
    check(cell(p362,'K')=='P361','Expected new P362 father reference')
    for k,p in parent.items():
        check(not p or p in parent,'Missing parent '+k+' -> '+str(p))
        chain=set();n=k
        while n:
            check(n not in chain,'Circular parent references at '+n)
            chain.add(n);n=parent[n]
    connected=0
    for k in parent:
        n=k;history=set()
        while n and n not in history:
            if n=='CORE-001':connected+=1;break
            history.add(n);n=parent[n]
    edges=sum(bool(x) for x in parent.values())
    check(edges==447 and connected==443,'Unexpected relationship counts: '+str((edges,connected)))
    check(sum(bool(x.get('red')) for x in positions[1:])==87,'Excel review coloring has changed unexpectedly')
    print('VALIDATED_BOOK',json.dumps({'people':len(parent),'edges':edges,'connected_to_trunk':connected,
         'unlinked':len(parent)-connected,'numeric_father_ids_normalized':67,'held_links':[]},ensure_ascii=False),flush=True)
    return book


def compare_previous(book):
    check(OLD_NORMALIZED.is_file(),'Previous v9 normalized archive unavailable')
    prev=json.loads(gzip.decompress(OLD_NORMALIZED.read_bytes()).decode('utf-8'))
    check(prev.get('__source_sha256')==OLD_SHA,'Previous v9 source archive checksum unexpected')
    get=lambda b:{cell(r,'A'):r for r in b['مواضع الشجرة الكبيرة'][1:]}
    a=get(prev);b=get(book)
    added=sorted(set(b)-set(a));removed=sorted(set(a)-set(b))
    changed=sum(1 for k in set(a)&set(b) if a[k]['cells']!=b[k]['cells'] or a[k]['red']!=b[k]['red'])
    print('EXCEL_DIFF',json.dumps({'new_positions':len(added),'removed_positions':len(removed),
                      'edited_positions':changed},ensure_ascii=False),flush=True)
    return {'added_positions':added,'removed_positions':removed,'changed_positions_count':changed,
            'from_excel':OLD_SOURCE,'to_excel':NEW_SOURCE}


def prepare_importer():
    check(PREV_IMPORT.is_file(),'Previous Excel importer is missing')
    s=PREV_IMPORT.read_text()
    s=swap(s,'/tmp/shajara-v9.normalized.json',str(INPUT))
    s=swap(s,OLD_SOURCE,NEW_SOURCE)
    s=swap(s,'$parentRefs!==421','$parentRefs!==447')
    s=swap(s,"'parent_ref'=>($key==='P362'?'':$C($r,'K')),'kind'=>'position'",
             "'parent_ref'=>$C($r,'K'),'kind'=>'position'")
    s=swap(s,'Excel-only:v9:','Excel-only:v10:')
    old_notice="if($key==='P362')$note.=' | ورد معرف الأب P362 في Excel مطابقا لمعرف الشخص؛ الرابط معلّق للمراجعة لتجنّب علاقة ذاتية.';"
    check(old_notice in s,'Importer still contains an unexpected pending edge hold')
    s=s.replace(old_notice,'')
    s=swap(s,"'source_sha256'=>'"+OLD_SHA+"'],JSON_UNESCAPED_UNICODE);",
           "'source_sha256'=>'"+NEW_SHA+"'],JSON_UNESCAPED_UNICODE);")
    IMPORT.write_text(s)
    lint=subprocess.run(['php','-l',str(IMPORT)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=30)
    check(lint.returncode==0,'PHP import syntax invalid: '+lint.stdout+lint.stderr)
    dry=subprocess.run(['php',str(IMPORT),'--dry-run'],cwd=API,stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=60)
    check(dry.returncode==0,'PHP import dry-run failed: '+(dry.stdout+dry.stderr)[-1400:])
    preview=json.loads(dry.stdout)
    check(preview.get('people')==521 and preview.get('parent_edges')==447,'Dry run returned incorrect counts')
    print('DRY_RUN',json.dumps(preview,ensure_ascii=False),flush=True)


def backup():
    stamp=datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
    folder=API/'storage/app/private'/('pre-v10-safe-backup-'+stamp)
    folder.mkdir(parents=True,exist_ok=False,mode=0o700)
    db=API/'database/database.sqlite';check(db.is_file(),'Missing production database')
    sqlite=shutil.which('sqlite3') or '/opt/android-sdk/platform-tools/sqlite3'
    check(Path(sqlite).is_file(),'SQLite backup CLI missing')
    job=subprocess.run([sqlite,str(db),'.backup '+str(folder/'database.sqlite')],stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=60)
    check(job.returncode==0 and (folder/'database.sqlite').is_file(), 'SQLite backup failed: '+(job.stdout+job.stderr)[-500:])
    for name in ('PersonController.php','ChartReadingController.php','ChartEdgeController.php'):
        shutil.copy2(API/'app/Http/Controllers/Api'/name,folder/name)
    shutil.copy2(MOBILE/'src/generated/bundledPeople.ts',folder/'bundledPeople.ts')
    print('BACKUP_READY',str(folder),flush=True)
    return folder


def import_data():
    r=subprocess.run(['php',str(IMPORT)],cwd=API,stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=170)
    check(r.returncode==0,'Import error: '+(r.stdout+r.stderr)[-1600:])
    obj=json.loads(r.stdout)
    check(obj.get('applied') and obj.get('people')==521 and obj.get('chart_readings')==657 and obj.get('chart_edges')==447,
          'Imported table count mismatch '+r.stdout[-1500:])
    print('IMPORT_COMPLETE',json.dumps(obj,ensure_ascii=False),flush=True)


def export_offline():
    c=sqlite3.connect(str(API/'database/database.sqlite'));c.row_factory=sqlite3.Row
    cols=['id','full_name','source_code','node_type','lineage_parent_id','status','approval_status','is_provisional',
          'generation','chart_branch','chart_color','chart_order','summary','source_reference','source_locator','is_living']
    people=[dict(r) for r in c.execute('SELECT '+','.join(cols)+' FROM people WHERE source_reference=? ORDER BY chart_order',(NEW_SOURCE,))]
    c.close();check(len(people)==521,'Expected 521 v10 people for offline bundle, got '+str(len(people)))
    for p in people:p['is_provisional']=bool(p['is_provisional']);p['is_living']=bool(p['is_living'])
    target=MOBILE/'src/generated/bundledPeople.ts'
    target.write_text("import type { Person } from '../types';\n// Offline snapshot derived solely from user's Excel v10.\nexport const bundledPeople: Person[] = "+json.dumps(people,ensure_ascii=False,separators=(',',':'))+';\n')
    tsc=Path('/opt/shajara-sdk58/node_modules/typescript/bin/tsc')
    if tsc.is_file():
        r=subprocess.run(['node',str(tsc),'--noEmit','--pretty','false'],cwd=MOBILE,
                         stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=120)
        check(r.returncode==0,'TypeScript verification failed: '+(r.stdout+r.stderr)[-1300:])
    print('OFFLINE_SNAPSHOT_OK',len(people),flush=True)


def publish_api():
    for name in ('PersonController.php','ChartReadingController.php','ChartEdgeController.php'):
        file=API/'app/Http/Controllers/Api'/name
        code=file.read_text()
        if name=='PersonController.php':
            check(OLD_SOURCE in code or NEW_SOURCE in code,'Person API workbook source mismatch')
            code=code.replace(OLD_SOURCE,NEW_SOURCE)
        else:
            check('Excel-only:v9:%' in code or 'Excel-only:v10:%' in code,'Chart API source marker mismatch')
            code=code.replace('Excel-only:v9:%','Excel-only:v10:%')
        file.write_text(code)
        lint=subprocess.run(['php','-l',str(file)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=30)
        check(lint.returncode==0,'API syntax error: '+(lint.stdout+lint.stderr)[-1000:])
    subprocess.run(['php','artisan','optimize:clear'],cwd=API,stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=45)
    print('API_PUBLISHED',flush=True)


def verify_api():
    from urllib.request import urlopen
    with urlopen('https://shajara.pm.sa/api/v1/stats',timeout=25) as res:stat=json.load(res)
    check(stat.get('total')==521 and stat.get('connected_to_prophet')==443 and stat.get('disconnected_from_prophet')==78,
          'Live API count mismatch: '+json.dumps(stat,ensure_ascii=False))
    print('API_STATS_VERIFIED',json.dumps(stat,ensure_ascii=False),flush=True)


def expo_restart():
    running=subprocess.run(['ss','-ltnp','sport = :8091'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=20)
    match=re.search(r'pid=(\d+)',running.stdout)
    if match:
        pid=int(match.group(1))
        cmd=(Path('/proc')/str(pid)/'cmdline').read_bytes().replace(b'\0',b' ')
        check(b'expo' in cmd and b'8091' in cmd,'Port 8091 is not owned by Expo')
        os.kill(pid,signal.SIGTERM);time.sleep(2)
    log=MOBILE/'expo-8091.log'
    with log.open('w') as output:
        proc=subprocess.Popen(['/usr/bin/node','node_modules/expo/bin/cli','start','--clear','--go','--tunnel','--port','8091'],
            cwd=MOBILE,stdin=subprocess.DEVNULL,stdout=output,stderr=subprocess.STDOUT,
            env=dict(os.environ,CI='1',EXPO_NO_TELEMETRY='1'),start_new_session=True)
    for _ in range(50):
        time.sleep(1)
        txt=log.read_text(errors='replace')
        match=re.search(r'Waiting on http://([^\s]+\.on\.expo\.app)',txt)
        if match:return 'exp://'+match.group(1)
        if proc.poll() is not None:raise RuntimeError('Expo stopped: '+txt[-700:])
    raise RuntimeError('Expo tunnel not ready within validation window')


def main():
    book=validate()
    diff=compare_previous(book)
    prepare_importer()
    folder=backup()
    import_data()
    export_offline()
    publish_api()
    verify_api()
    PRIVATE.mkdir(parents=True,exist_ok=True,mode=0o700)
    archive=PRIVATE/'shajara-source-v10-normalized.json.gz'
    archive.write_bytes(gzip.compress(INPUT.read_bytes(),compresslevel=8));archive.chmod(0o600)
    manifest=PRIVATE/'shajara-v10-changes.json'
    manifest.write_text(json.dumps(diff,ensure_ascii=False,indent=2));manifest.chmod(0o600)
    try: print('EXPO_LINK',expo_restart(),flush=True)
    except Exception as e: print('EXPO_RESTART_WARNING',str(e),flush=True)
    print('SHAJARA_V10_DEPLOYED',NEW_SHA,flush=True)

if __name__=='__main__':main()