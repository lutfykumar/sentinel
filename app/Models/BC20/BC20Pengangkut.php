<?php

namespace App\Models\BC20;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BC20Pengangkut extends Model
{
    protected $table = 'customs.bc20_pengangkut';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'idheader',
        'kodebendera',
        'kodecaraangkut',
        'namacaraangkut',
        'namanegara',
        'namapengangkut',
        'nomorpengangkut',
    ];

    /**
     * Get the header that owns the pengangkut.
     */
    public function header(): BelongsTo
    {
        return $this->belongsTo(BC20Header::class, 'idheader', 'idheader');
    }
}
