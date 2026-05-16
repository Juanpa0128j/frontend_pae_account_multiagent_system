'use client';

import { Box, Alert, Skeleton } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { BrutalistPageHero, BrutalistButton } from '@/components/brutalist';
import { moduleAccents } from '@/styles/brutalist';
import TransactionDetailView from '@/components/transactions/TransactionDetail';
import { AgentName, AgentResult, AgentStep, AsientoContable, TransactionDetail } from '@/types';
import { useTransactionDetail } from '@/hooks/useTransactions';

type AgentReasoningEntry = {
    agente?: string;
    accion?: string;
    resultado?: string;
    duracion_ms?: number;
    detalle?: string;
};

// agent_reasoning may arrive as:
//   1. Legacy array of {agente, accion, resultado, duracion_ms, detalle}.
//   2. Dict keyed by agent name: { contador: {...}, auditor: {...} }
//      where each value is the raw output of that agent.
// Normalise both shapes to AgentStep[] so the timeline component renders
// consistently regardless of pipeline version.
function buildAgentTrace(reasoning: unknown): AgentStep[] | undefined {
    if (!reasoning || typeof reasoning !== 'object') return undefined;

    if (Array.isArray(reasoning)) {
        return (reasoning as AgentReasoningEntry[])
            .filter((step) => step && typeof step === 'object')
            .map((step) => ({
                agente: (step.agente as AgentName) ?? 'Supervisor',
                accion: step.accion ?? '',
                resultado: (step.resultado as AgentResult) ?? 'success',
                duracion_ms: Number(step.duracion_ms ?? 0),
                detalle: step.detalle ?? '',
            }));
    }

    const agentNameMap: Record<string, AgentName> = {
        contador: 'Contador',
        tributario: 'Tributario',
        auditor: 'Auditor',
        ingest: 'Ingesta',
        ingesta: 'Ingesta',
        supervisor: 'Supervisor',
    };

    const reasoningDict = reasoning as Record<string, unknown>;
    const steps: AgentStep[] = [];
    for (const [key, raw] of Object.entries(reasoningDict)) {
        if (!raw || typeof raw !== 'object') continue;
        const obj = raw as Record<string, unknown>;
        const agente = agentNameMap[key.toLowerCase()] ?? 'Supervisor';
        const aprobado = obj.aprobado;
        const resultado: AgentResult =
            aprobado === false ? 'error' : aprobado === true ? 'success' : 'success';
        const accion =
            (obj.descripcion_general as string | undefined) ??
            (obj.resumen as string | undefined) ??
            `Salida del agente ${agente}`;
        const detalle =
            typeof obj.resumen === 'string' ? obj.resumen : JSON.stringify(obj, null, 2);
        steps.push({
            agente,
            accion: accion.slice(0, 240),
            resultado,
            duracion_ms: Number(obj.duracion_ms ?? 0),
            detalle,
        });
    }
    return steps.length > 0 ? steps : undefined;
}

function taxReferenceText(taxRefs: unknown): string {
    if (Array.isArray(taxRefs)) {
        return taxRefs.filter((r) => typeof r === 'string').join(', ');
    }
    if (typeof taxRefs === 'string') return taxRefs;
    return '';
}

function extractAgentJustification(reasoning: unknown, taxRefs: unknown): string {
    const fallback = taxReferenceText(taxRefs);
    if (!reasoning) return fallback;

    const normalizeText = (value: unknown): string => {
        if (typeof value === 'string') return value.trim();
        if (!value || typeof value !== 'object') return '';
        const obj = value as Record<string, unknown>;
        const raw =
            (obj.justificacion as string | undefined) ??
            (obj.descripcion_general as string | undefined) ??
            (obj.resumen as string | undefined) ??
            (obj.detalle as string | undefined) ??
            '';
        if (raw) return raw.trim();
        const json = JSON.stringify(obj);
        return json.length > 480 ? `${json.slice(0, 480)}…` : json;
    };

    if (Array.isArray(reasoning)) {
        const entries = reasoning as AgentReasoningEntry[];
        const preferred =
            entries.find((step) => step?.agente?.toLowerCase().includes('cont')) ?? entries[0];
        const text =
            (preferred?.detalle ?? preferred?.accion ?? '')?.toString().trim() ??
            normalizeText(preferred);
        return text || fallback;
    }

    if (typeof reasoning === 'object') {
        const reasoningDict = reasoning as Record<string, unknown>;
        const keys = Object.keys(reasoningDict);
        const preferredKey =
            keys.find((key) =>
                ['contador', 'contable', 'clasificador', 'clasificacion'].includes(
                    key.toLowerCase()
                )
            ) ?? keys[0];
        if (!preferredKey) return fallback;
        const text = normalizeText(reasoningDict[preferredKey]);
        return text || fallback;
    }

    return fallback;
}

