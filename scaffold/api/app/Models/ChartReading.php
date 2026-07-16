<?php

namespace App\Models;

use App\Services\ChartReadingPromoter;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class ChartReading extends Model
{
    use HasFactory;

    protected $fillable = [
        'source_key',
        'provisional_name',
        'normalized_name',
        'parent_source_key',
        'chart_branch',
        'chart_color',
        'node_type',
        'reading_status',
        'confidence',
        'source_locator',
        'notes',
        'is_promoted',
        'person_id',
    ];

    protected function casts(): array
    {
        return [
            'confidence' => 'integer',
            'is_promoted' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saved(function (ChartReading $reading): void {
            if (! Schema::hasColumn('people', 'approval_status')) {
                return;
            }

            app(ChartReadingPromoter::class)->promote($reading);
        });
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }
}
