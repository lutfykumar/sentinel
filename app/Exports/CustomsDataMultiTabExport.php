<?php

namespace App\Exports;

use App\Models\BC20\BC20Header;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use Maatwebsite\Excel\Concerns\WithEvents;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Color;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class CustomsDataMultiTabExport implements WithMultipleSheets
{
    use Exportable;

    protected $query;
    protected $sections;
    
    public function __construct(Builder $query, array $sections = [])
    {
        $this->query = $query;
        $this->sections = $sections;
    }

    public function sheets(): array
    {
        // DEBUG: Log what sections we received
        error_log('EXPORT DEBUG: Sections received: ' . implode(', ', $this->sections));
        
        $sheets = [];
        
        // If no sections specified, include general for backward compatibility
        if (empty($this->sections)) {
            $this->sections = ['general'];
        }
        
        // Add sheets based on selected sections
        if (in_array('basic', $this->sections)) {
            $sheets['Search Results'] = new SearchResultsSheet($this->query);
        }
        
        if (in_array('general', $this->sections)) {
            $sheets['Data Umum'] = new DataUmumSheet($this->query);
        }
        
        if (in_array('values', $this->sections)) {
            $sheets['Nilai'] = new NilaiSheet($this->query);
        }
        
        if (in_array('bc11', $this->sections) || in_array('warehouse', $this->sections)) {
            $sheets['BC 1.1 & Gudang'] = new BC11GudangSheet($this->query);
        }
        
        if (in_array('goods', $this->sections)) {
            $sheets['Barang'] = new BarangSheet($this->query);
        }
        
        if (in_array('documents', $this->sections)) {
            $sheets['Dokumen'] = new DokumenSheet($this->query);
        }
        
        if (in_array('containers', $this->sections)) {
            error_log('EXPORT DEBUG: Adding KontainerSheet');
            $sheets['Kontainer'] = new KontainerSheet($this->query);
        } else {
            error_log('EXPORT DEBUG: containers section NOT found in: ' . implode(', ', $this->sections));
        }
        
        if (in_array('duties', $this->sections)) {
            $sheets['Pungutan'] = new PungutanSheet($this->query);
        }
        
        // If no valid sections, at least include search results data
        if (empty($sheets)) {
            $sheets['Search Results'] = new SearchResultsSheet($this->query);
        }
        
        return $sheets;
    }
}

// Search Results Tab
class SearchResultsSheet implements FromCollection, WithTitle, WithStyles, WithHeadings, WithEvents
{
    protected $query;
    
    public function __construct(Builder $query)
    {
        $this->query = $query;
    }

    public function collection()
    {
        $data = new Collection();
        
        // Use smaller chunk size to reduce memory usage
        $rowNumber = 1;
        $this->query->chunk(100, function ($records) use (&$data, &$rowNumber) {
            foreach ($records as $record) {
                $entitas = is_object($record->entitas) ? $record->entitas : collect([]);
                $importir = $entitas->where('kodeentitas', '1')->first();
                $ppjk = $entitas->where('kodeentitas', '4')->first();
                $penjual = $entitas->where('kodeentitas', '10')->first();
                $firstBarang = $record->barang->first();
                
                // Calculate kontainer and TEUS dynamically if not pre-calculated
                $kontainerCount = 0;
                $teusTotal = 0.0;
                
                if (isset($record->kontainer) && is_numeric($record->kontainer)) {
                    // Use pre-calculated values from aggregation
                    $kontainerCount = $record->kontainer;
                    $teusTotal = $record->teus ?? 0.0;
                } else {
                    // Calculate from relationship
                    $kontainers = $record->kontainer ?? collect();
                    $kontainerCount = $kontainers->count();
                    
                    foreach ($kontainers as $kontainer) {
                        switch ($kontainer->kodeukurankontainer) {
                            case '20': $teusTotal += 1.0; break;
                            case '40': $teusTotal += 2.0; break;
                            case '45': $teusTotal += 2.25; break;
                            case '60': $teusTotal += 3.0; break;
                        }
                    }
                }
                
                $row = [
                    $rowNumber++, // No
                    $record->nomordaftar, // PIB
                    $record->tanggaldaftar, // Tanggal
                    $record->kodejalur, // Jalur
                    $importir ? $importir->namaentitas : '', // Nama Perusahaan
                    $ppjk ? $ppjk->namaentitas : '', // Nama PPJK
                    $penjual ? $penjual->namaentitas : '', // Nama Penjual
                    $kontainerCount, // Kontainer
                    number_format($teusTotal, 2), // TEUS
                    $firstBarang ? $firstBarang->postarif : '', // HS
                    $firstBarang ? $firstBarang->uraian : '', // Uraian Barang
                ];
                
                $data->push($row);
            }
        });
        
        return $data;
    }

