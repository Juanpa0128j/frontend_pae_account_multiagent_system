'use client';

import { useRouter } from 'next/navigation';
import { East as ArrowIcon } from '@mui/icons-material';
import { BrutalistEmptyState, BrutalistButton } from '@/components/brutalist';
import { palette } from '@/styles/brutalist';

/**
 * Tax sections that have no Vía B equivalent. Each one explains, in the user's
 * voice, what makes the section impossible to derive from aggregated
 * statements and points back to /upload as the path forward.
 */
export type ViaBBlockedSection = 'declarations' | 'certificates' | 'exogena';

interface CopyEntry {
    label: string;
    title: string;
    description: string;
}

const COPY: Record<ViaBBlockedSection, CopyEntry> = {
    declarations: {
        label: '// VÍA B — DECLARACIONES NO DISPONIBLE',
        title: 'Necesitamos los documentos fuente.',
        description:
            'Los formularios DIAN (F300, F350, F110, ICA, F2516) se construyen a partir ' +
            'del detalle movimiento por movimiento: facturas, retenciones por tercero, ' +
            'IVA por operación gravada o exenta. Tu empresa cargó estados financieros ' +
            'consolidados (Vía B), así que no podemos pre-llenar los renglones. ' +
            'Si quieres habilitar este flujo, carga las facturas y extractos del período ' +
            'desde la pestaña Cargar (Vía A).',
    },
    certificates: {
        label: '// VÍA B — CERTIFICADOS F220 NO DISPONIBLE',
        title: 'No tenemos retenciones por tercero.',
        description:
            'El Certificado de Retención en la Fuente (F220) requiere desglose por tercero, ' +
            'concepto, mes y monto de retefuente/ReteICA practicada. Esos movimientos ' +
            'individuales sólo existen cuando la contabilidad se construye desde los ' +
            'documentos fuente (Vía A). En Vía B sólo tenemos los saldos consolidados ' +
            'de las cuentas 2365 y 2368.',
    },
    exogena: {
        label: '// VÍA B — INFORMACIÓN EXÓGENA NO DISPONIBLE',
        title: 'Exógena necesita el detalle por movimiento.',
        description:
            'Los formatos 1001 (pagos y retenciones) y 2276 (ingresos) de medios magnéticos ' +
            'DIAN requieren un renglón por cada tercero y concepto reportado. Vía B agrupa ' +
            'todo en saldos contables, así que no podemos generar los registros. Carga los ' +
            'documentos fuente del período desde Cargar (Vía A) para habilitar este reporte.',
    },
};

interface ViaBBlockerPanelProps {
    section: ViaBBlockedSection;
}

export default function ViaBBlockerPanel({ section }: ViaBBlockerPanelProps) {
    const router = useRouter();
    const copy = COPY[section];

    return (
        <BrutalistEmptyState
            label={copy.label}
            title={copy.title}
            description={copy.description}
            accent={palette.amber}
            action={
                <BrutalistButton
                    variant="outline"
                    size="md"
                    accent={palette.amber}
                    endIcon={<ArrowIcon sx={{ fontSize: 16 }} />}
                    onClick={() => router.push('/upload')}
                >
                    Cargar documentos fuente
                </BrutalistButton>
            }
        />
    );
}
