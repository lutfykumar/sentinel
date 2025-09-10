import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { data } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  RotateCcw, 
  Download,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import FilterSection from '@/components/customs/FilterSection';
import ResultsTable from '@/components/customs/ResultsTable';
import DetailView from '@/components/customs/DetailView';

interface FilterState {
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
}

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

interface ApiResponse {
  data: CustomsRecord[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Data',
        href: data(),
    },
];

export default function CustomsData() {
  // State management
  const [filters, setFilters] = useState<FilterState>({
    start_date: '',
    end_date: '',
    nomordaftar: '',
    namaimportir: '',
    namapenjual: '',
    namapengirim: '',
    namappjk: '',
    negaraasal: '',
    uraianbarang: '',
    hscode: '',
    nomorkontainer: '',
    pelabuhan_muat: '',
    pelabuhan_transit: '',
    kode_tps: '',
    nama_pengangkut: '',
  });

  const [data, setData] = useState<CustomsRecord[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });

  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Sorting state
  const [sortBy, setSortBy] = useState('nomordaftar');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch data function with explicit sort parameters
  const fetchDataWithSort = useCallback(async (page = 1, perPage = 10, sortByParam?: string, sortDirectionParam?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: page.toString(),
        per_page: perPage.toString(),
        sort_by: sortByParam || sortBy,
        sort_direction: sortDirectionParam || sortDirection,
      });

      // Remove empty filters
      for (const [key, value] of params.entries()) {
        if (!value || value === '') {
          params.delete(key);
        }
      }

      const response = await fetch(`/api/data/customs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse = await response.json();

      if (result && result.data && typeof result.current_page !== 'undefined') {
        setData(result.data);
        setPagination({
          current_page: result.current_page,
          last_page: result.last_page,
          per_page: result.per_page,
          total: result.total,
          from: result.from,
          to: result.to,
        });
      } else {
        console.error('Invalid API response structure:', result);
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortDirection]);

  // Fetch data function (wrapper for backward compatibility)
  const fetchData = useCallback(async (page = 1, perPage = 10) => {
    await fetchDataWithSort(page, perPage);
  }, [fetchDataWithSort]);

  // Fetch detailed data for expanded row
  const fetchDetailData = useCallback(async (idheader: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/data/customs/${idheader}`);
      const result = await response.json();
      setDetailData(result);
    } catch (error) {
      console.error('Error fetching detail data:', error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Don't load data initially - wait for user to search
  // useEffect(() => {
  //   fetchData(1, 10);
  // }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore scroll position after pagination
  useEffect(() => {
    if (savedScrollPosition !== null && !loading) {
      setTimeout(() => {
        window.scrollTo(0, savedScrollPosition);
        setSavedScrollPosition(null);
      }, 50);
    }
  }, [data, loading, savedScrollPosition]);

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle filter submit
  const handleFilterSubmit = () => {
    setHasSearched(true);
    fetchData(1, pagination.per_page || 10);
  };

  // Handle filter reset
  const handleFilterReset = () => {
    const resetFilters = {
      start_date: '',
      end_date: '',
      nomordaftar: '',
      namaimportir: '',
      namapenjual: '',
      namapengirim: '',
      namappjk: '',
      negaraasal: '',
      uraianbarang: '',
      hscode: '',
      nomorkontainer: '',
      pelabuhan_muat: '',
      pelabuhan_transit: '',
      kode_tps: '',
      nama_pengangkut: '',
    };
    
    // Reset all states
    setFilters(resetFilters);
    setSortBy('nomordaftar');
    setSortDirection('asc');
    setExpandedRow(null);
    setDetailData(null);
    setHasSearched(false);
    
    // Clear data and reset pagination
    setData([]);
    setPagination({
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
      from: 0,
      to: 0,
    });
    
    // Don't fetch data on reset - wait for user to search again
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setSavedScrollPosition(window.scrollY);
    fetchData(page, pagination.per_page || 10);
  };

  // Handle per page change
  const handlePerPageChange = (perPage: number) => {
    setSavedScrollPosition(window.scrollY);
    fetchData(1, perPage); // Reset to first page when changing per page
  };

  // Handle row expansion
  const handleRowClick = (record: CustomsRecord) => {
    if (expandedRow === record.idheader) {
      // Close if already expanded
      setExpandedRow(null);
      setDetailData(null);
    } else {
      // Open new row
      setExpandedRow(record.idheader);
      fetchDetailData(record.idheader);
    }
  };

  // Handle sorting
  const handleSort = (column: string) => {
    let newSortBy = column;
    let newSortDirection: 'asc' | 'desc';
    
    if (sortBy === column) {
      newSortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      newSortDirection = 'asc';
    }
    
    // Update state
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
    
    // Immediately fetch data with new sort parameters
    fetchDataWithSort(1, pagination.per_page || 10, newSortBy, newSortDirection);
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Handle export function with sections
  const handleExport = (format: 'excel', sections: string[]) => {
    // Build export URL with current filters
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        params.set(key, value);
      }
    });
    
    // Add sorting parameters
    if (sortBy) {
      params.set('sort_by', sortBy);
      params.set('sort_direction', sortDirection);
    }
    
    // Add selected sections
    params.set('sections', sections.join(','));
    
    // Open export URL
    window.open(`/api/data/export/${format}?${params.toString()}`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Data" />
      
      {/* Single Combined Container */}
      <Card className="m-2 sm:m-4 flex-1 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 border border-sidebar-border/70 dark:border-sidebar-border">
        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Filter Section */}
          <div className="border-b border-border/50 pb-4">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => setFilterExpanded(!filterExpanded)}
            >
              <CardTitle className="flex items-center gap-2 text-xl">
                <span className="text-2xl">🔍</span> Search Filters
              </CardTitle>
              <div className="flex items-center">
                {filterExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
            
            {filterExpanded && (
              <div className="mt-4">
                <FilterSection
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onFilterSubmit={handleFilterSubmit}
                  onFilterReset={handleFilterReset}
                  loading={loading}
                  expanded={filterExpanded}
                  onExport={handleExport}
                  hasResults={data.length > 0}
                />
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h2 className="text-xl font-semibold">Search Results</h2>
            </div>
            
            {/* Pagination Controls at Top - Only show if search has been performed */}
            {hasSearched && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {pagination.from} to {pagination.to} of {pagination.total} results
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Per page:</span>
                    <Select
                      value={pagination.per_page.toString()}
                      onValueChange={(value) => handlePerPageChange(parseInt(value))}
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
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.current_page === 1}
                      className="shrink-0"
                    >
                      <ChevronFirst className="h-4 w-4" />
                    </Button>

                    {/* Previous page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page - 1)}
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
                              onClick={() => handlePageChange(i)}
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
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="shrink-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Last page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.last_page)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="shrink-0"
                    >
                      <ChevronLast className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <ResultsTable
              data={data}
              pagination={pagination}
              loading={loading}
              expandedRow={expandedRow}
              onRowClick={handleRowClick}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
              onSort={handleSort}
              getSortIcon={getSortIcon}
              detailData={detailData}
              detailLoading={detailLoading}
              hasSearched={hasSearched}
              onDetailClose={() => {
                setExpandedRow(null);
                setDetailData(null);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
