<?php

namespace App\Models\BC20;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BC20Entitas extends Model
{
    protected $table = 'customs.bc20_entitas';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'idheader',
        'alamatentitas',
        'kodeentitas',
        'kodejenisapi',
        'kodenegara',
        'kodestatus',
        'namanegara',
        'namapembayar',
        'namaentitas',
        'nibentitas',
        'nomorapi',
        'nomoridentitas',
        'nomorijinentitas',
        'serientitas',
        'tanggalijinentitas',
    ];

    protected $casts = [
        'serientitas' => 'integer',
    ];

    /**
     * Get the header that owns the entitas.
     */
    public function header(): BelongsTo
    {
        return $this->belongsTo(BC20Header::class, 'idheader', 'idheader');
    }
}
