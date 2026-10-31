#!/usr/bin/env python3
"""Fix multi-generational genealogy searches on the deployed Shajara website."""
import os
import shutil
import subprocess
import time
from pathlib import Path

app = Path(os.environ.get('APP_PATH') or '/mnt/home-storage/home/pmsa/apps/shajara').resolve()
api = app/'shajara-api'
controller = api/'app/Http/Controllers/Web/LineageController.php'
view = api/'resources/views/lineage/index.blade.php'
assert controller.is_file() and view.is_file(), 'Genealogy website files are missing'
old = """                    foreach ($terms as $term) {
                        if (mb_strpos($recordText, $term) === false && mb_strpos($recordCompact, $term) === false) {
                            return false;
                        }
                    }

                    return count($terms) > 0;"""
new = """                    // Preserve ordinary name, code and location search.
                    $directMatch = count($terms) > 0;
                    foreach ($terms as $term) {
                        if (mb_strpos($recordText, $term) === false && mb_strpos($recordCompact, $term) === false) {
                            $directMatch = false;
                            break;
                        }
                    }
                    if ($directMatch) {
                        return true;
                    }

                    // Also interpret a query such as Ahmad Alawi Hashim as
                    // person's name, father's name and grandfather's name.
                    // Use only recorded parent links from the source Excel.
                    $lineageTerms = array_values(array_filter($terms, static function ($term) {
                        return ! in_array($term, ['بن', 'بنت', 'ابن'], true);
                    }));
                    if (count($lineageTerms) < 2 || count($lineageTerms) > 7) {
                        return false;
                    }

                    $nearestFirst = $record['trace']['path']->reverse()->values();
                    if ($nearestFirst->count() < count($lineageTerms)) {
                        return false;
                    }
                    foreach ($lineageTerms as $position => $term) {
                        $ancestorName = self::normalizeSearchText((string) $nearestFirst[$position]->full_name);
                        $ancestorCompact = str_replace(' ', '', $ancestorName);
                        if (mb_strpos($ancestorName, $term) === false && mb_strpos($ancestorCompact, $term) === false) {
                            return false;
                        }
                    }

                    return true;"""
old_view = """                    <div class="details">
                        الرمز: {{ $person->source_code ?: 'غير محدد' }}"""
new_view = """                    @if($search !== '' && preg_match('/\\s/u', trim($search)))
                        <div class="lineage-search-path" style="font-size:12px;line-height:1.9;color:#596d66;margin-top:6px;border-right:3px solid #b7893d;padding-right:10px">
                            <strong>مسار النسب:</strong>
                            {{ $trace['path']->reverse()->values()->take(4)->pluck('full_name')->implode(' ← ') }}
                        </div>
                    @endif
                    <div class="details">
                        الرمز: {{ $person->source_code ?: 'غير محدد' }}"""
code=controller.read_text()
html=view.read_text()
assert "الشجرة_مع_الجذع_المربوط(20261031-160557).xlsx" in code, 'Source version changed'
assert code.count(old)==1 or new in code, 'Search code differs from inspected version'
assert html.count(old_view)==1 or 'class="lineage-search-path"' in html, 'Search results template differs'
backup=api/'storage/app/private'/('before-ancestor-search-'+time.strftime('%Y%m%d-%H%M%S'))
backup.mkdir(parents=True,mode=0o700)
shutil.copy2(controller,backup/'LineageController.php')
shutil.copy2(view,backup/'index.blade.php')
try:
    if old in code:
        controller.write_text(code.replace(old,new,1))
    if old_view in html:
        view.write_text(html.replace(old_view,new_view,1))
    for target in (controller,):
        p=subprocess.run(['php','-l',str(target)],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True,timeout=25)
        assert p.returncode==0,p.stdout
    for cmd in (['php','artisan','view:clear'],['php','artisan','optimize:clear'],['php','artisan','view:cache']):
        p=subprocess.run(cmd,cwd=api,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True,timeout=70)
        assert p.returncode==0,str(cmd)+': '+p.stdout[-1200:]
except Exception:
    shutil.copy2(backup/'LineageController.php',controller)
    shutil.copy2(backup/'index.blade.php',view)
    subprocess.run(['php','artisan','optimize:clear'],cwd=api,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=60)
    raise
print('ANCESTOR_SEARCH_DEPLOYED',str(backup),flush=True)
