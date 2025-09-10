import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dataRuleSets } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import RuleBuilder from '@/components/customs/RuleBuilder';
import ResultsTable from '@/components/customs/ResultsTable';
import DetailView from '@/components/customs/DetailView';
import { RuleGroupType } from 'react-querybuilder';
import { buildRuleSetApiUrl } from '@/utils/queryTranslator';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  { title: 'Rule Sets', href: dataRuleSets() },
];

const initialQuery: RuleGroupType = {
  combinator: 'and',
  rules: [],
};

export default function RuleSetPage() {
  const [query, setQuery] = useState<RuleGroupType>(initialQuery);
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
  const [sortBy, setSortBy] = useState('nomordaftar');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [builderExpanded, setBuilderExpanded] = useState(true);

  const executeQuery = useCallback(async (page = 1, perPage = 10, sortByParam?: string, sortDirectionParam?: string) => {
    // Don't execute if no rules are present
    if (!query.rules || query.rules.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const url = buildRuleSetApiUrl(
        '/api/rulesets/queries/execute',
        query,
        {
          page,
          per_page: perPage,
          sort_by: sortByParam || sortBy,
          sort_direction: sortDirectionParam || sortDirection,
        }
      );

      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          errorMessage += ` - ${errorText}`;
        } catch (e) {
          console.error('Could not read error response:', e);
        }
        throw new Error(errorMessage);
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
        
        if (result.total === 0) {
          setMessage({ type: 'success', text: 'Query executed successfully, but no records match your criteria.' });
        } else {
          setMessage({ type: 'success', text: `Query executed successfully. Found ${result.total} record(s).` });
        }
      } else {
        console.error('Invalid API response structure:', result);
        setData([]);
        setMessage({ type: 'error', text: 'Invalid response from server.' });
      }
    } catch (e) {
      console.error('Error executing query:', e);
      setMessage({ type: 'error', text: `Error executing query: ${e instanceof Error ? e.message : 'Unknown error'}` });
      setData([]);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
        from: 0,
        to: 0,
      });
    } finally {
      setLoading(false);
      // Auto-hide success/error messages after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    }
  }, [query, sortBy, sortDirection]);

  const fetchDetailData = useCallback(async (idheader: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/rulesets/queries/${idheader}`);
      const result = await response.json();
      setDetailData(result);
    } catch (error) {
      console.error('Error fetching detail data:', error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Don't execute empty queries on mount - only execute when user builds a query
  // useEffect(() => {
  //   executeQuery(1, 10);
  // }, []);

  const handleSort = (column: string) => {
    let newSortBy = column;
    let newSortDirection: 'asc' | 'desc';
    if (sortBy === column) {
      newSortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      newSortDirection = 'asc';
    }
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
    executeQuery(1, pagination.per_page || 10, newSortBy, newSortDirection);
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handlePageChange = (page: number) => {
    executeQuery(page, pagination.per_page || 10);
  };

  const handlePerPageChange = (perPage: number) => {
    executeQuery(1, perPage);
  };

  const handleRowClick = (record: CustomsRecord) => {
    if (expandedRow === record.idheader) {
      setExpandedRow(null);
      setDetailData(null);
    } else {
      setExpandedRow(record.idheader);
      fetchDetailData(record.idheader);
    }
  };

  // Export functionality
  const handleExport = (format: 'excel', sections: string[]) => {
    const url = buildRuleSetApiUrl('/api/rulesets/export/excel', query, {
      sort_by: sortBy,
      sort_direction: sortDirection,
      sections: sections.join(','),
    });
    window.open(url);
  };

  const handleSuccess = (text: string) => {
    setMessage({ type: 'success', text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleError = (text: string) => {
    setMessage({ type: 'error', text });
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Rule Sets" />
      <Card className="m-2 sm:m-4 flex-1 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 border border-sidebar-border/70 dark:border-sidebar-border">
        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Messages */}
          {message && (
            <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {/* Advanced Query Builder Section */}
          <div className="border-b border-border/50 pb-4">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => setBuilderExpanded(!builderExpanded)}
            >
              <CardTitle className="flex items-center gap-2 text-xl">
                <span className="text-2xl">⚙️</span> Advanced Query Builder
              </CardTitle>
              <div className="flex items-center">
                {builderExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
            
            {builderExpanded && (
              <div className="mt-4">
                <RuleBuilder
                  query={query}
                  onQueryChange={setQuery}
                  onExecuteQuery={() => {
                    // Only execute if query has rules
                    if (query.rules && query.rules.length > 0) {
                      executeQuery(1, pagination.per_page || 10);
                    } else {
                      setMessage({ type: 'error', text: 'Please add at least one rule to your query before executing.' });
                      setTimeout(() => setMessage(null), 5000);
                    }
                  }}
                  onReset={() => {
                    setQuery(initialQuery);
                    setExpandedRow(null);
                    setDetailData(null);
                    setData([]); // Clear results when resetting
                    setPagination({
                      current_page: 1,
                      last_page: 1,
                      per_page: 10,
                      total: 0,
                      from: 0,
                      to: 0,
                    });
                  }}
                  loading={loading}
                  hasResults={data.length > 0}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  onExport={handleExport}
                />
              </div>
            )}
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h2 className="text-xl font-semibold">Results</h2>
              {query.rules && query.rules.length === 0 && (
                <div className="text-sm text-muted-foreground ml-2">
                  (Build a query above and click "Execute Query" to see results)
                </div>
              )}
            </div>
            
            {/* Show results only if we have executed a query */}
            {query.rules && query.rules.length > 0 && (
              <>
                {/* Pagination Controls at Top */}
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
                  hasSearched={query.rules !== undefined && query.rules.length > 0}
                  onDetailClose={() => {
                    setExpandedRow(null);
                    setDetailData(null);
                  }}
                />
              </>
            )}
            
            {/* Show empty state when no query is built */}
            {(!query.rules || query.rules.length === 0) && (
              <div className="flex items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🔍</div>
                  <div className="text-xl font-semibold text-muted-foreground">Build Your Advanced Query</div>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Use the query builder above to create complex searches across customs data. 
                    Add rules, combine conditions, and execute to see filtered results.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

