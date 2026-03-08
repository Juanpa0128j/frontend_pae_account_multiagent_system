// ============================================================================
// PAE Contable — Custom React Hooks
// ============================================================================

// Upload & Ingestion
export { useUpload } from './useUpload';
export { useIngestDetail } from './useProcessing';

// Processing
export { 
  useProcessStatus, 
  useProcessResult 
} from './useProcessing';

// Transactions
export { 
  useTransactions, 
  useSearchTransactions,
  useEvaluationRun 
} from './useTransactions';

// Evaluation & Metrics
export { 
  useEvaluationRun as useMetricsRun,
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
