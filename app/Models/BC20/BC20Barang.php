<?php

namespace App\Models\BC20;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BC20Barang extends Model
{
    protected $table = 'customs.bc20_barang';
    protected $primaryKey = 'idbarang';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'idheader',
        'idbarang',
        'asuransi',
        'bruto',
        'cif',
        'fob',
        'freight',
        'hargaekspor',
        'hargapenyerahan',
        'jumlahsatuan',
        'jumlahkemasan',
        'kodebarang',
        'kodedaerahasal',
        'kodesatuanbarang',
        'kodejeniskemasan',
        'kodekategoribarang',
        'kodekondisibarang',
        'kodenegaraasal',
        'kodeperhitungan',
        'nilaijasa',
        'namasatuanbarang',
        'namakondisibarang',
        'namakategoribarang',
        'namajeniskemasan',
        'namanegaraasal',
        'namadaerahasal',
        'namaperhitungan',
        'merk',
        'netto',
        'postarif',
        'seribarang',
        'spesifikasilain',
        'tipe',
        'uraian',
        'ukuran',
        'volume',
        'bahanbaku',
        'barangpemilik',
        'barangspekkhusus',
    ];

    protected $casts = [
        'asuransi' => 'decimal:4',
        'bruto' => 'decimal:4',
        'cif' => 'decimal:4',
        'fob' => 'decimal:4',
        'freight' => 'decimal:4',
        'hargaekspor' => 'decimal:4',
        'hargapenyerahan' => 'decimal:4',
        'jumlahsatuan' => 'decimal:4',
        'jumlahkemasan' => 'decimal:4',
        'nilaijasa' => 'decimal:4',
        'netto' => 'decimal:4',
        'volume' => 'decimal:4',
        'seribarang' => 'integer',
    ];

    /**
     * Get the header that owns the barang.
     */
    public function header(): BelongsTo
    {
        return $this->belongsTo(BC20Header::class, 'idheader', 'idheader');
    }
}
