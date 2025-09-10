import axios, { AxiosResponse } from '@/lib/axios';
import {
  DocumentSummaryResponse,
  MonthlyDocumentResponse,
  RefreshResponse,
  ImportVisualizationResponse,
} from '../types/dashboard';

// Base API URL
const API_BASE = '/api';

// API client configuration
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 seconds timeout
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Add request interceptor to include CSRF token if available
apiClient.interceptors.request.use((config) => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (token) {
    config.headers['X-CSRF-TOKEN'] = token;
  }
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Fetch document summary data
 */
export const fetchDocumentSummary = async (): Promise<DocumentSummaryResponse> => {
  try {
    const response: AxiosResponse<DocumentSummaryResponse> = await apiClient.get('/document-summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching document summary:', error);
    throw new Error('Failed to fetch document summary data');
  }
};

/**
 * Fetch monthly document data
 */
export const fetchMonthlyDocuments = async (): Promise<MonthlyDocumentResponse> => {
  try {
    const response: AxiosResponse<MonthlyDocumentResponse> = await apiClient.get('/monthly-documents');
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly documents:', error);
    throw new Error('Failed to fetch monthly document data');
  }
};

/**
 * Refresh document summary materialized view
 */
export const refreshDocumentSummaryView = async (): Promise<RefreshResponse> => {
  try {
    const response: AxiosResponse<RefreshResponse> = await apiClient.post('/refresh-bc20-jumlahdok');
    return response.data;
  } catch (error) {
    console.error('Error refreshing document summary view:', error);
    throw new Error('Failed to refresh document summary view');
  }
};

/**
 * Refresh monthly documents materialized view
 */
export const refreshMonthlyDocumentsView = async (): Promise<RefreshResponse> => {
  try {
    const response: AxiosResponse<RefreshResponse> = await apiClient.post('/refresh-bc20-jumlahdok-bulan');
    return response.data;
  } catch (error) {
    console.error('Error refreshing monthly documents view:', error);
    throw new Error('Failed to refresh monthly documents view');
  }
};


/**
 * Fetch import visualization data
 */
export const fetchImportVisualization = async (): Promise<ImportVisualizationResponse> => {
  try {
    const response: AxiosResponse<ImportVisualizationResponse> = await apiClient.get('/import-visualization');
    return response.data;
  } catch (error) {
    console.error('Error fetching import visualization:', error);
    throw new Error('Failed to fetch import visualization data');
  }
};

/**
 * Refresh import visualization materialized view
 */
export const refreshImportVisualizationView = async (): Promise<RefreshResponse> => {
  try {
    const response: AxiosResponse<RefreshResponse> = await apiClient.post('/refresh-import-visualization');
    return response.data;
  } catch (error) {
    console.error('Error refreshing import visualization view:', error);
    throw new Error('Failed to refresh import visualization view');
  }
};

/**
 * Refresh all dashboard materialized views (includes document summary, monthly docs, and import visualization)
 */
export const refreshAllViews = async (): Promise<RefreshResponse> => {
  try {
    const response: AxiosResponse<RefreshResponse> = await apiClient.post('/refresh-all-dashboard-views');
    return response.data;
  } catch (error) {
    console.error('Error refreshing all views:', error);
    throw new Error('Failed to refresh all dashboard views');
  }
};

/**
 * Format numbers with thousands separator
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Format month string for display
 */
export const formatMonthDisplay = (monthString: string): string => {
  try {
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  } catch (error) {
    return monthString;
  }
};
