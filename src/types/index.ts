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
    fecha: string;              // ISO 8601
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
    cuenta_puc: string;         // Ej: "5195"
    nombre_cuenta: string;      // Ej: "Gastos diversos"
    debito: number;
    credito: number;
    tercero_nit: string;
}

export interface AgentStep {
    agente: AgentName;
    accion: string;
    resultado: AgentResult;
    duracion_ms: number;
    detalle: string;            // Natural language explanation
}

export interface TransactionDetail {
    id: string;
    raw: RawTransaction;
    clasificacion: {
        cuenta_puc: string;
        nombre_cuenta: string;
        justificacion: string;    // Agent counter explanation
        fuente: ClassificationSource;
    };
    impuestos: {
        retefuente: number;
        reteica: number;
        iva_generado: number;
        iva_descontable: number;
        referencia_normativa: string;  // Ej: "Art. 383 ET"
    };
    asiento: AsientoContable[];
    partida_doble_ok: boolean;
    agent_trace: AgentStep[];
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
// Upload
// ---------------------------------------------------------------------------

export interface FileUploadState {
    file: File;
    id: string;
    status: 'idle' | 'uploading' | 'processing' | 'extracting' | 'done' | 'error';
    progress: number;
    ingest_id?: string;
    error?: string;
    extracted?: {
        fecha?: string;
        nit?: string;
        total?: number;
        concepto?: string;
    };
}
