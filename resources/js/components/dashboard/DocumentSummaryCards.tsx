import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  DocumentSummaryCardsProps,
  DocumentSummaryStats,
  ComponentState,
} from '../../types/dashboard';
import {
  fetchDocumentSummary,
  refreshDocumentSummaryView,
  formatNumber,
  calculatePercentage,
} from '../../utils/dashboardApi';
import { useToast } from '@/hooks/useToast';

const DocumentSummaryCards: React.FC<DocumentSummaryCardsProps> = ({
  className = '',
  refreshInterval,
  refreshTrigger,
  hideRefreshButton = false,
  hideLastUpdated = false,
}) => {
  const [stats, setStats] = useState<DocumentSummaryStats>({
    total: 0,
    green: 0,
    red: 0,
  });
  
  const [state, setState] = useState<ComponentState>({
    loading: true,
    error: null,
    lastUpdated: null,
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  // Load data function
  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetchDocumentSummary();
      
      if (response.success) {
        setStats(response.stats);
        setState(prev => ({
          ...prev,
          loading: false,
          lastUpdated: new Date(),
        }));
      } else {
        const errorMsg = response.message || 'Failed to load document summary data';
        setState(prev => ({
          ...prev,
          loading: false,
          error: null,
        }));
        toast.error('Error loading data', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState(prev => ({
        ...prev,
        loading: false,
        error: null,
      }));
      toast.error('Error loading data', errorMsg);
    }
  }, []);

  // Refresh data function
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // First refresh the materialized view
      const refreshResponse = await refreshDocumentSummaryView();
      
      if (refreshResponse.success) {
        // Then load the updated data
        await loadData();
        toast.success('Data refreshed', 'Document summary has been refreshed successfully.');
      } else {
        const errorMsg = refreshResponse.message || 'Failed to refresh data';
        toast.error('Refresh failed', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to refresh data';
      toast.error('Refresh failed', errorMsg);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(loadData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, loadData]);

  // External refresh trigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadData();
    }
  }, [refreshTrigger, loadData]);

  const greenPercentage = calculatePercentage(stats.green, stats.total);
  const redPercentage = calculatePercentage(stats.red, stats.total);

  return (
    <div className={`document-summary-cards ${className}`}>
      {/* Header */}
      <div className={`flex items-center ${hideRefreshButton ? 'justify-start' : 'justify-between'} mb-6`}>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            📊 Document Summary
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of customs documents by status
          </p>
        </div>
        
        {!hideRefreshButton && (
          <button
            onClick={handleRefresh}
            disabled={state.loading || refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <RefreshCcw 
              className={`w-4 h-4 ${(state.loading || refreshing) ? 'animate-spin' : ''}`} 
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>


      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Documents Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Documents
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {state.loading ? (
                    <Loader2 className="w-8 h-8 animate-spin inline" />
                  ) : (
                    formatNumber(stats.total)
                  )}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All customs documents
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Green Documents Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Green Documents
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {state.loading ? (
                    <Loader2 className="w-8 h-8 animate-spin inline" />
                  ) : (
                    formatNumber(stats.green)
                  )}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Jalur Hijau (H)
                  </p>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {greenPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Red Documents Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Red Documents
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {state.loading ? (
                    <Loader2 className="w-8 h-8 animate-spin inline" />
                  ) : (
                    formatNumber(stats.red)
                  )}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Jalur Merah (M)
                  </p>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    {redPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {!hideLastUpdated && state.lastUpdated && (
        <div className="flex justify-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {state.lastUpdated.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentSummaryCards;
