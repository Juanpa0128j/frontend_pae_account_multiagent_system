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
  error_message?: string;
  error_category?: string;
  error_code?: string;
  remediation?: string;
  has_warnings?: boolean;
  trace_url?: string | null;
  created_at?: string;
  completed_at?: string;
  extraction_errors?: string[];
  raw_transactions: RawTransaction[];
  document_type?: string;
  pathway?: string;
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
  error_category?: string;
  error_code?: string;
  remediation?: string;
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
  has_warnings?: boolean;
  trace_url?: string | null;
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
  error_message?: string;
  error_category?: string;
  error_code?: string;
  remediation?: string;
}

export interface AuditFinding {
  target: string;
  rule_id: string;
  severity: 'info' | 'warning' | 'error' | 'blocker' | string;
  fixable: boolean;
  responsible_agent: string;
  technical_message: string;
  user_message_es: string;
  suggested_action_es?: string | null;
  evidence?: Record<string, unknown> | null;
}

export interface GiveUpRecord {
  target: string;
  attempts: number;
  last_findings: AuditFinding[];
  explanation_es: string;
}

export interface TraceStep {
  agent: string;
  status: 'ok' | 'warning' | 'failed' | 'retried' | string;
  started_at?: string | null;
  completed_at?: string | null;
  duration_ms?: number | null;
  summary_es: string;
  details_es: string[];
  findings: AuditFinding[];
}

export interface PipelineTrace {
  process_id: string;
  overall_status: 'completed' | 'completed_with_warnings' | 'failed' | string;
  steps: TraceStep[];
  blockers: AuditFinding[];
  give_up?: GiveUpRecord | null;
}

export interface ReportLineItem {
  codigo: string;
  nombre: string;
  saldo: number;
}

export interface BalanceSheet {
  period_start: string | null;
  period_end: string;
  company_nit: string | null;
  activos: number;
  pasivos: number;
  patrimonio: number;
  utilidad_neta: number;
  patrimonio_total: number;
  cuadre: boolean;
  mensaje_cuadre?: string;
}

export interface ProfitAndLoss {
  period_start: string | null;
  period_end: string;
  company_nit: string | null;
  ingresos: ReportLineItem[];
  costo_ventas: ReportLineItem[];
  gastos: ReportLineItem[];
  total_ingresos: number;
  total_costo_ventas: number;
  total_gastos: number;
  utilidad_bruta: number;
  utilidad_neta: number;
}

export interface CashFlow {
  period_start: string | null;
  period_end: string;
  company_nit: string | null;
  cuentas_efectivo: ReportLineItem[];
  total_efectivo: number;
  nota?: string;
}

export interface IVAReport {
  period_end: string;
  period_start: string | null;
  company_nit: string | null;
  iva_generado: number;
  iva_descontable: number;
  iva_a_pagar: number;
  referencias: string[];
}

export interface WithholdingsReport {
  period_end: string;
  period_start: string | null;
  company_nit: string | null;
  retencion_en_la_fuente: number;
  retencion_ica: number;
  total_retenciones: number;
  referencias: string[];
}

export interface ApiError {
  message: string;
  status?: number;
  detail?: string;
}

export interface CompanySettingsApiResponse {
  nit: string;
  nombre: string | null;
  ciudad: string | null;
  codigo_ciiu: string | null;
  iva_responsable: boolean;
  tasa_retefuente_servicios: number;
  tasa_retefuente_bienes: number;
  tasa_retefuente_arrendamiento: number;
  tasa_reteica: number;
  tasa_iva_general: number;
  tasa_ica: number;
  tasa_renta: number;
  created_at: string | null;
  updated_at: string | null;
}

export type FinancialStatementType =
  | 'balance_general'
  | 'estado_resultados'
  | 'libro_auxiliar'
  | 'libro_diario'
  | 'flujo_de_caja'
  | 'cambios_patrimonio'
  | 'notas_estados_financieros';

export type FinancialStatementSourceMode = 'direct' | 'derived' | 'derived_from_journal';

export interface FinancialStatementResponse {
  id: string;
  ingest_id: string;
  statement_type: FinancialStatementType;
  period_start: string | null;
  period_end: string;
  entity_nit: string | null;
  source_mode: FinancialStatementSourceMode;
  data: Record<string, unknown>;
  created_at: string | null;
}

export type ReportExportType = 'balance' | 'pnl' | 'cashflow';
export type ReportExportFormat = 'pdf' | 'excel';

