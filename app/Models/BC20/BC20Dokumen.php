<?php

namespace App\Models\BC20;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BC20Dokumen extends Model
{
    protected $table = 'customs.bc20_dokumen';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'idheader',
        'kodedokumen',
        'kodefasilitas',
        'namakantorpendek',
        'namadokumen',
        'nomordokumen',
        'namafasilitas',
        'tanggaldokumen',
        'seridokumen',
    ];

    protected $casts = [
        'tanggaldokumen' => 'datetime',
        'seridokumen' => 'integer',
    ];

    /**
     * Get the header that owns the dokumen.
     */
    public function header(): BelongsTo
    {
        return $this->belongsTo(BC20Header::class, 'idheader', 'idheader');
    }
}
