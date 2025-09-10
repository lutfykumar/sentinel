import React, { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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

interface CombinedDashboardProps {
  className?: string;
  refreshInterval?: number;
  refreshTrigger?: number;
  chartHeight?: number;
}

const CombinedDashboard: React.FC<CombinedDashboardProps> = ({
  className = '',
  refreshInterval,
  refreshTrigger,
  chartHeight = 400,
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
        const errorMsg = summaryResponse.message || chartResponse.message || 'Failed to load data';
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }));
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

  const greenPercentage = calculatePercentage(stats.green, stats.total);
  const redPercentage = calculatePercentage(stats.red, stats.total);

  return (
    <div className={`combined-dashboard h-full ${className}`}>
      {/* Error State */}
      {state.error && (
        <div className="absolute top-4 left-4 right-4 z-10 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading data</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-1">{state.error}</p>
        </div>
      )}

      {/* Main Content: Summary Cards Left (25%), Chart Right (75%) */}
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 h-full p-6">
        <div className="flex h-full gap-6">
          
          {/* Left Side: Document Summary Cards (25% width) */}
          <div className="w-1/4 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span>📈</span>
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Document Summary
                </span>
              </h3>
            </div>

            <div className="flex-1 flex flex-col space-y-4">
              {/* Total Documents Card */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Total Documents
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
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Green Documents
                  </h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {state.loading ? (
                      <Loader2 className="w-6 h-6 animate-spin inline" />
                    ) : (
                      formatNumber(stats.green)
                    )}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Jalur Hijau</span>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      {greenPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Red Documents Card */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Red Documents
                  </h4>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {state.loading ? (
                      <Loader2 className="w-6 h-6 animate-spin inline" />
                    ) : (
                      formatNumber(stats.red)
                    )}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Jalur Merah</span>
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      {redPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Monthly Chart (75% width) */}
          <div className="w-3/4 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span>📊</span>
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Monthly Trends
                </span>
              </h3>
            </div>

            {/* Chart Container - Same height as cards */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
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
                      fill="#3b82f6"
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
    </div>
  );
};

export default CombinedDashboard;
