<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PersonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'node_type' => $this->node_type,
            'honorific' => $this->honorific,
            'lineage_parent_id' => $this->lineage_parent_id,
            'status' => $this->status,
            'chart_branch' => $this->chart_branch,
            'chart_color' => $this->chart_color,
            'generation' => $this->generation,
            'summary' => $this->summary,
            'source_reference' => $this->source_reference,
            'source_locator' => $this->source_locator,
            'chart_order' => $this->chart_order,
            'is_living' => $this->is_living,
            'parent' => new self($this->whenLoaded('parent')),
            'children' => self::collection($this->whenLoaded('children')),
        ];
    }
}
