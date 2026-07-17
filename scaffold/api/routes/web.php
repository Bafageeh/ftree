<?php

use App\Http\Controllers\Web\LineageController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/app/', 302);
Route::get('/lineage', [LineageController::class, 'index'])->name('lineage.index');
Route::get('/lineage/{person}', [LineageController::class, 'show'])->name('lineage.show');
Route::redirect('/backend', '/lineage', 302);
