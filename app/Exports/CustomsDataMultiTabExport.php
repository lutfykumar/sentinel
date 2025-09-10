<?php

namespace App\Exports;

use App\Models\BC20\BC20Header;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
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
        $sheets = [];
        
        // If no sections specified, include all (for backward compatibility)
        if (empty($this->sections)) {
            $this->sections = ['general', 'values', 'bc11', 'warehouse', 'goods', 'documents', 'containers', 'duties'];
        }
        
        // Add sheets based on selected sections
        // Handle 'basic' section for backward compatibility
        if (in_array('basic', $this->sections) || in_array('general', $this->sections)) {
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
            $sheets['Kontainer'] = new KontainerSheet($this->query);
        }
        
        if (in_array('duties', $this->sections)) {
            $sheets['Pungutan'] = new PungutanSheet($this->query);
        }
        
        // If no valid sections, at least include basic data
        if (empty($sheets)) {
            $sheets['Data Umum'] = new DataUmumSheet($this->query);
        }
        
        return $sheets;
    }
}

// Data Umum Tab
class DataUmumSheet implements FromCollection, WithHeadings, WithTitle, WithStyles
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
                $importir = $record->entitas->where('kodeentitas', '1')->first();
                $ppjk = $record->entitas->where('kodeentitas', '4')->first();
                $penjual = $record->entitas->where('kodeentitas', '10')->first();
                $pengirim = $record->entitas->where('kodeentitas', '9')->first();
                $pemilik = $record->entitas->where('kodeentitas', '7')->first();
                $dataRecord = $record->data->where('idheader', $record->idheader)->first();
                
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
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F81BD']]
            ],
        ];
    }
}

// Nilai Tab
class NilaiSheet implements FromCollection, WithHeadings, WithTitle, WithStyles
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
                $dataRecord = $record->data->where('idheader', $record->idheader)->first();
                
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
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F81BD']]
            ],
        ];
    }
}

// BC 1.1 & Gudang Tab
class BC11GudangSheet implements FromCollection, WithHeadings, WithTitle, WithStyles
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
                $dataRecord = $record->data->where('idheader', $record->idheader)->first();
                $pengangkut = $record->pengangkut->where('idheader', $record->idheader)->first();
                
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
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F81BD']]
            ],
        ];
    }
}

// Barang Tab
class BarangSheet implements FromCollection, WithHeadings, WithTitle, WithStyles
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
                $barangs = $record->barang->where('idheader', $record->idheader);
                $dataRecord = $record->data->where('idheader', $record->idheader)->first();
                
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
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F81BD']]
            ],
        ];
    }
}

// Dokumen Tab
class DokumenSheet implements FromCollection, WithHeadings, WithTitle, WithStyles
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
                $dokumens = $record->dokumen->where('idheader', $record->idheader);
                
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
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F81BD']]
            ],
        ];
    }
}

// Kontainer Tab
class KontainerSheet implements FromCollection, WithHeadings, WithTitle, WithStyles
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
                $kontainers = $record->kontainer->where('idheader', $record->idheader);
                
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
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F81BD']]
            ],
        ];
    }
}

// Pungutan Tab
class PungutanSheet implements FromCollection, WithHeadings, WithTitle, WithStyles
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
                $pungutans = $record->pungutan->where('idheader', $record->idheader)->whereIn('keterangan', ['BM', 'PPH', 'PPN']);
                
                if ($pungutans->isEmpty()) {
                    $row = [
                        $record->nomordaftar, // PIB
                        $record->tanggaldaftar, // Tanggal
                        $record->kodejalur, // Jalur
                        '', '', ''
                    ];
                    $data->push($row);
                } else {
                    foreach ($pungutans as $pungutan) {
                        $dutyNumber = 1;
                        if ($pungutan->keterangan == 'PPH') $dutyNumber = 2;
                        if ($pungutan->keterangan == 'PPN') $dutyNumber = 3;
                        
                        $row = [
                            $record->nomordaftar, // PIB
                            $record->tanggaldaftar, // Tanggal
                            $record->kodejalur, // Jalur
                            $dutyNumber, // No Pungutan
                            $pungutan->keterangan, // Jenis Pungutan
                            $pungutan->dibayar, // Nilai Pungutan
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
            'PIB', 'Tanggal', 'Jalur', 'No Pungutan', 'Jenis Pungutan', 'Nilai Pungutan'
        ];
    }

    public function title(): string
    {
        return 'Pungutan';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F81BD']]
            ],
        ];
    }
}
