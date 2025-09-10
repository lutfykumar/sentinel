<?php

namespace App\Models\BC20;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BC20Header extends Model
{
    protected $table = 'customs.bc20_header';
    protected $primaryKey = 'idheader';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'idheader',
        'nomoraju',
        'nomordaftar',
        'namappjk',
        'tanggaldaftar',
        'kodedokumen',
        'namadokumen',
        'namaperusahaanproses',
        'namaperusahaan',
        'idperusahaan',
        'namaentitas',
        'kodeproses',
        'namaproses',
        'kodejalur',
        'namakantor',
        'urldokumen',
        'kodeprosesperbaikan',
        'idrespon',
        'namarespon',
        'nomorrespon',
        'tanggalrespon',
        'pdf',
        'acakmerah',
        'nopkbe',
        'flageseal',
        'flagkirimpajak',
        'flagendorsementdjp',
        'waktukirimgatepajak',
        'waktukirimpajak',
    ];

    protected $casts = [
        'tanggaldaftar' => 'date',
        'tanggalrespon' => 'datetime',
    ];

    /**
     * Get the data for the BC20 header.
     */
    public function data(): HasOne
    {
        return $this->hasOne(BC20Data::class, 'idheader', 'idheader');
    }

    /**
     * Get the goods for the BC20 header.
     */
    public function barang(): HasMany
    {
        return $this->hasMany(BC20Barang::class, 'idheader', 'idheader');
    }

    /**
     * Get the documents for the BC20 header.
     */
    public function dokumen(): HasMany
    {
        return $this->hasMany(BC20Dokumen::class, 'idheader', 'idheader');
    }

    /**
     * Get the entities for the BC20 header.
     */
    public function entitas(): HasMany
    {
        return $this->hasMany(BC20Entitas::class, 'idheader', 'idheader');
    }

    /**
     * Get the containers for the BC20 header.
     */
    public function kontainer(): HasMany
    {
        return $this->hasMany(BC20Kontainer::class, 'idheader', 'idheader');
    }

    /**
     * Get the carriers for the BC20 header.
     */
    public function pengangkut(): HasMany
    {
        return $this->hasMany(BC20Pengangkut::class, 'idheader', 'idheader');
    }

    /**
     * Get the charges for the BC20 header.
     */
    public function pungutan(): HasMany
    {
        return $this->hasMany(BC20Pungutan::class, 'idheader', 'idheader');
    }

    /**
     * Scope to filter by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('tanggaldaftar', [$startDate, $endDate]);
    }

    /**
     * Scope to search by registration number (starts with)
     */
    public function scopeByRegistrationNumber($query, $nomordaftar)
    {
        return $query->where('nomordaftar', 'like', $nomordaftar . '%');
    }

    /**
     * Scope to search by company name
     */
    public function scopeByCompanyName($query, $companyName)
    {
        return $query->where('namaperusahaan', 'like', '%' . $companyName . '%');
    }

    /**
     * Scope to filter by document code
     */
    public function scopeByDocumentCode($query, $kodedokumen)
    {
        return $query->where('kodedokumen', $kodedokumen);
    }

    /**
     * Scope to filter by process code
     */
    public function scopeByProcessCode($query, $kodeproses)
    {
        return $query->where('kodeproses', $kodeproses);
    }

    /**
     * Scope to filter by customs route
     */
    public function scopeByCustomsRoute($query, $kodejalur)
    {
        return $query->where('kodejalur', $kodejalur);
    }

    /**
     * Scope to search by office name
     */
    public function scopeByOfficeName($query, $namakantor)
    {
        return $query->where('namakantor', 'like', '%' . $namakantor . '%');
    }

    /**
     * Scope to filter by response status
     */
    public function scopeByResponseStatus($query, $namarespon)
    {
        return $query->where('namarespon', $namarespon);
    }
}
