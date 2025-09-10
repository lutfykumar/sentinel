import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronRight,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DetailView from './DetailView';

interface CustomsRecord {
  idheader: string;
  nomordaftar: string;
  tanggaldaftar: string;
  kodejalur: string;
  namaperusahaan: string;
  namakantor: string;
  namarespon: string;
  kodedokumen: string;
  kodeproses: string;
  namaimportir?: string;
  namappjk?: string;
  namapenjual?: string;
  kontainer?: number;
  teus?: number;
  barang?: number;
  hscode?: string;
  uraianbarang?: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface ResultsTableProps {
  data: CustomsRecord[];
  pagination: PaginationMeta;
  loading: boolean;
  expandedRow: string | null;
  onRowClick: (record: CustomsRecord) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onSort: (column: string) => void;
  getSortIcon: (column: string) => React.ReactNode;
  detailData: any;
  detailLoading: boolean;
  hasSearched: boolean;
  onDetailClose: () => void;
}

export default function ResultsTable({
  data,
  pagination,
  loading,
  expandedRow,
  onRowClick,
  onPageChange,
  onPerPageChange,
  onSort,
  getSortIcon,
  detailData,
  detailLoading,
  hasSearched,
  onDetailClose
}: ResultsTableProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getRouteColor = (route: string) => {
    switch (route) {
      case 'H': return 'text-green-700 bg-green-100 border-green-300 font-bold';
      case 'M': return 'text-red-700 bg-red-100 border-red-300 font-bold';
      case 'K': return 'text-yellow-700 bg-yellow-100 border-yellow-300 font-bold';
      case 'P': return 'text-blue-700 bg-blue-100 border-blue-300 font-bold';
      default: return 'text-gray-700 bg-gray-100 border-gray-300 font-bold';
    }
  };

  const formatValueUppercase = (value: any) => {
    if (!value && value !== 0) return '-';
    return String(value).toUpperCase();
  };

  const handleDownloadPdf = async (record: CustomsRecord, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row expansion
    
    try {
      console.log('Downloading PDF for:', record.idheader);
      
      // Use backend proxy for PDF download
      const proxyUrl = `/api/data/download/pdf/${record.idheader}`;
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.target = '_blank'; // Open in new tab to handle any errors gracefully
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('PDF download initiated via backend proxy');
      
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF. Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading customs data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center space-y-4">
          <div className="text-6xl">{hasSearched ? '📋' : '🔍'}</div>
          <div className="text-xl font-semibold text-muted-foreground">
            {hasSearched ? 'No Results Found' : 'Start Your Search'}
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            {hasSearched 
              ? 'No customs records match your current search criteria. Try adjusting your filters or search terms to find the data you\'re looking for.'
              : 'Use the search filters above to find customs data. Enter your search criteria and click "Search" to view results.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="table-compact min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center">No</TableHead>
              <TableHead 
                className="w-[80px] cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('nomordaftar')}
              >
                <div className="flex items-center space-x-2">
                  <span>PIB</span>
                  {getSortIcon('nomordaftar')}
                </div>
              </TableHead>
              <TableHead 
                className="w-[100px] cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('tanggaldaftar')}
              >
                <div className="flex items-center space-x-2">
                  <span>Tanggal</span>
                  {getSortIcon('tanggaldaftar')}
                </div>
              </TableHead>
              <TableHead 
                className="w-[60px] cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('kodejalur')}
              >
                <div className="flex items-center space-x-2">
                  <span>Jalur</span>
                  {getSortIcon('kodejalur')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('namaimportir')}
              >
                <div className="flex items-center space-x-2">
                  <span>Nama Perusahaan</span>
                  {getSortIcon('namaimportir')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('namappjk')}
              >
                <div className="flex items-center space-x-2">
                  <span>Nama PPJK</span>
                  {getSortIcon('namappjk')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('namapenjual')}
              >
                <div className="flex items-center space-x-2">
                  <span>Nama Penjual</span>
                  {getSortIcon('namapenjual')}
                </div>
              </TableHead>
              <TableHead 
                className="w-[90px] text-center cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('kontainer')}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>Kontainer</span>
                  {getSortIcon('kontainer')}
                </div>
              </TableHead>
              <TableHead 
                className="w-[80px] text-center cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('teus')}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>TEUS</span>
                  {getSortIcon('teus')}
                </div>
              </TableHead>
              <TableHead 
                className="w-[80px] text-center cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('barang')}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>Barang</span>
                  {getSortIcon('barang')}
                </div>
              </TableHead>
              <TableHead 
                className="w-[100px] cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('hscode')}
              >
                <div className="flex items-center space-x-2">
                  <span>HS</span>
                  {getSortIcon('hscode')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('uraianbarang')}
              >
                <div className="flex items-center space-x-2">
                  <span>Uraian Barang</span>
                  {getSortIcon('uraianbarang')}
                </div>
              </TableHead>
              <TableHead className="w-[60px] text-center">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record, index) => {
              // Calculate row number based on pagination
              const rowNumber = (pagination.current_page - 1) * pagination.per_page + index + 1;
              
              return (
                <React.Fragment key={record.idheader}>
                  <TableRow
                    className={cn(
                      "cursor-pointer transition-colors",
                      expandedRow === record.idheader && "bg-muted/50"
                    )}
                    onClick={() => onRowClick(record)}
                  >
                    <TableCell className="text-center text-sm text-muted-foreground text-data">
                      {rowNumber}
                    </TableCell>
                    <TableCell className="font-medium text-data text-center">
                      {formatValueUppercase(record.nomordaftar)}
                    </TableCell>
                    <TableCell className="text-data text-center">
                      {formatDate(record.tanggaldaftar)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span 
                        className={cn(
                          "px-2 py-1 text-xs font-medium rounded border inline-block min-w-[24px] text-center",
                          getRouteColor(record.kodejalur)
                        )}
                      >
                        {formatValueUppercase(record.kodejalur)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatValueUppercase(record.namaimportir)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatValueUppercase(record.namappjk)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatValueUppercase(record.namapenjual)}
                    </TableCell>
                    <TableCell className="text-data text-center">
                      {record.kontainer ?? 0}
                    </TableCell>
                    <TableCell className="text-data text-center">
                      {(record.teus ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-data text-center">
                      {record.barang ?? 0}
                    </TableCell>
                    <TableCell className="text-data text-center">
                      {formatValueUppercase(record.hscode)}
                    </TableCell>
                    <TableCell className="max-w-[400px] truncate text-sm" title={formatValueUppercase(record.uraianbarang)}>
                      {formatValueUppercase(record.uraianbarang)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleDownloadPdf(record, e)}
                        className="h-8 w-8 p-0"
                        title="Download PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRow === record.idheader && (
                    <TableRow>
                      <TableCell colSpan={13} className="p-0 bg-muted/20">
                        <div className="p-4">
                          <DetailView
                            data={detailData}
                            loading={detailLoading}
                            onClose={onDetailClose}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
          </Table>
        </div>
      </div>

      {/* Bottom Pagination */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Showing {pagination.from} to {pagination.to} of {pagination.total} results
          </div>
          
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="text-sm text-muted-foreground">Per page:</span>
            <Select
              value={pagination.per_page.toString()}
              onValueChange={(value) => onPerPageChange(parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="75">75</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto">
            {/* First page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={pagination.current_page === 1}
              className="shrink-0"
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>

            {/* Previous page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {(() => {
                const pages = [];
                const start = Math.max(1, pagination.current_page - 1);
                const end = Math.min(pagination.last_page, pagination.current_page + 1);

                for (let i = start; i <= end; i++) {
                  pages.push(
                    <Button
                      key={i}
                      variant={i === pagination.current_page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(i)}
                      className="w-8 shrink-0"
                    >
                      {i}
                    </Button>
                  );
                }
                return pages;
              })()}
            </div>

            {/* Next page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.last_page)}
              disabled={pagination.current_page === pagination.last_page}
              className="shrink-0"
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
