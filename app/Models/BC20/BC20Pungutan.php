<?php

namespace App\Models\BC20;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BC20Pungutan extends Model
{
    protected $table = 'customs.bc20_pungutan';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'idheader',
        'keterangan',
        'dibayar',
        'ditanggungpemerintah',
        'ditangguhkan',
        'berkala',
        'dibebaskan',
        'tidakdipungut',
        'sudahdilunasi',
        'dijaminkan',
        'ditunda',
    ];

    protected $casts = [
        'dibayar' => 'decimal:4',
        'ditanggungpemerintah' => 'decimal:4',
        'ditangguhkan' => 'decimal:4',
        'berkala' => 'decimal:4',
        'dibebaskan' => 'decimal:4',
        'tidakdipungut' => 'decimal:4',
        'sudahdilunasi' => 'decimal:4',
        'dijaminkan' => 'decimal:4',
        'ditunda' => 'decimal:4',
    ];

    /**
     * Get the header that owns the pungutan.
     */
    public function header(): BelongsTo
    {
        return $this->belongsTo(BC20Header::class, 'idheader', 'idheader');
    }
}
