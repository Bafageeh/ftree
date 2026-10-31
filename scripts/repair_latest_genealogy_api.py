#!/usr/bin/env python3
"""Restore the active workbook-only API and the root tree route after generic scaffold deploys."""
import os,shutil,subprocess,time
from pathlib import Path
root=Path(os.environ["APP_PATH"]).resolve()/"shajara-api"
api=root/"app/Http/Controllers/Api"
files={
 "people":api/"PersonController.php",
 "readings":api/"ChartReadingController.php",
 "edges":api/"ChartEdgeController.php",
 "routes":root/"routes/web.php"
}
for label,p in files.items():
    if not p.is_file():raise RuntimeError("Missing "+label+": "+str(p))
source="الشجرة_مع_الجذع_المربوط(20261031-160557).xlsx"
backup=root/"storage/app/private"/("before-search-api-repair-"+time.strftime("%Y%m%d-%H%M%S"))
backup.mkdir(parents=True,mode=0o700)
for key,p in files.items():shutil.copy2(p,backup/(key+".php"))
print("API_BACKUP",backup,flush=True)

def sub_once(body,old,new,label):
    n=body.count(old)
    if n==0 and new in body:return body
    if n!=1:raise RuntimeError("Changed "+label+" structure (matches "+str(n)+")")
    return body.replace(old,new,1)

try:
    p=files["people"];code=p.read_text()
    marker="    private function connectedPeople(PropheticLineageService $lineage): array"
    if marker not in code:raise RuntimeError("Unexpected PersonController version")
    head,tail=code.split(marker,1)
    tail=sub_once(tail,
        "->where('approval_status', '!=', 'rejected')\n            ->get();",
        "->where('approval_status', '!=', 'rejected')\n            ->where('source_reference', '"+source+"')\n            ->get();","connectedPeople")
    code=head+marker+tail
    for method in ("public function show(Person $person, PropheticLineageService $lineage): PersonResource",
                   "public function lineage(Person $person, PropheticLineageService $lineage): JsonResponse"):
        if method not in code:raise RuntimeError("Missing public method "+method)
        start=code.index(method); brace=code.index("{",start)
        chk="abort_unless($person->source_reference === '"+source+"', 404);"
        if chk not in code[brace:brace+200]:
            code=code[:brace+1]+"\n        "+chk+code[brace+1:]
    p.write_text(code)

    for key in ("readings","edges"):
        p=files[key];code=p.read_text()
        marker="private function connectedQuery(PropheticLineageService $lineage): Builder"
        if marker not in code:raise RuntimeError("Missing "+key+" connectedQuery")
        head,tail=code.split(marker,1)
        tail=sub_once(tail,
            "->where('approval_status', '!=', 'rejected')\n            ->get();",
            "->where('approval_status', '!=', 'rejected')\n            ->where('source_reference', '"+source+"')\n            ->get();",key+" people")
        if key=="readings":
            tail=sub_once(tail,
                "return ChartReading::query()->whereIn('source_key', $sourceCodes);",
                "return ChartReading::query()->where('notes', 'like', 'Excel-only:v13:%')->whereIn('source_key', $sourceCodes);",
                "readings filter")
        else:
            tail=sub_once(tail,
                "return ChartEdge::query()\n            ->whereIn('from_source_key', $sourceCodes)",
                "return ChartEdge::query()\n            ->where('notes', 'like', 'Excel-only:v13:%')\n            ->whereIn('from_source_key', $sourceCodes)",
                "edges filter")
        p.write_text(head+marker+tail)

    p=files["routes"];code=p.read_text()
    code=sub_once(code,
        "Route::redirect('/', '/lineage', 302);",
        "Route::get('/', [LineageController::class, 'index']);",
        "root route")
    p.write_text(code)

    for p in files.values():
        r=subprocess.run(["php","-l",str(p)],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True,timeout=20)
        if r.returncode:raise RuntimeError("PHP lint failure "+str(p)+": "+r.stdout)
    for cmd in (["php","artisan","optimize:clear"],["php","artisan","route:cache"],["php","artisan","view:cache"]):
        r=subprocess.run(cmd,cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True,timeout=70)
        if r.returncode:raise RuntimeError("Laravel cache error "+str(cmd)+": "+r.stdout[-800:])
except Exception:
    for key,p in files.items():shutil.copy2(backup/(key+".php"),p)
    subprocess.run(["php","artisan","optimize:clear"],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=50)
    raise

print("LATEST_517_API_AND_ROOT_RESTORED",flush=True)
