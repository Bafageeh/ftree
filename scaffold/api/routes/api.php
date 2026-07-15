<?php

use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\PersonController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', HealthController::class);
    Route::get('/stats', [PersonController::class, 'stats']);
    Route::get('/people', [PersonController::class, 'index']);
    Route::get('/people/{person}', [PersonController::class, 'show']);
    Route::get('/people/{person}/lineage', [PersonController::class, 'lineage']);
});
