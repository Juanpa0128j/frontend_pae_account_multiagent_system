// ============================================================================
// PAE Contable — TypeScript Types
// Aligned with FastAPI Pydantic schemas on the backend
// ============================================================================

// ---------------------------------------------------------------------------
// Shared / Primitives
// ---------------------------------------------------------------------------

export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'POSTED' | 'REJECTED';

export type DocumentType = 'factura' | 'extracto' | 'nota_credito' | 'otro';

export type AgentName = 'Supervisor' | 'Ingesta' | 'Contador' | 'Tributario' | 'Auditor';

export type AgentResult = 'success' | 'error' | 'retry';

export type ReportType = 'balance' | 'pnl' | 'cashflow';

export type BookType = 'diario' | 'mayor' | 'auxiliar' | 'balance';

export type ClassificationSource = 'historico' | 'normativa' | 'manual';

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export interface RawTransaction {
    id: string;
    fecha: string; // ISO 8601
    nit_emisor: string;
    nit_receptor: string;
    concepto: string;
    subtotal: number;
    iva: number;
    total: number;
    tipo_documento: DocumentType;
    archivo_origen: string;
    status: TransactionStatus;
    created_at: string;
}

export interface AsientoContable {
    cuenta_puc: string; // Ej: "5195"
    nombre_cuenta: string; // Ej: "Gastos diversos"
    debito: number;
    credito: number;
    tercero_nit: string;
}

export interface AgentStep {
    agente: AgentName;
    accion: string;
    resultado: AgentResult;
    duracion_ms: number;
    detalle: string; // Natural language explanation
}

