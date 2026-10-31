#!/usr/bin/env python3
"""Fix web route bundle loading; keep genealogical records unchanged."""
import json
import shutil
from pathlib import Path

root=Path('/mnt/home-storage/home/pmsa/apps/shajara/shajara-mobile')
config=root/'app.json'
backup=root/'app.json.before-web-visibility-fix.bak'
if not backup.exists():
    shutil.copy2(config, backup)
doc=json.loads(config.read_text())
doc['expo']['extra']['router']['asyncRoutes']['web']=False
config.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
print('WEB_ROUTE_FIX_APPLIED')
