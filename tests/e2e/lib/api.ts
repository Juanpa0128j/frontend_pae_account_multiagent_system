import { APIRequestContext } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

export interface UploadResponse {
  ingest_id: string;
}

export interface IngestDetail {
  ingest_id: string;
  status: string;
  doc_type: string | null;
  raw_transactions?: unknown;
  error_category?: string | null;
  error_code?: string | null;
  remediation?: string | null;
  has_warnings?: boolean;
}

export interface ProcessResponse {
  process_id: string;
}

export interface ProcessStatus {
  process_id: string;
  status: string;
  error_category?: string | null;
}

export async function uploadIngest(
  ctx: APIRequestContext,
  filePath: string,
  companyNit: string,
  docType?: string,
): Promise<UploadResponse> {
  const buffer = fs.readFileSync(filePath);
  const res = await ctx.post("/api/v1/ingest/upload", {
    multipart: {
      file: { name: path.basename(filePath), mimeType: detectMime(filePath), buffer },
      company_nit: companyNit,
      ...(docType ? { doc_type: docType } : {}),
    },
  });
  if (!res.ok()) throw new Error(`upload failed: ${res.status()} ${await res.text()}`);
  return (await res.json()) as UploadResponse;
}

export async function pollIngest(
  ctx: APIRequestContext,
  ingestId: string,
  timeoutMs: number,
): Promise<IngestDetail> {
  const start = Date.now();
  let last: IngestDetail | null = null;
  while (Date.now() - start < timeoutMs) {
    const res = await ctx.get(`/api/v1/ingest/${ingestId}`);
    if (!res.ok()) throw new Error(`poll failed: ${res.status()}`);
    last = (await res.json()) as IngestDetail;
    if (["completed", "failed", "pending_review"].includes(last.status)) return last;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`pollIngest timeout; last status=${last?.status}`);
}

export async function confirmClassification(
  ctx: APIRequestContext,
  ingestId: string,
  docType: string,
): Promise<IngestDetail> {
  const res = await ctx.patch(`/api/v1/ingest/${ingestId}/classification`, {
    data: { doc_type: docType, confirmed: true },
  });
  if (!res.ok()) throw new Error(`confirm failed: ${res.status()}`);
  return (await res.json()) as IngestDetail;
}

export async function processAccounting(
  ctx: APIRequestContext,
  ingestId: string,
): Promise<ProcessResponse> {
  const res = await ctx.post(`/api/v1/process/accounting/${ingestId}`);
  if (!res.ok()) throw new Error(`process start failed: ${res.status()}`);
  return (await res.json()) as ProcessResponse;
}

export async function pollProcess(
  ctx: APIRequestContext,
  processId: string,
  timeoutMs: number,
): Promise<ProcessStatus> {
  const start = Date.now();
  let last: ProcessStatus | null = null;
  while (Date.now() - start < timeoutMs) {
    const res = await ctx.get(`/api/v1/process/status/${processId}`);
    if (!res.ok()) throw new Error(`process poll failed: ${res.status()}`);
    last = (await res.json()) as ProcessStatus;
    if (["completed", "failed", "pending_audit_review"].includes(last.status)) return last;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`pollProcess timeout; last status=${last?.status}`);
}

export async function getStatements(
  ctx: APIRequestContext,
  companyNit: string,
): Promise<{ statements: Array<{ type: string; period: string; source_mode: string }> }> {
  const res = await ctx.get(`/api/v1/reports/statements?company_nit=${encodeURIComponent(companyNit)}`);
  if (!res.ok()) throw new Error(`statements failed: ${res.status()}`);
  return (await res.json()) as { statements: Array<{ type: string; period: string; source_mode: string }> };
}

export async function getTransactions(
  ctx: APIRequestContext,
  companyNit: string,
): Promise<{ transactions: Array<{ id: string; doc_type: string }> }> {
  const res = await ctx.get(`/api/v1/reports/transactions?company_nit=${encodeURIComponent(companyNit)}`);
  if (!res.ok()) throw new Error(`transactions failed: ${res.status()}`);
  return (await res.json()) as { transactions: Array<{ id: string; doc_type: string }> };
}

function detectMime(p: string): string {
  const ext = path.extname(p).toLowerCase();
  switch (ext) {
    case ".pdf": return "application/pdf";
    case ".xls": return "application/vnd.ms-excel";
    case ".xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".xml": return "application/xml";
    case ".jpg": case ".jpeg": return "image/jpeg";
    case ".png": return "image/png";
    default: return "application/octet-stream";
  }
}
