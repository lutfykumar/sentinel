import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentSummaryCards from '../DocumentSummaryCards';
import * as dashboardApi from '../../../utils/dashboardApi';

// Mock the API functions
jest.mock('../../../utils/dashboardApi', () => ({
  fetchDocumentSummary: jest.fn(),
  refreshDocumentSummaryView: jest.fn(),
  formatNumber: jest.fn((num: number) => num.toLocaleString()),
  calculatePercentage: jest.fn((value: number, total: number) => 
    total === 0 ? 0 : Math.round((value / total) * 100)
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  RefreshCcw: ({ className, ...props }: any) => <div data-testid="refresh-icon" className={className} {...props} />,
  FileText: ({ className, ...props }: any) => <div data-testid="file-icon" className={className} {...props} />,
  CheckCircle: ({ className, ...props }: any) => <div data-testid="check-icon" className={className} {...props} />,
  AlertCircle: ({ className, ...props }: any) => <div data-testid="alert-icon" className={className} {...props} />,
  Loader2: ({ className, ...props }: any) => <div data-testid="loader-icon" className={className} {...props} />,
}));

const mockedFetchDocumentSummary = dashboardApi.fetchDocumentSummary as jest.MockedFunction<typeof dashboardApi.fetchDocumentSummary>;
const mockedRefreshDocumentSummaryView = dashboardApi.refreshDocumentSummaryView as jest.MockedFunction<typeof dashboardApi.refreshDocumentSummaryView>;

describe('DocumentSummaryCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSuccessResponse = {
    success: true,
    data: [
      { kodejalur: 'H', count: 508232 },
      { kodejalur: 'M', count: 37648 },
    ],
    stats: {
      total: 545880,
      green: 508232,
      red: 37648,
    },
  };

  const mockErrorResponse = {
    success: false,
    message: 'Failed to fetch data',
    data: [],
    stats: {
      total: 0,
      green: 0,
      red: 0,
    },
  };

  test('renders component with correct title and description', () => {
    mockedFetchDocumentSummary.mockResolvedValue(mockSuccessResponse);
    
    render(<DocumentSummaryCards />);
    
    expect(screen.getByText('Document Summary')).toBeInTheDocument();
    expect(screen.getByText('Overview of customs documents by status')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    mockedFetchDocumentSummary.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<DocumentSummaryCards />);
    
    expect(screen.getAllByTestId('loader-icon')).toHaveLength(3);
  });

  test('displays data correctly after successful fetch', async () => {
    mockedFetchDocumentSummary.mockResolvedValue(mockSuccessResponse);
    
    render(<DocumentSummaryCards />);
    
    await waitFor(() => {
      expect(screen.getByText('545,880')).toBeInTheDocument(); // Total documents
      expect(screen.getByText('508,232')).toBeInTheDocument(); // Green documents
      expect(screen.getByText('37,648')).toBeInTheDocument(); // Red documents
    });

    expect(screen.getByText('Total Documents')).toBeInTheDocument();
    expect(screen.getByText('Green Documents')).toBeInTheDocument();
    expect(screen.getByText('Red Documents')).toBeInTheDocument();
    expect(screen.getByText('Jalur Hijau (H)')).toBeInTheDocument();
    expect(screen.getByText('Jalur Merah (M)')).toBeInTheDocument();
  });

  test('displays error message when fetch fails', async () => {
    mockedFetchDocumentSummary.mockRejectedValue(new Error('API Error'));
    
    render(<DocumentSummaryCards />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading data')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  test('displays error message when API returns error response', async () => {
    mockedFetchDocumentSummary.mockResolvedValue(mockErrorResponse);
    
    render(<DocumentSummaryCards />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading data')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
    });
  });

  test('refresh button works correctly', async () => {
    mockedFetchDocumentSummary.mockResolvedValue(mockSuccessResponse);
    mockedRefreshDocumentSummaryView.mockResolvedValue({
      success: true,
      message: 'View refreshed successfully',
      view_name: 'bc20_jumlahdok',
    });
    
    render(<DocumentSummaryCards />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('545,880')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    expect(mockedRefreshDocumentSummaryView).toHaveBeenCalledTimes(1);
    expect(mockedFetchDocumentSummary).toHaveBeenCalledTimes(2); // Initial load + refresh
  });

  test('refresh button shows refreshing state', async () => {
    mockedFetchDocumentSummary.mockResolvedValue(mockSuccessResponse);
    mockedRefreshDocumentSummaryView.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<DocumentSummaryCards />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('545,880')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    
    act(() => {
      fireEvent.click(refreshButton);
    });

    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    expect(refreshButton).toBeDisabled();
  });

  test('handles refresh failure gracefully', async () => {
    mockedFetchDocumentSummary.mockResolvedValue(mockSuccessResponse);
    mockedRefreshDocumentSummaryView.mockRejectedValue(new Error('Refresh failed'));
    
    render(<DocumentSummaryCards />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('545,880')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Error loading data')).toBeInTheDocument();
      expect(screen.getByText('Refresh failed')).toBeInTheDocument();
    });
  });

  test('calculates percentages correctly', async () => {
    mockedFetchDocumentSummary.mockResolvedValue(mockSuccessResponse);
    
    render(<DocumentSummaryCards />);
    
    await waitFor(() => {
      expect(screen.getByText('93%')).toBeInTheDocument(); // Green percentage
      expect(screen.getByText('7%')).toBeInTheDocument(); // Red percentage
    });
  });

  test('applies custom className prop', () => {
    mockedFetchDocumentSummary.mockResolvedValue(mockSuccessResponse);
    
    const { container } = render(<DocumentSummaryCards className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('document-summary-cards', 'custom-class');
  });

  test('displays last updated timestamp', async () => {
    mockedFetchDocumentSummary.mockResolvedValue(mockSuccessResponse);
    
    render(<DocumentSummaryCards />);
    
    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  test('auto-refresh functionality with interval', async () => {
    mockedFetchDocumentSummary.mockResolvedValue(mockSuccessResponse);
    
    jest.useFakeTimers();
    
    render(<DocumentSummaryCards refreshInterval={1000} />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(mockedFetchDocumentSummary).toHaveBeenCalledTimes(1);
    });

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockedFetchDocumentSummary).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });
});