    public function headings(): array
    {
        return [
            'No', 'PIB', 'Tanggal', 'Jalur', 'Nama Perusahaan', 'Nama PPJK', 'Nama Penjual', 'Kontainer', 'TEUS', 'HS', 'Uraian Barang'
        ];
    }

    public function title(): string
    {
        return 'Search Results';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['argb' => 'FFFFFF']], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => '366092']]]
        ];
    }
    
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $event->sheet->getDelegate()->getTabColor()->setRGB('0066CC');
            },
        ];
    }
}

// Data Umum Tab
class DataUmumSheet implements FromCollection, WithTitle, WithStyles, WithHeadings, WithEvents
{
    protected $query;
    
    public function __construct(Builder $query)
    {
        $this->query = $query;
    }

    public function collection()
    {
        $data = new Collection();
        
        // Use smaller chunk size to reduce memory usage
        $this->query->chunk(100, function ($records) use (&$data) {
            foreach ($records as $record) {
                $entitas = is_object($record->entitas) ? $record->entitas : collect([]);
                $importir = $entitas->where('kodeentitas', '1')->first();
                $ppjk = $entitas->where('kodeentitas', '4')->first();
                $penjual = $entitas->where('kodeentitas', '10')->first();
                $pengirim = $entitas->where('kodeentitas', '9')->first();
                $pemilik = $entitas->where('kodeentitas', '7')->first();
                $dataRecord = is_object($record->data) ? $record->data->where('idheader', $record->idheader)->first() : null;
                
                $row = [
                    $record->nomordaftar, // PIB
                    $record->tanggaldaftar, // Tanggal
                    $record->kodejalur, // Jalur
                    $record->nomoraju ?? '', // CAR
                    $dataRecord ? $dataRecord->kodekantor : '', // Kode Kantor
                    $dataRecord ? $dataRecord->namakantorpendek : '', // Nama Kantor
                    $importir ? $importir->nomoridentitas : '', // ID Importir
                    $importir ? $importir->namaentitas : '', // Nama Importir
                    $penjual ? $penjual->namaentitas : '', // Nama Penjual
                    $penjual ? $penjual->alamatentitas : '', // Alamat Penjual
                    $penjual ? $penjual->kodenegara : '', // Kode Negara Penjual
                    $penjual ? $penjual->namanegara : '', // Nama Negara Penjual
                    $pengirim ? $pengirim->namaentitas : '', // Nama Pengirim
                    $pengirim ? $pengirim->alamatentitas : '', // Alamat Pengirim
                    $pengirim ? $pengirim->kodenegara : '', // Kode Negara Pengirim
                    $pengirim ? $pengirim->namanegara : '', // Nama Negara Pengirim
                    $pemilik ? $pemilik->namaentitas : '', // Nama Pemilik
                    $pemilik ? $pemilik->alamatentitas : '', // Alamat Pemilik
                    $ppjk ? $ppjk->namaentitas : '', // Nama PPJK
                    $dataRecord ? $dataRecord->kodepelmuat : '', // Kode Pelabuhan Muat
                    $dataRecord ? $dataRecord->namapelabuhanmuat : '', // Nama Pelabuhan Muat
                    $dataRecord ? $dataRecord->kodepeltransit : '', // Kode Pelabuhan Transit
                    $dataRecord ? $dataRecord->namapelabuhantransit : '', // Nama Pelabuhan Transit
                    $importir ? $importir->kodestatus : '', // Status Importir
                    $importir ? $importir->kodejenisapi : '', // Kode Jenis API
                ];
                
                $data->push($row);
            }
        });
        
        return $data;
    }

