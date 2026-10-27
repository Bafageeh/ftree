<?php
namespace App\Services;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Process\Process;
class WorkbookReviewImporter {
    public function import(string $path): array {
        $process = new Process(['python3', base_path('scripts/read_review_xlsx.py'), $path]);
        $process->setTimeout(30); $process->run();
        if (!$process->isSuccessful()) throw ValidationException::withMessages(['file'=>'تعذر قراءة الملف: '.mb_substr($process->getErrorOutput(),0,400)]);
        $rows = json_decode($process->getOutput(),true,512,JSON_THROW_ON_ERROR);
        $hash = hash_file('sha256',$path);
        return DB::transaction(function () use ($rows,$hash) {
            $existing = DB::table('workbook_reviews')->get()->keyBy('position_key');
            $merged = $existing->map(fn($r)=>json_decode($r->payload,true))->all();
            foreach ($rows as $row) {
                $key=$row['position_key'];
                foreach (['corrected_name','father_ref','father_name'] as $field) {
                    if ($row[$field]==='' && isset($merged[$key])) $row[$field]=$merged[$key][$field];
                }
                $merged[$key]=$row;
            }
            $people=DB::table('people')->pluck('full_name','source_code')->all();
            foreach ($merged as $key=>$row) {
                $ref=$row['father_ref'];
                if ($ref && !isset($merged[$ref]) && !isset($people[$ref])) throw ValidationException::withMessages(['file'=>"معرف الأب غير موجود في {$key}: {$ref}"]);
                if ($ref && $row['father_name']) {
                    $name=isset($merged[$ref]) ? ($merged[$ref]['corrected_name'] ?: $merged[$ref]['original_name']) : $people[$ref];
                    if ($name !== $row['father_name']) throw ValidationException::withMessages(['file'=>"اسم الأب لا يطابق معرفه في {$key}"]);
                }
                $visited=[$key=>true];
                while ($ref && isset($merged[$ref])) {
                    if (isset($visited[$ref])) throw ValidationException::withMessages(['file'=>"حلقة في علاقات الأب عند {$key}"]);
                    $visited[$ref]=true; $ref=$merged[$ref]['father_ref'];
                }
            }
            $changed=0; $created=0;
            foreach ($rows as $input) {
                $key=$input['position_key']; $row=$merged[$key];
                $old=isset($existing[$key]) ? json_decode($existing[$key]->payload,true) : null;
                if ($old==$row) continue;
                $json=json_encode($row,JSON_UNESCAPED_UNICODE);
                DB::table('workbook_review_history')->insert(['position_key'=>$key,'previous_payload'=>$old ? json_encode($old,JSON_UNESCAPED_UNICODE):null,'new_payload'=>$json,'file_hash'=>$hash,'created_at'=>now()]);
                DB::table('workbook_reviews')->updateOrInsert(['position_key'=>$key],['payload'=>$json,'created_at'=>$existing[$key]->created_at ?? now(),'updated_at'=>now()]);
                $old ? $changed++ : $created++;
            }
            return ['created'=>$created,'changed'=>$changed,'unchanged'=>count($rows)-$created-$changed];
        });
    }
}
