<?php

namespace App\Exports;

use App\Models\BC20\BC20Header;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class CustomsDataExport implements FromCollection, WithHeadings, WithStyles
{
    use Exportable;

    protected $query;
    protected $sections;
    
    public function __construct(Builder $query, array $sections = ['basic'])
    {
        $this->query = $query;
        $this->sections = $sections;
    }

    public function collection()
    {
        $data = new Collection();
        
        $this->query->chunk(1000, function ($records) use (&$data) {
            foreach ($records as $record) {
                // Use adaptive multi-row logic like CSV export
                if (in_array('containers', $this->sections) && $record->kontainer->isNotEmpty()) {
                    $this->generateContainerLevelRows($record, $data);
                } elseif (in_array('goods', $this->sections) && $record->barang->isNotEmpty()) {
                    $this->generateGoodsLevelRows($record, $data);
                } elseif (in_array('documents', $this->sections) && $record->dokumen->isNotEmpty()) {
                    $this->generateDocumentLevelRows($record, $data);
                } elseif (in_array('duties', $this->sections) && $record->pungutan->isNotEmpty()) {
                    $this->generateDutiesLevelRows($record, $data);
                } else {
                    $this->generatePibLevelRow($record, $data);
                }
            }
        });
        
        return $data;
    }

    public function headings(): array
    {
        // Use the same header generation logic as CSV
        return app('App\Http\Controllers\CustomsDataController')->getCsvHeaders($this->sections);
    }

    private function generatePibLevelRow($record, &$data)
    {
        $row = $this->buildRowData($record);
        $data->push($row);
    }
    
    private function generateGoodsLevelRows($record, &$data)
    {
        $barangs = $record->barang->where('idheader', $record->idheader);
        if ($barangs->isEmpty()) {
            $row = $this->buildRowData($record, null, null, null);
            $data->push($row);
        } else {
            foreach ($barangs as $barang) {
                $row = $this->buildRowData($record, $barang, null, null);
                $data->push($row);
            }
        }
    }
    
    private function generateDocumentLevelRows($record, &$data)
    {
        $dokumens = $record->dokumen->where('idheader', $record->idheader);
        if ($dokumens->isEmpty()) {
            $row = $this->buildRowData($record, null, null, null);
            $data->push($row);
        } else {
            foreach ($dokumens as $dokumen) {
                $row = $this->buildRowData($record, null, null, $dokumen);
                $data->push($row);
            }
        }
    }
    
    private function generateContainerLevelRows($record, &$data)
    {
        $kontainers = $record->kontainer->where('idheader', $record->idheader);
        if ($kontainers->isEmpty()) {
            $row = $this->buildRowData($record, null, null, null);
            $data->push($row);
        } else {
            foreach ($kontainers as $kontainer) {
                $row = $this->buildRowData($record, null, $kontainer, null);
                $data->push($row);
            }
        }
    }
    
    private function generateDutiesLevelRows($record, &$data)
    {
        $duties = $record->pungutan->where('idheader', $record->idheader)->whereIn('keterangan', ['BM', 'PPH', 'PPN']);
        if ($duties->isEmpty()) {
            $row = $this->buildRowData($record, null, null, null);
            $data->push($row);
        } else {
            foreach ($duties as $duty) {
                $row = $this->buildRowData($record, null, null, null, $duty);
                $data->push($row);
            }
        }
    }
    
    private function buildRowData($record, $barang = null, $kontainer = null, $dokumen = null, $duty = null)
    {
        $row = [];
        
        // Basic export (always required)
        $row[] = $record->nomordaftar; // PIB
        $row[] = $record->tanggaldaftar; // Tanggal
        $row[] = $record->kodejalur; // Jalur
        
        // Data Umum (only when specifically requested)
        if (in_array('general', $this->sections)) {
            $importir = $record->entitas->where('kodeentitas', '1')->first();
            $ppjk = $record->entitas->where('kodeentitas', '4')->first();
            $penjual = $record->entitas->where('kodeentitas', '10')->first();
            $pengirim = $record->entitas->where('kodeentitas', '9')->first();
            $pemilik = $record->entitas->where('kodeentitas', '7')->first(); // Fixed to '7'
            
            // Get data specifically for this PIB's idheader
            $data = $record->data->where('idheader', $record->idheader)->first();
            
            $row[] = $record->nomoraju ?? ''; // CAR
            $row[] = $data ? $data->kodekantor : ''; // Kode Kantor
            $row[] = $data ? $data->namakantorpendek : ''; // Nama Kantor
            $row[] = $importir ? $importir->nomoridentitas : ''; // ID Importir
            $row[] = $importir ? $importir->namaentitas : ''; // Nama Importir
            $row[] = $penjual ? $penjual->namaentitas : ''; // Nama Penjual
            $row[] = $penjual ? $penjual->alamatentitas : ''; // Alamat Penjual
            $row[] = $penjual ? $penjual->kodenegara : ''; // Kode Negara Penjual
            $row[] = $penjual ? $penjual->namanegara : ''; // Nama Negara Penjual
            $row[] = $pengirim ? $pengirim->namaentitas : ''; // Nama Pengirim
            $row[] = $pengirim ? $pengirim->alamatentitas : ''; // Alamat Pengirim
            $row[] = $pengirim ? $pengirim->kodenegara : ''; // Kode Negara Pengirim
            $row[] = $pengirim ? $pengirim->namanegara : ''; // Nama Negara Pengirim
            $row[] = $pemilik ? $pemilik->namaentitas : ''; // Nama Pemilik
            $row[] = $pemilik ? $pemilik->alamatentitas : ''; // Alamat Pemilik
            $row[] = $ppjk ? $ppjk->namaentitas : ''; // Nama PPJK
            $row[] = $data ? $data->kodepelmuat : ''; // Kode Pelabuhan Muat
            $row[] = $data ? $data->namapelabuhanmuat : ''; // Nama Pelabuhan Muat
            $row[] = $data ? $data->kodepeltransit : ''; // Kode Pelabuhan Transit
            $row[] = $data ? $data->namapelabuhantransit : ''; // Nama Pelabuhan Transit
            $row[] = $importir ? $importir->kodestatus : ''; // Status Importir
            $row[] = $importir ? $importir->kodejenisapi : ''; // Kode Jenis API
        }
        
        // Data Nilai
        if (in_array('values', $this->sections)) {
            // Get data specifically for this PIB's idheader
            $data = $record->data->where('idheader', $record->idheader)->first();
            $row[] = $data ? $data->netto : ''; // NETTO
            $row[] = $data ? $data->bruto : ''; // BRUTO
            $row[] = $data ? $data->cif : ''; // CIF
            $row[] = $data ? $data->ndpbm : ''; // NDPBM
            $row[] = $data ? $data->cif : ''; // Nilai Pabean (same as CIF)
            $row[] = $data ? $data->kodevaluta : ''; // Kode Valuta
        }
        
        // BC 1.1 & Kedatangan
        if (in_array('bc11', $this->sections)) {
            // Get data specifically for this PIB's idheader
            $data = $record->data->where('idheader', $record->idheader)->first();
            $row[] = $data ? $data->tanggaltiba : ''; // Tanggal Tiba
            $row[] = $data ? $data->nomorbc11 : ''; // Nomor BC11
            $row[] = $data ? $data->tanggalbc11 : ''; // Tanggal BC11
            $row[] = $data ? $data->posbc11 : ''; // Pos BC11
            $row[] = $data ? $data->subposbc11 : ''; // Sub Pos BC11
        }
        
        // Gudang & Pengangkut
        if (in_array('warehouse', $this->sections)) {
            // Get data specifically for this PIB's idheader
            $data = $record->data->where('idheader', $record->idheader)->first();
            $pengangkut = $record->pengangkut->where('idheader', $record->idheader)->first();
            
            $row[] = $data ? $data->namatpswajib : ''; // Nama Gudang
            $row[] = $data ? $data->kodetps : ''; // Kode TPS
            $row[] = $pengangkut ? $pengangkut->namapengangkut : ''; // Nama Pengangkut
            $row[] = $pengangkut ? $pengangkut->nomorpengangkut : ''; // Nomor Voy/Flight
            $row[] = $pengangkut ? $pengangkut->kodebendera : ''; // Kode Bendera
            $row[] = $pengangkut ? $pengangkut->namanegara : ''; // Nama Negara Pengangkut
        }
        
        // Data Barang
        if (in_array('goods', $this->sections)) {
            $barangData = $barang ?? $record->barang->where('idheader', $record->idheader)->first();
            // Get data specifically for this PIB's idheader
            $data = $record->data->where('idheader', $record->idheader)->first();
            
            // Packaging info (from barang item)
            $row[] = $barangData ? $barangData->jumlahkemasan : ''; // Jumlah Kemasan
            $row[] = $barangData ? $barangData->kodejeniskemasan : ''; // Kode Jenis Kemasan
            $row[] = $barangData ? $barangData->namajeniskemasan : ''; // Nama Kemasan
            
            // Goods details
            $row[] = $barangData ? $barangData->seribarang : ''; // No Barang
            $row[] = $barangData ? $barangData->postarif : ''; // HS Code
            $row[] = $barangData ? $barangData->uraian : ''; // Uraian Barang
            $row[] = $barangData ? $barangData->cif : ''; // CIF Barang
            $row[] = $data ? $data->kodevaluta : ''; // Valuta
            $row[] = $barangData ? $barangData->jumlahsatuan : ''; // Jumlah
            $row[] = $barangData ? $barangData->kodesatuanbarang : ''; // Satuan Barang
            
            // Unit Price calculation (CIF / Quantity)
            $unitPrice = '';
            if ($barangData && $barangData->cif && $barangData->jumlahsatuan && $barangData->jumlahsatuan > 0) {
                $unitPrice = number_format($barangData->cif / $barangData->jumlahsatuan, 4);
                if ($data && $data->kodevaluta) {
                    $unitPrice .= ' ' . $data->kodevaluta;
                }
            }
            $row[] = $unitPrice; // Unit Price
        }
        
        // Data Lampiran
        if (in_array('documents', $this->sections)) {
            $dokumenData = $dokumen ?? $record->dokumen->where('idheader', $record->idheader)->first();
            $row[] = $dokumenData ? $dokumenData->seridokumen : ''; // No Dokumen
            
            // Dokumen: "namadokumen :: nomordokumen, namafasilitas"
            $dokumenInfo = '';
            if ($dokumenData) {
                $dokumenInfo = $dokumenData->namadokumen;
                if ($dokumenData->nomordokumen) {
                    $dokumenInfo .= ' :: ' . $dokumenData->nomordokumen;
                }
                if ($dokumenData->namafasilitas) {
                    $dokumenInfo .= ', ' . $dokumenData->namafasilitas;
                }
            }
            $row[] = $dokumenInfo; // Dokumen
            $row[] = $dokumenData ? $dokumenData->tanggaldokumen : ''; // Tanggal Dokumen
        }
        
        // Data Kontainer
        if (in_array('containers', $this->sections)) {
            $kontainerData = $kontainer ?? $record->kontainer->where('idheader', $record->idheader)->first();
            $row[] = $kontainerData ? $kontainerData->serikontainer : ''; // No Kontainer (Urut)
            $row[] = $kontainerData ? $kontainerData->nomorkontainer : ''; // Nomor Kontainer
            $row[] = $kontainerData ? $kontainerData->namaukurankontainer : ''; // Ukuran Kontainer
            $row[] = $kontainerData ? $kontainerData->namajeniskontainer : ''; // Tipe Kontainer
        }
        
        // Data Pungutan
        if (in_array('duties', $this->sections)) {
            if ($duty) {
                // Use the specific duty item
                $dutyNumber = 1;
                if ($duty->keterangan == 'PPH') $dutyNumber = 2;
                if ($duty->keterangan == 'PPN') $dutyNumber = 3;
                
                $row[] = $dutyNumber; // No Pungutan
                $row[] = $duty->keterangan; // Jenis Pungutan
                $row[] = $duty->dibayar; // Nilai Pungutan
            } else {
                // Use first duty (summary)
                $duties = $record->pungutan->where('idheader', $record->idheader)->whereIn('keterangan', ['BM', 'PPH', 'PPN'])->sortBy('keterangan');
                $firstDuty = $duties->first();
                
                if ($firstDuty) {
                    $dutyNumber = 1;
                    if ($firstDuty->keterangan == 'PPH') $dutyNumber = 2;
                    if ($firstDuty->keterangan == 'PPN') $dutyNumber = 3;
                    
                    $row[] = $dutyNumber; // No Pungutan
                    $row[] = $firstDuty->keterangan; // Jenis Pungutan
                    $row[] = $firstDuty->dibayar; // Nilai Pungutan
                } else {
                    $row[] = ''; // No Pungutan
                    $row[] = ''; // Jenis Pungutan
                    $row[] = ''; // Nilai Pungutan
                }
            }
        }
        
        return $row;
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style the first row (headers) as bold
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F81BD']
                ],
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF']
                ]
            ],
        ];
    }
}
