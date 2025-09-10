<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RuleSet extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'rules',
        'user_id',
        'is_public',
    ];

    protected $casts = [
        'rules' => 'array',
        'is_public' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scope to get only user's own rule sets or public ones
    public function scopeAccessibleByUser($query, $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('user_id', $userId)
              ->orWhere('is_public', true);
        });
    }

    // Scope for admin to get all rule sets
    public function scopeForAdmin($query)
    {
        return $query->with('user:id,name,email');
    }
}
