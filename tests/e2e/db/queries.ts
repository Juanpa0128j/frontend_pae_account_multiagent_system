import { Pool } from "pg";

export interface IngestJobRow {
  id: string;
  company_nit: string;
  status: string;
  document_type: string | null;
  pathway: string | null;
  classification_confirmed: boolean | null;
  extraction_errors: unknown;
  raw_preview: unknown;
}

export interface TransactionPendingRow {
  id: string;
  ingest_id: string;
  company_nit: string;
  raw_data: unknown;
  items: unknown;
  total: string | null;
  fecha: string | null;
  nit_emisor: string | null;
  status: string;
}

export interface JournalEntryLineRow {
  id: number;
  transaction_posted_id: string;
  cuenta_puc: string;
  cuenta_nombre: string | null;
  debito: string;
  credito: string;
  company_nit: string;
}

export interface TransactionPostedRow {
  id: string;
  transaction_pending_id: string;
  company_nit: string;
  status: string;
}

export interface FinancialStatementRow {
  id: string;
  ingest_id: string;
  entity_nit: string;
  statement_type: string;
  period_start: string;
  period_end: string;
  data: unknown;
  source_mode: string;
}

export interface StatementLineageRow {
  id: string;
  target_statement_id: string;
  source_statement_id: string;
  relation_type: string;
}

export async function getIngestJob(pool: Pool, id: string): Promise<IngestJobRow | null> {
  const r = await pool.query<IngestJobRow>(
    `SELECT id, company_nit, status::text AS status, document_type, pathway,
            classification_confirmed, extraction_errors, raw_preview
     FROM ingest_jobs WHERE id = $1`,
    [id],
  );
  return r.rows[0] ?? null;
}

export async function getTransactionsPending(
  pool: Pool,
  ingestId: string,
): Promise<TransactionPendingRow[]> {
  const r = await pool.query<TransactionPendingRow>(
    `SELECT id, ingest_id, company_nit, raw_data, items, total::text AS total,
            fecha::text AS fecha, nit_emisor, status::text AS status
     FROM transactions_pending WHERE ingest_id = $1`,
    [ingestId],
  );
  return r.rows;
}

export async function getJournalEntryLines(
  pool: Pool,
  transactionPostedId: string,
): Promise<JournalEntryLineRow[]> {
  const r = await pool.query<JournalEntryLineRow>(
    `SELECT id, transaction_posted_id, cuenta_puc, cuenta_nombre,
            debito::text AS debito, credito::text AS credito, company_nit
     FROM journal_entry_lines WHERE transaction_posted_id = $1`,
    [transactionPostedId],
  );
  return r.rows;
}

export async function getJournalEntryLinesByNit(
  pool: Pool,
  nit: string,
): Promise<JournalEntryLineRow[]> {
  const r = await pool.query<JournalEntryLineRow>(
    `SELECT id, transaction_posted_id, cuenta_puc, cuenta_nombre,
            debito::text AS debito, credito::text AS credito, company_nit
     FROM journal_entry_lines WHERE company_nit = $1`,
    [nit],
  );
  return r.rows;
}

export async function getTransactionsPostedByNit(
  pool: Pool,
  nit: string,
): Promise<TransactionPostedRow[]> {
  const r = await pool.query<TransactionPostedRow>(
    `SELECT id, transaction_pending_id, company_nit, status::text AS status
     FROM transactions_posted WHERE company_nit = $1`,
    [nit],
  );
  return r.rows;
}

export async function getFinancialStatements(
  pool: Pool,
  nit: string,
): Promise<FinancialStatementRow[]> {
  const r = await pool.query<FinancialStatementRow>(
    `SELECT id, ingest_id, entity_nit, statement_type,
            period_start::text AS period_start, period_end::text AS period_end,
            data, source_mode
     FROM financial_statements WHERE entity_nit = $1`,
    [nit],
  );
  return r.rows;
}

export async function getStatementLineage(
  pool: Pool,
  nit: string,
): Promise<StatementLineageRow[]> {
  const r = await pool.query<StatementLineageRow>(
    `SELECT l.id, l.target_statement_id, l.source_statement_id, l.relation_type
     FROM financial_statement_lineage l
     JOIN financial_statements s ON s.id = l.target_statement_id
     WHERE s.entity_nit = $1`,
    [nit],
  );
  return r.rows;
}
