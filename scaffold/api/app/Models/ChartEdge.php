<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChartEdge extends Model
{
    use HasFactory;

    protected $fillable = [
        'from_source_key',
        'to_source_key',
        'relation_type',
        'reading_status',
        'confidence',
        'approval_status',
        'source_locator',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'confidence' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (ChartEdge $edge): void {
            $edge->relation_type = 'lineage';
        });
    }
}