export default function TransactionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { data: backendTx, isLoading, isError, error } = useTransactionDetail(id, !!id);

    const data: TransactionDetail | null = backendTx
        ? (() => {
              const posted = backendTx.posted ?? null;
              const journalLines = backendTx.journal_lines ?? [];

              const asiento: AsientoContable[] | undefined =
                  journalLines.length > 0
                      ? journalLines.map((line) => ({
                            cuenta_puc: line.cuenta_puc,
                            nombre_cuenta: line.descripcion,
                            debito: line.debito,
                            credito: line.credito,
                            tercero_nit: line.tercero_nit,
                        }))
                      : undefined;

              const totalDebito = asiento?.reduce((s, l) => s + (l.debito || 0), 0) ?? 0;
              const totalCredito = asiento?.reduce((s, l) => s + (l.credito || 0), 0) ?? 0;
              const partidaDobleOk =
                  asiento && asiento.length > 0
                      ? Math.abs(totalDebito - totalCredito) < 0.01
                      : undefined;

              const clasificacion = posted
                  ? {
                        cuenta_puc: posted.cuenta_puc,
                        nombre_cuenta: posted.puc_descripcion || posted.cuenta_puc,
                        justificacion: extractAgentJustification(
                            posted.agent_reasoning,
                            posted.tax_references
                        ),
                        fuente: 'normativa' as const,
                    }
                  : undefined;

              const impuestos = posted
                  ? {
                        retefuente: posted.retefuente,
                        reteica: posted.reteica,
                        iva_generado: posted.iva,
                        iva_descontable: 0,
                        referencia_normativa: taxReferenceText(posted.tax_references),
                    }
                  : undefined;

              const agentTrace = buildAgentTrace(posted?.agent_reasoning);

              return {
                  id: backendTx.id,
                  raw: {
                      id: backendTx.id,
                      fecha: backendTx.fecha,
                      nit_emisor: backendTx.nit_emisor,
                      nit_receptor: '',
                      concepto: backendTx.concepto,
                      subtotal: posted ? backendTx.total - (posted.iva || 0) : 0,
                      iva: posted?.iva ?? 0,
                      total: backendTx.total,
                      tipo_documento: 'otro',
                      archivo_origen: '',
                      status: String(
                          backendTx.status || 'PENDING'
                      ).toUpperCase() as TransactionDetail['raw']['status'],
                      created_at: '',
                  },
                  clasificacion,
                  impuestos,
                  asiento,
                  partida_doble_ok: partidaDobleOk,
                  agent_trace: agentTrace,
              };
          })()
        : null;

    return (
        <Box>
            <BrutalistPageHero
                eyebrow={`// TX // ${String(id).slice(0, 12).toUpperCase()}`}
                title={
                    <>
                        Detalle
                        <br />
                        transacción.
                    </>
                }
                subtitle={`#${id}`}
                lede="Datos de la transacción tal como están almacenados en la base de datos."
                accent={moduleAccents.transactions}
                ghostNumber="3"
                action={
                    <BrutalistButton
                        variant="outline"
                        accent={moduleAccents.transactions}
                        size="md"
                        icon={<BackIcon sx={{ fontSize: 16 }} />}
                        onClick={() => router.back()}
                    >
                        Volver
                    </BrutalistButton>
                }
            />

            {isLoading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Skeleton
                        variant="rectangular"
                        height={200}
                        sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)' }}
                    />
                    <Skeleton
                        variant="rectangular"
                        height={200}
                        sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)' }}
                    />
                </Box>
            )}

            {!isLoading && isError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    No se pudo cargar la transacción:{' '}
                    {error instanceof Error ? error.message : 'error desconocido'}
                </Alert>
            )}

            {!isLoading && !isError && !data && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    Transacción no encontrada.
                </Alert>
            )}

            {!isLoading && !isError && data && <TransactionDetailView detail={data} />}
        </Box>
    );
}
