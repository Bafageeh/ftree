<?php
namespace App\Http\Controllers\Web;
use App\Http\Controllers\Controller;
use App\Services\WorkbookReviewImporter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class WorkbookReviewController extends Controller {
    public function index() {
        $rows=DB::table('workbook_reviews')->orderBy('position_key')->get()->map(function($r){$p=json_decode($r->payload,true);$p['updated_at']=$r->updated_at;return $p;});
        return view('review.workbook',compact('rows'));
    }
    public function upload(Request $request,WorkbookReviewImporter $importer) {
        $request->validate(['file'=>['required','file','max:5120','extensions:xlsx']]);
        $result=$importer->import($request->file('file')->getRealPath());
        return redirect($request->fullUrl())->with('result',"تمت الإضافة: {$result['created']}، التحديث: {$result['changed']}، دون تغيير: {$result['unchanged']}");
    }
}
