import type { AgentName, AgentResult, AgentStep } from '@/types';

type AgentReasoningEntry = {
    agente?: string;
    accion?: string;
    resultado?: string;
    duracion_ms?: number;
    duration_ms?: number;
    duracion?: number | string;
    duration?: number | string;
    detalle?: string;
};

export function buildAgentTrace(reasoning: unknown): AgentStep[] | undefined {
    if (!reasoning || typeof reasoning !== 'object') return undefined;

    const parseDurationMs = (value: unknown): number => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
            const parsed = Number.parseFloat(value);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        return 0;
    };

    if (Array.isArray(reasoning)) {
        return (reasoning as AgentReasoningEntry[])
            .filter((step) => step && typeof step === 'object')
            .map((step) => ({
                agente: (step.agente as AgentName) ?? 'Supervisor',
                accion: step.accion ?? '',
                resultado: (step.resultado as AgentResult) ?? 'success',
                duracion_ms: parseDurationMs(
                    step.duracion_ms ?? step.duration_ms ?? step.duracion ?? step.duration ?? 0
                ),
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
        const detalle = JSON.stringify(obj, null, 2);
        const duracion = parseDurationMs(
            obj.duracion_ms ??
                obj.duration_ms ??
                obj.duracion ??
                obj.duration ??
                obj.elapsed_ms ??
                0
        );
        steps.push({
            agente,
            accion: accion.slice(0, 240),
            resultado,
            duracion_ms: duracion,
            detalle,
        });
    }
    return steps.length > 0 ? steps : undefined;
}
