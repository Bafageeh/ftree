<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Person extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'source_code',
        'chart_reading_id',
        'node_type',
        'honorific',
        'gender',
        'lineage_parent_id',
        'status',
        'approval_status',
        'is_provisional',
        'supervisor_note',
        'approved_at',
        'chart_branch',
        'chart_color',
        'generation',
        'summary',
        'general_details',
        'profile_photo_path',
        'source_reference',
        'source_locator',
        'chart_order',
        'is_living',
    ];

    protected function casts(): array
    {
        return [
            'generation' => 'integer',
            'chart_order' => 'integer',
            'is_living' => 'boolean',
            'is_provisional' => 'boolean',
            'approved_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Person $person): void {
            if ($person->chart_reading_id || $person->is_provisional) {
                return;
            }

            if (! $person->source_code && $person->chart_order) {
                $person->source_code = sprintf('CORE-%03d', $person->chart_order);
            }

            $person->approval_status = 'supervisor_confirmed';
            $person->is_provisional = false;
            $person->approved_at ??= now();
        });

        static::deleted(function (Person $person): void {
            if ($person->profile_photo_path) {
                Storage::disk('public')->delete($person->profile_photo_path);
            }
        });
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'lineage_parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'lineage_parent_id')
            ->orderByRaw('chart_order is null')
            ->orderBy('chart_order')
            ->orderBy('generation')
            ->orderBy('full_name');
    }

    public function chartReading(): BelongsTo
    {
        return $this->belongsTo(ChartReading::class);
    }
}