    public function headings(): array
    {
        return [
            'PIB', 'Tanggal', 'Jalur', 'CAR', 'Kode Kantor', 'Nama Kantor',
            'ID Importir', 'Nama Importir', 'Nama Penjual', 'Alamat Penjual',
            'Kode Negara Penjual', 'Nama Negara Penjual', 'Nama Pengirim',
            'Alamat Pengirim', 'Kode Negara Pengirim', 'Nama Negara Pengirim',
            'Nama Pemilik', 'Alamat Pemilik', 'Nama PPJK', 'Kode Pelabuhan Muat',
            'Nama Pelabuhan Muat', 'Kode Pelabuhan Transit', 'Nama Pelabuhan Transit',
            'Status Importir', 'Kode Jenis API'
        ];
    }

    public function title(): string
    {
        return 'Data Umum';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2563EB']] // Blue-600 (Data Umum)
            ],
        ];
    }
    
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $event->sheet->getDelegate()->getTabColor()->setRGB('2563EB'); // Blue-600
            },
        ];
    }
}

// Nilai Tab
class NilaiSheet implements FromCollection, WithHeadings, WithTitle, WithStyles, WithEvents
{
    protected $query;
    
    public function __construct(Builder $query)
    {
        $this->query = $query;
    }

    public function collection()
    {
        $data = new Collection();
        
        $this->query->chunk(100, function ($records) use (&$data) {
            foreach ($records as $record) {
                $dataRecord = is_object($record->data) ? $record->data->where('idheader', $record->idheader)->first() : null;
                
                $row = [
                    $record->nomordaftar, // PIB
                    $record->tanggaldaftar, // Tanggal
                    $record->kodejalur, // Jalur
                    $dataRecord ? $dataRecord->netto : '', // NETTO
                    $dataRecord ? $dataRecord->bruto : '', // BRUTO
                    $dataRecord ? $dataRecord->cif : '', // CIF
                    $dataRecord ? $dataRecord->ndpbm : '', // NDPBM
                    $dataRecord ? $dataRecord->cif : '', // Nilai Pabean
                    $dataRecord ? $dataRecord->kodevaluta : '', // Kode Valuta
                ];
                
                $data->push($row);
            }
        });
        
        return $data;
    }

    public function headings(): array
    {
        return [
            'PIB', 'Tanggal', 'Jalur', 'NETTO', 'BRUTO', 'CIF',
            'NDPBM', 'Nilai Pabean', 'Kode Valuta'
        ];
    }

    public function title(): string
    {
        return 'Nilai';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'CA8A04']] // Yellow-600 (Data Nilai)
            ],
        ];
    }
    
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $event->sheet->getDelegate()->getTabColor()->setRGB('CA8A04'); // Yellow-600
            },
        ];
    }
}

// BC 1.1 & Gudang Tab
class BC11GudangSheet implements FromCollection, WithHeadings, WithTitle, WithStyles, WithEvents
{
    protected $query;
    
    public function __construct(Builder $query)
    {
        $this->query = $query;
    }

