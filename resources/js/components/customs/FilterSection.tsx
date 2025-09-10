import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, RotateCcw, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import ExportModal from './ExportModal';
import useAuth from '@/hooks/useAuth';

interface FilterSectionProps {
  filters: {
    start_date: string;
    end_date: string;
    nomordaftar: string;
    namaimportir: string;
    namapenjual: string;
    namapengirim: string;
    namappjk: string;
    negaraasal: string;
    uraianbarang: string;
    hscode: string;
    nomorkontainer: string;
    pelabuhan_muat: string;
    pelabuhan_transit: string;
    kode_tps: string;
    nama_pengangkut: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onFilterSubmit: () => void;
  onFilterReset: () => void;
  loading: boolean;
  expanded: boolean;
  onExport: (format: 'excel', sections: string[]) => void;
  hasResults: boolean;
}

export default function FilterSection({
  filters,
  onFilterChange,
  onFilterSubmit,
  onFilterReset,
  loading,
  expanded,
  onExport,
  hasResults
}: FilterSectionProps) {
  const { hasPermission } = useAuth();
  const [exportModalOpen, setExportModalOpen] = useState(false);

  return (
    <>
      <Collapsible open={expanded}>
        <CollapsibleContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label htmlFor="start_date">Tanggal Mulai</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => onFilterChange('start_date', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Tanggal Akhir</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => onFilterChange('end_date', e.target.value)}
                  className="w-full"
                />
              </div>

            {/* PIB */}
            <div className="space-y-2">
              <Label htmlFor="nomordaftar">PIB</Label>
              <Input
                id="nomordaftar"
                type="text"
                value={filters.nomordaftar}
                onChange={(e) => {
                  // Only allow numeric input, max 6 digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  onFilterChange('nomordaftar', value);
                }}
                placeholder="Cari nomor PIB..."
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                className="w-full"
              />
            </div>

            {/* Nama Importir */}
            <div className="space-y-2">
              <Label htmlFor="namaimportir">Nama Importir</Label>
              <AutocompleteInput
                id="namaimportir"
                value={filters.namaimportir}
                onChange={(value) => onFilterChange('namaimportir', value)}
                apiEndpoint="/data/api/suggestions/importir"
                placeholder="Cari nama importir..."
                className="w-full"
              />
            </div>

            {/* Nama Penjual */}
            <div className="space-y-2">
              <Label htmlFor="namapenjual">Nama Penjual</Label>
              <AutocompleteInput
                id="namapenjual"
                value={filters.namapenjual}
                onChange={(value) => onFilterChange('namapenjual', value)}
                apiEndpoint="/data/api/suggestions/penjual"
                placeholder="Cari nama penjual..."
                className="w-full"
              />
            </div>

            {/* Nama Pengirim */}
            <div className="space-y-2">
              <Label htmlFor="namapengirim">Nama Pengirim</Label>
              <AutocompleteInput
                id="namapengirim"
                value={filters.namapengirim}
                onChange={(value) => onFilterChange('namapengirim', value)}
                apiEndpoint="/data/api/suggestions/pengirim"
                placeholder="Cari nama pengirim..."
                className="w-full"
              />
            </div>

            {/* Nama PPJK */}
            <div className="space-y-2">
              <Label htmlFor="namappjk">Nama PPJK</Label>
              <AutocompleteInput
                id="namappjk"
                value={filters.namappjk}
                onChange={(value) => onFilterChange('namappjk', value)}
                apiEndpoint="/data/api/suggestions/ppjk"
                placeholder="Cari nama PPJK..."
                className="w-full"
              />
            </div>

            {/* Negara Asal */}
            <div className="space-y-2">
              <Label htmlFor="negaraasal">Negara Asal</Label>
              <AutocompleteInput
                id="negaraasal"
                value={filters.negaraasal}
                onChange={(value) => onFilterChange('negaraasal', value)}
                apiEndpoint="/data/api/suggestions/negara-asal"
                placeholder="Cari negara asal..."
                className="w-full"
              />
            </div>

            {/* Uraian Barang */}
            <div className="space-y-2">
              <Label htmlFor="uraianbarang">Uraian Barang</Label>
              <AutocompleteInput
                id="uraianbarang"
                value={filters.uraianbarang}
                onChange={(value) => onFilterChange('uraianbarang', value)}
                apiEndpoint="/data/api/suggestions/uraian-barang"
                placeholder="Cari uraian barang..."
                className="w-full"
              />
            </div>

            {/* HS Code */}
            <div className="space-y-2">
              <Label htmlFor="hscode">HS Code</Label>
              <AutocompleteInput
                id="hscode"
                value={filters.hscode}
                onChange={(value) => onFilterChange('hscode', value)}
                apiEndpoint="/data/api/suggestions/hs-code"
                placeholder="Cari HS Code..."
                className="w-full"
              />
            </div>

            {/* Nomor Kontainer */}
            <div className="space-y-2">
              <Label htmlFor="nomorkontainer">Nomor Kontainer</Label>
              <AutocompleteInput
                id="nomorkontainer"
                value={filters.nomorkontainer}
                onChange={(value) => onFilterChange('nomorkontainer', value)}
                apiEndpoint="/data/api/suggestions/nomor-kontainer"
                placeholder="Cari nomor kontainer..."
                className="w-full"
              />
            </div>

            {/* Pelabuhan Muat */}
            <div className="space-y-2">
              <Label htmlFor="pelabuhan_muat">Pelabuhan Muat</Label>
              <AutocompleteInput
                id="pelabuhan_muat"
                value={filters.pelabuhan_muat}
                onChange={(value) => onFilterChange('pelabuhan_muat', value.toUpperCase())}
                apiEndpoint="/data/api/suggestions/pelabuhan-muat"
                placeholder="Cari pelabuhan muat..."
                maxLength={6}
                className="w-full"
              />
            </div>

            {/* Pelabuhan Transit */}
            <div className="space-y-2">
              <Label htmlFor="pelabuhan_transit">Pelabuhan Transit</Label>
              <AutocompleteInput
                id="pelabuhan_transit"
                value={filters.pelabuhan_transit}
                onChange={(value) => onFilterChange('pelabuhan_transit', value.toUpperCase())}
                apiEndpoint="/data/api/suggestions/pelabuhan-transit"
                placeholder="Cari pelabuhan transit..."
                maxLength={6}
                className="w-full"
              />
            </div>

            {/* Kode TPS */}
            <div className="space-y-2">
              <Label htmlFor="kode_tps">Kode TPS</Label>
              <AutocompleteInput
                id="kode_tps"
                value={filters.kode_tps}
                onChange={(value) => onFilterChange('kode_tps', value.toUpperCase())}
                apiEndpoint="/data/api/suggestions/kode-tps"
                placeholder="Cari kode TPS..."
                className="w-full"
              />
            </div>

            {/* Nama Pengangkut */}
            <div className="space-y-2">
              <Label htmlFor="nama_pengangkut">Nama Pengangkut</Label>
              <AutocompleteInput
                id="nama_pengangkut"
                value={filters.nama_pengangkut}
                onChange={(value) => onFilterChange('nama_pengangkut', value.toUpperCase())}
                apiEndpoint="/data/api/suggestions/nama-pengangkut"
                placeholder="Cari nama pengangkut..."
                className="w-full"
              />
            </div>
          </div>

          {/* Action Buttons with Dashboard Style */}
          <div className="flex flex-col space-y-3 pt-4 sm:pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                variant="outline"
                onClick={onFilterSubmit}
                disabled={loading}
                className="flex items-center justify-center gap-2 border-blue-300 dark:border-blue-500 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 px-6 py-2 font-semibold border-2 rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <Search className="h-4 w-4" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
              
              <Button
                variant="outline"
                onClick={onFilterReset}
                disabled={loading}
                className="flex items-center justify-center gap-2 border-red-300 dark:border-red-500 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 px-6 py-2 font-semibold border-2 rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              
              {/* Export Button - Only show when there are results and user has export permission */}
              {hasResults && hasPermission('data.export') && (
                <Button
                  variant="outline"
                  onClick={() => setExportModalOpen(true)}
                  className="flex items-center gap-2 border-green-300 dark:border-green-500 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 px-6 py-2 font-semibold border-2 rounded-lg hover:shadow-md w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={onExport}
        hasResults={hasResults}
      />
    </>
  );
}
