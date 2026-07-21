<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PersonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profilePhotoUrl = null;

        if ($this->profile_photo_path) {
            $storedUrl = Storage::disk('public')->url($this->profile_photo_path);
            $profilePhotoUrl = Str::startsWith($storedUrl, ['http://', 'https://'])
                ? $storedUrl
                : rtrim($request->getSchemeAndHttpHost(), '/').'/'.ltrim($storedUrl, '/');
        }

        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'source_code' => $this->source_code,
            'chart_reading_id' => $this->chart_reading_id,
            'node_type' => $this->node_type,
            'honorific' => $this->honorific,
            'gender' => $this->gender,
            'mobile_number' => $this->mobile_number,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'death_date' => $this->death_date?->format('Y-m-d'),
            'lineage_parent_id' => $this->lineage_parent_id,
            'status' => $this->status,
            'approval_status' => $this->approval_status,
            'is_provisional' => $this->is_provisional,
            'supervisor_note' => $this->supervisor_note,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'chart_branch' => $this->chart_branch,
            'chart_color' => $this->chart_color,
            'generation' => $this->generation,
            'summary' => $this->summary,
            'general_details' => $this->general_details,
            'profile_photo_url' => $profilePhotoUrl,
            'source_reference' => $this->source_reference,
            'source_locator' => $this->source_locator,
            'chart_order' => $this->chart_order,
            'is_living' => blank($this->death_date),
            'parent' => new self($this->whenLoaded('parent')),
            'children' => self::collection($this->whenLoaded('children')),
        ];
    }
}
