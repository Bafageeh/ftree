<?php

use App\Http\Controllers\Api\ChartEdgeController;
use App\Http\Controllers\Api\ChartReadingController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\PersonController;
use App\Http\Controllers\Api\ReviewRequestController;
use App\Http\Controllers\Api\SupervisorReviewController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', HealthController::class);
    Route::get('/stats', [PersonController::class, 'stats']);
    Route::get('/people', [PersonController::class, 'index']);
    Route::get('/people/{person}', [PersonController::class, 'show']);
    Route::get('/people/{person}/lineage', [PersonController::class, 'lineage']);
    Route::post('/people/{person}/review', [SupervisorReviewController::class, 'reviewPerson'])->middleware('throttle:60,1');

    Route::get('/chart-readings', [ChartReadingController::class, 'index']);
    Route::get('/chart-readings-stats', [ChartReadingController::class, 'stats']);
    Route::get('/chart-edges', [ChartEdgeController::class, 'index']);
    Route::get('/chart-edges-stats', [ChartEdgeController::class, 'stats']);
    Route::post('/chart-edges/{chartEdge}/review', [SupervisorReviewController::class, 'reviewEdge'])->middleware('throttle:60,1');

    Route::post('/review-requests', [ReviewRequestController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/review-requests/{trackingCode}', [ReviewRequestController::class, 'status'])->middleware('throttle:30,1');
});
