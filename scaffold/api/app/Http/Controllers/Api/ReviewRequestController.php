<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReviewRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ReviewRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'person_id' => ['nullable', 'integer', 'exists:people,id'],
            'request_type' => ['required', Rule::in(['correction', 'addition', 'source'])],
            'requester_name' => ['required', 'string', 'min:2', 'max:120'],
            'requester_phone' => ['nullable', 'string', 'max:40'],
            'person_name' => ['nullable', 'string', 'max:180'],
            'proposed_value' => ['required', 'string', 'min:3', 'max:4000'],
            'source_details' => ['nullable', 'string', 'max:4000'],
            'notes' => ['nullable', 'string', 'max:4000'],
        ]);

        $reviewRequest = ReviewRequest::create([
            ...$validated,
            'tracking_code' => $this->makeTrackingCode(),
            'status' => 'pending',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'تم استلام المساهمة وإرسالها للمراجعة.',
            'tracking_code' => $reviewRequest->tracking_code,
            'status' => $reviewRequest->status,
            'submitted_at' => $reviewRequest->created_at?->toIso8601String(),
        ], 201);
    }

    public function status(string $trackingCode): JsonResponse
    {
        $reviewRequest = ReviewRequest::query()
            ->where('tracking_code', strtoupper(trim($trackingCode)))
            ->firstOrFail();

        return response()->json([
            'tracking_code' => $reviewRequest->tracking_code,
            'request_type' => $reviewRequest->request_type,
            'person_name' => $reviewRequest->person_name,
            'status' => $reviewRequest->status,
            'submitted_at' => $reviewRequest->created_at?->toIso8601String(),
            'reviewed_at' => $reviewRequest->reviewed_at?->toIso8601String(),
        ]);
    }

    private function makeTrackingCode(): string
    {
        do {
            $code = 'SHJ-' . now()->format('ymd') . '-' . Str::upper(Str::random(6));
        } while (ReviewRequest::where('tracking_code', $code)->exists());

        return $code;
    }
}
