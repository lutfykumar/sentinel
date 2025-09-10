import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getEntityByCode,
  formatPIB,
  formatCodeWithName,
  formatCountryCodeWithName,
  formatEntityIdWithName,
} from '@/utils/customsReferences';
import { formatJenisApi } from '@/utils/references/jenisApi';

interface DetailViewProps {
  data: any;
  loading: boolean;
  onClose: () => void;
}

export default function DetailView({ data, loading, onClose }: DetailViewProps) {
  if (loading) {
    return (
      <Card className="animate-slide-down border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Data Umum</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading details...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="animate-slide-down border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Data Umum</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No detail data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get entity data by codes
  const importir = getEntityByCode(data.entitas, '1');
  const ppjk = getEntityByCode(data.entitas, '4');
  const pemilik = getEntityByCode(data.entitas, '7');
  const pengirim = getEntityByCode(data.entitas, '9');
  const penjual = getEntityByCode(data.entitas, '10');

  // Helper functions for formatting
  const formatCurrency = (amount: number, currency: string = '') => {
    if (amount === null || amount === undefined) return '-';
    const formattedNumber = new Intl.NumberFormat('id-ID', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(amount);
    return currency ? `${formattedNumber} ${currency}` : formattedNumber;
  };

  const formatNDPBM = (amount: number) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('id-ID', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(amount);
  };

  const formatRupiah = (amount: number) => {
    if (amount === null || amount === undefined) return 'Rp. 0,00';
    const formattedNumber = new Intl.NumberFormat('id-ID', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(amount);
    return `Rp. ${formattedNumber}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatBC11Number = (number: string, date: string) => {
    if (!number && !date) return '-';
    return `${(number || '').toUpperCase()} / ${formatDate(date)}`;
  };

  const formatPosBC11 = (pos: string, subpos: string) => {
    if (!pos && !subpos) return '-';
    const formattedSubpos = (!subpos || subpos.trim() === '') ? '00000000' : subpos.toUpperCase();
    return `${(pos || '').toUpperCase()} / ${formattedSubpos}`;
  };

  // Update formatCurrency to handle uppercase
  const formatValueUppercase = (value: any) => {
    if (!value && value !== 0) return '-';
    return String(value).toUpperCase();
  };

  // Get package information from barang data
  const getPackageInfo = () => {
    if (!data.barang || data.barang.length === 0) return { totalPackages: 0, packageType: '-' };
    
    // Sum all jumlahkemasan from barang items
    const totalPackages = data.barang.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.jumlahkemasan) || 0);
    }, 0);
    
    // Get package type from first item (assuming consistent package type)
    const firstItem = data.barang[0];
    const packageType = firstItem?.kodejeniskemasan && firstItem?.namajeniskemasan 
      ? `${firstItem.kodejeniskemasan} / ${firstItem.namajeniskemasan}`
      : '-';
    
    return { totalPackages, packageType };
  };

  const packageInfo = getPackageInfo();

  // Calculate unit price for barang
  const calculateUnitPrice = (cif: number, jumlahSatuan: number, currency: string) => {
    if (!cif || !jumlahSatuan || jumlahSatuan === 0) return '-';
    const unitPrice = cif / jumlahSatuan;
    return `${formatCurrency(unitPrice)} ${currency}`;
  };

  // Get all pungutan data sorted by keterangan
  const getPungutanData = () => {
    if (!data.pungutan || !Array.isArray(data.pungutan)) {
      return { items: [], total: 0 };
    }
    
    // Sort all pungutan by keterangan (ascending)
    const sortedPungutan = data.pungutan
      .map((p: any) => ({
        keterangan: p.keterangan || '',
        dibayar: parseFloat(p.dibayar || 0)
      }))
      .sort((a: any, b: any) => a.keterangan.localeCompare(b.keterangan));
    
    // Calculate total of all dibayar amounts
    const total = sortedPungutan.reduce((sum: number, item: any) => sum + item.dibayar, 0);
    
    return { items: sortedPungutan, total };
  };

  const pungutanData = getPungutanData();

  return (
    <Card className="animate-slide-down w-full max-w-full">
      <CardContent className="p-4 w-full max-w-full">
        <div className="space-y-6 w-full max-w-full">
          {/* Top Section: Data Umum | Data Nilai + BC 1.1 + Gudang */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start w-full max-w-full">
            {/* Left Column - Data Umum */}
            <div className="space-y-3 w-full max-w-full min-w-0">
              <h3 className="font-semibold text-lg border-b pb-2">
                📋 <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Data Umum</span>
              </h3>
              <div className="rounded-md border border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-50/30 to-blue-100/30 dark:from-blue-900/10 dark:to-blue-800/10 w-full max-w-full overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table className="table-compact min-w-full">
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium min-w-[120px] bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">PIB</TableCell>
                      <TableCell className="text-data">{formatValueUppercase(formatPIB(data.nomordaftar, data.tanggaldaftar))}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">CAR</TableCell>
                      <TableCell className="text-data">{formatValueUppercase(data.nomoraju)}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Nama Kantor</TableCell>
                      <TableCell>{formatValueUppercase(formatCodeWithName(data.data?.kodekantor, data.data?.namakantorpendek))}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">ID/NM Importir</TableCell>
                      <TableCell>{formatValueUppercase(formatEntityIdWithName(importir?.nomoridentitas, importir?.namaentitas))}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Nama Penjual</TableCell>
                      <TableCell>{formatValueUppercase(penjual?.namaentitas)}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Alamat Penjual</TableCell>
                      <TableCell>{formatValueUppercase(penjual?.alamatentitas)}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Negara Penjual</TableCell>
                      <TableCell>{formatValueUppercase(formatCountryCodeWithName(penjual?.kodenegara, penjual?.namanegara))}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Nama Pengirim</TableCell>
                      <TableCell>{formatValueUppercase(pengirim?.namaentitas)}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Alamat Pengirim</TableCell>
                      <TableCell>{formatValueUppercase(pengirim?.alamatentitas)}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Negara Pengirim</TableCell>
                      <TableCell>{formatValueUppercase(formatCountryCodeWithName(pengirim?.kodenegara, pengirim?.namanegara))}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Nama Pemilik</TableCell>
                      <TableCell>{formatValueUppercase(pemilik?.namaentitas)}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Alamat Pemilik</TableCell>
                      <TableCell>{formatValueUppercase(pemilik?.alamatentitas)}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Nama PPJK</TableCell>
                      <TableCell>{formatValueUppercase(formatEntityIdWithName(ppjk?.nomoridentitas, ppjk?.namaentitas))}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Pelabuhan Muat</TableCell>
                      <TableCell>{formatValueUppercase(formatCodeWithName(data.data?.kodepelmuat, data.data?.namapelabuhanmuat))}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Pelabuhan Transit</TableCell>
                      <TableCell>{formatValueUppercase(formatCodeWithName(data.data?.kodepeltransit, data.data?.namapelabuhantransit))}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Jalur</TableCell>
                      <TableCell>{formatValueUppercase(data.kodejalur)}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Status Importir</TableCell>
                      <TableCell>{formatValueUppercase(importir?.kodestatus)}</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200">Kode Jenis API</TableCell>
                      <TableCell>{formatValueUppercase(formatJenisApi(importir?.kodejenisapi))}</TableCell>
                    </TableRow>
                    </TableBody>
                    </Table>
                  </div>
              </div>
            </div>

            {/* Right Column - Three sections */}
            <div className="w-full max-w-full min-w-0">
              {/* Data Nilai */}
              <div>
                <h3 className="font-semibold text-lg border-b pb-2">
                  💰 <span className="bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">Data Nilai</span>
                </h3>
                <div className="rounded-md border border-yellow-200 dark:border-yellow-700 bg-gradient-to-br from-yellow-50/30 to-yellow-100/30 dark:from-yellow-900/10 dark:to-yellow-800/10 mt-3 w-full max-w-full overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table className="table-compact min-w-full">
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium w-40 bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200">NETTO</TableCell>
                        <TableCell className="text-financial">{formatCurrency(data.data?.netto)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200">BRUTO</TableCell>
                        <TableCell className="text-financial">{formatCurrency(data.data?.bruto)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200">CIF</TableCell>
                        <TableCell className="text-financial">{formatCurrency(data.data?.cif)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200">NDPBM</TableCell>
                        <TableCell className="text-financial">{formatNDPBM(data.data?.ndpbm)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200">Nilai Pabean</TableCell>
                        <TableCell className="text-financial">{formatCurrency(data.data?.cif, data.data?.kodevaluta)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200">Nilai Pabean Rupiah</TableCell>
                        <TableCell className="text-financial">{formatRupiah(data.data?.cif * data.data?.ndpbm)}</TableCell>
                      </TableRow>
                    </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* BC 1.1 & Kedatangan */}
              <div className="mt-4">
                <h3 className="font-semibold text-lg border-b pb-2">
                  🚢 <span className="bg-gradient-to-r from-cyan-600 to-teal-700 bg-clip-text text-transparent">BC 1.1 & Kedatangan</span>
                </h3>
                <div className="rounded-md border border-cyan-200 dark:border-cyan-700 bg-gradient-to-br from-cyan-50/30 to-cyan-100/30 dark:from-cyan-900/10 dark:to-cyan-800/10 mt-3 w-full max-w-full overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table className="table-compact min-w-full">
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium w-40 bg-cyan-100/60 dark:bg-cyan-800/30 text-cyan-800 dark:text-cyan-200">Tgl Tiba</TableCell>
                        <TableCell>{formatDate(data.data?.tanggaltiba)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-cyan-100/60 dark:bg-cyan-800/30 text-cyan-800 dark:text-cyan-200">No/Tgl BC11</TableCell>
                        <TableCell>{formatBC11Number(data.data?.nomorbc11, data.data?.tanggalbc11)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-cyan-100/60 dark:bg-cyan-800/30 text-cyan-800 dark:text-cyan-200">No Pos BC11</TableCell>
                        <TableCell>{formatPosBC11(data.data?.posbc11, data.data?.subposbc11)}</TableCell>
                      </TableRow>
                    </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Gudang & Pengangkut */}
              <div className="mt-4">
                <h3 className="font-semibold text-lg border-b pb-2">
                  🏭 <span className="bg-gradient-to-r from-slate-600 to-gray-700 bg-clip-text text-transparent">Gudang & Pengangkut</span>
                </h3>
                <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/30 to-slate-100/30 dark:from-slate-900/10 dark:to-slate-800/10 mt-3 w-full max-w-full overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table className="table-compact min-w-full">
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium w-40 bg-slate-100/60 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200">Gudang</TableCell>
                        <TableCell>{formatValueUppercase(data.data?.namatpswajib)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-slate-100/60 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200">Kode TPS</TableCell>
                        <TableCell>{formatValueUppercase(data.data?.kodetps)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-slate-100/60 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200">Nama Pengangkut</TableCell>
                        <TableCell>{formatValueUppercase(data.pengangkut?.[0]?.namapengangkut)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-slate-100/60 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200">No Voy/Flight</TableCell>
                        <TableCell>{formatValueUppercase(data.pengangkut?.[0]?.nomorpengangkut)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-slate-100/60 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200">Nama Negara</TableCell>
                        <TableCell>{formatValueUppercase(formatCountryCodeWithName(data.pengangkut?.[0]?.kodebendera, data.pengangkut?.[0]?.namanegara))}</TableCell>
                      </TableRow>
                    </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Barang - Full Width */}
          <div className="w-full max-w-full min-w-0">
                <h3 className="font-semibold text-lg border-b pb-2">
                  📦 <span className="bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">Data Barang</span>
                </h3>
            <div className="mt-2 mb-3 text-base font-bold text-foreground flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <span>Jumlah Kemasan: {packageInfo.totalPackages}</span>
              <span>Jenis Kemasan: {packageInfo.packageType}</span>
            </div>
              <div className="rounded-md border border-orange-200 dark:border-orange-700 bg-gradient-to-br from-orange-50/30 to-orange-100/30 dark:from-orange-900/10 dark:to-orange-800/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="table-compact min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200">No</TableHead>
                      <TableHead className="w-24 text-center font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200">HS Code</TableHead>
                      <TableHead className="font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200">Uraian Barang</TableHead>
                      <TableHead className="w-28 text-right font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200">CIF</TableHead>
                      <TableHead className="w-16 text-center font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200">Valuta</TableHead>
                      <TableHead className="w-28 text-right font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200">Jumlah</TableHead>
                      <TableHead className="w-16 text-center font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200">Satuan</TableHead>
                      <TableHead className="w-32 text-right font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200">Unit Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.barang && data.barang.length > 0 ? (
                      data.barang
                        .sort((a: any, b: any) => (a.seribarang || 0) - (b.seribarang || 0))
                        .map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="text-center text-sm">{item.seribarang || index + 1}</TableCell>
                            <TableCell className="text-center text-data text-sm">{formatValueUppercase(item.postarif)}</TableCell>
                            <TableCell className="text-sm">{formatValueUppercase(item.uraian)}</TableCell>
                            <TableCell className="text-financial text-right text-sm">{formatCurrency(item.cif)}</TableCell>
                            <TableCell className="text-center text-sm">{formatValueUppercase(data.data?.kodevaluta)}</TableCell>
                            <TableCell className="text-financial text-right text-sm">{formatCurrency(item.jumlahsatuan)}</TableCell>
                            <TableCell className="text-center text-sm">{formatValueUppercase(item.kodesatuanbarang)}</TableCell>
                            <TableCell className="text-financial text-right text-sm">{calculateUnitPrice(item.cif, item.jumlahsatuan, data.data?.kodevaluta)}</TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No goods data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  </Table>
                </div>
            </div>
          </div>

          {/* Data Lampiran - Full Width */}
          <div className="w-full max-w-full min-w-0">
                <h3 className="font-semibold text-lg border-b pb-2">
                  📄 <span className="bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent">Data Lampiran</span>
                </h3>
            <div className="rounded-md border border-purple-200 dark:border-purple-700 bg-gradient-to-br from-purple-50/30 to-purple-100/30 dark:from-purple-900/10 dark:to-purple-800/10 mt-3 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="table-compact min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 font-medium bg-purple-100/60 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200">No</TableHead>
                      <TableHead className="font-medium bg-purple-100/60 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200">Dokumen</TableHead>
                      <TableHead className="w-32 font-medium bg-purple-100/60 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200">Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.dokumen && data.dokumen.length > 0 ? (
                      data.dokumen
                        .sort((a: any, b: any) => (a.seridokumen || 0) - (b.seridokumen || 0))
                        .map((item: any, index: number) => {
                          const dokumenInfo = [];
                          if (item.namadokumen && item.nomordokumen) {
                            dokumenInfo.push(`${item.namadokumen} : ${item.nomordokumen}`);
                          }
                          if (item.namafasilitas) {
                            dokumenInfo.push(item.namafasilitas);
                          }
                          return (
                            <TableRow key={index}>
                              <TableCell className="text-center">{item.seridokumen || index + 1}</TableCell>
                              <TableCell>{formatValueUppercase(dokumenInfo.join(' '))}</TableCell>
                              <TableCell>{formatDate(item.tanggaldokumen)}</TableCell>
                            </TableRow>
                          );
                        })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No document data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  </Table>
                </div>
            </div>
          </div>

          {/* Bottom Section: Data Kontainer | Data Pungutan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-full">
            {/* Data Kontainer */}
            <div className="w-full max-w-full min-w-0">
                <h3 className="font-semibold text-lg border-b pb-2">
                  🚛 <span className="bg-gradient-to-r from-red-600 to-rose-700 bg-clip-text text-transparent">Data Kontainer</span>
                </h3>
              <div className="rounded-md border border-red-200 dark:border-red-700 bg-gradient-to-br from-red-50/30 to-red-100/30 dark:from-red-900/10 dark:to-red-800/10 mt-3 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="table-compact min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 font-medium bg-red-100/60 dark:bg-red-800/30 text-red-800 dark:text-red-200">No</TableHead>
                      <TableHead className="font-medium bg-red-100/60 dark:bg-red-800/30 text-red-800 dark:text-red-200">No Kontainer</TableHead>
                      <TableHead className="font-medium bg-red-100/60 dark:bg-red-800/30 text-red-800 dark:text-red-200">Ukuran</TableHead>
                      <TableHead className="font-medium bg-red-100/60 dark:bg-red-800/30 text-red-800 dark:text-red-200">Tipe Kontainer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.kontainer && data.kontainer.length > 0 ? (
                      data.kontainer
                        .sort((a: any, b: any) => (a.serikontainer || 0) - (b.serikontainer || 0))
                        .map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="text-center">{index + 1}</TableCell>
                            <TableCell className="text-data">{formatValueUppercase(item.nomorkontainer)}</TableCell>
                            <TableCell>{formatValueUppercase(item.namaukurankontainer)}</TableCell>
                            <TableCell>{formatValueUppercase(item.namajeniskontainer)}</TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                          No container data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Data Pungutan */}
            <div className="w-full max-w-full min-w-0">
                <h3 className="font-semibold text-lg border-b pb-2">
                  💳 <span className="bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">Data Pungutan</span>
                </h3>
              <div className="rounded-md border border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50/30 to-green-100/30 dark:from-green-900/10 dark:to-green-800/10 mt-3 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="table-compact min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 font-medium bg-green-100/60 dark:bg-green-800/30 text-green-800 dark:text-green-200">No</TableHead>
                      <TableHead className="font-medium bg-green-100/60 dark:bg-green-800/30 text-green-800 dark:text-green-200">Jenis Pungutan</TableHead>
                      <TableHead className="text-right font-medium bg-green-100/60 dark:bg-green-800/30 text-green-800 dark:text-green-200">Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pungutanData.items.length > 0 ? (
                      pungutanData.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell>{formatValueUppercase(item.keterangan)}</TableCell>
                          <TableCell className="text-financial text-right">{formatRupiah(item.dibayar)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                          No pungutan data available
                        </TableCell>
                      </TableRow>
                    )}
                    {pungutanData.items.length > 0 && (
                      <TableRow className="border-t-2 border-primary/20 font-semibold">
                        <TableCell colSpan={2} className="text-right">TOTAL BAYAR</TableCell>
                        <TableCell className="text-financial text-right">{formatRupiah(pungutanData.total)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
