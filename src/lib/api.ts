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

const PROCESS_ID_REGEX = /(proc_[A-Za-z0-9_-]+)/i;

function extractProcessIdFromText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (!text) return undefined;

  const match = text.match(PROCESS_ID_REGEX);
  return match?.[1];
}

function normalizeErrorText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const text = value.trim();
    return text.length > 0 ? text : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => normalizeErrorText(item))
      .filter((item): item is string => Boolean(item));
    return parts.length > 0 ? parts.join(' | ') : undefined;
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const msg = normalizeErrorText(obj.message);
    const remediation = normalizeErrorText(obj.remediation);

    if (msg && remediation) {
      return `${msg} ${remediation}`;
    }

    const nested =
      normalizeErrorText(obj.detail) ||
      msg ||
      normalizeErrorText(obj.error) ||
      normalizeErrorText(obj.msg);

    if (nested) return nested;

    try {
      return JSON.stringify(value);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export interface GenericReportResponse {
  report: string;
  data: Record<string, any>;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | string;
  database?: 'connected' | 'disconnected' | string;
  environment?: string;
}

export interface RootStatusResponse {
  message: string;
  status: string;
}

export interface CompanySettingsRequest {
  nombre?: string;
  ciudad?: string;
  codigo_ciiu?: string;
  iva_responsable: boolean;
  tasa_retefuente_servicios: number;
  tasa_retefuente_bienes: number;
  tasa_retefuente_arrendamiento: number;
  tasa_reteica: number;
  tasa_iva_general: number;
}

export interface CompanyProfileSetupRequest {
  nombre?: string;
  ciudad: string;
  codigo_ciiu: string;
  iva_responsable: boolean;
}

export interface CompanySettingsResponse extends CompanySettingsRequest {
  nit: string;
  created_at?: string;
  updated_at?: string;
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
    const responseData = error.response?.data as unknown;
    const responseObj =
      responseData && typeof responseData === 'object'
        ? (responseData as Record<string, unknown>)
        : undefined;

    const customError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status,
    };

    if (error.response) {
      // Server responded with error status
      customError.message =
        normalizeErrorText(responseObj?.message) ||
        normalizeErrorText(responseObj?.detail) ||
        error.message ||
        'Request failed';
      customError.detail = normalizeErrorText(responseObj?.detail);
    } else if (error.request) {
      // Request was made but no response received
      customError.message = 'No response from server. Please check your connection.';
    } else {
      // Error in request setup
      customError.message = error.message;
    }

    // Reject as an Error instance so downstream `instanceof Error` checks work.
    const enrichedError = Object.assign(new Error(customError.message), customError);
    return Promise.reject(enrichedError);
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
): Promise<ProcessResponse> => {
  try {
    const response = await apiClient.post<ProcessResponse>(
      `/api/v1/process/accounting/${ingestId}`
    );
    return response.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;

    // Some deployed backend versions return 409 with a text payload even when a
    // process already exists. Recover process_id from the message and continue.
    if (apiError?.status === 409) {
      const processId =
        extractProcessIdFromText(apiError.detail) ||
        extractProcessIdFromText(apiError.message);

      if (processId) {
        return {
          message: apiError.detail || apiError.message || 'Proceso ya existente recuperado',
          process_id: processId,
          status: 'RUNNING',
        };
      }

      throw Object.assign(new Error(apiError.detail || apiError.message || 'Conflicto al iniciar el proceso.'), {
        ...apiError,
      });
    }

    throw error;
  }
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
  const response = await apiClient.get<BalanceSheet | GenericReportResponse>('/api/v1/reports/balance');
  const payload = response.data as any;

  if (payload?.assets && payload?.liabilities && payload?.equity) {
    return payload as BalanceSheet;
  }

  const data = payload?.data || {};
  return {
    assets: {
      current: data.assets?.current || {},
      non_current: data.assets?.non_current || {},
      total: Number(data.assets?.total || 0),
    },
    liabilities: {
      current: data.liabilities?.current || {},
      non_current: data.liabilities?.non_current || {},
      total: Number(data.liabilities?.total || 0),
    },
    equity: {
      items: data.equity?.items || {},
      total: Number(data.equity?.total || 0),
    },
    period: data.period,
  };
};

