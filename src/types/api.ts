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

export interface IVAReport {
    period_end: string;
    period_start: string | null;
    company_nit: string | null;
    iva_generado: number;
    iva_descontable: number;
    iva_a_pagar: number;
    iva_status?: 'saldo_a_pagar' | 'saldo_a_favor' | 'saldo_cero';
    referencias: string[];
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

export interface CompanySettingsRequest {
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

export interface BookQueryParams {
    tipo: 'diario' | 'mayor' | 'auxiliar' | 'balance';
    fecha_inicio?: string;
    fecha_fin?: string;
    cuenta_puc?: string;
    tercero_nit?: string;
    company_nit?: string;
    signal?: AbortSignal;
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
    // backend libro mayor fields
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

export interface BalanceGeneralEntry {
    cuenta_puc: string;
    cuenta_nombre: string;
    saldo: number;
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
}

export interface MonthlyTrendPoint {
    month: string;
    ingresos: number;
    gastos: number;
}

export interface MonthlyTrendResponse {
    data: MonthlyTrendPoint[];
}

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

export interface CompanyMembership {
    user_id: string;
    company_nit: string;
}
