import React, { useState, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { company } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import CompanyFilterSection from '@/components/company/CompanyFilterSection';
import CompanyResultsTable from '@/components/company/CompanyResultsTable';
import CompanyDetailView from '@/components/company/CompanyDetailView';

interface FilterState {
  nib: string;
  npwp_perseroan: string;
  nama_perseroan: string;
  no_identitas_penanggung_jwb: string;
  nama_penanggung_jwb: string;
  npwp_penanggung_jwb: string;
}

interface CompanyRecord {
  nib: string;
  npwp_perseroan?: string;
  nama_perseroan?: string;
}

interface ApiResponse {
  data: CompanyRecord[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Company',
        href: company(),
    },
];

export default function Company() {
  // State management
  const [filters, setFilters] = useState<FilterState>({
    nib: '',
    npwp_perseroan: '',
    nama_perseroan: '',
    no_identitas_penanggung_jwb: '',
    nama_penanggung_jwb: '',
    npwp_penanggung_jwb: '',
  });

  const [data, setData] = useState<CompanyRecord[]>([]);
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
  const [hasSearched, setHasSearched] = useState(false);
  
  // Sorting state
  const [sortBy, setSortBy] = useState('nib');
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

      const response = await fetch(`/api/company/companies?${params.toString()}`);
      
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
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortDirection]);

  // Fetch data function (wrapper for backward compatibility)
  const fetchData = useCallback(async (page = 1, perPage = 10) => {
    await fetchDataWithSort(page, perPage);
  }, [fetchDataWithSort]);

  // Fetch detailed data for expanded row
  const fetchDetailData = useCallback(async (nib: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/company/companies/${encodeURIComponent(nib)}`);
      const result = await response.json();
      setDetailData(result);
    } catch (error) {
      console.error('Error fetching detail data:', error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

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
      nib: '',
      npwp_perseroan: '',
      nama_perseroan: '',
      no_identitas_penanggung_jwb: '',
      nama_penanggung_jwb: '',
      npwp_penanggung_jwb: '',
    };
    
    // Reset all states
    setFilters(resetFilters);
    setSortBy('nib');
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
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchData(page, pagination.per_page || 10);
  };

  // Handle per page change
  const handlePerPageChange = (perPage: number) => {
    fetchData(1, perPage); // Reset to first page when changing per page
  };

  // Handle row expansion
  const handleRowClick = (record: CompanyRecord) => {
    if (expandedRow === record.nib) {
      // Close if already expanded
      setExpandedRow(null);
      setDetailData(null);
    } else {
      // Open new row
      setExpandedRow(record.nib);
      fetchDetailData(record.nib);
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





  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Company" />
      
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
                <span className="text-2xl">🏢</span> Company Search Filters
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
                <CompanyFilterSection
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onFilterSubmit={handleFilterSubmit}
                  onFilterReset={handleFilterReset}
                  loading={loading}
                  expanded={filterExpanded}
                />
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              <h2 className="text-xl font-semibold">Search Results</h2>
            </div>
            
            <CompanyResultsTable
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
