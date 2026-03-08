import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

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

export interface SchemaComplianceMetrics {
  overall_compliance_rate: number;
  per_agent_compliance_rate: Record<string, number>;
  total_validations: number;
  total_passed: number;
  total_failed: number;
  per_agent_detail: Record<string, {
    passed: number;
    failed: number;
    total: number;
    rate: number;
  }>;
}

export interface RAGStatusResponse {
  status: 'ready' | 'empty' | 'unavailable';
  normativa_collection: {
    name: string;
    document_count: number;
  };
  empresa_collections: Array<{
    name: string;
    document_count: number;
  }>;
  total_collections: number;
}

export interface UploadResponse {
  ingest_id: string;
  file_name: string;
  message: string;
  status: string;
  extracted_transactions?: number;
  created_at?: string;
  raw_preview?: Record<string, any> | null;
}

export interface RawTransaction {
  fecha: string;
  nit_emisor: string;
  nit_receptor: string;
  total: number;
  descripcion?: string;
  items?: Array<Record<string, any>>;
}

export interface IngestDetailResponse {
  ingest_id: string;
  file_name: string;
  status: string;
  created_at?: string;
  completed_at?: string;
  extraction_errors?: string[];
  raw_transactions: RawTransaction[];
}

export interface AccountingResponse {
  ingest_id: string;
  status: string;
  message: string;
  data?: any;
}

export interface ProcessResponse {
  message: string;
  process_id: string;
  status: string;
}

export interface ProcessStatusResponse {
  process_id: string;
  status: string;
  current_stage?: string;
  current_agent?: string;
  progress?: number;
  error_message?: string;
  agent_log?: Array<{
    timestamp: string;
    agent: string;
    stage: string;
    event?: string;
    message: string;
    [key: string]: any;
  }>;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface ProcessResultResponse {
  process_id: string;
  ingest_id: string;
  status: string;
  transactions: Array<{
    id: string;
    fecha: string;
    descripcion: string;
    total: number;
    nit_emisor?: string;
    items: Array<{
      cuenta_puc: string;
      cuenta_nombre: string;
      debito: number;
      credito: number;
      tercero_nit?: string;
    }>;
  }>;
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
  (response: AxiosResponse) => response,
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
 * GET /api/v1/evaluation/schema-compliance
 * Retrieves detailed schema compliance metrics with per-agent breakdown
 */
export const getSchemaCompliance = async (): Promise<SchemaComplianceMetrics> => {
  const response = await apiClient.get<SchemaComplianceMetrics>(
    '/api/v1/evaluation/schema-compliance'
  );
  return response.data;
};

/**
 * POST /api/v1/evaluation/reset-metrics
 * Resets all validation metrics (for testing purposes)
 */
export const resetMetrics = async (): Promise<{ status: string }> => {
  const response = await apiClient.post<{ status: string }>(
    '/api/v1/evaluation/reset-metrics'
  );
  return response.data;
};

/**
 * GET /api/v1/evaluation/rag-status
 * Retrieves the status of all ChromaDB vector collections
 */
export const getRagStatus = async (): Promise<RAGStatusResponse> => {
  const response = await apiClient.get<RAGStatusResponse>(
    '/api/v1/evaluation/rag-status'
  );
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
 * GET /api/v1/ingest/{ingest_id}
 * Retrieves detailed information about a specific ingest job
 * @param ingestId - The ingest ID to retrieve
 */
export const getIngestDetail = async (
  ingestId: string
): Promise<IngestDetailResponse> => {
  const response = await apiClient.get<IngestDetailResponse>(
    `/api/v1/ingest/${ingestId}`
  );
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
 * GET /api/v1/process/status/{process_id}
 * Polls the status of an asynchronous processing job
 * @param processId - The process ID to check
 */
export const getProcessStatus = async (
  processId: string
): Promise<ProcessStatusResponse> => {
  const response = await apiClient.get<ProcessStatusResponse>(
    `/api/v1/process/status/${processId}`
  );
  return response.data;
};

/**
 * GET /api/v1/process/result/{process_id}
 * Retrieves the final processed transactions for a completed process job
 * @param processId - The process ID to get results for
 */
export const getProcessResult = async (
  processId: string
): Promise<ProcessResultResponse> => {
  const response = await apiClient.get<ProcessResultResponse>(
    `/api/v1/process/result/${processId}`
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

export interface TransactionSearchParams {
  nit?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  status?: string;
  limit?: number;
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

/**
 * GET /api/v1/transactions/search
 * Searches transactions with multiple filters
 * @param params - Search filters (nit, fecha_inicio, fecha_fin, status, limit)
 */
export const searchTransactions = async (
  params: TransactionSearchParams
): Promise<TransactionListItem[]> => {
  const response = await apiClient.get<TransactionListItem[]>(
    '/api/v1/transactions/search',
    { params }
  );
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
