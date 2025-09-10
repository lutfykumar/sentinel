<?php

namespace App\Models\BC20;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BC20Kontainer extends Model
{
    protected $table = 'customs.bc20_kontainer';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'idheader',
        'kodejeniskontainer',
        'kodeukurankontainer',
        'nomorkontainer',
        'namajeniskontainer',
        'namaukurankontainer',
        'serikontainer',
    ];

    protected $casts = [
        'serikontainer' => 'integer',
    ];

    /**
     * Get the header that owns the kontainer.
     */
    public function header(): BelongsTo
    {
        return $this->belongsTo(BC20Header::class, 'idheader', 'idheader');
    }
}
