import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MonthlyDocumentChart from '../MonthlyDocumentChart';
import * as dashboardApi from '../../../utils/dashboardApi';

// Mock the API functions
jest.mock('../../../utils/dashboardApi', () => ({
  fetchMonthlyDocuments: jest.fn(),
  refreshMonthlyDocumentsView: jest.fn(),
  formatNumber: jest.fn((num: number) => num.toLocaleString()),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  RefreshCcw: ({ className, ...props }: any) => <div data-testid="refresh-icon" className={className} {...props} />,
  TrendingUp: ({ className, ...props }: any) => <div data-testid="trending-icon" className={className} {...props} />,
  AlertCircle: ({ className, ...props }: any) => <div data-testid="alert-icon" className={className} {...props} />,
  Loader2: ({ className, ...props }: any) => <div data-testid="loader-icon" className={className} {...props} />,
}));

// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children, width, height, ...props }: any) => (
    <div data-testid="responsive-container" style={{ width, height }} {...props}>
      {children}
    </div>
  ),
  BarChart: ({ children, data, ...props }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} {...props}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, name, fill, ...props }: any) => (
    <div data-testid="bar" data-key={dataKey} data-name={name} data-fill={fill} {...props} />
  ),
  XAxis: ({ dataKey, ...props }: any) => (
    <div data-testid="x-axis" data-key={dataKey} {...props} />
  ),
  YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: ({ content, ...props }: any) => (
    <div data-testid="tooltip" {...props}>
      {content && typeof content === 'function' && content({ active: true, payload: [{ payload: { formatted_month: 'Test', count: 100 } }] })}
    </div>
  ),
  Legend: (props: any) => <div data-testid="legend" {...props} />,
}));

const mockedFetchMonthlyDocuments = dashboardApi.fetchMonthlyDocuments as jest.MockedFunction<typeof dashboardApi.fetchMonthlyDocuments>;
const mockedRefreshMonthlyDocumentsView = dashboardApi.refreshMonthlyDocumentsView as jest.MockedFunction<typeof dashboardApi.refreshMonthlyDocumentsView>;

