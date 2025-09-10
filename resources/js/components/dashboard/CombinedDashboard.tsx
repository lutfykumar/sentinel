import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCcw, AlertCircle } from 'lucide-react';
import ImportVisualizationDashboard from './ImportVisualizationDashboard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  DocumentSummaryStats,
  MonthlyDocumentData,
  ComponentState,
} from '../../types/dashboard';
import {
  fetchDocumentSummary,
  fetchMonthlyDocuments,
  formatNumber,
  calculatePercentage,
} from '../../utils/dashboardApi';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/toast-container';

interface CombinedDashboardProps {
  className?: string;
  refreshInterval?: number;
  refreshTrigger?: number;
  chartHeight?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
}

const CombinedDashboard: React.FC<CombinedDashboardProps> = ({
  className = '',
  refreshInterval,
  refreshTrigger,
  chartHeight = 400,
  onRefresh,
  isRefreshing = false,
  lastUpdated,
}) => {
  // States for summary data
  const [stats, setStats] = useState<DocumentSummaryStats>({
    total: 0,
    green: 0,
    red: 0,
  });

  // States for chart data
  const [chartData, setChartData] = useState<MonthlyDocumentData[]>([]);

  // Combined state for loading/error
  const [state, setState] = useState<ComponentState>({
    loading: true,
    error: null,
    lastUpdated: null,
  });
  
  const toast = useToast();

  // Load both summary and chart data
  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Fetch both datasets simultaneously
      const [summaryResponse, chartResponse] = await Promise.all([
        fetchDocumentSummary(),
        fetchMonthlyDocuments()
      ]);
      
      if (summaryResponse.success && chartResponse.success) {
        setStats(summaryResponse.stats);
        setChartData(chartResponse.data);
        setState(prev => ({
          ...prev,
          loading: false,
          lastUpdated: new Date(),
        }));
      } else {
        const errorMsg = summaryResponse.message || chartResponse.message || 'Failed to load dashboard data';
        setState(prev => ({
          ...prev,
          loading: false,
          error: null,
        }));
        toast.error('Dashboard Error', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState(prev => ({
        ...prev,
        loading: false,
        error: null,
      }));
      toast.error('Dashboard Error', errorMsg);
    }
  }, []);

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

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as MonthlyDocumentData;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {data.formatted_month || label}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Documents: <strong>{formatNumber(data.count)}</strong>
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const greenPercentage = calculatePercentage(stats.green, stats.total);
  const redPercentage = calculatePercentage(stats.red, stats.total);

  return (
    <div className={`combined-dashboard h-full ${className}`}>

      {/* Header with refresh button */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200 dark:border-blue-700">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <span>💻</span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Executive Dashboard
              </span>
            </h2>
            {lastUpdated && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 disabled:transform-none disabled:hover:scale-100 shadow-lg hover:shadow-emerald-500/25"
          >
            <RefreshCcw 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
            {isRefreshing ? 'Refreshing All...' : 'Refresh All'}
          </button>
        </div>
      </div>

      {/* Main Content: Summary Cards Left (25%), Chart Right (75%) */}
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 flex-1 p-6">
        <div className="flex h-full gap-6">
          
          {/* Left Side: Document Summary Cards (25% width) */}
          <div className="w-1/4 flex flex-col">
            <div className="flex-1 flex flex-col space-y-4">
              {/* Total Documents Card */}
              <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center">
                <div className="text-4xl mr-4">
                  📑
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold flex items-center gap-2">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Total Documents
                    </span>
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {state.loading ? (
                      <Loader2 className="w-6 h-6 animate-spin inline" />
                    ) : (
                      formatNumber(stats.total)
                    )}
                  </p>
                </div>
              </div>

              {/* Green Documents Card */}
              <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center">
                <div className="text-4xl mr-4">
                  ✅
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold flex items-center gap-2">
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Jalur Hijau
                    </span>
                  </h4>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {state.loading ? (
                        <Loader2 className="w-6 h-6 animate-spin inline" />
                      ) : (
                        formatNumber(stats.green)
                      )}
                    </p>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      ({greenPercentage}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Red Documents Card */}
              <div className="flex-1 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center">
                <div className="text-4xl mr-4">
                  ❌
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold flex items-center gap-2">
                    <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                      Jalur Merah
                    </span>
                  </h4>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {state.loading ? (
                        <Loader2 className="w-6 h-6 animate-spin inline" />
                      ) : (
                        formatNumber(stats.red)
                      )}
                    </p>
                    <span className="text-xl font-bold text-red-600 dark:text-red-400">
                      ({redPercentage}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Monthly Chart (75% width) */}
          <div className="w-3/4 flex flex-col">
            {/* Chart Container - Same height as cards */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="mb-4">
                <h3 className="text-3xl font-semibold flex items-center gap-2">
                  <span>📈</span>
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Monthly Trends
                  </span>
                </h3>
              </div>
              {state.loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-gray-600 dark:text-gray-400">Loading chart data...</p>
                  </div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                    <p className="text-gray-600 dark:text-gray-400">No chart data available</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <defs>
                      <linearGradient id="purplePinkGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
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
                    <Bar
                      dataKey="count"
                      name="Document Count"
                      fill="url(#purplePinkGradient)"
                      radius={[4, 4, 0, 0]}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Import Visualization Section */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <ImportVisualizationDashboard 
          refreshTrigger={refreshTrigger}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
      </div>
      
      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
};

export default CombinedDashboard;
