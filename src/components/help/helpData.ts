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
            { value: 'auto', label: 'persistencia entre sesiones' },
        ],
        steps: [
            {
                title: 'Seleccionar una empresa existente',
                body: 'Haz clic en el selector de la barra superior para buscar por razón social o NIT. Al elegir, toda la aplicación se actualiza automáticamente: transacciones, libros, reportes e impuestos cambian al contexto de la empresa seleccionada.',
                highlights: [
                    'Búsqueda fuzzy por nombre y NIT al mismo tiempo',
                    'La empresa activa se propaga a todos los módulos de la app',
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
                warning:
                    'Si el NIT ya existe, la operación actualiza la empresa en lugar de crear una nueva. El diálogo muestra error si hay conflicto.',
            },
            {
                title: 'Persistencia entre sesiones',
                body: 'La empresa seleccionada se recuerda automáticamente. Al recargar la app o abrir una nueva pestaña, vuelves directamente a la misma empresa. Si la empresa ya no existe, el sistema carga la primera disponible.',
                highlights: [
                    'Selección persistente entre recargas y pestañas',
                    'Cambio instantáneo con el selector del TopBar',
                    'Si algo falla, selecciona la empresa manualmente desde el selector',
                ],
            },
        ],
        tip: 'Si el selector aparece vacío, asegúrate de haber creado al menos una empresa con el botón "+ Nueva empresa". También verifica que el sistema esté disponible revisando el indicador de conexión en la barra superior.',
    },

    {
        id: 'dashboard',
        number: '2',
        title: 'Dashboard',
        subtitle: 'Foto financiera en tiempo real',
        accent: '#EC4899',
        lede: 'Vista panorámica de la salud contable de la empresa activa. Los KPIs se calculan en tiempo real a partir de los asientos contabilizados, así que reflejan el estado real al instante sin depender de jobs batch.',
        kpis: [
            { value: '4', label: 'KPIs principales' },
            { value: '6', label: 'meses en tendencias' },
            { value: 'tiempo-real', label: 'sin procesamiento diferido' },
        ],
        steps: [
            {
                title: 'KPIs principales',
                body: 'Cuatro métricas en la parte superior: documentos pendientes de procesar, transacciones contabilizadas en el mes en curso, alertas activas que requieren atención, y el total de activos de la empresa. Haz clic en cualquier KPI para ir directamente al módulo correspondiente.',
                highlights: [
                    'Documentos pendientes → ir a Transacciones con filtro activo',
                    'Transacciones del mes → suma acumulada de lo contabilizado',
                    'Alertas activas → documentos rechazados que requieren revisión',
                    'Total activos → valor acumulado de todas las cuentas de activo',
                ],
            },
            {
                title: 'Gráficos y tendencias',
                body: 'Gráfico de ingresos vs egresos de los últimos 6 meses y un desglose de la composición del balance (activos corrientes vs no corrientes, pasivos, patrimonio). Los datos se actualizan con cada nuevo documento contabilizado.',
                highlights: [
                    'Ingresos del período: cuentas de ingresos (clase 4)',
                    'Egresos del período: cuentas de costos y gastos (clases 5 y 6)',
                    'Balance: foto al último día del período',
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
        lede: 'Hay dos formas de alimentar el sistema. Entender cuándo usar cada una es clave: Vía A construye asientos desde documentos fuente (facturas, extractos, recibos de caja). Vía B importa estados financieros ya construidos y deriva los demás. Ambos flujos viven en la misma página con un selector en la parte superior.',
        kpis: [
            { value: '2', label: 'flujos de ingesta' },
            { value: '20MB', label: 'tamaño máx por archivo' },
            { value: 'PDF/XLSX/XML', label: 'formatos soportados' },
        ],
        steps: [
            {
                title: 'Vía A — Documentos fuente',
                body: 'Subes facturas de venta/compra, extractos bancarios, recibos de caja, notas crédito/débito, declaraciones de IVA o XML de DIAN. El pipeline corre en 4 fases: extracción (PDF→texto/OCR), clasificación (cuentas PUC + terceros), cálculo tributario (retefuente, reteica, IVA), y contabilización (asientos de partida doble validados por el auditor). El resultado aparece en Transacciones con estado CONTABILIZADA.',
                highlights: [
                    'Agentes: Ingesta → Contador → Tributario → Auditor',
                    'Tiempo típico: 30–90s por documento, según complejidad',
                    'Detección automática de NIT emisor, NIT receptor, fechas e ítems',
                    'Validación de partida doble antes de contabilizar',
                    'Documentos detectados como estados financieros se redirigen a Vía B automáticamente',
                ],
            },
            {
                title: 'Vía B — Estados financieros',
                body: 'Subes hasta 4 PDFs de primer nivel: Balance General del período actual, Estado de Resultados, Libro Auxiliar, y opcionalmente el Balance General del período anterior (necesario para NIC 7 — flujo de caja indirecto). Arrastra todos los archivos a la zona de carga múltiple y el sistema intentará asignarlos por nombre. Se abre un diálogo de confirmación donde puedes verificar o corregir la asignación antes de confirmar. Si el Balance anterior ya está en el sistema, aparece como disponible y no es necesario subirlo de nuevo.',
                highlights: [
                    'Drop múltiple: suelta 1–4 PDFs a la vez',
                    'Clasificación por nombre: "anterior/previo" → BG anterior, "balance/activo" → BG, "resultado/pnl" → ER, "auxiliar/libro" → LA',
                    'Diálogo de confirmación: verifica o corrige la asignación antes de enviar',
                    'El Balance anterior es opcional pero habilita derivación NIC 7 completa',
                    'Derivación de flujo de caja, cambios en patrimonio y notas se ejecuta desde la sección Derivación una vez subidos los documentos base',
                ],
                warning:
                    'Si los documentos no cubren el mismo período o NIT, la derivación no se dispara. El Balance anterior debe ser del período inmediatamente anterior para que NIC 7 calcule correctamente las variaciones de capital de trabajo.',
            },
            {
                title: 'Contabilización automática y revisión humana',
                body: 'No hay botón de "contabilizar" en Transacciones. Al terminar la ingesta, el pipeline encadena la contabilización sin intervención del usuario. En la mayoría de los casos el estado pasa PENDIENTE → PROCESANDO → CONTABILIZADA sin bloqueo. Sin embargo, cuando el agente auditor detecta ambigüedades o inconsistencias en las cuentas sugeridas, puede escalar la transacción a REVISIÓN — se muestra un aviso en la cola y el pipeline espera tu confirmación antes de continuar.',
                highlights: [
                    'Trigger implícito: una vez ingesta termina, contabilizar arranca',
                    'REVISIÓN: el auditor pide confirmación humana — abre el detalle y acepta o rechaza',
                    'Tras confirmar en REVISIÓN, el pipeline retoma y la transacción pasa a CONTABILIZADA',
                    'Si fallan los reintentos, el estado queda RECHAZADA con detalle del error',
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
            { value: '5', label: 'estados posibles' },
            { value: 'tiempo real', label: 'actualización automática' },
            { value: 'trazable', label: 'auditabilidad total' },
        ],
        steps: [
            {
                title: 'Estados y ciclo de vida',
                body: 'Pendiente: documento recibido, aún no procesado. Procesando: el sistema está trabajando — puede tomar hasta 90 segundos. Revisión: el auditor detectó algo que requiere tu confirmación antes de continuar — abre el detalle, revisa y acepta o rechaza. Contabilizada: asiento creado y verificado, no se puede modificar. Rechazada: el proceso falló o fue rechazado — revisa el detalle para ver por qué.',
                highlights: [
                    'PENDIENTE ⭢ aparece justo tras ingesta, antes del contador',
                    'PROCESANDO ⭢ puede tomar hasta 90s · polling cada 3s',
                    'REVISIÓN ⭢ pipeline pausado esperando confirmación — no es un error, es auditoría',
                    'CONTABILIZADA ⭢ asientos contables generados y verificados',
                    'RECHAZADA ⭢ revisar en detalle por qué falló el auditor',
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
        lede: 'Las cuatro vistas clásicas del plan contable colombiano. Se actualizan automáticamente con cada documento contabilizado — no hay denormalización, así que siempre reflejan el estado actual. Exportables a Excel y CSV.',
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
                warning:
                    'Si el balance no cuadra, hay una transacción corrupta en el sistema. Revisa el libro diario buscando el asiento que rompe la partida doble.',
            },
        ],
    },

    {
        id: 'derivacion',
        number: '6',
        title: 'Derivación',
        subtitle: 'Via A · Via B · estados financieros completos',
        accent: '#D4FF00',
        lede: 'El módulo de Derivación convierte los documentos cargados en los 7 estados financieros completos requeridos por NIIF. Hay dos rutas según el origen de los datos: Via B (importa PDFs ya construidos) y Via A (reconstruye desde el libro diario). El resultado es idéntico — la ruta depende del tipo de empresa y los documentos disponibles.',
        kpis: [
            { value: '7', label: 'estados derivados' },
            { value: '2', label: 'rutas de derivación' },
            { value: 'NIC 7', label: 'flujo indirecto' },
        ],
        steps: [
            {
                title: 'Via B — Derivar desde PDFs',
                body: 'Si la empresa tiene al menos Balance General, Estado de Resultados y Libro Auxiliar cargados para un período, el botón "Derivar" aparece en la tarjeta del período. La derivación genera flujo de caja (NIC 7), cambios en el patrimonio y notas en memoria, sin llamada adicional a LLM. El resultado se persiste como estados con source_mode="derivado".',
                highlights: [
                    'Requiere los 3 documentos base del mismo período y NIT',
                    'Balance anterior opcional — si no está, flujo de caja omite variaciones de capital de trabajo',
                    'Tarjeta verde con "✓ Derivado" cuando ya fue procesado — no se puede derivar dos veces',
                    'Tarjeta ámbar si derivación está incompleta — re-derivar disponible',
                ],
                warning:
                    'Sin el Balance General anterior, la derivación NIC 7 es parcial: calcula efectivo neto pero no desglosa variaciones de capital de trabajo ni ajustes por depreciación.',
            },
            {
                title: 'Via A — Derivar desde el diario',
                body: 'Para empresas que trabajan con Vía A (generan asientos desde facturas y extractos), la derivación lee directamente los asientos contabilizados en el libro diario. Selecciona el período (fecha inicio y fin) y presiona "Actualizar". El sistema agrupa los asientos por clase PUC y construye el balance, estado de resultados, y luego los estados derivados.',
                highlights: [
                    'No requiere PDFs — usa asientos del pipeline Via A',
                    'Rango de fechas seleccionable · puede derivar múltiples períodos',
                    'Re-derivar es idempotente: sobreescribe el período anterior',
                    'Muestra rango mínimo y máximo de fechas disponibles en el diario',
                ],
            },
            {
                title: 'Matriz de períodos',
                body: 'La vista principal muestra una matriz con los períodos disponibles como filas y los tipos de documento (BG/ER/LA) como columnas. Un punto chartreuse indica que ese documento existe para ese período; un guión ámbar indica que falta. Esta vista permite identificar rápidamente qué está listo para derivar y qué falta cargar.',
                highlights: [
                    'BG = Balance General · ER = Estado de Resultados · LA = Libro Auxiliar',
                    'Punto verde = presente · guión ámbar = faltante',
                    'Período completo (3 puntos) → botón "Derivar" activo',
                    'Período incompleto → muestra qué documentos cargar primero',
                ],
            },
            {
                title: 'Navegación entre Via A y Via B',
                body: 'El módulo tiene un toggle en la parte superior para cambiar entre Via A y Via B. El sidebar lleva directamente a la pestaña correcta según el locked_pathway de la empresa activa: empresas con pathway "build_from_scratch" van a Via A, las de "work_with_existing" van a Via B. La URL refleja la pestaña activa con el parámetro ?tab=via-a o ?tab=via-b.',
                highlights: [
                    'URL persistente: ?tab=via-a / ?tab=via-b — compartible y navegable con back',
                    'Sidebar inteligente: detecta locked_pathway y abre la pestaña correcta',
                    'Toggle manual siempre disponible independientemente del pathway',
                ],
            },
        ],
        tip: 'Después de derivar, ve a Reportes (módulo 7) para ver los 7 estados financieros completos con sus gráficos y opciones de descarga. Los estados derivados aparecen con source_mode="derivado" o "desde diario" según la ruta usada.',
    },

    {
        id: 'reportes',
        number: '7',
        title: 'Reportes financieros',
        subtitle: 'Balance · PyG · Flujo · 7 documentos',
        accent: '#D4FF00',
        lede: 'Los reportes se generan automáticamente cuando hay datos procesados. No hay botón de "generar" — solo "ver gráfico" y "descargar JSON". La filosofía: si hay asientos contables, hay reportes. Sin batch, sin espera.',
        kpis: [
            { value: '3', label: 'reportes principales' },
            { value: '7', label: 'documentos financieros' },
            { value: '3', label: 'orígenes de datos' },
        ],
        steps: [
            {
                title: 'Balance General',
                body: 'Muestra la ecuación contable fundamental: Activos = Pasivos + Patrimonio. El sistema verifica automáticamente el cuadre y te avisa si la ecuación no se cumple, lo que indicaría una inconsistencia en los asientos registrados.',
                highlights: [
                    'Activos: cuentas del grupo 1 del PUC',
                    'Pasivos: cuentas del grupo 2 del PUC',
                    'Patrimonio: cuentas del grupo 3 más la utilidad neta del período',
                    'Aviso visible si el balance no cuadra',
                ],
            },
            {
                title: 'Estado de Resultados',
                body: 'Ingresos menos costos de ventas menos gastos = utilidad neta. Con desglose por cuenta PUC, útil para identificar qué categorías pesan más en los resultados del período.',
                highlights: [
                    'Ingresos: cuentas del grupo 4',
                    'Costos de ventas: cuentas del grupo 6',
                    'Gastos: cuentas del grupo 5',
                    'Utilidad bruta = ingresos − costos de venta',
                    'Utilidad neta = utilidad bruta − gastos',
                ],
            },
            {
                title: 'Flujo de Caja',
                body: 'Muestra los movimientos de efectivo y bancos de la empresa. Si la empresa solo ha subido facturas sin conciliación bancaria, el gráfico puede aparecer vacío. Eso es normal — para ver el flujo completo, sube también los extractos bancarios o usa la derivación desde Vía B.',
                highlights: [
                    'Basado en movimientos de caja y bancos (PUC clase 11)',
                    'Método directo: flujo real de entradas y salidas de efectivo',
                    'Sin movimientos bancarios → gráfico vacío (no es un error)',
                ],
                warning:
                    'Para un flujo de caja con ajustes por depreciación y variaciones de capital de trabajo, usa la derivación desde el módulo Derivación con Vía B.',
            },
            {
                title: 'Los 7 estados financieros',
                body: 'La sección inferior lista los estados financieros disponibles: balance general, estado de resultados, libro auxiliar, libro diario, flujo de caja, cambios en patrimonio y notas. Cada uno indica cómo fue generado (subido directamente, derivado o reconstruido desde asientos). Haz clic en el ícono de vista para ver el detalle completo.',
                highlights: [
                    'Subido: el documento fue cargado como PDF (Vía B)',
                    'Derivado: generado automáticamente a partir de los documentos base',
                    'Desde asientos: reconstruido a partir del libro diario (Vía A)',
                    'Vista detallada por tipo al hacer clic en el ícono',
                ],
            },
        ],
        tip: 'Un balance "subido" puede diferir de uno "desde asientos" — el primero refleja lo que reportó la empresa, el segundo lo que se reconstruye del libro diario. Las diferencias son normales y útiles para auditoría.',
    },

    {
        id: 'tributario',
        number: '8',
        title: 'Tributario',
        subtitle: 'Declaraciones · Calendario · Certificados · Exógena',
        accent: '#6366F1',
        lede: 'Módulo fiscal completo con 5 pestañas: Resumen (IVA, retenciones, ICA, renta), Declaraciones (borradores DIAN con editor), Calendario (vencimientos 2026), Certificados (F220), e Información Exógena (1001, 2276). Requiere empresa seleccionada para funcionar.',
        kpis: [
            { value: '5', label: 'pestañas funcionales' },
            { value: '5', label: 'formularios DIAN' },
            { value: '2', label: 'formatos exógena' },
        ],
        steps: [
            {
                title: 'Resumen · IVA, Retenciones, ICA, Renta',
                body: 'Vista consolidada de las 4 obligaciones principales. IVA muestra saldo a pagar (generado - descontable). Retenciones suma Retefuente + ReteICA + ReteIVA. ICA calcula sobre ingresos brutos. Renta muestra provisión del 35%. Usa el selector de período para cambiar entre meses/bimestres.',
                highlights: [
                    'Selector de período: navega mes/bimestre/año con flechas',
                    'IVA: diferencia entre IVA generado e IVA descontable',
                    'Retefuente: 11% servicios · 3% bienes · 10% arriendo',
                    'Renta: 35% sobre la utilidad antes de impuestos (Ley 2277/2022)',
                ],
            },
            {
                title: 'Declaraciones · Borradores DIAN',
                body: 'Genera borradores pre-llenados de 5 formularios: F300 (IVA), F350 (Retefuente), F110 (Renta personas jurídicas), ICA (municipal), F260 (Régimen SIMPLE). Cada borrador trae los renglones calculados desde el PUC con indicadores de confianza. El editor permite modificar valores y marcar campos como revisados.',
                highlights: [
                    'F300: bimestral/cuatrimestral según régimen de la empresa',
                    'F350: mensual · retenciones practicadas a terceros',
                    'F110: anual · renta personas jurídicas',
                    'Editor visual: chips de estado (Confiable/Verificar/Revisar)',
                    'Exporta a CSV cuando todos los campos estén verificados',
                ],
                warning:
                    'Los campos marcados con "Revisar" (rojo) deben verificarse antes de exportar. El sistema bloquea la exportación si hay campos pendientes.',
            },
            {
                title: 'Calendario · Vencimientos DIAN 2026',
                body: 'Calendario tributario oficial DIAN para 2026 con todas las obligaciones programadas. Muestra días restantes, alertas de urgencia (rojo = vencido o < 5 días, amarillo = < 15 días, verde = futuro). Incluye IVA bimestral/cuatrimestral, retenciones mensuales, y renta anual.',
                highlights: [
                    'Alertas automáticas según proximidad del vencimiento',
                    'Doble dígito NIT: el calendario muestra qué dígito declara cuándo',
                    'Filtro por año (default 2026)',
                    'Integración con régimen de IVA de la empresa',
                ],
            },
            {
                title: 'Certificados · F220 Retenciones',
                body: 'Genera certificados de retención en la fuente (Formulario 220) para todos los terceros de la empresa en un año determinado. Incluye: pagos totales, retenciones practicadas, conceptos (servicios, bienes, arriendo), y totales. Selecciona terceros individuales o descarga todos en ZIP.',
                highlights: [
                    'Año seleccionable (default año anterior)',
                    'Vista previa: lista de terceros con totales antes de generar',
                    'Selección múltiple: checkboxes para certificados específicos',
                    'Exporta CSV individual con datos completos del certificado',
                    'Cumple requisitos DIAN para entrega a proveedores',
                ],
            },
            {
                title: 'Información Exógena · 1001 y 2276',
                body: 'Prepara archivos para medios magnéticos DIAN. Formato 1001: pagos y retenciones a terceros (operaciones con proveedores). Formato 2276: ventas a terceros (operaciones con clientes). Muestra vista previa de los datos, validación de campos obligatorios, y exporta a Excel/CSV con formato DIAN.',
                highlights: [
                    'Formato 1001: ingresos y retenciones pagadas a terceros',
                    'Formato 2276: ingresos recibidos de terceros (ventas)',
                    'Validación DIAN: normalización (mayúsculas, sin tildes)',
                    'Exporta CSV con formato DIAN',
                    'Año seleccionable con validación de período cerrado',
                ],
                warning:
                    'La DIAN valida estrictamente el formato: todos los campos deben estar en mayúsculas, sin tildes, y con valores numéricos sin separadores de miles. El sistema normaliza automáticamente.',
            },
        ],
        tip: 'El módulo tributario requiere una empresa seleccionada. Si ves "sin empresa" en el subtítulo, selecciona una empresa desde el selector del TopBar. Los cálculos usan las tarifas configuradas en Configuración → Tarifas tributarias.',
    },

    {
        id: 'chat',
        number: '9',
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
                    'Sin sesiones aún → estado vacío sin conversaciones previas',
                ],
            },
            {
                title: 'Tarjetas de datos (data cards)',
                body: 'Cuando el agente cita cifras concretas, las renderiza en tarjetas brutalistas con eyebrow accent + tabla mono. Cada tipo tiene su color: balance indigo, P&G verde, IVA pink, ratios chartreuse. La fila final destaca el número clave (utilidad neta, IVA a pagar, etc.) con tipografía display.',
            },
        ],
        tip: 'Si el agente responde "no tengo datos suficientes", probablemente la empresa activa aún no tiene transacciones contabilizadas. Sube documentos en /upload y vuelve a preguntar — las consultas se hacen contra los asientos contabilizados en tiempo real.',
    },

    {
        id: 'tips',
        number: '10',
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
                title: 'Error "Código PUC no encontrado"',
                body: 'El agente contador sugirió una cuenta del PUC que no está cargada en el sistema. Esto ocurre con cuentas de planes sectoriales especializados (salud, educación, sector público) o con códigos auxiliares ERP de la empresa. El sistema intentará resolver el código a la cuenta padre más cercana automáticamente.',
                highlights: [
                    'Si el error persiste, reporta el código PUC al equipo de soporte',
                    'El código se agrega al catálogo y puedes reintentar el documento desde Transacciones',
                    'Mientras tanto, el sistema registra el movimiento en la cuenta "Otros Gastos Diversos" como fallback',
                ],
            },
            {
                title: 'Reportes vacíos aunque hay transacciones',
                body: 'Verifica que las transacciones estén POSTED, no solo PENDING. Los reportes solo leen de los asientos contabilizados, que se crean en la fase final del pipeline (contabilización). Si están PENDING o REJECTED, no existen asientos.',
                highlights: [
                    'Chequear tab "Contabilizadas" en Transacciones',
                    'Si hay muchos PENDING, revisar logs del backend',
                    'Si hay REJECTED, abrir el detalle y ver por qué falló audit',
                ],
                related: 'Ver módulo 3 — Transacciones',
            },
            {
                title: 'Sistema offline o con fallas de conexión',
                body: 'El indicador en el TopBar muestra el estado del sistema: verde = todo bien, ámbar = funcionamiento degradado, rojo = sin conexión. Si el sistema no responde, la app muestra un aviso claro y no datos de prueba. Recarga la página o contacta al administrador.',
                highlights: [
                    'Indicador verde en TopBar = conexión activa',
                    'Ámbar = el sistema está respondiendo pero con limitaciones',
                    'Rojo = sin conexión — espera o contacta al soporte',
                ],
            },
            {
                title: 'Atajos de teclado y navegación',
                body: 'Desde cualquier parte de la guía, presiona / para enfocar el buscador. Desde cualquier página de la app, el botón ? del TopBar abre el drawer de ayuda rápida con acceso directo a los 11 módulos.',
                highlights: [
                    '/  → buscar en la guía (estando en /help)',
                    '?  → drawer de ayuda rápida (TopBar)',
                    'Descarga PDF → botón al final de esta guía',
                ],
            },
        ],
    },
];
