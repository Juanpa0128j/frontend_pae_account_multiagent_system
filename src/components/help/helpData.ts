export interface HelpStep {
    title: string;
    body: string;
    highlights?: string[];
    warning?: string;
    related?: string;
}

export interface HelpSection {
    id: string;
    number: string;
    title: string;
    subtitle: string;
    lede: string;
    accent: string;
    kpis?: { value: string; label: string }[];
    steps: HelpStep[];
    tip?: string;
}

export const SECTIONS: HelpSection[] = [
    {
        id: 'empresa',
        number: '1',
        title: 'Empresa activa',
        subtitle: 'Tu tenant · tu universo contable',
        accent: '#6366F1',
        lede: 'Todo lo que ves en la app está filtrado por una empresa. Cambiarla cambia el mundo: transacciones, libros, reportes, impuestos. El selector vive en la barra superior y es el switch más importante de toda la aplicación.',
        kpis: [
            { value: '1', label: 'empresa activa por sesión' },
            { value: '∞', label: 'empresas soportadas' },
            { value: 'localStorage', label: 'persistencia' },
        ],
        steps: [
            {
                title: 'Seleccionar una empresa existente',
                body: 'Click en el selector de la barra superior abre un Autocomplete que busca tanto por razón social como por NIT. La lista viene del endpoint GET /api/v1/settings/companies y se cachea 5 minutos. Al elegir, TanStack Query invalida todas las queries dependientes y toda la app se refresca en cascada.',
                highlights: [
                    'Búsqueda fuzzy por nombre y NIT al mismo tiempo',
                    'Empresa activa se propaga a todos los hooks vía CompanyContext',
                    'Refresh automático: reportes, libros, transacciones, impuestos',
                ],
            },
            {
                title: 'Crear una empresa nueva',
                body: 'Al final del dropdown hay un botón "+ Nueva empresa". Abre un diálogo pidiendo solo NIT, razón social y ciudad. Las tarifas tributarias se inicializan con valores por defecto razonables para PYMES colombianas y pueden ajustarse después en Configuración.',
                highlights: [
                    'IVA general 19%, Retefuente servicios 11% · bienes 3% · arriendo 10%',
                    'ReteICA 6.9‰ (Bogotá por defecto — ajustable por municipio)',
                    'NIT se normaliza automáticamente (quita puntos, normaliza guión)',
                ],
                warning: 'Si el NIT ya existe, la operación actualiza la empresa en lugar de crear una nueva. El diálogo muestra error si hay conflicto.',
            },
            {
                title: 'Persistencia entre sesiones',
                body: 'La empresa seleccionada se guarda en localStorage bajo la clave pae_active_nit. Al recargar la app o abrir una nueva pestaña, el CompanyProvider lee ese valor y vuelves automáticamente a la misma empresa. Si la empresa guardada ya no existe en la lista, se usa la primera disponible.',
                highlights: [
                    'Fallback automático a la primera empresa si la guardada no existe',
                    'Por dominio · compartido entre pestañas del mismo navegador',
                    'Para limpiar: borrar localStorage o usar el selector',
                ],
            },
        ],
        tip: 'Si el selector está vacío, probablemente el backend no está corriendo o no hay empresas registradas. Crea una con el botón "+ Nueva empresa" o verifica NEXT_PUBLIC_API_URL en tu .env.local.',
    },

    {
        id: 'dashboard',
        number: '2',
        title: 'Dashboard',
        subtitle: 'Foto financiera en tiempo real',
        accent: '#EC4899',
        lede: 'Vista panorámica de la salud contable de la empresa activa. Los KPIs vienen de agregaciones directas sobre journal_entry_lines, así que reflejan el estado real al instante sin depender de jobs batch.',
        kpis: [
            { value: '4', label: 'KPIs principales' },
            { value: '60s', label: 'refresh staleTime' },
            { value: 'tiempo-real', label: 'sin batch processing' },
        ],
        steps: [
            {
                title: 'KPIs principales',
                body: 'Cuatro métricas arriba de la página: documentos pendientes (count de PENDING en transactions_pending), transacciones del mes (POSTED con created_at ≥ inicio de mes), alertas activas (REJECTED), y total de activos (suma de saldos de cuentas clase 1).',
                highlights: [
                    'Documentos pendientes → click lleva a Transacciones filtrado',
                    'Transacciones del mes → suma acumulada de lo contabilizado',
                    'Alertas activas → rechazos del agente auditor que requieren revisión',
                    'Total activos → agregado de journal_entry_lines con cuenta_puc LIKE "1%"',
                ],
            },
            {
                title: 'Gráficos y tendencias',
                body: 'Serie temporal de ingresos vs egresos de los últimos 6 meses y un breakdown de la composición del balance (activos corrientes vs no corrientes, pasivos, patrimonio). Los datos se derivan en vivo de journal_entry_lines agregados por mes.',
                highlights: [
                    'Ingresos = suma créditos cuenta 4xxx del período',
                    'Egresos = suma débitos cuentas 5xxx/6xxx del período',
                    'Balance = snapshot al último día del período',
                ],
            },
            {
                title: 'Actividad reciente',
                body: 'Lista de las últimas transacciones procesadas (POSTED) con concepto, monto y fecha. Click en cualquier fila abre el detalle con el trace completo del pipeline de agentes.',
                related: 'Ver módulo 3 — Transacciones',
            },
        ],
    },

    {
        id: 'upload',
        number: '3',
        title: 'Cargar documentos',
        subtitle: 'Via A · Via B · dos flujos',
        accent: '#D4FF00',
        lede: 'Hay dos formas de alimentar el sistema. Entender cuándo usar cada una es clave: Via A construye asientos desde documentos fuente (facturas, extractos). Via B importa estados financieros ya construidos y deriva los demás. Ambos flujos viven en la misma página con un toggle.',
        kpis: [
            { value: '2', label: 'flujos de ingesta' },
            { value: '20MB', label: 'tamaño máx por archivo' },
            { value: 'PDF/XLSX/XML', label: 'formatos soportados' },
        ],
        steps: [
            {
                title: 'Via A — Documentos fuente',
                body: 'Subes facturas de venta/compra, extractos bancarios, notas crédito/débito o XML de DIAN. El pipeline corre en 4 fases: extracción (PDF→texto/OCR), clasificación (cuentas PUC + terceros), cálculo tributario (retefuente, reteica, IVA), y contabilización (asientos de partida doble validados por el auditor). El resultado aparece en Transacciones con status POSTED.',
                highlights: [
                    'Agentes: Ingesta → Contador → Tributario → Auditor',
                    'Tiempo típico: 30–90s por documento, según complejidad',
                    'Detección automática de nit_emisor, nit_receptor, fechas, items',
                    'Validación de partida doble antes de contabilizar',
                ],
            },
            {
                title: 'Via B — Estados financieros',
                body: 'Subes 3 PDFs de primer nivel: Balance General, Estado de Resultados, Libro Auxiliar. El backend reconoce automáticamente el tipo de cada uno mediante un clasificador LLM que lee el contenido. Tras validar los 3, dispara la derivación automática de los otros 4 estados: flujo de caja, cambios en el patrimonio, notas, libro diario.',
                highlights: [
                    'Reconocimiento automático por patrones de texto (PUC, terminología NIIF)',
                    'Los 3 deben ser de la misma empresa y mismo período para derivar',
                    'Derivación en memoria · no se dispara LLM de nuevo',
                    'Polling cada 2s con timeout de 2 minutos en el frontend',
                ],
                warning: 'Si los 3 archivos no cubren el mismo período o NIT, la derivación no se dispara y solo quedan los 3 originales con source_mode directo.',
            },
            {
                title: 'Contabilización automática',
                body: 'No hay botón de "contabilizar" en Transacciones. Al terminar la ingesta, el pipeline encadena la contabilización sin intervención del usuario. Esto evita fricción de pasos manuales y reduce errores. El estado pasa por PENDING → PROCESSING → POSTED sin bloqueo.',
                highlights: [
                    'Trigger implícito: una vez ingesta termina, contabilizar arranca',
                    'Si fallan 3 intentos, el status queda REJECTED con detalle',
                    'Reintentable desde el detalle de la transacción',
                ],
            },
            {
                title: 'Historial "Documentos recientes"',
                body: 'Al final de la página de upload hay una tabla con las últimas 8 transacciones procesadas para la empresa activa. No se pierde al navegar: viene del endpoint de transacciones filtrado por company_nit.',
                related: 'Ver módulo 3 — Transacciones',
            },
        ],
        tip: 'Si el documento trae un NIT distinto al de la empresa activa (frecuente en facturas de compra), el sistema usa el NIT activo del selector. Asegúrate de tener la empresa correcta seleccionada antes de subir.',
    },

    {
        id: 'transacciones',
        number: '4',
        title: 'Transacciones',
        subtitle: 'El corazón del pipeline',
        accent: '#6366F1',
        lede: 'Cada documento subido se convierte en una transacción. Las tabs filtran por estado: todas, pendientes, procesando, contabilizadas, rechazadas. El detalle expone el razonamiento completo de los agentes que la procesaron.',
        kpis: [
            { value: '4', label: 'estados posibles' },
            { value: '3s', label: 'polling activo' },
            { value: 'full trace', label: 'auditabilidad total' },
        ],
        steps: [
            {
                title: 'Estados y ciclo de vida',
                body: 'PENDING: transacción extraída del documento, aún no contabilizada. PROCESSING: el pipeline está activamente trabajando (agentes corriendo). POSTED: asiento contable creado, partida doble verificada, inmutable. REJECTED: el agente auditor rechazó la clasificación — requiere revisión manual.',
                highlights: [
                    'PENDING ⭢ aparece justo tras ingesta, antes del contador',
                    'PROCESSING ⭢ puede tomar hasta 90s · polling cada 3s',
                    'POSTED ⭢ líneas en journal_entry_lines creadas',
                    'REJECTED ⭢ revisar en detalle por qué falló el audit',
                ],
            },
            {
                title: 'Ver detalle completo',
                body: 'Click sobre cualquier fila abre la vista detalle. Incluye: datos crudos del documento, clasificación PUC sugerida con justificación, cálculos de impuestos con referencias normativas (Art. 383 ET, etc.), el asiento contable generado y el log cronológico de cada agente que intervino con su duración y resultado.',
                highlights: [
                    'Razonamiento visible: por qué el contador escogió cada cuenta',
                    'Referencias legales inline para cálculos tributarios',
                    'Asiento en tabla con débitos/créditos por línea',
                    'Timeline de agentes con duración y resultado por paso',
                ],
            },
            {
                title: 'Filtros y búsqueda',
                body: 'Además de las tabs por estado, puedes buscar por NIT del emisor, rango de fechas, o concepto. Los filtros se aplican server-side vía query params, no client-side, así que funcionan con datasets grandes.',
            },
        ],
    },

    {
        id: 'libros',
        number: '5',
        title: 'Libros contables',
        subtitle: 'Diario · Mayor · Auxiliar · Balance',
        accent: '#EC4899',
        lede: 'Las cuatro vistas clásicas del plan contable colombiano. Todas se derivan en vivo de journal_entry_lines — no hay denormalización, así que siempre reflejan el estado actual. Exportables a Excel y CSV.',
        kpis: [
            { value: '4', label: 'tipos de libro' },
            { value: 'PUC', label: 'agrupación estándar' },
            { value: 'CSV/XLSX', label: 'formatos de export' },
        ],
        steps: [
            {
                title: 'Libro Diario',
                body: 'El registro cronológico de cada asiento contable con sus débitos y créditos. Es la fuente de verdad. Cada fila es una línea del asiento con cuenta PUC, tercero NIT, débito o crédito, y descripción. Si algo no cuadra aquí, no cuadra en ningún otro libro.',
                highlights: [
                    'Ordenado por fecha descendente por defecto',
                    'Cada transacción puede tener N líneas (partida doble o múltiple)',
                    'Filtro por rango de fecha y por tercero',
                ],
            },
            {
                title: 'Libro Mayor',
                body: 'Agrupa por cuenta PUC y muestra el saldo acumulado, total de débitos y total de créditos. Útil para ver rápidamente cuánto se ha movido cada cuenta. El saldo final debe coincidir con el balance.',
                highlights: [
                    'Una fila por cuenta PUC',
                    'Saldo = débitos - créditos (para cuentas deudoras)',
                    'Click en una cuenta lleva al auxiliar de esa cuenta',
                ],
            },
            {
                title: 'Auxiliares',
                body: 'Detalle por cuenta específica. Requiere seleccionar un código PUC como filtro. Muestra todos los movimientos de esa cuenta con fecha, tercero, concepto y monto. Indispensable para conciliaciones bancarias y de cartera.',
                highlights: [
                    'Filtro obligatorio por cuenta_puc',
                    'Típico para cuentas de bancos (1110xx), clientes (1305), proveedores (2205)',
                    'Soporta filtro adicional por tercero NIT',
                ],
            },
            {
                title: 'Balance de prueba',
                body: 'Balance de comprobación que lista todas las cuentas con su saldo. La suma de débitos debe igualar la suma de créditos. Es la validación matemática de la partida doble: si no cuadra, hay un asiento desbalanceado en algún lado.',
                highlights: [
                    'Total débitos = Total créditos (siempre debe cumplirse)',
                    'Sirve como input para generar el Balance General',
                ],
                warning: 'Si el balance no cuadra, hay una transacción corrupta en el sistema. Revisa el libro diario buscando el asiento que rompe la partida doble.',
            },
        ],
    },

    {
        id: 'reportes',
        number: '6',
        title: 'Reportes financieros',
        subtitle: 'Balance · PyG · Flujo · 7 documentos',
        accent: '#D4FF00',
        lede: 'Los reportes se generan automáticamente cuando hay datos procesados. No hay botón de "generar" — solo "ver gráfico" y "descargar JSON". La filosofía: si hay asientos contables, hay reportes. Sin batch, sin espera.',
        kpis: [
            { value: '3', label: 'reportes principales' },
            { value: '7', label: 'documentos financieros' },
            { value: '3', label: 'source_modes' },
        ],
        steps: [
            {
                title: 'Balance General',
                body: 'La ecuación contable fundamental: Activos = Pasivos + Patrimonio. El sistema verifica automáticamente el cuadre y muestra un mensaje si la ecuación no se cumple (lo que indicaría un problema en el libro diario).',
                highlights: [
                    'Activos = suma saldos cuenta_puc clase 1',
                    'Pasivos = suma saldos cuenta_puc clase 2',
                    'Patrimonio = suma clase 3 + utilidad neta del período',
                    'Cuadre verificado: mensaje explícito si no match',
                ],
            },
            {
                title: 'Estado de Resultados',
                body: 'Ingresos menos costos de ventas menos gastos = utilidad neta. Con desglose línea por línea por cuenta PUC. Útil para identificar rápido qué categorías pesan más en los resultados del período.',
                highlights: [
                    'Ingresos: clase 4xxx · créditos',
                    'Costos ventas: clase 6xxx · débitos',
                    'Gastos: clase 5xxx · débitos',
                    'Utilidad bruta = ingresos - costos de venta',
                    'Utilidad neta = utilidad bruta - gastos',
                ],
            },
            {
                title: 'Flujo de Caja',
                body: 'Método directo: saldo neto de cuentas de efectivo y bancos (clase 11). Si la empresa no tiene movimientos en clase 11 (por ejemplo cuando solo se suben facturas sin conciliación bancaria), el gráfico aparece vacío. Es normal, no un error.',
                highlights: [
                    'Solo mira cuentas clase 11 (caja, bancos, equivalentes)',
                    'Método directo · más simple que el indirecto',
                    'Empty state si no hay movimientos clase 11',
                ],
                warning: 'Para ver flujo indirecto (con ajustes por depreciación, etc.), usa el documento flujo_de_caja derivado de Via B.',
            },
            {
                title: 'Documentos Financieros · los 7 estados',
                body: 'La sección inferior lista los 7 estados financieros almacenados: balance, estado de resultados, libro auxiliar, libro diario, flujo de caja, cambios en patrimonio, notas. Cada uno tiene un source_mode que indica cómo se generó. Click en el ojito abre un drawer con vista estructurada específica por tipo.',
                highlights: [
                    '"directo" → subido como PDF (Via B)',
                    '"derivado" → auto-generado de los 3 primeros (flujo, cambios, notas)',
                    '"desde diario" → reconstruido de journal_entry_lines (Via A)',
                    'Drawer con formato custom por tipo de documento',
                ],
            },
        ],
        tip: 'El source_mode importa muchísimo para auditoría. Un balance "directo" puede diferir de uno "desde diario" — el primero refleja lo que reportó la empresa, el segundo lo que se puede reconstruir del libro. Discrepancias son normales y útiles para revisión.',
    },

    {
        id: 'tributario',
        number: '7',
        title: 'Tributario',
        subtitle: 'IVA · Retenciones · ICA · Renta',
        accent: '#6366F1',
        lede: 'Módulo fiscal completo con las cuatro obligaciones colombianas principales. Todos los cálculos usan las tarifas configuradas por empresa en company_settings — ajustables sin tocar código para cambios normativos.',
        kpis: [
            { value: '4', label: 'impuestos soportados' },
            { value: 'PUC-based', label: 'cálculos automáticos' },
            { value: 'editable', label: 'tarifas por empresa' },
        ],
        steps: [
            {
                title: 'IVA · Impuesto al Valor Agregado',
                body: 'Saldo a pagar = IVA generado (ventas) - IVA descontable (compras). IVA generado se acumula en cuenta 240808, descontable en 240802. La diferencia es lo que debe declararse a la DIAN en el período. Aparece alerta visual si hay vencimiento cercano.',
                highlights: [
                    'Tasa general 19% (configurable por régimen)',
                    'IVA generado (240808) · créditos del período',
                    'IVA descontable (240802) · débitos del período',
                    'Referencia: Art. 420 ET',
                ],
            },
            {
                title: 'Retenciones practicadas',
                body: 'Suma de Retefuente + ReteICA + ReteIVA acumuladas en el período. Cada una se acumula en su propia cuenta PUC y tiene su propio cálculo según el tipo de operación (servicios vs bienes vs arrendamiento). Historial completo disponible para cruces con proveedores.',
                highlights: [
                    'Retefuente servicios: 11% (Art. 392 ET)',
                    'Retefuente bienes: 3% (Art. 401 ET)',
                    'Retefuente arrendamiento: 10%',
                    'ReteICA: tarifa municipal según CIIU',
                    'ReteIVA: 15% · Art. 437-1 ET',
                ],
            },
            {
                title: 'ICA Municipal',
                body: 'Impuesto de Industria y Comercio sobre ingresos brutos del período. Se calcula ingresos_brutos × tasa_ica. La tasa por defecto es 6.9‰ (Bogotá PYMES) pero es configurable por empresa según el CIIU y el municipio.',
                highlights: [
                    'Base gravable: ingresos brutos del período',
                    'Tasa Bogotá PYMES: 6.9‰ (0.0069)',
                    'Tarifas varían entre 2‰ y 14‰ según CIIU',
                    'Cuenta PUC: 540101 (gasto) y 240808 (pasivo)',
                ],
            },
            {
                title: 'Provisión Impuesto de Renta',
                body: 'Provisión societaria del 35% sobre la utilidad antes de impuestos (Art. 240 ET, reforma tributaria Ley 2277/2022). No es el impuesto final declarado — es la provisión contable que debe reconocerse en el período.',
                highlights: [
                    'Tasa general personas jurídicas: 35%',
                    'Tasa zona franca: 20% (configurable)',
                    'Se calcula sobre utilidad contable, ajustada luego fiscalmente',
                    'Referencia: Ley 2277/2022, Art. 240 ET',
                ],
            },
        ],
        tip: 'Las tarifas (IVA, retefuente, ICA, renta) se setean al crear la empresa con valores por defecto razonables. Si tu empresa tiene régimen especial (zona franca, CIIU con tarifa distinta, etc.), ajústalas en Configuración → Tarifas tributarias antes de subir el primer documento.',
    },

    {
        id: 'chat',
        number: '8',
        title: 'Chat IA',
        subtitle: 'Pregunta · agente conversacional financiero',
        accent: '#D4FF00',
        lede: 'Conversación natural con un agente IA que responde preguntas sobre tu contabilidad: balance, IVA, retenciones, ratios, ranking de cuentas. Las respuestas vienen acompañadas de tarjetas de datos estructuradas con cifras reales.',
        kpis: [
            { value: '8+', label: 'tipos de tarjetas de datos' },
            { value: 'streaming', label: 'tokens en tiempo real' },
            { value: '∞', label: 'sesiones por usuario' },
        ],
        steps: [
            {
                title: 'Cómo funciona',
                body: 'Escribes tu pregunta en lenguaje natural. El agente analiza la intención, consulta la base de datos de la empresa activa, formula la respuesta en markdown y opcionalmente adjunta tarjetas estructuradas (balance, P&G, ratios, IVA). Los tokens se transmiten en streaming así que ves la respuesta formándose.',
                highlights: [
                    'Respuestas tipadas: el agente puede devolver hasta 8 tipos de cards',
                    'Streaming en vivo · puedes detener con el botón de stop',
                    'Markdown completo: tablas, listas, código, blockquotes',
                    'Filtra por la empresa activa del TopBar — cambia y la conversación cambia de contexto',
                ],
            },
            {
                title: 'Sugerencias del estado vacío',
                body: 'Cuando entras por primera vez sin sesiones, la página muestra cuatro preguntas-plantilla que cubren los flujos más comunes: balance general, deuda IVA, liquidez, análisis completo. Click en cualquiera y el agente responde sin que tengas que escribir.',
                highlights: [
                    '¿Cuál es mi balance general? · invoca card balance',
                    '¿Cuánto debo de IVA? · invoca card iva',
                    '¿Cómo está mi liquidez? · invoca card ratios + cashflow',
                    'Dame un análisis completo · respuesta combinada con varios cards',
                ],
            },
            {
                title: 'Sesiones',
                body: 'Cada conversación queda guardada en el sidebar izquierdo. Click en una sesión vieja para retomarla, click en "Nueva conversación" para empezar limpio. Las sesiones persisten entre recargas y dispositivos (vinculadas a tu cuenta y a la empresa activa).',
                highlights: [
                    'Sesión activa marcada con dot chartreuse + border-left',
                    'Hover sobre una sesión muestra el botón de borrar',
                    'Sin sesiones aún → estado vacío con `// SIN SESIONES` mono',
                ],
            },
            {
                title: 'Tarjetas de datos (data cards)',
                body: 'Cuando el agente cita cifras concretas, las renderiza en tarjetas brutalistas con eyebrow accent + tabla mono. Cada tipo tiene su color: balance indigo, P&G verde, IVA pink, ratios chartreuse. La fila final destaca el número clave (utilidad neta, IVA a pagar, etc.) con tipografía display.',
            },
        ],
        tip: 'Si el agente responde "no tengo datos suficientes", probablemente la empresa activa aún no tiene transacciones contabilizadas. Sube documentos en /upload y vuelve a preguntar — las consultas se hacen contra journal_entry_lines en vivo.',
    },

    {
        id: 'tips',
        number: '9',
        title: 'Tips & troubleshooting',
        subtitle: 'Atajos · errores comunes · performance',
        accent: '#EC4899',
        lede: 'Lo que nadie te enseña hasta que lo necesitas. Errores frecuentes con causa y solución, comportamientos no obvios, atajos de teclado, cómo interpretar el estado del sistema.',
        kpis: [
            { value: '/', label: 'buscar en guía' },
            { value: '?', label: 'drawer rápido' },
            { value: 'TopBar', label: 'indicador API live' },
        ],
        steps: [
            {
                title: 'Error "missing company tax settings for NIT X"',
                body: 'Causa: el documento subido trae un NIT en el cuerpo (generalmente el nit_receptor) que no tiene company_settings registrado. El backend intenta usar ese NIT para aplicar tarifas y falla.',
                highlights: [
                    'Solución rápida: crear la empresa con ese NIT desde el selector',
                    'Solución correcta: seleccionar la empresa activa antes de subir',
                    'El frontend ahora pasa company_nit explícito para evitar esto',
                ],
            },
            {
                title: 'Error "PUC validation failed: Missing codes: X"',
                body: 'El agente contador sugirió un código PUC que no existe en la tabla cuentas_puc. Esto pasa cuando el documento contiene cuentas de planes sectoriales (salud, educación, etc.) que no están en el seed por defecto.',
                highlights: [
                    'Reporta el código faltante al equipo backend',
                    'Se agrega al seed en scripts/seed_puc.py',
                    'Re-run: python scripts/seed_puc.py',
                ],
            },
            {
                title: 'Reportes vacíos aunque hay transacciones',
                body: 'Verifica que las transacciones estén POSTED, no solo PENDING. Los reportes solo leen de journal_entry_lines, que se crean en la fase final del pipeline (contabilización). Si están PENDING o REJECTED, no existen asientos.',
                highlights: [
                    'Chequear tab "Contabilizadas" en Transacciones',
                    'Si hay muchos PENDING, revisar logs del backend',
                    'Si hay REJECTED, abrir el detalle y ver por qué falló audit',
                ],
                related: 'Ver módulo 3 — Transacciones',
            },
            {
                title: 'Backend offline / API degradada',
                body: 'El indicador en el TopBar muestra el estado: verde = OK, ámbar = degradada (alguna dependencia caída), rojo = offline. Health check cada 30s. Si está rojo, la mayoría de la UI cae en mock data o muestra estados vacíos.',
                highlights: [
                    'Verificar NEXT_PUBLIC_API_URL en .env.local',
                    'Verificar que el backend esté corriendo en el puerto correcto',
                    'Si cambias de puerto, reiniciar Next dev server (npm run dev)',
                ],
            },
            {
                title: 'Atajos de teclado y navegación',
                body: 'Desde cualquier parte de la guía, presiona / para enfocar el buscador. Desde cualquier página de la app, el botón ? del TopBar abre el drawer de ayuda rápida con acceso directo a los 8 módulos.',
                highlights: [
                    '/  → buscar en la guía (estando en /help)',
                    '?  → drawer de ayuda rápida (TopBar)',
                    'Descarga PDF → botón al final de esta guía',
                ],
            },
        ],
    },
];
