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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CompanyDetailView from './CompanyDetailView';

interface CompanyRecord {
  nib: string;
  npwp_perseroan?: string;
  nama_perseroan?: string;
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
  data: CompanyRecord[];
  pagination: PaginationMeta;
  loading: boolean;
  expandedRow: string | null;
  onRowClick: (record: CompanyRecord) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onSort: (column: string) => void;
  getSortIcon: (column: string) => React.ReactNode;
  detailData: any;
  detailLoading: boolean;
  hasSearched: boolean;
  onDetailClose: () => void;
}

export default function CompanyResultsTable({
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
  const formatValueUppercase = (value: any) => {
    if (!value && value !== 0) return '-';
    return String(value).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading company data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center space-y-4">
          <div className="text-6xl">{hasSearched ? '🏢' : '🔍'}</div>
          <div className="text-xl font-semibold text-muted-foreground">
            {hasSearched ? 'No Companies Found' : 'Start Your Search'}
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            {hasSearched 
              ? 'No company records match your current search criteria. Try adjusting your filters or search terms to find the companies you\'re looking for.'
              : 'Use the search filters above to find company data. Enter your search criteria and click "Search" to view results.'
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
              <TableHead className="w-12 text-center">No</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('nib')}
              >
                <div className="flex items-center space-x-2">
                  <span>NIB</span>
                  {getSortIcon('nib')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('npwp_perseroan')}
              >
                <div className="flex items-center space-x-2">
                  <span>NPWP Perusahaan</span>
                  {getSortIcon('npwp_perseroan')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('nama_perseroan')}
              >
                <div className="flex items-center space-x-2">
                  <span>Nama Perusahaan</span>
                  {getSortIcon('nama_perseroan')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record, index) => {
              // Calculate row number based on pagination
              const rowNumber = (pagination.current_page - 1) * pagination.per_page + index + 1;
              
              return (
                <React.Fragment key={record.nib}>
                  <TableRow
                    className={cn(
                      "transition-colors",
                      expandedRow === record.nib && "bg-muted/50"
                    )}
                  >
                    <TableCell className="text-center text-sm text-muted-foreground text-data">
                      {rowNumber}
                    </TableCell>
                    <TableCell 
                      className="font-medium text-data cursor-pointer hover:bg-muted/30" 
                      onClick={() => onRowClick(record)}
                    >
                      {formatValueUppercase(record.nib)}
                    </TableCell>
                    <TableCell 
                      className="text-data cursor-pointer hover:bg-muted/30" 
                      onClick={() => onRowClick(record)}
                    >
                      {formatValueUppercase(record.npwp_perseroan)}
                    </TableCell>
                    <TableCell 
                      className="text-sm cursor-pointer hover:bg-muted/30" 
                      onClick={() => onRowClick(record)}
                    >
                      {formatValueUppercase(record.nama_perseroan)}
                    </TableCell>
                  </TableRow>
                  {expandedRow === record.nib && (
                    <TableRow>
                      <TableCell colSpan={4} className="p-0 bg-muted/20">
                        <div className="p-4" id={`company-detail-${record.nib}`}>
                          <CompanyDetailView
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
