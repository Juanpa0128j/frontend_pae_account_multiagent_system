// ============================================================================
// PAE Contable — Custom React Hooks
// ============================================================================

// Upload & Ingestion
export { useUpload, useViaBUpload } from './useUpload';
export type { ViaBSlot, ViaBDocType } from './useUpload';
export { useIngestDetail } from './useProcessing';

// Processing
export { 
  useProcessStatus, 
  useProcessResult,
  useProcessTrace,
  useIngestTrace,
} from './useProcessing';

// Transactions
export { 
  useTransactions, 
  useSearchTransactions,
  useTransactionDetail
} from './useTransactions';

// Dashboard
export { useDashboardStats } from './useDashboard';

// Evaluation & Metrics
export { 
  useEvaluationRun,
  useSchemaCompliance, 
  useResetMetrics, 
  useRagStatus 
} from './useEvaluation';

// Reports & Books
export * from './useReports';
export * from './useBooks';

// Tax
export * from './useTax';

// Health Check
export * from './useHealthCheck';

// Settings
export * from './useSettings';

// Chat
export { useChat } from './useChat';
