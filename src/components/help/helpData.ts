export interface HelpStep {
    title: string;
    body: string;
    code?: string;
}

export interface HelpSection {
    id: string;
    number: string;
    title: string;
    subtitle: string;
    lede: string;
    accent: string;
    steps: HelpStep[];
    tip?: string;
}

export const SECTIONS: HelpSection[] = [
    {
        id: 'empresa',
        number: '01',
        title: 'Empresa activa',
        subtitle: 'Tu tenant · tu universo contable',
        accent: '#6366F1',
        lede: 'Todo lo que ves en la app está filtrado por una empresa. Cambiarla cambia el mundo: transacciones, libros, reportes, impuestos. El selector vive en la barra superior.',
        steps: [
            {
                title: 'Seleccionar una empresa existente',
                body: 'Click en el selector de la barra superior. Escribe el nombre o el NIT para filtrar la lista. Al elegir, toda la app se refresca para ese tenant.',
            },
            {
                title: 'Crear una empresa nueva',
                body: 'Al final del dropdown hay un botón "+ Nueva empresa". Abre un diálogo pidiendo NIT, razón social y ciudad. Las tarifas tributarias se setean con valores por defecto y pueden ajustarse después.',
            },
            {
                title: 'Persistencia',
                body: 'La empresa seleccionada se guarda en localStorage — al recargar la app, volverás a la misma empresa automáticamente.',
                code: 'pae_active_nit → localStorage',
            },
        ],
        tip: 'Si el selector está vacío, probablemente el backend no está corriendo o no hay empresas registradas. Crea una con el botón "+ Nueva empresa".',
    },
    {
        id: 'dashboard',
        number: '02',
        title: 'Dashboard',
        subtitle: 'Foto financiera en tiempo real',
        accent: '#EC4899',
        lede: 'Vista panorámica de la salud contable: KPIs del mes, gráficos de ingresos vs gastos, alertas fiscales. Todo filtrado por la empresa activa.',
        steps: [
            {
                title: 'KPIs principales',
                body: 'Documentos pendientes, transacciones procesadas este mes, alertas activas y total de activos. Se actualizan en vivo.',
            },
            {
                title: 'Gráficos',
                body: 'Serie temporal de revenue vs expenses de los últimos meses. Y un breakdown de composición del balance.',
            },
        ],
    },
    {
        id: 'upload',
        number: '03',
        title: 'Cargar documentos',
        subtitle: 'Via A · Via B · dos flujos',
        accent: '#D4FF00',
        lede: 'Hay dos formas de alimentar el sistema. Entender cuándo usar cada una es clave: Via A construye desde cero, Via B parte de estados ya existentes.',
        steps: [
            {
                title: 'Via A — Documentos fuente',
                body: 'Facturas, extractos bancarios, XML. Se procesan por el pipeline completo de IA: extracción, clasificación, contabilización automática. El resultado son transacciones en el libro diario.',
                code: 'factura.pdf → ingesta → contador → transacción',
            },
            {
                title: 'Via B — Estados financieros',
                body: 'Subes 3 PDFs de primer nivel: Balance General, Estado de Resultados, Libro Auxiliar. El backend los reconoce automáticamente y DERIVA los otros 4 estados (flujo de caja, cambios en patrimonio, notas, libro diario).',
                code: '3 PDFs → 7 documentos financieros',
            },
            {
                title: 'Contabilización automática',
                body: 'No hay botón de "contabilizar". Al terminar la ingesta, el pipeline se dispara solo. Ve el resultado en Transacciones y Libros.',
            },
            {
                title: 'Historial',
                body: 'Al final de la página hay una sección "Documentos recientes" que lista las últimas 8 transacciones procesadas. Persiste entre navegaciones.',
            },
        ],
        tip: 'Si el documento trae un NIT distinto al de la empresa activa, el sistema usa el NIT activo. Sube con la empresa correcta seleccionada.',
    },
    {
        id: 'transacciones',
        number: '04',
        title: 'Transacciones',
        subtitle: 'El corazón del pipeline',
        accent: '#6366F1',
        lede: 'Cada documento subido se convierte en una transacción. Las tabs permiten filtrar por estado: pendientes, procesando, contabilizadas, rechazadas.',
        steps: [
            {
                title: 'Estados',
                body: 'PENDING: extraída, aún no contabilizada. PROCESSING: el agente está trabajando. POSTED: asiento contable creado. REJECTED: el auditor la rechazó.',
            },
            {
                title: 'Ver detalle',
                body: 'Click sobre una transacción abre la vista detalle: datos crudos, clasificación PUC, cálculos de impuestos, el asiento contable y el log de los agentes que la procesaron.',
            },
        ],
    },
    {
        id: 'libros',
        number: '05',
        title: 'Libros contables',
        subtitle: 'Diario · Mayor · Auxiliar · Balance',
        accent: '#EC4899',
        lede: 'Las cuatro vistas clásicas del plan contable. Todas filtradas por empresa y período. Todas exportables.',
        steps: [
            {
                title: 'Libro Diario',
                body: 'Registro cronológico de cada asiento con sus débitos y créditos. La fuente de verdad.',
            },
            {
                title: 'Libro Mayor',
                body: 'Agrupa por cuenta PUC. Muestra saldo acumulado y movimientos netos.',
            },
            {
                title: 'Auxiliares',
                body: 'Detalle por cuenta específica (requiere PUC como filtro). Útil para conciliaciones.',
            },
            {
                title: 'Balance',
                body: 'Balance de prueba. Activos = Pasivos + Patrimonio debe cuadrar.',
            },
        ],
    },
    {
        id: 'reportes',
        number: '06',
        title: 'Reportes financieros',
        subtitle: 'Balance · PyG · Flujo · 7 documentos',
        accent: '#D4FF00',
        lede: 'Los reportes se generan automáticamente cuando hay datos procesados. No hay botón de "generar" — solo "ver gráfico" y "descargar JSON".',
        steps: [
            {
                title: 'Balance General',
                body: 'Ecuación contable: Activos = Pasivos + Patrimonio. El sistema verifica automáticamente el cuadre.',
            },
            {
                title: 'Estado de Resultados',
                body: 'Ingresos menos costos menos gastos = utilidad neta. Con desglose por cuenta PUC.',
            },
            {
                title: 'Flujo de Caja',
                body: 'Saldo neto de cuentas de efectivo clase 11. Si la empresa no tiene movimientos clase 11, aparece vacío (normal).',
            },
            {
                title: 'Documentos Financieros',
                body: 'Sección inferior: lista los 7 estados financieros almacenados con su source_mode (directo/derivado/desde diario). Click en el ojito abre un drawer con vista estructurada.',
                code: 'balance_general · estado_resultados · libro_auxiliar · libro_diario · flujo_de_caja · cambios_patrimonio · notas_estados_financieros',
            },
        ],
        tip: 'El source_mode importa: "directo" = subido como PDF. "derivado" = auto-generado de los 3 primeros. "desde diario" = reconstruido de los asientos contables.',
    },
    {
        id: 'tributario',
        number: '07',
        title: 'Tributario',
        subtitle: 'IVA · Retenciones · ICA · Renta',
        accent: '#6366F1',
        lede: 'Módulo fiscal completo con las cuatro obligaciones colombianas principales. Todos los cálculos usan las tarifas configuradas por empresa.',
        steps: [
            {
                title: 'IVA',
                body: 'Saldo a pagar = IVA generado (ventas) - IVA descontable (compras). Aparece alerta si hay vencimiento cercano.',
            },
            {
                title: 'Retenciones practicadas',
                body: 'Retefuente + ReteICA + ReteIVA acumuladas. Con detalle histórico y referencias normativas.',
            },
            {
                title: 'ICA Municipal',
                body: 'Ingresos brutos × tasa ICA (por defecto 6.9‰). La tasa es configurable por empresa según el CIIU.',
            },
            {
                title: 'Provisión Renta',
                body: 'Utilidad antes de impuestos × 35% (Art. 240 ET). Provisión del impuesto societario.',
            },
        ],
        tip: 'Las tarifas (IVA, retefuente, ICA, renta) se setean al crear la empresa. Ajústalas en Configuración si tu empresa tiene régimen especial.',
    },
    {
        id: 'tips',
        number: '08',
        title: 'Tips & troubleshooting',
        subtitle: 'Atajos · errores comunes · performance',
        accent: '#EC4899',
        lede: 'Lo que nadie te enseña hasta que lo necesitas.',
        steps: [
            {
                title: 'Error "missing company tax settings"',
                body: 'Significa que el documento trae un NIT sin configurar. Crea la empresa primero o selecciónala desde el topbar antes de subir.',
            },
            {
                title: 'Error "PUC validation failed"',
                body: 'El agente sugirió un código PUC que no existe en la tabla de referencia. Reporta el código faltante para que se agregue al seed.',
            },
            {
                title: 'Reportes vacíos',
                body: 'Verifica que la empresa activa tenga transacciones contabilizadas (no solo pendientes). Si todo está POSTED, revisa los filtros de período.',
            },
            {
                title: 'Backend offline',
                body: 'El indicador en el TopBar pasa a rojo. Verifica NEXT_PUBLIC_API_URL en .env.local y que el backend esté corriendo.',
                code: 'uvicorn main:app --reload --host 0.0.0.0 --port 8000',
            },
        ],
    },
];