    public function collection()
    {
        $data = new Collection();
        
        $this->query->chunk(100, function ($records) use (&$data) {
            foreach ($records as $record) {
                $dataRecord = is_object($record->data) ? $record->data->where('idheader', $record->idheader)->first() : null;
                $pengangkut = is_object($record->pengangkut) ? $record->pengangkut->where('idheader', $record->idheader)->first() : null;
                
                $row = [
                    $record->nomordaftar, // PIB
                    $record->tanggaldaftar, // Tanggal
                    $record->kodejalur, // Jalur
                    $dataRecord ? $dataRecord->tanggaltiba : '', // Tanggal Tiba
                    $dataRecord ? $dataRecord->nomorbc11 : '', // Nomor BC11
                    $dataRecord ? $dataRecord->tanggalbc11 : '', // Tanggal BC11
                    $dataRecord ? $dataRecord->posbc11 : '', // Pos BC11
                    $dataRecord ? $dataRecord->subposbc11 : '', // Sub Pos BC11
                    $dataRecord ? $dataRecord->namatpswajib : '', // Nama Gudang
                    $dataRecord ? $dataRecord->kodetps : '', // Kode TPS
                    $pengangkut ? $pengangkut->namapengangkut : '', // Nama Pengangkut
                    $pengangkut ? $pengangkut->nomorpengangkut : '', // Nomor Voy/Flight
                    $pengangkut ? $pengangkut->kodebendera : '', // Kode Bendera
                    $pengangkut ? $pengangkut->namanegara : '', // Nama Negara Pengangkut
                ];
                
                $data->push($row);
            }
        });
        
        return $data;
    }

    public function headings(): array
    {
        return [
            'PIB', 'Tanggal', 'Jalur', 'Tanggal Tiba', 'Nomor BC11', 'Tanggal BC11',
            'Pos BC11', 'Sub Pos BC11', 'Nama Gudang', 'Kode TPS', 'Nama Pengangkut',
            'Nomor Voy/Flight', 'Kode Bendera', 'Nama Negara Pengangkut'
        ];
    }

    public function title(): string
    {
        return 'BC 1.1 & Gudang';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '06B6D4']] // Cyan
            ],
        ];
    }
    
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $event->sheet->getDelegate()->getTabColor()->setRGB('06B6D4'); // Cyan tab
            },
        ];
    }
}

// Barang Tab
class BarangSheet implements FromCollection, WithHeadings, WithTitle, WithStyles, WithEvents
{
    protected $query;
    
    public function __construct(Builder $query)
    {
        $this->query = $query;
    }

    public function collection()
    {
        $data = new Collection();
        
        $this->query->chunk(100, function ($records) use (&$data) {
            foreach ($records as $record) {
                $barangs = is_object($record->barang) ? $record->barang->where('idheader', $record->idheader) : collect([]);
                $dataRecord = is_object($record->data) ? $record->data->where('idheader', $record->idheader)->first() : null;
                
                if ($barangs->isEmpty()) {
                    // If no goods, create one row with empty goods data
                    $row = [
                        $record->nomordaftar, // PIB
                        $record->tanggaldaftar, // Tanggal
                        $record->kodejalur, // Jalur
                        '', '', '', '', '', '', '', '', '', '', ''
                    ];
                    $data->push($row);
                } else {
                    foreach ($barangs as $barang) {
                        $unitPrice = '';
                        if ($barang && $barang->cif && $barang->jumlahsatuan && $barang->jumlahsatuan > 0) {
                            $unitPrice = number_format($barang->cif / $barang->jumlahsatuan, 4);
                            if ($dataRecord && $dataRecord->kodevaluta) {
                                $unitPrice .= ' ' . $dataRecord->kodevaluta;
                            }
                        }
                        
                        $row = [
                            $record->nomordaftar, // PIB
                            $record->tanggaldaftar, // Tanggal
                            $record->kodejalur, // Jalur
                            $barang->seribarang, // No Barang
                            $barang->postarif, // HS Code
                            $barang->uraian, // Uraian Barang
                            $barang->cif, // CIF Barang
                            $dataRecord ? $dataRecord->kodevaluta : '', // Valuta
                            $barang->jumlahsatuan, // Jumlah
                            $barang->kodesatuanbarang, // Satuan Barang
                            $barang->jumlahkemasan, // Jumlah Kemasan
                            $barang->kodejeniskemasan, // Kode Jenis Kemasan
                            $barang->namajeniskemasan, // Nama Kemasan
                            $unitPrice, // Unit Price
                        ];
                        
                        $data->push($row);
                    }
                }
            }
        });
        
        return $data;
    }

