import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RefreshCcw, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import {
  MonthlyDocumentChartProps,
  MonthlyDocumentData,
  ComponentState,
  ChartTooltipPayload,
} from '../../types/dashboard';
import {
  fetchMonthlyDocuments,
  refreshMonthlyDocumentsView,
  formatNumber,
} from '../../utils/dashboardApi';
import { useToast } from '@/hooks/useToast';

const MonthlyDocumentChart: React.FC<MonthlyDocumentChartProps> = ({
  className = '',
  refreshInterval,
  chartHeight = 400,
  refreshTrigger,
  hideRefreshButton = false,
  hideLastUpdated = false,
}) => {
  const [data, setData] = useState<MonthlyDocumentData[]>([]);
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
      
      const response = await fetchMonthlyDocuments();
      
      if (response.success && response.data) {
        setData(response.data);
        setState(prev => ({
          ...prev,
          loading: false,
          lastUpdated: new Date(),
        }));
      } else {
        const errorMsg = response.message || 'Failed to load chart data';
        setState(prev => ({
          ...prev,
          loading: false,
          error: null,
        }));
        toast.error('Error loading chart', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState(prev => ({
        ...prev,
        loading: false,
        error: null,
      }));
      toast.error('Error loading chart', errorMsg);
    }
  }, []);

  // Refresh data function
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // First refresh the materialized view
      const refreshResponse = await refreshMonthlyDocumentsView();
      
      if (refreshResponse.success) {
        // Then load the updated data
        await loadData();
        toast.success('Chart refreshed', 'Monthly document chart has been refreshed successfully.');
      } else {
        const errorMsg = refreshResponse.message || 'Failed to refresh chart data';
        toast.error('Refresh failed', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to refresh chart data';
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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as MonthlyDocumentData;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {data.formatted_month || label}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Documents: <strong>{formatNumber(data.count)}</strong>
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate summary stats
  const totalDocuments = data.reduce((sum, item) => sum + item.count, 0);
  const averagePerMonth = data.length > 0 ? Math.round(totalDocuments / data.length) : 0;
  const maxMonth = data.reduce((max, item) => item.count > max.count ? item : max, { count: 0, month: '', formatted_month: '' });

  return (
    <div className={`monthly-document-chart ${className}`}>
      {/* Header */}
      <div className={`flex items-center ${hideRefreshButton ? 'justify-start' : 'justify-between'} mb-6`}>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            📈 Monthly Document Trends
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Document volume over time
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



      {/* Chart Container */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        {state.loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <p className="text-gray-600 dark:text-gray-400">Loading chart data...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-600 dark:text-gray-400">No data available</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                className="dark:stroke-gray-600" 
              />
              <XAxis
                dataKey="formatted_month"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ 
                  fontSize: 12,
                  fill: 'currentColor'
                }}
                className="text-gray-700 dark:text-gray-300"
              />
              <YAxis
                tick={{ 
                  fontSize: 12,
                  fill: 'currentColor'
                }}
                className="text-gray-700 dark:text-gray-300"
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="count"
                name="Document Count"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity duration-200"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
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

export default MonthlyDocumentChart;
