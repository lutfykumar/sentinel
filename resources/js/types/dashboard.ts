// Types for Document Summary Dashboard
export interface DocumentSummaryData {
  kodejalur: string;
  count: number;
}

export interface DocumentSummaryStats {
  total: number;
  green: number;
  red: number;
}

export interface DocumentSummaryResponse {
  data: DocumentSummaryData[];
  stats: DocumentSummaryStats;
  success: boolean;
  message?: string;
}

// Types for Monthly Document Chart
export interface MonthlyDocumentData {
  month: string;
  count: number;
  formatted_month?: string;
}

export interface MonthlyDocumentResponse {
  data: MonthlyDocumentData[];
  success: boolean;
  message?: string;
}

// Types for Import Visualization
export interface ImportData {
  country_code: string;
  count: number;
  country_name: string;
}

export interface ImportVisualizationResponse {
  success: boolean;
  data: ImportData[];
  top_countries: ImportData[];
  total_countries: number;
  total_imports: number;
  message?: string;
}

export interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  strokeWidth: number;
  country_code: string;
  country_name: string;
  count: number;
}

// Types for API responses
export interface RefreshResponse {
  success: boolean;
  message: string;
  view_name?: string;
  duration_seconds?: number;
  timestamp?: string;
}

// Component Props Types
export interface DocumentSummaryCardsProps {
  className?: string;
  refreshInterval?: number; // in milliseconds
  refreshTrigger?: number; // external trigger for refresh
  hideRefreshButton?: boolean;
  hideLastUpdated?: boolean;
}

export interface MonthlyDocumentChartProps {
  className?: string;
  refreshInterval?: number; // in milliseconds
  chartHeight?: number;
  refreshTrigger?: number; // external trigger for refresh
  hideRefreshButton?: boolean;
  hideLastUpdated?: boolean;
}

// Loading and Error States
export interface ComponentState {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Chart Configuration Types
export interface ChartColors {
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
}

export interface ChartTooltipPayload {
  value: number;
  payload: MonthlyDocumentData;
  name: string;
  color: string;
}