export interface ReportExportParams {
  report_type: ReportExportType;
  format: ReportExportFormat;
  statement_id: string;
  company_name?: string;
  company_nit: string;
}

export interface ReportExportDownload {
  blob: Blob;
  filename: string;
  contentType: string;
}

export interface ICADeclaracionResponse {
  report_type: 'ica_declaracion';
  period_start: string | null;
  period_end: string;
  generated_at: string;
  ingresos_brutos: number;
  tasa_ica: number;
  ica_a_pagar: number;
  cuenta_gasto_puc: string;
  cuenta_pasivo_puc: string;
  referencias: string[];
}

export interface RentaProvisionResponse {
  report_type: 'renta_provision';
  period_start: string | null;
  period_end: string;
  generated_at: string;
  utilidad_antes_impuestos: number;
  tasa_renta: number;
  provision_renta: number;
  cuenta_gasto_puc: string;
  cuenta_pasivo_puc: string;
  referencias: string[];
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
  tasa_ica: number;
  tasa_renta: number;
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
  onUploadProgress?: (progressEvent: any) => void,
  company_nit?: string
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  if (company_nit) {
    formData.append('company_nit', company_nit);
  }

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
 * GET /api/v1/ingest/{ingest_id}/trace
 * Retrieves the structured accountant-facing ingest trace
 * @param ingestId - The ingest ID to get trace for
 */
export const getIngestTrace = async (
  ingestId: string
): Promise<PipelineTrace> => {
  const response = await apiClient.get<PipelineTrace>(
    `/api/v1/ingest/${ingestId}/trace`
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
 * GET /api/v1/process/{process_id}/trace
 * Retrieves the structured accountant-facing process trace
 * @param processId - The process ID to get trace for
 */
export const getProcessTrace = async (
  processId: string
): Promise<PipelineTrace> => {
  const response = await apiClient.get<PipelineTrace>(
    `/api/v1/process/${processId}/trace`
  );
  return response.data;
};
/**
 * GET /api/v1/reports/balance
 * Retrieves the balance sheet
 */
export const getBalance = async (company_nit?: string): Promise<BalanceSheet> => {
  const response = await apiClient.get<BalanceSheet>(
    '/api/v1/reports/balance',
    { params: company_nit ? { company_nit } : undefined }
  );
  return response.data;
};

/**
 * GET /api/v1/reports/pnl
 * Retrieves the profit and loss statement
 */
export const getProfitAndLoss = async (company_nit?: string): Promise<ProfitAndLoss> => {
  const response = await apiClient.get<ProfitAndLoss>(
    '/api/v1/reports/pnl',
    { params: company_nit ? { company_nit } : undefined }
  );
  return response.data;
};

/**
 * GET /api/v1/reports/cashflow
 * Retrieves the cash flow statement
 */
export const getCashFlow = async (company_nit?: string): Promise<CashFlow> => {
  const response = await apiClient.get<CashFlow>(
    '/api/v1/reports/cashflow',
    { params: company_nit ? { company_nit } : undefined }
  );
  return response.data;
};

/**
 * GET /api/v1/tax/iva
 * Retrieves the IVA (VAT) report
 */
export const getIVA = async (company_nit?: string): Promise<IVAReport> => {
  const response = await apiClient.get<IVAReport>(
    '/api/v1/tax/iva',
    { params: company_nit ? { company_nit } : undefined }
  );
  return response.data;
};

/**
 * GET /api/v1/tax/withholdings
 * Retrieves the withholdings report
 */
export const getWithholdings = async (company_nit?: string): Promise<WithholdingsReport> => {
  const response = await apiClient.get<WithholdingsReport>(
    '/api/v1/tax/withholdings',
    { params: company_nit ? { company_nit } : undefined }
  );
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
  status?: string,
  company_nit?: string
): Promise<TransactionListItem[]> => {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (company_nit) params.company_nit = company_nit;
  const response = await apiClient.get<TransactionListItem[]>('/api/v1/transactions', {
    params: Object.keys(params).length ? params : undefined,
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
  company_nit?: string;
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
export const getDashboardStats = async (company_nit?: string): Promise<DashboardStatsResponse> => {
  const response = await apiClient.get<DashboardStatsResponse>(
    '/api/v1/dashboard/stats',
    { params: company_nit ? { company_nit } : undefined }
  );
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

/**
 * GET /api/v1/settings/companies
 * Returns all registered companies for the company selector.
 */
export const getCompanies = async (): Promise<CompanySettingsApiResponse[]> => {
  const response = await apiClient.get<CompanySettingsApiResponse[]>(
    '/api/v1/settings/companies'
  );
  return response.data;
};

// ============================================================================
// Financial Statements (Via B pipeline)
// ============================================================================

/**
 * GET /api/v1/reports/statements
 * Lists stored financial statements. Optionally filtered by company NIT,
 * statement type, source mode, or date range.
 */
export const getStatements = async (params?: {
  company_nit?: string;
  statement_type?: string;
  source_mode?: string;
  start_date?: string;
  end_date?: string;
}): Promise<FinancialStatementResponse[]> => {
  const response = await apiClient.get<FinancialStatementResponse[]>(
    '/api/v1/reports/statements',
    { params }
  );
  return response.data;
};

/**
 * GET /api/v1/reports/statements/{statement_id}
 * Retrieves a single financial statement by ID.
 */
export const getStatement = async (
  statementId: string
): Promise<FinancialStatementResponse> => {
  const response = await apiClient.get<FinancialStatementResponse>(
    `/api/v1/reports/statements/${statementId}`
  );
  return response.data;
};

/**
 * GET /api/v1/tax/ica
 * Retrieves the ICA municipal declaration for a company.
 */
export const getICA = async (
  company_nit: string
): Promise<ICADeclaracionResponse> => {
  const response = await apiClient.get<ICADeclaracionResponse>('/api/v1/tax/ica', {
    params: { company_nit },
  });
  return response.data;
};

/**
 * GET /api/v1/tax/renta-provision
 * Retrieves the income tax provision (35%) for a company.
 */
export const getRentaProvision = async (
  company_nit: string
): Promise<RentaProvisionResponse> => {
  const response = await apiClient.get<RentaProvisionResponse>(
    '/api/v1/tax/renta-provision',
    { params: { company_nit } }
  );
  return response.data;
};

/**
 * GET /api/v1/reports/{report_type}/download/{format}
 * Downloads report files (PDF/Excel) generated in backend export endpoints.
 */
export const downloadReportExport = async (
  params: ReportExportParams
): Promise<ReportExportDownload> => {
  const endpoint = `/api/v1/reports/${params.report_type}/download/${params.format}`;

  const response = await apiClient.get<Blob>(endpoint, {
    params: {
      statement_id: params.statement_id,
      company_name: params.company_name,
      company_nit: params.company_nit,
    },
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  const filename = extractFilenameFromContentDisposition(contentDisposition)
    ?? `${params.report_type}_${params.statement_id}.${params.format === 'excel' ? 'xlsx' : 'pdf'}`;

  return {
    blob: response.data,
    filename,
    contentType: response.headers['content-type'] ?? 'application/octet-stream',
  };
};

/**
 * GET /api/v1/reports/{statement_type}/download/{format}
 * Downloads financial statement exports (Libro Diario, Auxiliar, etc.)
 */
export const downloadStatementExport = async (
  statementType: 'libro_diario' | 'libro_auxiliar' | 'cambios_patrimonio' | 'notas_estados_financieros',
  format: ReportExportFormat,
  statementId: string,
  companyName: string = 'Empresa',
  companyNit?: string
): Promise<ReportExportDownload> => {
  const endpoint = `/api/v1/reports/${statementType}/download/${format}`;

  const response = await apiClient.get<Blob>(endpoint, {
    params: {
      statement_id: statementId,
      company_name: companyName,
      company_nit: companyNit,
    },
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  const filename = extractFilenameFromContentDisposition(contentDisposition)
    ?? `${statementType}_${statementId}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

  return {
    blob: response.data,
    filename,
    contentType: response.headers['content-type'] ?? 'application/octet-stream',
  };
};

function extractFilenameFromContentDisposition(
  contentDisposition: string | undefined
): string | null {
  if (!contentDisposition) return null;

  // RFC 5987 format: filename*=UTF-8''encoded-name.ext
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).replace(/[\"']/g, '');
    } catch {
      return utf8Match[1].replace(/[\"']/g, '');
    }
  }

  const plainMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return null;
}

// ============================================================================
// Tax Module - Declarations, Calendar, Certificates, Exogena
// ============================================================================

export type TaxFormType = 'F300' | 'F350' | 'F110' | 'ICA' | 'F260';

export interface DraftField {
  label: string;
  value: number | string;
  source: string;
  renglon: string;
  confidence: 'high' | 'medium' | 'low';
  requires_review: boolean;
}

export interface DraftWarning {
  field: string;
  message: string;
}

export interface TaxDeclarationDraft {
  draft_id: string;
  company_nit: string;
  form_type: TaxFormType;
  period_start: string;
  period_end: string;
  year: number;
  status: 'draft' | 'reviewed' | 'filed';
  fields: DraftField[];
  warnings: DraftWarning[];
  created_at: string;
  updated_at?: string;
}

export interface GenerateDraftRequest {
  company_nit: string;
  form_type: TaxFormType;
  period_start: string;
  period_end: string;
}

export interface UpdateFieldRequest {
  renglon: string;
  value: number;
}

export interface TaxCalendarObligation {
  form_type: string;
  period: string;
  period_label: string;
  deadline: string;
  days_until: number;
  alert: boolean;
}

export interface TaxCalendarResponse {
  nit: string;
  year: number;
  iva_regime: 'bimestral' | 'cuatrimestral';
  generated_at: string;
  obligations: TaxCalendarObligation[];
}

export interface F220Concepto {
  mes: string;
  pagos: number;
  retefuente: number;
  reteica: number;
}

export interface F220Retenedor {
  nit: string;
  nombre: string;
  ciudad: string;
}

export interface F220Retenido {
  nit: string;
  nombre: string;
}

export interface F220Certificate {
  retenedor: F220Retenedor;
  retenido: F220Retenido;
  year: number;
  total_pagos: number;
  total_retefuente: number;
  total_reteica: number;
  conceptos: F220Concepto[];
  requires_review: boolean;
  review_reason: string | null;
}

export interface F220Response {
  company_nit: string;
  year: number;
  total_certificates: number;
  certificates: F220Certificate[];
}

export interface ExogenaRow {
  concepto?: string;
  tipo_documento?: string;
  numero_identificacion?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  primer_nombre?: string;
  otros_nombres?: string;
  razon_social?: string;
  direccion?: string;
  codigo_dpto?: string;
  codigo_mcp?: string;
  pais_residencia?: string;
  pago_abono?: number;
  retencion_renta?: number;
  iva_descontable?: number;
  ingresos_brutos?: number;
  [key: string]: string | number | undefined;
}

export interface ExogenaResponse {
  formato: string;
  company_nit: string;
  year: number;
  total_rows: number;
  invalid_rows: number;
  rows: ExogenaRow[];
}

/**
 * POST /api/v1/tax/declarations/generate
 * Generate a pre-filled DIAN declaration draft
 */
export const generateDeclarationDraft = async (
  data: GenerateDraftRequest
): Promise<TaxDeclarationDraft> => {
  const response = await apiClient.post<TaxDeclarationDraft>(
    '/api/v1/tax/declarations/generate',
    data
  );
  return response.data;
};

/**
 * GET /api/v1/tax/declarations/{draft_id}
 * Retrieve a declaration draft by ID
 */
export const getDeclarationDraft = async (
  draftId: string
): Promise<TaxDeclarationDraft> => {
  const response = await apiClient.get<TaxDeclarationDraft>(
    `/api/v1/tax/declarations/${draftId}`
  );
  return response.data;
};

/**
 * PATCH /api/v1/tax/declarations/{draft_id}/fields
 * Update a field value in a draft
 */
export const updateDraftField = async (
  draftId: string,
  data: UpdateFieldRequest
): Promise<TaxDeclarationDraft> => {
  const response = await apiClient.patch<TaxDeclarationDraft>(
    `/api/v1/tax/declarations/${draftId}/fields`,
    data
  );
  return response.data;
};

/**
 * Export declaration draft to CSV format
 * Client-side export for DIAN declaration drafts
 */
export const exportDeclarationDraft = (
  draft: TaxDeclarationDraft
): { filename: string; content: string; mimeType: string } => {
  // Helper to escape CSV values
  const escapeCSV = (value: string | number): string => {
    const str = String(value);
    // Escape quotes and wrap in quotes if contains special chars
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  // Build CSV content
  const headers = ['Renglón', 'Concepto', 'Valor', 'Fuente', 'Confianza', 'Estado'];
  const rows = draft.fields.map((field) => [
    escapeCSV(field.renglon),
    escapeCSV(field.label),
    escapeCSV(field.value),
    escapeCSV(field.source),
    escapeCSV(field.confidence.toUpperCase()),
    escapeCSV(field.requires_review ? 'REVISAR' : 'OK'),
  ]);

  // Add warnings as comments at the top
  const warningsSection = draft.warnings?.length
    ? draft.warnings.map((w) => `# ADVERTENCIA: Renglón ${w.field} - ${w.message}`).join('\n') + '\n\n'
    : '';

  // Build CSV
  const csvContent =
    warningsSection +
    `// Formulario: ${draft.form_type}\n` +
    `// Período: ${draft.period_start} a ${draft.period_end}\n` +
    `// Empresa NIT: ${draft.company_nit}\n` +
    `// Generado: ${new Date().toISOString()}\n` +
    `// Total campos: ${draft.fields.length}\n` +
    `// Campos por revisar: ${draft.fields.filter((f) => f.requires_review).length}\n\n` +
    headers.join(',') +
    '\n' +
    rows.map((row) => row.join(',')).join('\n');

  const filename = `${draft.form_type}_${draft.period_start}_${draft.company_nit}.csv`;

  return {
    filename,
    content: csvContent,
    mimeType: 'text/csv;charset=utf-8;',
  };
};

/**
 * GET /api/v1/tax/calendar
 * Get tax calendar with obligations and deadlines
 */
export const getTaxCalendar = async (
  nit: string,
  year?: number,
  ivaRegime?: 'bimestral' | 'cuatrimestral'
): Promise<TaxCalendarResponse> => {
  const params: Record<string, string | number> = { nit };
  if (year) params.year = year;
  if (ivaRegime) params.iva_regime = ivaRegime;

  const response = await apiClient.get<TaxCalendarResponse>(
    '/api/v1/tax/calendar',
    { params }
  );
  return response.data;
};

/**
 * POST /api/v1/tax/certificates/f220
 * Generate F220 certificates for a given year
 */
export const generateF220Certificates = async (
  companyNit: string,
  year: number
): Promise<F220Response> => {
  const response = await apiClient.post<F220Response>(
    '/api/v1/tax/certificates/f220',
    null,
    { params: { company_nit: companyNit, year } }
  );
  return response.data;
};

/**
 * GET /api/v1/tax/exogena/{formato}
 * Get exogena data for formats 1001 or 2276
 */
export const getExogenaFormat = async (
  formato: '1001' | '2276',
  companyNit: string,
  year: number
): Promise<ExogenaResponse> => {
  const response = await apiClient.get<ExogenaResponse>(
    `/api/v1/tax/exogena/${formato}`,
    { params: { company_nit: companyNit, year } }
  );
  return response.data;
};

// ============================================================================
// Chat (Reportero Chatbot)
// ============================================================================

export interface ChatRequestPayload {
  message: string;
  session_id?: string | null;
  company_nit?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface ChatResponsePayload {
  reply: string;
  session_id: string;
  data_cards: Array<{ card_type: string; title: string; data: Record<string, any> }>;
  intent_detected: string;
  sources: string[];
}

export interface ChatSessionSummary {
  id: string;
  title: string | null;
  company_nit: string | null;
  message_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChatMessageRecord {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data_cards?: Array<{ card_type: string; title: string; data: Record<string, any> }> | null;
  intent?: string | null;
  sources?: string[] | null;
  created_at?: string | null;
}

/**
 * POST /api/v1/chat
 * Send a chat message (non-streaming)
 */
export const sendChatMessage = async (
  payload: ChatRequestPayload
): Promise<ChatResponsePayload> => {
  const response = await apiClient.post<ChatResponsePayload>('/api/v1/chat', payload);
  return response.data;
};

/**
 * GET /api/v1/chat/sessions
 * List chat sessions, optionally filtered by company NIT
 */
export const getChatSessions = async (
  companyNit?: string
): Promise<ChatSessionSummary[]> => {
  const response = await apiClient.get<ChatSessionSummary[]>('/api/v1/chat/sessions', {
    params: companyNit ? { company_nit: companyNit } : undefined,
  });
  return response.data;
};

/**
 * GET /api/v1/chat/sessions/{sessionId}/messages
 * Get all messages for a chat session
 */
export const getChatMessages = async (
  sessionId: string
): Promise<ChatMessageRecord[]> => {
  const response = await apiClient.get<ChatMessageRecord[]>(
    `/api/v1/chat/sessions/${sessionId}/messages`
  );
  return response.data;
};

/**
 * DELETE /api/v1/chat/sessions/{sessionId}
 * Delete a chat session and all its messages
 */
export const deleteChatSession = async (
  sessionId: string
): Promise<void> => {
  await apiClient.delete(`/api/v1/chat/sessions/${sessionId}`);
};

// ============================================================================
// Export the configured axios instance for advanced usage
// ============================================================================

export default apiClient;
