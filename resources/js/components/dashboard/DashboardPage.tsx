import React, { useState, useCallback } from 'react';
import { RefreshCcw } from 'lucide-react';
import CombinedDashboard from './CombinedDashboard';
import { refreshAllViews } from '../../utils/dashboardApi';

interface DashboardPageProps {
  className?: string;
  autoRefreshInterval?: number; // in milliseconds (e.g., 300000 for 5 minutes)
  onRefresh?: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  className = '',
  autoRefreshInterval,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Global refresh handler
  const handleGlobalRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // Refresh all materialized views
      await refreshAllViews();
      
      // Update timestamp and trigger component refreshes
      setLastUpdated(new Date());
      setRefreshTrigger(prev => prev + 1);
      
      // Notify parent component of refresh
      onRefresh?.();
    } catch (error) {
      console.error('Global refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <div className={`dashboard-page ${className}`}>
      {/* Combined Dashboard Content - Indonesia Import Flow Style */}
      <div className="relative min-h-[70vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
        <CombinedDashboard 
          className="w-full h-full"
          refreshInterval={autoRefreshInterval}
          refreshTrigger={refreshTrigger}
          chartHeight={450}
          onRefresh={handleGlobalRefresh}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
