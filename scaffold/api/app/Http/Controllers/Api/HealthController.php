<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'service' => 'shajara-api',
            'version' => '1.0.0',
            'time' => now()->toIso8601String(),
        ]);
    }
}
