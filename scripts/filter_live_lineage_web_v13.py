#!/usr/bin/env python3
"""Limit the public genealogy web pages to the latest user-supplied workbook."""
from pathlib import Path
import shutil,subprocess
api=Path('/mnt/home-storage/home/pmsa/apps/shajara/shajara-api')
path=api/'app/Http/Controllers/Web/LineageController.php'
assert path.is_file(),str(path)
src=path.read_text()
assert 'class LineageController' in src
marker="            ->where('approval_status', '!=', 'rejected')"
expected="            ->where('source_reference', 'الشجرة_مع_الجذع_المربوط(20261031-160557).xlsx')"
if expected not in src:
    assert marker in src,'Expected query marker not found'
    src=src.replace(marker,marker+"\n"+expected,1)
show_marker="        abort_if($person->approval_status === 'rejected', 404);"
show_filter="        abort_unless($person->source_reference === 'الشجرة_مع_الجذع_المربوط(20261031-160557).xlsx', 404);"
if show_filter not in src:
    assert show_marker in src,'Expected selected-person marker not found'
    src=src.replace(show_marker,show_filter+"\n"+show_marker,1)
backup=path.with_name('LineageController.before-excel-v13.php.bak')
if not backup.exists():shutil.copy2(path,backup)
path.write_text(src)
lint=subprocess.run(['php','-l',str(path)],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True)
if lint.returncode:
    shutil.copy2(backup,path)
    raise RuntimeError('PHP syntax failure: '+lint.stdout)
cmd=subprocess.run(['php','artisan','optimize:clear'],cwd=api,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True,timeout=40)
assert cmd.returncode==0,cmd.stdout
print('LATEST_WEB_FILTER_ENABLED')
