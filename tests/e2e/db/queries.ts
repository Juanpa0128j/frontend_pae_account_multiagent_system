import { Pool } from "pg";

export interface IngestJobRow {
  id: string;
  company_nit: string;
  status: string;
  doc_type: string | null;
  error_category: string | null;
  error_code: string | null;
  remediation: string | null;
}

export interface TransactionPendingRow {
  id: string;
  ingest_job_id: string;
  company_nit: string;
  raw_data: unknown;
  doc_type: string;
}

export interface JournalEntryLineRow {
  id: string;
  journal_entry_id: string;
  account: string;
  debit: string;
  credit: string;
}

export interface FinancialStatementRow {
  id: string;
  company_nit: string;
  type: string;
  period: string;
  data: unknown;
  source_mode: string;
}

export interface StatementLineageRow {
  derived_id: string;
  source_id: string;
}

export async function getIngestJob(pool: Pool, id: string): Promise<IngestJobRow | null> {
  const r = await pool.query<IngestJobRow>(
    "SELECT id, company_nit, status, doc_type, error_category, error_code, remediation FROM ingest_jobs WHERE id = $1",
    [id],
  );
  return r.rows[0] ?? null;
}

export async function getTransactionsPending(
  pool: Pool,
  ingestJobId: string,
): Promise<TransactionPendingRow[]> {
  const r = await pool.query<TransactionPendingRow>(
    "SELECT id, ingest_job_id, company_nit, raw_data, doc_type FROM transaction_pending WHERE ingest_job_id = $1",
    [ingestJobId],
  );
  return r.rows;
}

export async function getJournalEntryLines(
  pool: Pool,
  processId: string,
): Promise<JournalEntryLineRow[]> {
  const r = await pool.query<JournalEntryLineRow>(
    `SELECT jel.id, jel.journal_entry_id, jel.account, jel.debit::text, jel.credit::text
     FROM journal_entry_line jel
     JOIN transaction_posted tp ON tp.journal_entry_id = jel.journal_entry_id
     WHERE tp.process_id = $1`,
    [processId],
  );
  return r.rows;
}

export async function getFinancialStatements(
  pool: Pool,
  nit: string,
): Promise<FinancialStatementRow[]> {
  const r = await pool.query<FinancialStatementRow>(
    "SELECT id, company_nit, type, period, data, source_mode FROM financial_statements WHERE company_nit = $1",
    [nit],
  );
  return r.rows;
}

export async function getStatementLineage(
  pool: Pool,
  nit: string,
): Promise<StatementLineageRow[]> {
  const r = await pool.query<StatementLineageRow>(
    `SELECT l.derived_id, l.source_id
     FROM financial_statement_lineage l
     JOIN financial_statements s ON s.id = l.derived_id
     WHERE s.company_nit = $1`,
    [nit],
  );
  return r.rows;
}
