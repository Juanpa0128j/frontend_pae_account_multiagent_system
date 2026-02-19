import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

export interface RunResponse {
  status: string;
  metrics: {
    schema_compliance: number;
    double_entry_integrity: number;
  };
}

export interface UploadResponse {
  ingest_id: string;
  filename: string;
  message: string;
}

export interface AccountingResponse {
  ingest_id: string;
  status: string;
  message: string;
  data?: any;
}

export interface BalanceSheet {
  assets: {
    current: Record<string, number>;
    non_current: Record<string, number>;
    total: number;
  };
  liabilities: {
    current: Record<string, number>;
    non_current: Record<string, number>;
    total: number;
  };
  equity: {
    items: Record<string, number>;
    total: number;
  };
  period?: string;
}

export interface ProfitAndLoss {
  revenue: Record<string, number>;
  expenses: Record<string, number>;
  gross_profit: number;
  operating_profit: number;
  net_profit: number;
  period?: string;
}

export interface CashFlow {
  operating_activities: Record<string, number>;
  investing_activities: Record<string, number>;
  financing_activities: Record<string, number>;
  net_cash_flow: number;
  period?: string;
}

export interface IVAReport {
  period: string;
  vat_collected: number;
  vat_paid: number;
  vat_balance: number;
  details?: Record<string, any>;
}

export interface WithholdingsReport {
  period: string;
  total_withholdings: number;
  by_type: Record<string, number>;
  details?: Array<{
    date: string;
    type: string;
    amount: number;
    description?: string;
  }>;
}

export interface ApiError {
  message: string;
  status?: number;
  detail?: string;
}

// ============================================================================
// Axios Instance Configuration
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// ============================================================================
// Response Interceptor for Error Handling
// ============================================================================

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const customError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status,
    };

    if (error.response) {
      // Server responded with error status
      customError.message = error.response.data?.message || error.message;
      customError.detail = error.response.data?.detail;
    } else if (error.request) {
      // Request was made but no response received
      customError.message = 'No response from server. Please check your connection.';
    } else {
      // Error in request setup
      customError.message = error.message;
    }

    return Promise.reject(customError);
  }
);

// ============================================================================
// API Functions
// ============================================================================

/**
 * GET /api/v1/evaluation/run
 * Triggers the evaluation pipeline
 */
export const getRun = async (): Promise<RunResponse> => {
  const response = await apiClient.get<RunResponse>('/api/v1/evaluation/run');
  return response.data;
};

/**
 * POST /api/v1/ingest/upload
 * Uploads a PDF file
 * @param file - PDF file to upload
 * @param onUploadProgress - Optional callback for upload progress
 */
export const uploadFile = async (
  file: File,
  onUploadProgress?: (progressEvent: any) => void
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadResponse>('/api/v1/ingest/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });

  return response.data;
};

/**
 * POST /api/v1/process/accounting/{ingest_id}
 * Processes accounting data for a specific ingest
 * @param ingestId - The ingest ID to process
 */
export const processAccounting = async (
  ingestId: string
): Promise<AccountingResponse> => {
  const response = await apiClient.post<AccountingResponse>(
    `/api/v1/process/accounting/${ingestId}`
  );
  return response.data;
};

/**
 * GET /api/v1/reports/balance
 * Retrieves the balance sheet
 */
export const getBalance = async (): Promise<BalanceSheet> => {
  const response = await apiClient.get<BalanceSheet>('/api/v1/reports/balance');
  return response.data;
};

/**
 * GET /api/v1/reports/pnl
 * Retrieves the profit and loss statement
 */
export const getProfitAndLoss = async (): Promise<ProfitAndLoss> => {
  const response = await apiClient.get<ProfitAndLoss>('/api/v1/reports/pnl');
  return response.data;
};

/**
 * GET /api/v1/reports/cashflow
 * Retrieves the cash flow statement
 */
export const getCashFlow = async (): Promise<CashFlow> => {
  const response = await apiClient.get<CashFlow>('/api/v1/reports/cashflow');
  return response.data;
};

/**
 * GET /api/v1/tax/iva
 * Retrieves the IVA (VAT) report
 */
export const getIVA = async (): Promise<IVAReport> => {
  const response = await apiClient.get<IVAReport>('/api/v1/tax/iva');
  return response.data;
};

/**
 * GET /api/v1/tax/withholdings
 * Retrieves the withholdings report
 */
export const getWithholdings = async (): Promise<WithholdingsReport> => {
  const response = await apiClient.get<WithholdingsReport>('/api/v1/tax/withholdings');
  return response.data;
};

// ============================================================================
// Transactions
// ============================================================================

export interface TransactionListItem {
  id: string;
  fecha: string;
  concepto: string;
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'POSTED' | 'REJECTED';
  nit_emisor: string;
}

/**
 * GET /api/v1/transactions
 * Lists transactions, optionally filtered by status
 */
export const getTransactions = async (
  status?: string
): Promise<TransactionListItem[]> => {
  const response = await apiClient.get<TransactionListItem[]>('/api/v1/transactions', {
    params: status ? { status } : undefined,
  });
  return response.data;
};

/**
 * GET /api/v1/transactions/{id}
 * Retrieves full detail for a single transaction
 */
export const getTransactionDetail = async (id: string): Promise<any> => {
  const response = await apiClient.get(`/api/v1/transactions/${id}`);
  return response.data;
};

// ============================================================================
// Books (Libros Contables)
// ============================================================================

export interface BookQueryParams {
  tipo: 'diario' | 'mayor' | 'auxiliar';
  fecha_inicio?: string;
  fecha_fin?: string;
  cuenta_puc?: string;
  tercero_nit?: string;
}

/**
 * GET /api/v1/books
 * Queries the accounting books with optional filters
 */
export const getBooks = async (params: BookQueryParams): Promise<any[]> => {
  const response = await apiClient.get('/api/v1/books', { params });
  return response.data;
};

// ============================================================================
// Dashboard
// ============================================================================

export interface DashboardStatsResponse {
  documentos_pendientes: number;
  transacciones_procesadas_mes: number;
  alertas_activas: number;
  total_activos_cop: number;
}

/**
 * GET /api/v1/dashboard/stats
 * Retrieves the aggregated dashboard counters
 */
export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const response = await apiClient.get<DashboardStatsResponse>('/api/v1/dashboard/stats');
  return response.data;
};

// ============================================================================
// Export the configured axios instance for advanced usage
// ============================================================================

export default apiClient;