export interface TransactionDetail {
    id: string;
    raw: RawTransaction;
    // Optional: backend may not return these fields yet for every transaction.
    // The view component already guards each access with `?.` or truthiness checks.
    clasificacion?: {
        cuenta_puc: string;
        nombre_cuenta: string;
        justificacion: string; // Agent counter explanation
        fuente: ClassificationSource;
    };
    impuestos?: {
        retefuente: number;
        reteica: number;
        iva_generado: number;
        iva_descontable: number;
        referencia_normativa: string; // Ej: "Art. 383 ET"
    };
    asiento?: AsientoContable[];
    partida_doble_ok?: boolean;
    agent_trace?: AgentStep[];
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface ReportRequest {
    tipo: ReportType;
    fecha_inicio: string;
    fecha_fin: string;
}

// ---------------------------------------------------------------------------
// Books (Libros Contables)
// ---------------------------------------------------------------------------

export interface BookEntry {
    fecha: string;
    documento: string;
    concepto: string;
    cuenta_puc: string;
    nombre_cuenta: string;
    debito: number;
    credito: number;
    saldo: number;
    tercero_nit?: string;
}

export interface BookFilter {
    fecha_inicio?: string;
    fecha_fin?: string;
    cuenta_puc?: string;
    tercero_nit?: string;
    tipo: BookType;
}

// ---------------------------------------------------------------------------
// Tax (Tributario)
// ---------------------------------------------------------------------------

export interface FiscalAlert {
    tipo: string;
    descripcion: string;
    vencimiento: string;
    monto_estimado?: number;
    urgencia: 'alta' | 'media' | 'baja';
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export interface EvaluationMetrics {
    schema_compliance_rate: number;
    double_entry_error_rate: number;
    puc_assignment_accuracy: number;
    tax_calculation_accuracy: number;
    audit_pass_rate: number;
    evaluated_at: string;
    total_transactions_evaluated: number;
}

export interface MetricsTrend {
    date: string;
    schema_compliance: number;
    double_entry: number;
    puc_accuracy: number;
    tax_accuracy: number;
    audit_pass: number;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface CompanySettings {
    razon_social: string;
    nit: string;
    regimen_tributario: 'comun' | 'simplificado' | 'especial';
    direccion?: string;
    email_contador?: string;
    representante_legal?: string;
}

export interface UserProfile {
    id: string;
    nombre: string;
    email: string;
    rol: 'admin' | 'contador' | 'visor';
    activo: boolean;
    created_at: string;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardStats {
    documentos_pendientes: number;
    transacciones_procesadas_mes: number;
    alertas_activas: number;
    total_activos_cop: number;
}

// ---------------------------------------------------------------------------
// Transaction list (summary row used in tables)
// ---------------------------------------------------------------------------

export interface TransactionSummary {
    id: string;
    fecha: string;
    concepto: string;
    total: number;
    status: TransactionStatus;
    nit_emisor: string;
    ingest_id?: string;
}

// ---------------------------------------------------------------------------
// Financial Statements (Via B pipeline)
// ---------------------------------------------------------------------------

export type FinancialStatementType =
    | 'balance_general'
    | 'estado_resultados'
    | 'libro_auxiliar'
    | 'libro_diario'
    | 'flujo_de_caja'
    | 'cambios_patrimonio'
    | 'notas_estados_financieros';

export type FinancialStatementSourceMode = 'direct' | 'derived' | 'derived_from_journal';

// ---------------------------------------------------------------------------
// Tax — ICA & Renta Provision (aliases defined below with full declarations)
// ---------------------------------------------------------------------------

export interface IngestClassificationReview {
    predicted_type?: string | null;
    predicted_label?: string | null;
    confidence?: number | null;
    available_types: { value: string; label: string }[];
    wrong_upload_area?: boolean;
}

export interface BundleJobState {
    ingest_id: string;
    file_name: string;
    status: 'extracting' | 'review' | 'processing' | 'done' | 'error';
    progress: number;
    classification_review?: IngestClassificationReview | null;
    process_id?: string;
    error?: string;
    error_category?: string;
    error_code?: string;
    remediation?: string;
    has_warnings?: boolean;
    trace_url?: string | null;
    file_names?: string[];
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export interface FileUploadState {
    file: File;
    files?: File[];
    id: string;
    status: 'idle' | 'uploading' | 'processing' | 'extracting' | 'review' | 'done' | 'error';
    progress: number;
    parser_mode?: string;
    ingest_id?: string;
    ingest_ids?: string[];
    bundle_jobs?: BundleJobState[];
    process_id?: string;
    error?: string;
    error_category?: string;
    error_code?: string;
    remediation?: string;
    has_warnings?: boolean;
    trace_url?: string | null;
    classification_review?: IngestClassificationReview | null;
    file_names?: string[];
    // Persisted display metadata so a reloaded job (blob stripped from
    // localStorage) still shows the real name/size instead of "archivo · 0 B".
    display_name?: string;
    display_size?: number;
    multi_file_mode?: 'pages' | 'documents';
    current_file_index?: number | null;
    extracted?: {
        fecha?: string;
        nit?: string;
        total?: number;
        concepto?: string;
        source_file?: string | null;
    };
}

// ---------------------------------------------------------------------------
// Chat (Reportero Chatbot)
// ---------------------------------------------------------------------------

export type ChatReasoningPhase =
    | 'intent'
    | 'params'
    | 'gathering_data'
    | 'rag'
    | 'generating'
    | 'complete';

export interface ChatReasoningStep {
    phase: ChatReasoningPhase;
    label: string;
    detail?: string | null;
    duration_ms?: number | null;
    status?: 'running' | 'done' | 'error';
    timestamp?: string | null;
}

export interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    data_cards?: FinancialDataCard[] | null;
    intent?: string | null;
    sources?: string[] | null;
    reasoning?: ChatReasoningStep[] | null;
    created_at?: string | null;
}

export interface FinancialDataCard {
    card_type: string;
    title: string;
    data: Record<string, unknown>;
}

export interface BalanceCardData {
    activos: number;
    pasivos: number;
    patrimonio_total: number;
    cuadre?: boolean;
}

export interface PnlCardData {
    total_ingresos: number;
    total_costo_ventas: number;
    total_gastos: number;
    utilidad_neta: number;
}

export interface IvaCardData {
    iva_generado: number;
    iva_descontable: number;
    iva_a_pagar: number;
}

export interface RatiosCardData {
    razon_corriente?: number;
    prueba_acida?: number;
    margen_neto?: number;
    roa?: number;
    razon_endeudamiento?: number;
}

export interface ChatRequest {
    message: string;
    session_id?: string | null;
    company_nit?: string | null;
    start_date?: string | null;
    end_date?: string | null;
}

export interface ChatResponse {
    reply: string;
    session_id: string;
    data_cards: FinancialDataCard[];
    intent_detected: string;
    sources: string[];
}

export interface ChatSession {
    id: string;
    title: string | null;
    company_nit: string | null;
    message_count: number;
    created_at: string | null;
    updated_at: string | null;
}

// ---------------------------------------------------------------------------
// API types copied from src/lib/api.ts (migration step 1 — both files hold
// these declarations temporarily while domain clients are built)
// ---------------------------------------------------------------------------

export interface RunResponse {
    status: string;
    metrics: {
        schema_compliance: number;
        double_entry_integrity: number;
    };
}

export interface EvaluationAgentDetail {
    passed: number;
    failed: number;
    total: number;
    rate: number;
}

export interface SchemaComplianceMetrics {
    overall_compliance_rate: number;
    per_agent_compliance_rate: Record<string, number>;
    total_validations: number;
    total_passed: number;
    total_failed: number;
    per_agent_detail: Record<string, EvaluationAgentDetail>;
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
    ingest_ids?: string[];
    file_name: string;
    message: string;
    status: string;
    extracted_transactions?: number;
    created_at?: string;
    raw_preview?: Record<string, unknown> | null;
}

export interface ClassificationReviewOption {
    value: string;
    label: string;
}

export interface ClassificationReview {
    predicted_type?: string | null;
    predicted_label?: string | null;
    confidence?: number | null;
    available_types: ClassificationReviewOption[];
    wrong_upload_area?: boolean;
}

export interface IngestDetailResponse {
    ingest_id: string;
    file_name: string;
    file_names?: string[];
    current_file_index?: number | null;
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
    classification_review?: ClassificationReview | null;
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
        [key: string]: unknown;
    }>;
    created_at?: string;
    started_at?: string;
    completed_at?: string;
    has_warnings?: boolean;
    trace_url?: string | null;
    audit_review?: Record<string, unknown> | null;
}

export interface ProcessCancelResponse {
    process_id: string;
    status: string;
    message: string;
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
    rejection_reason?: string | null;
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

export type TaxReportSource = 'via_a' | 'via_b';

export interface IVAReport {
    period_end: string;
    period_start: string | null;
    company_nit: string | null;
    iva_generado: number;
    iva_descontable: number;
    iva_a_pagar: number;
    iva_status?: 'saldo_a_pagar' | 'saldo_a_favor' | 'saldo_cero';
    referencias: string[];
    source?: TaxReportSource;
}

export interface WithholdingsReport {
    period_end: string;
    period_start: string | null;
    company_nit: string | null;
    retencion_en_la_fuente: number;
    retencion_en_la_fuente_status?: 'saldo_a_pagar' | 'saldo_a_favor' | 'saldo_cero';
    retencion_ica: number;
    retencion_ica_status?: 'saldo_a_pagar' | 'saldo_a_favor' | 'saldo_cero';
    total_retenciones: number;
    total_retenciones_status?: 'saldo_a_pagar' | 'saldo_a_favor' | 'saldo_cero';
    referencias: string[];
    source?: TaxReportSource;
}

export interface ICAReport {
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
    source?: TaxReportSource;
}

export interface RentaProvisionReport {
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
    source?: TaxReportSource;
}

export interface TransactionLine {
    id: string;
    fecha: string;
    concepto: string;
    total: number;
    status: TransactionStatus;
    nit_emisor: string;
    ingest_id?: string;
}

export interface Transaction {
    id: string;
    fecha: string;
    concepto: string;
    total: number;
    status: string;
    nit_emisor: string;
    items?: Array<Record<string, unknown>> | null;
    raw_data?: Record<string, unknown> | null;
    process_id?: string | null;
}

export interface DashboardStatsResponse {
    documentos_pendientes: number;
    transacciones_procesadas_mes: number;
    alertas_activas: number;
    total_activos_cop: number;
    total_pasivos_cop: number;
    utilidad_neta_cop: number;
    efectivo_disponible_cop: number;
    iva_por_pagar: number;
    total_retenciones: number;
    transacciones_por_estado: Record<string, number>;
    pathway?: 'build_from_scratch' | 'work_with_existing' | null;
    via_b_statements_count?: number;
    latest_via_b_period?: string | null;
    derivation_ready?: boolean;
    period_end?: string | null;
    period_resolution?: 'common' | 'partial' | null;
}

export interface MonthlyTrendEntry {
    month: string;
    ingresos: number;
    gastos: number;
}

export interface TrendDataPoint {
    data: MonthlyTrendEntry[];
}

export interface RootStatusResponse {
    message: string;
    status: string;
}

export interface HealthResponse {
    status: 'healthy' | 'degraded' | string;
    database?: 'connected' | 'disconnected' | string;
    environment?: string;
}

export interface CompanySettingsResponse {
    nit: string;
    nombre?: string;
    ciudad?: string;
    codigo_ciiu?: string;
    iva_responsable: boolean;
    es_declarante?: boolean;
    tasa_retefuente_servicios: number;
    tasa_retefuente_bienes: number;
    tasa_retefuente_arrendamiento: number;
    tasa_reteica: number;
    tasa_iva_general: number;
    tasa_ica: number;
    tasa_renta: number;
    regimen_tributario?: string;
    actividad_economica?: string;
    created_at?: string;
    updated_at?: string;
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
    locked_pathway?: 'build_from_scratch' | 'work_with_existing' | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface BookQueryParams {
    tipo: 'diario' | 'mayor' | 'auxiliar' | 'balance';
    fecha_inicio?: string;
    fecha_fin?: string;
    cuenta_puc?: string;
    tercero_nit?: string;
    company_nit?: string;
    signal?: AbortSignal;
}

export interface BalanceGeneralEntry {
    cuenta_puc: string;
    cuenta_nombre: string;
    saldo: number;
}

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

export interface StatementListItem {
    id: string;
    statement_type: FinancialStatementType;
    period_start: string | null;
    period_end: string;
    source_mode: FinancialStatementSourceMode;
    created_at: string | null;
}

export interface DerivationStatus {
    company_nit: string;
    is_ready: boolean;
    ready_periods: Array<{ period_start: string; period_end: string }>;
    derived_periods: Array<{ period_end: string; statements: string[]; complete: boolean }>;
}

export interface TaxConstantsResponse {
    uvt: UvtValue;
    base_minima: BaseMinima[];
}

export interface UvtValue {
    year: number;
    value: number;
    decreto?: string;
}

export interface BaseMinima {
    concepto: string;
    uvt_units: number;
    year: number;
}

export interface TaxDeclarationDraft {
    draft_id: string;
    company_nit: string;
    form_type: string;
    period_start: string;
    period_end: string;
    year: number;
    status: 'draft' | 'reviewed' | 'filed';
    fields: Array<{
        label: string;
        value: number | string;
        source: string;
        renglon: string;
        confidence: 'high' | 'medium' | 'low';
        requires_review: boolean;
    }>;
    warnings: Array<{ field: string; message: string }>;
    created_at: string;
    updated_at?: string;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    filed_by?: string | null;
    filed_at?: string | null;
    dian_acknowledgment?: string | null;
    reopened_by?: string | null;
    reopened_at?: string | null;
    reopen_reason?: string | null;
}

export type DraftFieldValue = number | string;

export interface TaxCalendarEntry {
    form_type: string;
    period: string;
    period_label: string;
    deadline: string;
    days_until: number;
    alert: boolean;
}

export interface F220Certificate {
    retenedor: {
        nit: string;
        nombre: string;
        ciudad: string;
    };
    retenido: {
        nit: string;
        nombre: string;
    };
    year: number;
    total_pagos: number;
    total_retefuente: number;
    total_reteica: number;
    conceptos: Array<{
        mes: string;
        pagos: number;
        retefuente: number;
        reteica: number;
    }>;
    requires_review: boolean;
    review_reason: string | null;
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
    data_cards?: Array<{ card_type: string; title: string; data: Record<string, unknown> }> | null;
    intent?: string | null;
    sources?: string[] | null;
    reasoning?: Array<{
        phase: 'intent' | 'params' | 'gathering_data' | 'rag' | 'generating' | 'complete';
        label: string;
        detail?: string | null;
        duration_ms?: number | null;
        status?: 'running' | 'done' | 'error';
        timestamp?: string | null;
    }> | null;
    created_at?: string | null;
}

export interface PerdidaAcumulada {
    id: number;
    company_nit: string;
    year: number;
    monto_perdida: number;
    monto_compensado: number;
    monto_pendiente: number;
    decreto?: string;
    notas?: string;
}

export type RegimenTributario = 'ordinario' | 'esal' | 'zona_franca' | 'rst';
export type ActividadEconomica = 'general' | 'financiero' | 'hidroelectrico' | 'otro';

export interface TarifaRenta {
    id: number;
    regimen: RegimenTributario;
    actividad: ActividadEconomica | null;
    tarifa_base: number;
    sobretasa: number;
    tarifa_efectiva: number;
    year_from: number;
    year_to: number | null;
    base_legal: string | null;
    notas: string | null;
}

export interface CreateTarifaRequest {
    regimen: RegimenTributario;
    actividad: ActividadEconomica | null;
    tarifa_base: number;
    sobretasa: number;
    year_from: number;
    year_to: number | null;
    base_legal: string | null;
    notas: string | null;
}

export interface ReteicaTarifa {
    id: number;
    municipio: string;
    ciiu_seccion: string;
    tasa: number;
    fuente: string | null;
    base_minima_uvt: number | null;
}

export interface TaxConcept {
    code: string;
    label: string;
    renglon_350: string;
    aplica_a: string;
    tarifa_default: number | null;
    base_minima_uvt: number | null;
    categoria: string;
    art_referencia: string | null;
    activo: boolean;
}

export interface TaxConceptUpsertRequest {
    code: string;
    label: string;
    renglon_350: string;
    aplica_a: string;
    categoria: string;
    tarifa_default?: number;
    base_minima_uvt?: number;
    art_referencia?: string;
    activo?: boolean;
}

export interface CuentaPUC {
    id: number;
    codigo: string;
    nombre: string;
    clase: number;
    naturaleza: 'debito' | 'credito';
    grupo?: string;
    cuenta?: string;
    subcuenta?: string;
    descripcion?: string;
    activa: boolean;
    created_at?: string;
}

export interface CuentaPUCRequest {
    codigo: string;
    nombre: string;
    clase: number;
    naturaleza: 'debito' | 'credito';
    grupo?: string;
    cuenta?: string;
    subcuenta?: string;
    descripcion?: string;
    activa?: boolean;
}

export interface CompanyMembership {
    user_id: string;
    company_nit: string;
}

export interface ApiError {
    message: string;
    status?: number;
    detail?: string;
}

export interface ReportExportDownload {
    blob: Blob;
    filename: string;
    contentType: string;
}

// ---------------------------------------------------------------------------
// Aliases kept for backward compatibility with existing imports
// ---------------------------------------------------------------------------
export type { FinancialStatementResponse as FinancialStatement };
export type ICADeclaracion = ICAReport;
export type RentaProvision = RentaProvisionReport;

// ---------------------------------------------------------------------------
// Report export types
// ---------------------------------------------------------------------------

export type ReportExportType =
    | 'balance'
    | 'pnl'
    | 'cashflow'
    | 'libro_diario'
    | 'libro_auxiliar'
    | 'cambios_patrimonio'
    | 'notas_estados_financieros';

export type ReportExportFormat = 'pdf' | 'excel';

export interface ReportExportParams {
    report_type: ReportExportType;
    format: ReportExportFormat;
    statement_id: string;
    company_name?: string;
    company_nit: string;
}

// ---------------------------------------------------------------------------
// Tax report response aliases (from api.ts ICADeclaracionResponse / RentaProvisionResponse)
// ---------------------------------------------------------------------------

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
    source?: TaxReportSource;
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
    source?: TaxReportSource;
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export interface TransactionListItem {
    id: string;
    fecha: string;
    concepto: string;
    total: number;
    status: 'PENDING' | 'PROCESSING' | 'POSTED' | 'REJECTED';
    nit_emisor: string;
    ingest_id?: string;
}

export interface TransactionPostedSummary {
    id: string;
    cuenta_puc: string;
    puc_descripcion: string;
    retefuente: number;
    reteica: number;
    iva: number;
    ica: number;
    provision_renta: number;
    neto_a_pagar: number;
    journal_entries_json?: unknown;
    tax_references?: unknown;
    agent_reasoning?: unknown;
    status: string;
}

export interface TransactionJournalLine {
    id: number;
    cuenta_puc: string;
    descripcion: string;
    tercero_nit: string;
    debito: number;
    credito: number;
    fecha: string;
}

export interface TransactionDetailResponse {
    id: string;
    fecha: string;
    concepto: string;
    total: number;
    status: string;
    nit_emisor: string;
    items?: Array<Record<string, unknown>> | null;
    raw_data?: Record<string, unknown> | null;
    posted?: TransactionPostedSummary | null;
    journal_lines?: TransactionJournalLine[];
    process_id?: string | null;
}

export interface TransactionSearchParams {
    nit?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    status?: string;
    limit?: number;
}

// ---------------------------------------------------------------------------
// Books (Libros Contables)
// ---------------------------------------------------------------------------

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
    account?: string;
    name?: string;
    total_debit?: number;
    total_credit?: number;
    net_balance?: number;
}

export interface LibroAuxiliarLine {
    fecha: string;
    comprobante: string;
    tercero_nit: string;
    descripcion: string;
    debito: number;
    credito: number;
}

// ---------------------------------------------------------------------------
// Dashboard monthly trend
// ---------------------------------------------------------------------------

export interface MonthlyTrendPoint {
    month: string;
    ingresos: number;
    gastos: number;
}

export interface MonthlyTrendResponse {
    data: MonthlyTrendPoint[];
}

// ---------------------------------------------------------------------------
// Vía B Derivation
// ---------------------------------------------------------------------------

export interface DerivationSourceItem {
    id: string;
    period_start: string | null;
    period_end: string | null;
}

export interface DerivationReadyPeriod {
    period_start: string;
    period_end: string;
}

export interface DerivedPeriod {
    period_end: string;
    statements: string[];
    complete: boolean;
}

export interface DerivationStatusResponse {
    company_nit: string;
    sources: {
        balance_general: DerivationSourceItem[];
        estado_resultados: DerivationSourceItem[];
        libro_auxiliar: DerivationSourceItem[];
    };
    ready_periods: DerivationReadyPeriod[];
    derived_periods: DerivedPeriod[];
    is_ready: boolean;
}

export interface ViaADerivationStatus {
    company_nit: string;
    first_level_periods: Array<{
        period_start: string | null;
        period_end: string;
        types: string[];
    }>;
    derived_periods: DerivedPeriod[];
    journal_date_range: { earliest: string | null; latest: string | null } | null;
}

// ---------------------------------------------------------------------------
// Pérdidas Fiscales
// ---------------------------------------------------------------------------

export interface PerdidaFiscal {
    id: number;
    company_nit: string;
    year: number;
    monto_perdida: number;
    monto_compensado: number;
    monto_pendiente: number;
    decreto?: string;
    notas?: string;
}

export interface CreatePerdidaRequest {
    company_nit: string;
    year: number;
    monto_perdida: number;
    decreto?: string;
    notas?: string;
}

// ---------------------------------------------------------------------------
// ReteicaTarifa upsert
// ---------------------------------------------------------------------------

export interface ReteicaTarifaUpsertRequest {
    municipio: string;
    ciiu_seccion: string;
    tasa: number;
    fuente?: string;
    base_minima_uvt?: number;
}

// ---------------------------------------------------------------------------
// Tax declarations — supplemental types
// ---------------------------------------------------------------------------

export type TaxFormType = 'F300' | 'F350' | 'F110' | 'ICA' | 'F2516';

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

export type PreflightSeverity = 'blocker' | 'warning' | 'info';

export interface PreflightCheck {
    code: string;
    severity: PreflightSeverity;
    passed: boolean;
    message: string;
    cta_path?: string | null;
    metadata?: Record<string, unknown>;
}

export interface PreflightResponse {
    ready: boolean;
    form_type: TaxFormType;
    period_start: string;
    period_end: string;
    checks: PreflightCheck[];
    blockers: number;
    warnings: number;
}

export interface TaxCalendarResponse {
    nit: string;
    year: number;
    iva_regime: 'bimestral' | 'cuatrimestral';
    generated_at: string;
    obligations: TaxCalendarEntry[];
}

export interface F220Response {
    company_nit: string;
    year: number;
    total_certificates: number;
    certificates: F220Certificate[];
}

export interface ExogenaResponse {
    formato: string;
    company_nit: string;
    year: number;
    total_rows: number;
    invalid_rows: number;
    rows: ExogenaRow[];
}
