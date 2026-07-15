<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Person extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'honorific',
        'lineage_parent_id',
        'status',
        'generation',
        'summary',
        'source_reference',
        'is_living',
    ];

    protected function casts(): array
    {
        return [
            'generation' => 'integer',
            'is_living' => 'boolean',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'lineage_parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'lineage_parent_id')->orderBy('generation')->orderBy('full_name');
    }
}