/**
 * GET /api/v1/reports/pnl
 * Retrieves the profit and loss statement
 */
export const getProfitAndLoss = async (): Promise<ProfitAndLoss> => {
  const response = await apiClient.get<ProfitAndLoss | GenericReportResponse>('/api/v1/reports/pnl');
  const payload = response.data as any;

  if (payload?.revenue && payload?.expenses) {
    return payload as ProfitAndLoss;
  }

  const data = payload?.data || {};
  return {
    revenue: data.revenue || {},
    expenses: data.expenses || {},
    gross_profit: Number(data.gross_profit || 0),
    operating_profit: Number(data.operating_profit || 0),
    net_profit: Number(data.net_profit || 0),
    period: data.period,
  };
};

/**
 * GET /api/v1/reports/cashflow
 * Retrieves the cash flow statement
 */
export const getCashFlow = async (): Promise<CashFlow> => {
  const response = await apiClient.get<CashFlow | GenericReportResponse>('/api/v1/reports/cashflow');
  const payload = response.data as any;

  if (payload?.operating_activities && payload?.investing_activities && payload?.financing_activities) {
    return payload as CashFlow;
  }

  const data = payload?.data || {};
  return {
    operating_activities: data.operating_activities || {},
    investing_activities: data.investing_activities || {},
    financing_activities: data.financing_activities || {},
    net_cash_flow: Number(data.net_cash_flow || 0),
    period: data.period,
  };
};

/**
 * GET /api/v1/tax/iva
 * Retrieves the IVA (VAT) report
 */
export const getIVA = async (): Promise<IVAReport> => {
  const response = await apiClient.get<IVAReport | GenericReportResponse>('/api/v1/tax/iva');
  const payload = response.data as any;

  if (typeof payload?.vat_collected === 'number') {
    return payload as IVAReport;
  }

  const data = payload?.data || {};
  return {
    period: String(data.period || ''),
    vat_collected: Number(data.vat_collected || 0),
    vat_paid: Number(data.vat_paid || 0),
    vat_balance: Number(data.vat_balance || 0),
    details: data.details || {},
  };
};

/**
 * GET /api/v1/tax/withholdings
 * Retrieves the withholdings report
 */
export const getWithholdings = async (): Promise<WithholdingsReport> => {
  const response = await apiClient.get<WithholdingsReport | GenericReportResponse>('/api/v1/tax/withholdings');
  const payload = response.data as any;

  if (typeof payload?.total_withholdings === 'number') {
    return payload as WithholdingsReport;
  }

  const data = payload?.data || {};
  return {
    period: String(data.period || ''),
    total_withholdings: Number(data.total_withholdings || 0),
    by_type: data.by_type || {},
    details: Array.isArray(data.details) ? data.details : [],
  };
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
  ingest_id?: string;
}