describe('MonthlyDocumentChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSuccessResponse = {
    success: true,
    data: [
      { month: '2025-01', count: 67566, formatted_month: 'Jan 2025' },
      { month: '2025-02', count: 56481, formatted_month: 'Feb 2025' },
      { month: '2025-03', count: 78234, formatted_month: 'Mar 2025' },
    ],
  };

  const mockEmptyResponse = {
    success: true,
    data: [],
  };

  const mockErrorResponse = {
    success: false,
    message: 'Failed to fetch chart data',
    data: [],
  };

  test('renders component with correct title and description', () => {
    mockedFetchMonthlyDocuments.mockResolvedValue(mockSuccessResponse);
    
    render(<MonthlyDocumentChart />);
    
    expect(screen.getByText('Monthly Document Trends')).toBeInTheDocument();
    expect(screen.getByText('Document volume over time')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    mockedFetchMonthlyDocuments.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<MonthlyDocumentChart />);
    
    expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  test('displays chart after successful data fetch', async () => {
    mockedFetchMonthlyDocuments.mockResolvedValue(mockSuccessResponse);
    
    render(<MonthlyDocumentChart />);
    
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  test('displays summary statistics correctly', async () => {
    mockedFetchMonthlyDocuments.mockResolvedValue(mockSuccessResponse);
    
    render(<MonthlyDocumentChart />);
    
    await waitFor(() => {
      // Total documents: 67566 + 56481 + 78234 = 202281
      expect(screen.getByText('202,281')).toBeInTheDocument();
      
      // Average per month: 202281 / 3 = 67427
      expect(screen.getByText('67,427')).toBeInTheDocument();
      
      // Peak month should be Mar 2025 (highest count)
      expect(screen.getByText('Mar 2025')).toBeInTheDocument();
      expect(screen.getByText('78,234 docs')).toBeInTheDocument();
    });

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Average/Month')).toBeInTheDocument();
    expect(screen.getByText('Peak Month')).toBeInTheDocument();
  });

  test('displays empty state when no data available', async () => {
    mockedFetchMonthlyDocuments.mockResolvedValue(mockEmptyResponse);
    
    render(<MonthlyDocumentChart />);
    
    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });
  });

  test('displays error message when fetch fails', async () => {
    mockedFetchMonthlyDocuments.mockRejectedValue(new Error('API Error'));
    
    render(<MonthlyDocumentChart />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading chart data')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  test('displays error message when API returns error response', async () => {
    mockedFetchMonthlyDocuments.mockResolvedValue(mockErrorResponse);
    
    render(<MonthlyDocumentChart />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading chart data')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch chart data')).toBeInTheDocument();
    });
  });

  test('refresh button works correctly', async () => {
    mockedFetchMonthlyDocuments.mockResolvedValue(mockSuccessResponse);
    mockedRefreshMonthlyDocumentsView.mockResolvedValue({
      success: true,
      message: 'View refreshed successfully',
      view_name: 'bc20_jumlahdok_bulan',
    });
    
    render(<MonthlyDocumentChart />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    expect(mockedRefreshMonthlyDocumentsView).toHaveBeenCalledTimes(1);
    expect(mockedFetchMonthlyDocuments).toHaveBeenCalledTimes(2); // Initial load + refresh
  });

  test('refresh button shows refreshing state', async () => {
    mockedFetchMonthlyDocuments.mockResolvedValue(mockSuccessResponse);
    mockedRefreshMonthlyDocumentsView.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<MonthlyDocumentChart />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    
    act(() => {
      fireEvent.click(refreshButton);
    });

    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    expect(refreshButton).toBeDisabled();
  });

  test('handles refresh failure gracefully', async () => {
    mockedFetchMonthlyDocuments.mockResolvedValue(mockSuccessResponse);
    mockedRefreshMonthlyDocumentsView.mockRejectedValue(new Error('Refresh failed'));
    
    render(<MonthlyDocumentChart />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Error loading chart data')).toBeInTheDocument();
      expect(screen.getByText('Refresh failed')).toBeInTheDocument();
    });
  });

  test('applies custom className prop', () => {
    mockedFetchMonthlyDocuments.mockResolvedValue(mockSuccessResponse);
    
    const { container } = render(<MonthlyDocumentChart className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('monthly-document-chart', 'custom-class');
  });

  test('uses custom chart height', async () => {
    mockedFetchMonthlyDocuments.mockResolvedValue(mockSuccessResponse);
    
    render(<MonthlyDocumentChart chartHeight={500} />);
    
    await waitFor(() => {
      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveStyle({ height: '500' });
    });
  });

  test('displays last updated timestamp', async () => {
    mockedFetchMonthlyDocuments.mockResolvedValue(mockSuccessResponse);
    
    render(<MonthlyDocumentChart />);
    
    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  test('auto-refresh functionality with interval', async () => {
    mockedFetchMonthlyDocuments.mockResolvedValue(mockSuccessResponse);
    
    jest.useFakeTimers();
    
    render(<MonthlyDocumentChart refreshInterval={1000} />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(mockedFetchMonthlyDocuments).toHaveBeenCalledTimes(1);
    });

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockedFetchMonthlyDocuments).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  test('chart tooltip renders correctly', async () => {
    mockedFetchMonthlyDocuments.mockResolvedValue(mockSuccessResponse);
    
    render(<MonthlyDocumentChart />);
    
    await waitFor(() => {
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  test('does not show summary stats when loading', () => {
    mockedFetchMonthlyDocuments.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<MonthlyDocumentChart />);
    
    expect(screen.queryByText('Total')).not.toBeInTheDocument();
    expect(screen.queryByText('Average/Month')).not.toBeInTheDocument();
    expect(screen.queryByText('Peak Month')).not.toBeInTheDocument();
  });

  test('does not show summary stats when error occurs', async () => {
    mockedFetchMonthlyDocuments.mockRejectedValue(new Error('API Error'));
    
    render(<MonthlyDocumentChart />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading chart data')).toBeInTheDocument();
    });

    expect(screen.queryByText('Total')).not.toBeInTheDocument();
    expect(screen.queryByText('Average/Month')).not.toBeInTheDocument();
    expect(screen.queryByText('Peak Month')).not.toBeInTheDocument();
  });
});
