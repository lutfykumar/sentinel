import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, RotateCcw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CompanyAutocompleteInput from './CompanyAutocompleteInput';

interface FilterSectionProps {
  filters: {
    nib: string;
    npwp_perseroan: string;
    nama_perseroan: string;
    no_identitas_penanggung_jwb: string;
    nama_penanggung_jwb: string;
    npwp_penanggung_jwb: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onFilterSubmit: () => void;
  onFilterReset: () => void;
  loading: boolean;
  expanded: boolean;
}

export default function CompanyFilterSection({
  filters,
  onFilterChange,
  onFilterSubmit,
  onFilterReset,
  loading,
  expanded,
}: FilterSectionProps) {
  return (
    <Collapsible open={expanded}>
      <CollapsibleContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {/* NIB */}
            <div className="space-y-2">
              <Label htmlFor="nib">NIB</Label>
              <CompanyAutocompleteInput
                id="nib"
                value={filters.nib}
                onChange={(value) => onFilterChange('nib', value)}
                apiEndpoint="/api/company/suggestions/nib"
                placeholder="Cari NIB..."
                className="w-full"
              />
            </div>

            {/* NPWP Perseroan */}
            <div className="space-y-2">
              <Label htmlFor="npwp_perseroan">NPWP Perusahaan</Label>
              <CompanyAutocompleteInput
                id="npwp_perseroan"
                value={filters.npwp_perseroan}
                onChange={(value) => onFilterChange('npwp_perseroan', value)}
                apiEndpoint="/api/company/suggestions/npwp-perseroan"
                placeholder="Cari NPWP perusahaan..."
                className="w-full"
              />
            </div>

            {/* Nama Perseroan */}
            <div className="space-y-2">
              <Label htmlFor="nama_perseroan">Nama Perusahaan</Label>
              <CompanyAutocompleteInput
                id="nama_perseroan"
                value={filters.nama_perseroan}
                onChange={(value) => onFilterChange('nama_perseroan', value)}
                apiEndpoint="/api/company/suggestions/nama-perseroan"
                placeholder="Cari nama perusahaan..."
                className="w-full"
              />
            </div>

            {/* No Identitas Penanggung Jawab */}
            <div className="space-y-2">
              <Label htmlFor="no_identitas_penanggung_jwb">ID Penanggung Jawab</Label>
              <CompanyAutocompleteInput
                id="no_identitas_penanggung_jwb"
                value={filters.no_identitas_penanggung_jwb}
                onChange={(value) => onFilterChange('no_identitas_penanggung_jwb', value)}
                apiEndpoint="/api/company/suggestions/identitas-penanggung-jwb"
                placeholder="Cari ID penanggung jawab..."
                className="w-full"
              />
            </div>

            {/* Nama Penanggung Jawab */}
            <div className="space-y-2">
              <Label htmlFor="nama_penanggung_jwb">Nama Penanggung Jawab</Label>
              <CompanyAutocompleteInput
                id="nama_penanggung_jwb"
                value={filters.nama_penanggung_jwb}
                onChange={(value) => onFilterChange('nama_penanggung_jwb', value)}
                apiEndpoint="/api/company/suggestions/nama-penanggung-jwb"
                placeholder="Cari nama penanggung jawab..."
                className="w-full"
              />
            </div>

            {/* NPWP Penanggung Jawab */}
            <div className="space-y-2">
              <Label htmlFor="npwp_penanggung_jwb">NPWP Penanggung Jawab</Label>
              <CompanyAutocompleteInput
                id="npwp_penanggung_jwb"
                value={filters.npwp_penanggung_jwb}
                onChange={(value) => onFilterChange('npwp_penanggung_jwb', value)}
                apiEndpoint="/api/company/suggestions/npwp-penanggung-jwb"
                placeholder="Cari NPWP penanggung jawab..."
                className="w-full"
              />
            </div>
          </div>

          {/* Action Buttons */}
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
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