export interface TransactionDetailResponse {
  id: string;
  fecha: string;
  concepto: string;
  total: number;
  status: string;
  nit_emisor: string;
  items?: Array<Record<string, any>> | null;
  raw_data?: Record<string, any> | null;
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
export const getTransactionDetail = async (id: string): Promise<TransactionDetailResponse> => {
  const response = await apiClient.get<TransactionDetailResponse>(`/api/v1/transactions/${id}`);
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
  tipo: 'diario' | 'mayor' | 'auxiliar' | 'balance';
  fecha_inicio?: string;
  fecha_fin?: string;
  cuenta_puc?: string;
  tercero_nit?: string;
}

export interface LibroDiarioLine {
  fecha: string;
  comprobante: string;
  cuenta: string;
  descripcion: string;
  debito: number;
  credito: number;
}

export interface LibroMayorEntry {
  cuenta_puc: string;
  cuenta_nombre: string;
  saldo_inicial: number;
  total_debitos: number;
  total_creditos: number;
  saldo_final: number;
}

export interface LibroAuxiliarLine {
  fecha: string;
  comprobante: string;
  tercero_nit: string;
  descripcion: string;
  debito: number;
  credito: number;
}

export interface BalanceGeneralEntry {
  cuenta_puc: string;
  cuenta_nombre: string;
  saldo: number;
}

/**
 * GET /api/v1/books?tipo=diario
 * Retrieves the Libro Diario (journal) entries
 */
export const getLibroDiario = async (
  fecha_inicio?: string,
  fecha_fin?: string
): Promise<LibroDiarioLine[]> => {
  const response = await apiClient.get<LibroDiarioLine[]>('/api/v1/books/', {
    params: { tipo: 'diario', fecha_inicio, fecha_fin },
  });
  return response.data;
};

/**
 * GET /api/v1/books?tipo=mayor
 * Retrieves the Libro Mayor (ledger) summary per account
 */
export const getLibroMayor = async (
  fecha_inicio?: string,
  fecha_fin?: string
): Promise<LibroMayorEntry[]> => {
  const response = await apiClient.get<LibroMayorEntry[]>('/api/v1/books/', {
    params: { tipo: 'mayor', fecha_inicio, fecha_fin },
  });
  return response.data;
};

/**
 * GET /api/v1/books?tipo=auxiliar
 * Retrieves the Libro Auxiliar for a specific PUC account
 * @param cuenta_puc - Required PUC account code
 */
export const getLibroAuxiliar = async (
  cuenta_puc: string,
  fecha_inicio?: string,
  fecha_fin?: string
): Promise<LibroAuxiliarLine[]> => {
  const response = await apiClient.get<LibroAuxiliarLine[]>('/api/v1/books/', {
    params: { tipo: 'auxiliar', cuenta_puc, fecha_inicio, fecha_fin },
  });
  return response.data;
};

/**
 * GET /api/v1/books?tipo=balance
 * Retrieves the Balance General (trial balance) as of a given date
 */
export const getBalanceGeneral = async (
  fecha_fin?: string
): Promise<BalanceGeneralEntry[]> => {
  const response = await apiClient.get<BalanceGeneralEntry[]>('/api/v1/books/', {
    params: { tipo: 'balance', fecha_fin },
  });
  return response.data;
};

/**
 * GET /api/v1/books
 * Generic books query — prefer the typed helpers above when possible
 */
export const getBooks = async (params: BookQueryParams): Promise<any[]> => {
  const response = await apiClient.get('/api/v1/books/', { params });
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

/**
 * GET /
 * Retrieves API root status
 */
export const getApiRootStatus = async (): Promise<RootStatusResponse> => {
  const response = await apiClient.get<RootStatusResponse>('/');
  return response.data;
};

/**
 * GET /health
 * Retrieves backend health status
 */
export const getHealthStatus = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
};

// ============================================================================
// Settings
// ============================================================================

/**
 * GET /api/v1/settings/company/{nit}
 * Retrieves tax settings for a company
 */
export const getCompanySettings = async (
  nit: string
): Promise<CompanySettingsResponse | null> => {
  try {
    const response = await apiClient.get<CompanySettingsResponse>(
      `/api/v1/settings/company/${nit}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * PUT /api/v1/settings/company/{nit}
 * Creates or replaces company tax settings manually
 */
export const upsertCompanySettings = async (
  nit: string,
  payload: CompanySettingsRequest
): Promise<CompanySettingsResponse> => {
  const response = await apiClient.put<CompanySettingsResponse>(
    `/api/v1/settings/company/${nit}`,
    payload
  );
  return response.data;
};

/**
 * POST /api/v1/settings/company/{nit}/setup
 * Auto-computes company tax settings from profile (city/CIIU/IVA)
 */
export const setupCompanySettings = async (
  nit: string,
  payload: CompanyProfileSetupRequest
): Promise<CompanySettingsResponse> => {
  const response = await apiClient.post<CompanySettingsResponse>(
    `/api/v1/settings/company/${nit}/setup`,
    payload
  );
  return response.data;
};

// ============================================================================
// Export the configured axios instance for advanced usage
// ============================================================================

export default apiClient;
