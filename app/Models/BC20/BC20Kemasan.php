<?php

namespace App\Models\BC20;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BC20Kemasan extends Model
{
    protected $table = 'customs.bc20_kemasan';
    protected $primaryKey = 'idkemasan';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'idheader',
        'idkemasan',
        'jumlahkemasan',
        'kodejeniskemasan',
        'namakemasan',
        'serikemasan',
    ];

    protected $casts = [
        'jumlahkemasan' => 'decimal:4',
        'serikemasan' => 'integer',
    ];

    /**
     * Get the header that owns the kemasan.
     */
    public function header(): BelongsTo
    {
        return $this->belongsTo(BC20Header::class, 'idheader', 'idheader');
    }
}
