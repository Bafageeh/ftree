#!/usr/bin/env python3
"""Safely publish the latest standalone Shajara web-search experience."""
import os, subprocess, shutil, time
from pathlib import Path

base = Path(os.environ["APP_PATH"]).resolve() / "shajara-api"
c = base / "app/Http/Controllers/Web/LineageController.php"
v = base / "resources/views/lineage/index.blade.php"
staged_c = Path("/tmp/shajara-search-controller.php")
staged_v = Path("/tmp/shajara-search-index.blade.php")
source = "الشجرة_مع_الجذع_المربوط(20261031-160557).xlsx"

def require(p, msg):
    if not p: raise RuntimeError(msg)

for path in (c, v, staged_c, staged_v):
    require(path.is_file() and path.stat().st_size > 2000, "Missing expected file: "+str(path))
require(source in c.read_text() and source in staged_c.read_text(), "Live genealogy source mismatch")
require("class LineageController" in c.read_text(), "Unexpected active web controller")
require("private static function normalizeSearchText" in staged_c.read_text(), "Arabic normalization not staged")
require("id=\"tree-results\"" in staged_v.read_text(), "Live results section not staged")
require("new DOMParser()" in staged_v.read_text(), "Live instant-search behavior not staged")
require("<form class=\"filters\"" in v.read_text(), "Existing view structure changed")

lint = subprocess.run(["php", "-l", str(staged_c)], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True, timeout=20)
require(lint.returncode == 0, "PHP syntax check failed: "+lint.stdout)

folder = base / "storage/app/private" / ("web-search-backup-"+time.strftime("%Y%m%d-%H%M%S"))
folder.mkdir(mode=0o700, parents=True)
shutil.copy2(c, folder/"LineageController.php")
shutil.copy2(v, folder/"index.blade.php")
try:
    shutil.copy2(staged_c, c)
    shutil.copy2(staged_v, v)
    lint = subprocess.run(["php", "-l", str(c)], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True, timeout=20)
    require(lint.returncode == 0, "Production PHP syntax check failed: "+lint.stdout)
    for cmd in (["php", "artisan", "view:clear"], ["php", "artisan", "optimize:clear"], ["php", "artisan", "view:cache"]):
        checked = subprocess.run(cmd, cwd=base, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True, timeout=60)
        require(checked.returncode == 0, "Laravel command failed "+str(cmd)+": "+checked.stdout[-800:])
except Exception:
    shutil.copy2(folder/"LineageController.php", c)
    shutil.copy2(folder/"index.blade.php", v)
    subprocess.run(["php", "artisan", "optimize:clear"], cwd=base, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=40)
    raise

print("LIVE_SEARCH_PUBLISHED", str(folder))
