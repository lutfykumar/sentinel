import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DetailViewProps {
  data: any;
  loading: boolean;
  onClose: () => void;
}

export default function CompanyDetailView({ data, loading, onClose }: DetailViewProps) {
  if (loading) {
    return (
      <Card className="animate-slide-down border-l-4 border-l-primary">
        <CardContent className="p-4 w-full max-w-full">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading company details...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="animate-slide-down border-l-4 border-l-primary">
        <CardContent className="p-4 w-full max-w-full">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No company data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { company, legalitas, pemegang_saham, penanggung_jawab, proyek } = data;

  // Reference mappings
  const jenisPerseroanMap: { [key: string]: string } = {
    '01': 'PERSEROAN TERBATAS (PT)',
    '02': 'PERSEKUTUAN KOMANDITER (CV / COMMANDITAIRE VENNOOTSCHAP)',
    '05': 'PERSEKUTUAN FIRMA (FA / VENOOTSCHAP ONDER FIRMA)',
    '06': 'PERSEKUTUAN PERDATA',
    '07': 'KOPERASI',
    '09': 'PERSEKUTUAN DAN PERKUMPULAN',
    '10': 'YAYASAN',
    '17': 'PERORANGAN',
    '19': 'BADAN HUKUM LAINNYA',
    '21': 'PERUSAHAAN UMUM (PERUM)',
    '22': 'PERUSAHAAN UMUM DAERAH (PERUMDA)',
    '23': 'PERUSAHAAN DAERAH (PERUSDA)',
    '26': 'PERSEROAN TERBATAS (PT) PERSEORANGAN',
    '27': 'PEDAGANG BERJANGKA ASING (PBA)'
  };

  const jenisApiMap: { [key: string]: string } = {
    '01': 'ANGKA PENGENAL IMPORTIR UMUM (API - U)',
    '02': 'ANGKA PENGENAL IMPORTIR PRODUSEN (API - P)'
  };

  const jenisPelakuUsahaMap: { [key: string]: string } = {
    '11': 'NON PERSEORANGAN',
    '12': 'PERSEORANGAN',
    '13': 'MIKRO',
    '14': 'PERWAKILAN (SIUP3A)',
    '15': 'PERWAKILAN (BUJKA)',
    '16': 'PERWAKILAN (KPPA)',
    '17': 'STPW LUAR NEGERI',
    '21': 'PERUSAHAAN UMUM (PERUM)',
    '22': 'PERUSAHAAN UMUM DAERAH (PERUMDA)',
    '23': 'PERUSAHAAN DAERAH (PERUSDA)'
  };

  const statusBadanHukumMap: { [key: string]: string } = {
    '01': 'BADAN HUKUM',
    '02': 'BUKAN BADAN HUKUM',
    '12': 'PEMENUHAN KOMITMEN'
  };

  const kdKawasanMap: { [key: string]: string } = {
    '0': '-',
    '01': 'KAWASAN INDUSTRI (KI)',
    '02': 'KAWASAN EKONOMI KHUSUS (KEK)',
    '03': 'FTZ',
    '04': 'RDTR',
    '05': 'IKN'
  };

  const skalaUsahaMap: { [key: string]: string } = {
    '01': 'USAHA MIKRO',
    '02': 'USAHA KECIL',
    '03': 'USAHA MENENGAH',
    '04': 'USAHA BESAR'
  };

  const statusPenanamanModalMap: { [key: string]: string } = {
    '01': 'PENANAMAN MODAL ASING (PMA)',
    '02': 'PENANAMAN MODAL DALAM NEGERI (PMDN)',
    '03': 'BUKAN (PMA/PMDN)'
  };

  const jenisKelaminMap: { [key: string]: string } = {
    'L': 'LAKI-LAKI',
    'P': 'PEREMPUAN'
  };

  const sektorMap: { [key: string]: string } = {
    '015': 'KEUANGAN',
    '018': 'PERTANIAN',
    '019': 'PERINDUSTRIAN',
    '020': 'ENERGI DAN SUMBER DAYA MINERAL',
    '022': 'PERHUBUNGAN',
    '023': 'PENDIDIKAN DAN KEBUDAYAAN',
    '024': 'KESEHATAN',
    '025': 'AGAMA',
    '026': 'KETENAGAKERJAAN',
    '029': 'LINGKUNGAN HIDUP DAN KEHUTANAN',
    '032': 'KELAUTAN DAN PERIKANAN',
    '033': 'PEKERJAAN UMUM DAN PERUMAHAN RAKYAT',
    '040': 'PARIWISATA',
    '042': 'RISET TEKNOLOGI DAN PENDIDIKAN TINGGI',
    '044': 'KOPERASI DAN USAHA KECIL DAN MENENGAH',
    '059': 'KOMUNIKASI DAN INFORMATIKA',
    '060': 'KEPOLISIAN',
    '063': 'OBAT DAN MAKANAN',
    '065': 'BKPM',
    '080': 'KETENAGANUKLIRAN',
    '090': 'PERDAGANGAN'
  };

  const skalaResikoMap: { [key: string]: string } = {
    'R': 'RENDAH',
    'MR': 'MENENGAH RENDAH',
    'MT': 'MENENGAH TINGGI',
    'T': 'TINGGI'
  };

  // Helper functions for formatting
  const formatValue = (value: any) => {
    if (!value && value !== 0) return '-';
    return String(value).toUpperCase();
  };

  const formatMappedValue = (value: any, mapping: { [key: string]: string }) => {
    if (!value && value !== 0) return '-';
    const mapped = mapping[String(value)];
    return mapped || String(value).toUpperCase();
  };

  const formatCurrency = (value: any) => {
    if (!value || value === '') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('id-ID', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(num);
  };

  const formatRupiah = (amount: any) => {
    if (amount === null || amount === undefined || amount === '') return 'Rp. 0';
    const num = parseFloat(amount);
    if (isNaN(num)) return 'Rp. 0';
    const formattedNumber = new Intl.NumberFormat('id-ID', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(num);
    return `Rp.\u00A0${formattedNumber}`; // Using non-breaking space
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Card className="animate-slide-down w-full max-w-full">
      <CardContent className="p-4 w-full max-w-full">
        <div className="space-y-6 w-full max-w-full">
          {/* Top Section: PERUSAHAAN | ALAMAT */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start w-full max-w-full">
            {/* Left Column - PERUSAHAAN */}
            <div className="space-y-3 w-full max-w-full min-w-0">
              <h3 className="font-semibold text-lg border-b pb-2">
                🏢 <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">PERUSAHAAN</span>
              </h3>
              <div className="rounded-md border border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-50/30 to-blue-100/30 dark:from-blue-900/10 dark:to-blue-800/10 w-full max-w-full overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table className="table-compact min-w-full">
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium w-40 bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200 align-top">NIB</TableCell>
                        <TableCell className="text-data align-top">{formatValue(company.nib)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200 align-top">NAMA</TableCell>
                        <TableCell className="align-top">{formatValue(company.nama_perseroan)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200 align-top">NPWP</TableCell>
                        <TableCell className="text-data align-top">{formatValue(company.npwp_perseroan)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200 align-top">JENIS</TableCell>
                        <TableCell className="align-top">{formatMappedValue(company.jenis_perseroan, jenisPerseroanMap)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200 align-top">API</TableCell>
                        <TableCell className="align-top">{formatMappedValue(company.jenis_api, jenisApiMap)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200 align-top">PELAKU USAHA</TableCell>
                        <TableCell className="align-top">{formatMappedValue(company.jenis_pelaku_usaha, jenisPelakuUsahaMap)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200 align-top">STATUS</TableCell>
                        <TableCell className="align-top">{formatMappedValue(company.status_badan_hukum, statusBadanHukumMap)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200 align-top">NO PENGESAHAN</TableCell>
                        <TableCell className="text-data align-top">{formatValue(company.no_pengesahan)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-100/60 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200 align-top">TGL PENGESAHAN</TableCell>
                        <TableCell className="align-top">{formatDate(company.tgl_pengesahan)}</TableCell>
                      </TableRow>
                    </TableBody>
                    </Table>
                  </div>
              </div>
            </div>

            {/* Right Column - ALAMAT */}
            <div className="w-full max-w-full min-w-0">
              <div>
                <h3 className="font-semibold text-lg border-b pb-2">
                  📍 <span className="bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">ALAMAT</span>
                </h3>
                <div className="rounded-md border border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50/30 to-green-100/30 dark:from-green-900/10 dark:to-green-800/10 mt-3 w-full max-w-full overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table className="table-compact min-w-full">
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium w-40 bg-green-100/60 dark:bg-green-800/30 text-green-800 dark:text-green-200 align-top">ALAMAT</TableCell>
                        <TableCell className="align-top">{formatValue(company.alamat_perseroan)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-green-100/60 dark:bg-green-800/30 text-green-800 dark:text-green-200 align-top">RT RW</TableCell>
                        <TableCell className="align-top">{formatValue(company.rt_rw_perseroan)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-green-100/60 dark:bg-green-800/30 text-green-800 dark:text-green-200 align-top">KELURAHAN</TableCell>
                        <TableCell className="align-top">{formatValue(company.kelurahan_perseroan)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-green-100/60 dark:bg-green-800/30 text-green-800 dark:text-green-200 align-top">KODE DAERAH</TableCell>
                        <TableCell className="align-top">{formatValue(company.perseroan_daerah_id)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-green-100/60 dark:bg-green-800/30 text-green-800 dark:text-green-200 align-top">KODE POS</TableCell>
                        <TableCell className="text-data align-top">{formatValue(company.kode_pos_perseroan)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-green-100/60 dark:bg-green-800/30 text-green-800 dark:text-green-200 align-top">NOMOR TELEPON</TableCell>
                        <TableCell className="text-data align-top">{formatValue(company.nomor_telpon_perseroan)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-green-100/60 dark:bg-green-800/30 text-green-800 dark:text-green-200 align-top">EMAIL</TableCell>
                        <TableCell className="text-data align-top">{formatValue(company.email_perusahaan)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-green-100/60 dark:bg-green-800/30 text-green-800 dark:text-green-200 align-top">KD KAWASAN</TableCell>
                        <TableCell className="text-data align-top">{formatMappedValue(company.kd_kawasan, kdKawasanMap)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-green-100/60 dark:bg-green-800/30 text-green-800 dark:text-green-200 align-top">JENIS KAWASAN</TableCell>
                        <TableCell className="align-top">{formatValue(company.jenis_kawasan)}</TableCell>
                      </TableRow>
                    </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second Section: MODAL | USER OSS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start w-full max-w-full">
            {/* Left Column - MODAL */}
            <div className="space-y-3 w-full max-w-full min-w-0">
              <h3 className="font-semibold text-lg border-b pb-2">
                💰 <span className="bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">MODAL</span>
              </h3>
              <div className="rounded-md border border-yellow-200 dark:border-yellow-700 bg-gradient-to-br from-yellow-50/30 to-yellow-100/30 dark:from-yellow-900/10 dark:to-yellow-800/10 w-full max-w-full overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table className="table-compact min-w-full">
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium w-40 bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200 align-top">SKALA USAHA</TableCell>
                        <TableCell className="align-top">{formatMappedValue(company.skala_usaha, skalaUsahaMap)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200 align-top">STATUS</TableCell>
                        <TableCell className="align-top">{formatMappedValue(company.status_penanaman_modal, statusPenanamanModalMap)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200 align-top">TOTAL MODAL</TableCell>
                        <TableCell className="text-financial align-top">{formatRupiah(company.total_modal_ditempatkan)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200 align-top">NEGARA PMA</TableCell>
                        <TableCell className="align-top">{formatValue(company.negara_pma_dominan)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200 align-top">TOTAL PMA</TableCell>
                        <TableCell className="text-financial align-top">{formatRupiah(company.total_pma)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200 align-top">NILAI PMDN</TableCell>
                        <TableCell className="text-financial align-top">{formatRupiah(company.nilai_pmdn)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200 align-top">PERSEN PMA</TableCell>
                        <TableCell className="text-financial align-top">{formatValue(company.persen_pma)}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-yellow-100/60 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200 align-top">PERSEN PMDN</TableCell>
                        <TableCell className="text-financial align-top">{formatValue(company.persen_pmdn)}%</TableCell>
                      </TableRow>
                    </TableBody>
                    </Table>
                  </div>
              </div>
            </div>

            {/* Right Column - USER OSS */}
            <div className="w-full max-w-full min-w-0">
              <div>
                <h3 className="font-semibold text-lg border-b pb-2">
                  👤 <span className="bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent">USER OSS</span>
                </h3>
                <div className="rounded-md border border-purple-200 dark:border-purple-700 bg-gradient-to-br from-purple-50/30 to-purple-100/30 dark:from-purple-900/10 dark:to-purple-800/10 mt-3 w-full max-w-full overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table className="table-compact min-w-full">
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium w-40 bg-purple-100/60 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200 align-top">NAMA</TableCell>
                        <TableCell className="align-top">{formatValue(company.nama_user_proses)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-purple-100/60 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200 align-top">NO IDENTITAS</TableCell>
                        <TableCell className="text-data align-top">{formatValue(company.no_id_user_proses)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-purple-100/60 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200 align-top">JNS KELAMIN</TableCell>
                        <TableCell className="align-top">{formatMappedValue(company.jns_kelamin_user_proses, jenisKelaminMap)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-purple-100/60 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200 align-top">TGL LAHIR</TableCell>
                        <TableCell className="align-top">{formatDate(company.tgl_lahir_user_proses)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-purple-100/60 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200 align-top">TEMPAT LAHIR</TableCell>
                        <TableCell className="align-top">{formatValue(company.tempat_lahir_user_proses)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-purple-100/60 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200 align-top">HP</TableCell>
                        <TableCell className="text-data align-top">{formatValue(company.hp_user_proses)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-purple-100/60 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200 align-top">EMAIL</TableCell>
                        <TableCell className="text-data align-top">{formatValue(company.email_user_proses)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-purple-100/60 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200 align-top">ALAMAT</TableCell>
                        <TableCell className="align-top">{formatValue(company.alamat_user_proses)}</TableCell>
                      </TableRow>
                    </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PENANGGUNG JAWAB - Full Width */}
          {penanggung_jawab && penanggung_jawab.length > 0 && (
            <div className="w-full max-w-full min-w-0">
              <h3 className="font-semibold text-lg border-b pb-2">
                👨‍💼 <span className="bg-gradient-to-r from-red-600 to-rose-700 bg-clip-text text-transparent">PENANGGUNG JAWAB</span>
              </h3>
              <div className="rounded-md border border-red-200 dark:border-red-700 bg-gradient-to-br from-red-50/30 to-red-100/30 dark:from-red-900/10 dark:to-red-800/10 mt-3 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="table-compact min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 font-medium bg-red-100/60 dark:bg-red-800/30 text-red-800 dark:text-red-200 text-center">No</TableHead>
                      <TableHead className="w-32 font-medium bg-red-100/60 dark:bg-red-800/30 text-red-800 dark:text-red-200 text-left">Jabatan</TableHead>
                      <TableHead className="w-64 font-medium bg-red-100/60 dark:bg-red-800/30 text-red-800 dark:text-red-200 text-left">Nama</TableHead>
                      <TableHead className="w-32 font-medium bg-red-100/60 dark:bg-red-800/30 text-red-800 dark:text-red-200 text-left">No. Identitas</TableHead>
                      <TableHead className="w-32 font-medium bg-red-100/60 dark:bg-red-800/30 text-red-800 dark:text-red-200 text-left">NPWP</TableHead>
                      <TableHead className="font-medium bg-red-100/60 dark:bg-red-800/30 text-red-800 dark:text-red-200 text-left">Alamat</TableHead>
                      <TableHead className="w-24 font-medium bg-red-100/60 dark:bg-red-800/30 text-red-800 dark:text-red-200 text-left">No HP</TableHead>
                      <TableHead className="font-medium bg-red-100/60 dark:bg-red-800/30 text-red-800 dark:text-red-200 text-left">Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...penanggung_jawab].sort((a, b) => (a.jabatan_penanggung_jwb || '').localeCompare(b.jabatan_penanggung_jwb || '')).map((person: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="w-12 text-center align-top p-2">{index + 1}</TableCell>
                        <TableCell className="w-32 align-top p-2">{formatValue(person.jabatan_penanggung_jwb)}</TableCell>
                        <TableCell className="w-64 font-semibold align-top p-2">{formatValue(person.nama_penanggung_jwb)}</TableCell>
                        <TableCell className="w-32 text-data align-top p-2">{formatValue(person.no_identitas_penanggung_jwb)}</TableCell>
                        <TableCell className="w-32 text-data align-top p-2">{formatValue(person.npwp_penanggung_jwb)}</TableCell>
                        <TableCell className="align-top p-2">{formatValue(person.alamat_penanggung_jwb)}</TableCell>
                        <TableCell className="w-24 text-data align-top p-2">{formatValue(person.no_hp_penanggung_jwb)}</TableCell>
                        <TableCell className="text-data align-top p-2">{formatValue(person.email_penanggung_jwb)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* PEMEGANG SAHAM - Full Width */}
          {pemegang_saham && pemegang_saham.length > 0 && (
            <div className="w-full max-w-full min-w-0">
              <h3 className="font-semibold text-lg border-b pb-2">
                👥 <span className="bg-gradient-to-r from-cyan-600 to-teal-700 bg-clip-text text-transparent">PEMEGANG SAHAM</span>
              </h3>
              <div className="rounded-md border border-cyan-200 dark:border-cyan-700 bg-gradient-to-br from-cyan-50/30 to-cyan-100/30 dark:from-cyan-900/10 dark:to-cyan-800/10 mt-3 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="table-compact min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 font-medium bg-cyan-100/60 dark:bg-cyan-800/30 text-cyan-800 dark:text-cyan-200 text-center">No</TableHead>
                      <TableHead className="w-32 font-medium bg-cyan-100/60 dark:bg-cyan-800/30 text-cyan-800 dark:text-cyan-200 text-left">Jabatan</TableHead>
                      <TableHead className="w-64 font-medium bg-cyan-100/60 dark:bg-cyan-800/30 text-cyan-800 dark:text-cyan-200 text-left">Nama</TableHead>
                      <TableHead className="w-32 font-medium bg-cyan-100/60 dark:bg-cyan-800/30 text-cyan-800 dark:text-cyan-200 text-left">No. Identitas</TableHead>
                      <TableHead className="w-32 font-medium bg-cyan-100/60 dark:bg-cyan-800/30 text-cyan-800 dark:text-cyan-200 text-left">NPWP</TableHead>
                      <TableHead className="font-medium bg-cyan-100/60 dark:bg-cyan-800/30 text-cyan-800 dark:text-cyan-200 text-left">Alamat</TableHead>
                      <TableHead className="text-center font-medium bg-cyan-100/60 dark:bg-cyan-800/30 text-cyan-800 dark:text-cyan-200 text-right">Modal</TableHead>
                      <TableHead className="font-medium bg-cyan-100/60 dark:bg-cyan-800/30 text-cyan-800 dark:text-cyan-200 text-left">Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...pemegang_saham].sort((a, b) => (a.jabatan_pemegang_saham || '').localeCompare(b.jabatan_pemegang_saham || '')).map((shareholder: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="w-12 text-center align-top p-2">{index + 1}</TableCell>
                        <TableCell className="w-32 align-top p-2">{formatValue(shareholder.jabatan_pemegang_saham)}</TableCell>
                        <TableCell className="w-64 font-semibold align-top p-2">{formatValue(shareholder.nama_pemegang_saham)}</TableCell>
                        <TableCell className="w-32 text-data align-top p-2">{formatValue(shareholder.no_identitas_pemegang_saham)}</TableCell>
                        <TableCell className="w-32 text-data align-top p-2">{formatValue(shareholder.npwp_pemegang_saham)}</TableCell>
                        <TableCell className="align-top p-2">{formatValue(shareholder.alamat_pemegang_saham)}</TableCell>
                        <TableCell className="text-financial text-right align-top p-2">{formatRupiah(shareholder.total_modal_pemegang)}</TableCell>
                        <TableCell className="text-data align-top p-2">{formatValue(shareholder.email_pemegang_saham)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* LEGALITAS - Full Width */}
          {legalitas && legalitas.length > 0 && (
            <div className="w-full max-w-full min-w-0">
              <h3 className="font-semibold text-lg border-b pb-2">
                📄 <span className="bg-gradient-to-r from-slate-600 to-gray-700 bg-clip-text text-transparent">LEGALITAS</span>
              </h3>
              <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/30 to-slate-100/30 dark:from-slate-900/10 dark:to-slate-800/10 mt-3 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="table-compact min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 font-medium bg-slate-100/60 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200 text-center">No</TableHead>
                      <TableHead className="w-24 font-medium bg-slate-100/60 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200 text-left">No Legal</TableHead>
                      <TableHead className="w-24 font-medium bg-slate-100/60 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200 text-left">Tanggal</TableHead>
                      <TableHead className="w-64 font-medium bg-slate-100/60 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200 text-left">Notaris</TableHead>
                      <TableHead className="font-medium bg-slate-100/60 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200 text-left">Alamat Notaris</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...legalitas].sort((a, b) => {
                      // Sort by tanggal legal first, then by no_legal
                      const dateA = new Date(a.tgl_legal || '1900-01-01').getTime();
                      const dateB = new Date(b.tgl_legal || '1900-01-01').getTime();
                      if (dateA !== dateB) {
                        return dateA - dateB;
                      }
                      return (a.no_legal || '').localeCompare(b.no_legal || '');
                    }).map((legal: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="w-12 text-center align-top p-2">{index + 1}</TableCell>
                        <TableCell className="w-24 text-data align-top p-2">{formatValue(legal.no_legal)}</TableCell>
                        <TableCell className="w-24 align-top p-2">{formatDate(legal.tgl_legal)}</TableCell>
                        <TableCell className="w-64 align-top p-2">{formatValue(legal.nama_notaris)}</TableCell>
                        <TableCell className="align-top p-2">{formatValue(legal.alamat_notaris)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* DATA PROYEK - Full Width */}
          {proyek && proyek.length > 0 && (
            <div className="w-full max-w-full min-w-0">
              <h3 className="font-semibold text-lg border-b pb-2">
                🏗️ <span className="bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">DATA PROYEK</span>
              </h3>
              <div className="rounded-md border border-orange-200 dark:border-orange-700 bg-gradient-to-br from-orange-50/30 to-orange-100/30 dark:from-orange-900/10 dark:to-orange-800/10 mt-3 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="table-compact min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200 text-center">No</TableHead>
                      <TableHead className="w-24 font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200 text-left">KBLI</TableHead>
                      <TableHead className="font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200 text-left">Sektor</TableHead>
                      <TableHead className="font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200 text-left">Uraian</TableHead>
                      <TableHead className="w-16 font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200 text-left">Resiko</TableHead>
                      <TableHead className="font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200 text-left">Cabang</TableHead>
                      <TableHead className="text-center font-medium bg-orange-100/60 dark:bg-orange-800/30 text-orange-800 dark:text-orange-200 text-right">Investasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...proyek].sort((a, b) => (a.kbli || '').localeCompare(b.kbli || '')).map((project: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="w-12 text-center align-top p-2">{index + 1}</TableCell>
                        <TableCell className="w-24 text-data align-top p-2">{formatValue(project.kbli)}</TableCell>
                        <TableCell className="align-top p-2">{formatMappedValue(project.sektor, sektorMap)}</TableCell>
                        <TableCell className="align-top p-2">{formatValue(project.uraian)}</TableCell>
                        <TableCell className="w-16 align-top p-2">{formatMappedValue(project.skala_resiko, skalaResikoMap)}</TableCell>
                        <TableCell className="align-top p-2">{formatValue(project.nama_cabang)}</TableCell>
                        <TableCell className="text-financial text-right align-top p-2">{formatRupiah(project.jumlah_investasi)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