    public function headings(): array
    {
        return [
            'PIB', 'Tanggal', 'Jalur', 'No Barang', 'HS Code', 'Uraian Barang', 'CIF Barang',
            'Valuta', 'Jumlah', 'Satuan Barang', 'Jumlah Kemasan', 'Kode Jenis Kemasan',
            'Nama Kemasan', 'Unit Price'
        ];
    }

    public function title(): string
    {
        return 'Barang';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'EA580C']] // Orange-600 (Data Barang)
            ],
        ];
    }
    
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $event->sheet->getDelegate()->getTabColor()->setRGB('EA580C'); // Orange-600
            },
        ];
    }
}

// Dokumen Tab
class DokumenSheet implements FromCollection, WithHeadings, WithTitle, WithStyles, WithEvents
{
    protected $query;
    
    public function __construct(Builder $query)
    {
        $this->query = $query;
    }

    public function collection()
    {
        $data = new Collection();
        
        $this->query->chunk(100, function ($records) use (&$data) {
            foreach ($records as $record) {
                $dokumens = is_object($record->dokumen) ? $record->dokumen->where('idheader', $record->idheader) : collect([]);
                
                if ($dokumens->isEmpty()) {
                    $row = [
                        $record->nomordaftar, // PIB
                        $record->tanggaldaftar, // Tanggal
                        $record->kodejalur, // Jalur
                        '', '', ''
                    ];
                    $data->push($row);
                } else {
                    foreach ($dokumens as $dokumen) {
                        $dokumenInfo = $dokumen->namadokumen;
                        if ($dokumen->nomordokumen) {
                            $dokumenInfo .= ' :: ' . $dokumen->nomordokumen;
                        }
                        if ($dokumen->namafasilitas) {
                            $dokumenInfo .= ', ' . $dokumen->namafasilitas;
                        }
                        
                        $row = [
                            $record->nomordaftar, // PIB
                            $record->tanggaldaftar, // Tanggal
                            $record->kodejalur, // Jalur
                            $dokumen->seridokumen, // No Dokumen
                            $dokumenInfo, // Dokumen
                            $dokumen->tanggaldokumen, // Tanggal Dokumen
                        ];
                        
                        $data->push($row);
                    }
                }
            }
        });
        
        return $data;
    }

    public function headings(): array
    {
        return [
            'PIB', 'Tanggal', 'Jalur', 'No Dokumen', 'Dokumen', 'Tanggal Dokumen'
        ];
    }

    public function title(): string
    {
        return 'Dokumen';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '7C3AED']] // Purple-600 (Data Lampiran)
            ],
        ];
    }
    
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $event->sheet->getDelegate()->getTabColor()->setRGB('7C3AED'); // Purple-600
            },
        ];
    }
}

// Kontainer Tab
class KontainerSheet implements FromCollection, WithHeadings, WithTitle, WithStyles, WithEvents
{
    protected $query;
    
    public function __construct(Builder $query)
    {
        $this->query = $query;
    }

    public function collection()
    {
        $data = new Collection();
        
        $this->query->chunk(100, function ($records) use (&$data) {
            foreach ($records as $record) {
                // DEBUG: See what's actually in the record
                error_log('DEBUG PIB: ' . $record->nomordaftar . ' | kontainer type: ' . gettype($record->kontainer) . ' | is_object: ' . (is_object($record->kontainer) ? 'yes' : 'no'));
                if (is_object($record->kontainer)) {
                    error_log('DEBUG PIB: ' . $record->nomordaftar . ' | kontainer count before filter: ' . $record->kontainer->count());
                }
                
                $kontainers = is_object($record->kontainer) ? $record->kontainer->where('idheader', $record->idheader) : collect([]);
                error_log('DEBUG PIB: ' . $record->nomordaftar . ' | kontainers after filter: ' . $kontainers->count());
                
                if ($kontainers->isEmpty()) {
                    $row = [
                        $record->nomordaftar, // PIB
                        $record->tanggaldaftar, // Tanggal
                        $record->kodejalur, // Jalur
                        '', '', '', ''
                    ];
                    $data->push($row);
                } else {
                    foreach ($kontainers as $kontainer) {
                        $row = [
                            $record->nomordaftar, // PIB
                            $record->tanggaldaftar, // Tanggal
                            $record->kodejalur, // Jalur
                            $kontainer->serikontainer, // No Kontainer (Urut)
                            $kontainer->nomorkontainer, // Nomor Kontainer
                            $kontainer->namaukurankontainer, // Ukuran Kontainer
                            $kontainer->namajeniskontainer, // Tipe Kontainer
                        ];
                        
                        $data->push($row);
                    }
                }
            }
        });
        
        return $data;
    }

