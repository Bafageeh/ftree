#!/usr/bin/env python3
"""Diagnose Laravel runtime failures and restore last-good search if necessary."""
from pathlib import Path
import os,re,subprocess,shutil
app=Path(os.environ['APP_PATH']).resolve()/'shajara-api'
log=app/'storage/logs/laravel.log'
if log.exists():
    lines=log.read_text(errors='replace').splitlines()
    recent=[line for line in lines[-2500:] if '.ERROR:' in line or 'production.ERROR:' in line or 'local.ERROR:' in line or 'ErrorException:' in line]
    for line in recent[-6:]:
        line=re.sub(r'https?://\S+','[url]',line)
        line=re.sub(r'\?search=[^ ]+','?search=[redacted]',line)
        print('LAST_LARAVEL_ERROR',line[:850],flush=True)
else:
    print('NO_LARAVEL_LOG')
backup=app/'storage/app/private/before-ancestor-search-20261031-214250'
for file,target in [('LineageController.php',app/'app/Http/Controllers/Web/LineageController.php'),('index.blade.php',app/'resources/views/lineage/index.blade.php')]:
    prior=backup/file
    assert prior.is_file() and target.is_file(),str(prior)
    shutil.copy2(prior,target)
for cmd in [['php','artisan','optimize:clear'],['php','artisan','view:cache']]:
    p=subprocess.run(cmd,cwd=app,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True,timeout=65)
    assert p.returncode==0,p.stdout[-500:]
print('PREVIOUS_WORKING_SEARCH_RESTORED')
