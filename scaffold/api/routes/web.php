<?php

use App\Http\Controllers\Web\LineageController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/lineage', 302);
Route::get('/lineage', [LineageController::class, 'index'])->name('lineage.index');
Route::get('/lineage/{person}', [LineageController::class, 'show'])->name('lineage.show');
Route::redirect('/backend', '/lineage', 302);

// Signed private review link; public lineage publication remains unchanged.
Route::get('/workbook-review', [\App\Http\Controllers\Web\WorkbookReviewController::class, 'index'])->middleware('signed')->name('workbook.review');
Route::post('/workbook-review', [\App\Http\Controllers\Web\WorkbookReviewController::class, 'upload'])->middleware(['signed','throttle:10,1']);