    public function headings(): array
    {
        return [
            'PIB', 'Tanggal', 'Jalur', 'No Kontainer (Urut)', 'Nomor Kontainer',
            'Ukuran Kontainer', 'Tipe Kontainer'
        ];
    }

    public function title(): string
    {
        return 'Kontainer';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'DC2626']] // Red-600 (Data Kontainer)
            ],
        ];
    }
    
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $event->sheet->getDelegate()->getTabColor()->setRGB('DC2626'); // Red-600
            },
        ];
    }
}

// Data Pungutan Tab
class PungutanSheet implements FromCollection, WithHeadings, WithTitle, WithStyles, WithEvents
{
    protected $query;
    
    public function __construct(Builder $query)
    {
        $this->query = $query;
    }

    public function collection()
    {
        $data = new Collection();
        
        $this->query->chunk(100, function ($records) use (&$data) {
            foreach ($records as $record) {
                // Get ALL pungutan types for this record (not just BM, PPH, PPN)
                $pungutans = is_object($record->pungutan) ? $record->pungutan->where('idheader', $record->idheader) : collect([]);
                
                if ($pungutans->isEmpty()) {
                    // If no pungutan data, create one row with empty values
                    $row = [
                        $record->nomordaftar, // PIB
                        $record->tanggaldaftar, // Tanggal
                        $record->kodejalur, // Jalur
                        '', // No Pungutan
                        'No pungutan data', // Jenis Pungutan
                        'Rp. 0,00' // Nilai Pungutan
                    ];
                    $data->push($row);
                } else {
                    // Process and sort pungutan data alphabetically
                    $sortedPungutan = $pungutans
                        ->map(function($p) {
                            return [
                                'keterangan' => $p->keterangan ?: '',
                                'dibayar' => floatval($p->dibayar ?: 0)
                            ];
                        })
                        ->sortBy('keterangan');
                    
                    // Export each pungutan type as separate row (like other sheets)
                    $seqNumber = 1;
                    foreach ($sortedPungutan as $item) {
                        $row = [
                            $record->nomordaftar, // PIB
                            $record->tanggaldaftar, // Tanggal
                            $record->kodejalur, // Jalur
                            $seqNumber++, // No Pungutan
                            strtoupper($item['keterangan']), // Jenis Pungutan
                            $this->formatRupiah($item['dibayar']) // Nilai Pungutan
                        ];
                        
                        $data->push($row);
                    }
                }
            }
        });
        
        return $data;
    }
    
    /**
     * Format currency exactly like frontend formatRupiah function
     */
    private function formatRupiah($amount)
    {
        if ($amount === null || $amount === 0) {
            return 'Rp. 0,00';
        }
        
        $formattedNumber = number_format($amount, 2, ',', '.');
        return "Rp. {$formattedNumber}";
    }

    public function headings(): array
    {
        return [
            'PIB',
            'Tanggal',
            'Jalur',
            'No Pungutan',
            'Jenis Pungutan',
            'Nilai Pungutan'
        ];
    }

    public function title(): string
    {
        return 'Data Pungutan';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '059669']] // Green-600 (Data Pungutan)
            ],
        ];
    }
    
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $event->sheet->getDelegate()->getTabColor()->setRGB('059669'); // Green-600
            },
        ];
    }
}
