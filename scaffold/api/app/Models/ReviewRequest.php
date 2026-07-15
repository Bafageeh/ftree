<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'tracking_code',
        'person_id',
        'request_type',
        'requester_name',
        'requester_phone',
        'person_name',
        'proposed_value',
        'source_details',
        'notes',
        'status',
        'reviewed_at',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }
}
