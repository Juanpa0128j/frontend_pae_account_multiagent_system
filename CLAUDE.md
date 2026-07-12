# PAE Contable — Frontend.

Sistema multiagente contable para Colombia. Next.js 14 (App Router) + TypeScript + MUI + TanStack Query.

---

## ⚠ DESIGN SYSTEM — BRUTALIST EDITORIAL

Toda la interfaz de PAE Contable usa **una sola dirección de diseño**: brutalismo editorial. Esta regla es vinculante. **Cualquier página, componente o feature nueva DEBE seguir este sistema sin excepciones.** La referencia canónica es `/help`.

### Principios

1. **Composición sobre decoración.** Escala extrema, contraste alto, asimetría intencional. Números/títulos masivos como protagonistas. Espacio negativo generoso O densidad controlada — nunca ambigüedad.
2. **Tipografía con personalidad.** Nunca Inter sola en headlines, nunca Arial/system fonts. Usar las 3 fuentes del sistema (ver tokens) con jerarquía clara: Bricolage para impacto, JetBrains Mono para etiquetas técnicas, Inter para body.
3. **Acento agresivo.** Cada sección/módulo tiene UN color acento. Los acentos no se mezclan dentro de una misma sección.
4. **Microinteracciones intencionadas.** Hover transforms, glow rings, accent fills — siempre con `cubic-bezier(0.2, 0.9, 0.3, 1)`, no `ease`.
5. **Detalles visuales.** Reglas de color, badges con `// prefijo`, números fantasma de fondo, marquees, scroll progress. Nunca planar / corporate / SaaS-genérico.

### Tokens (fuente de verdad: `src/styles/brutalist.ts`)

**Paleta:**
- `ink` `#0A0E1A` — fondo base
- `paper` `#FAFAF5` — texto principal off-white
- `accent` `#6366F1` — indigo (primario, módulos info)
- `pink` `#EC4899` — magenta (módulos transaccionales)
- `chartreuse` `#D4FF00` — verde ácido (CTAs, énfasis, alerts positivos)
- `amber` `#F59E0B` — warnings
- `error` `#EF4444` — destructivo

**Tipografía:**
- `--font-bricolage` (Bricolage Grotesque) — headlines, números, títulos `font-weight: 700-800`, letter-spacing tight `-0.04em`
- `--font-jetbrains` (JetBrains Mono) — labels técnicos, códigos PUC, NITs, prefijos `//`, letter-spacing wide `0.15-0.3em`, uppercase
- `--font-inter` — body text, párrafos, listas

**Tamaños tipográficos canónicos:**
- Hero display: `12rem / 9rem / 6rem / 4rem` (lg/md/sm/xs)
- Section title: `5rem / 3.5rem / 2.5rem`
- Card title: `1.55rem / 1.2rem`
- Body: `1rem / 0.95rem`
- Mono labels: `0.7rem` letter-spacing `0.25em` uppercase
- Stat KPIs: `2.4rem` bold

**Espaciado:**
- Section vertical padding: `pt: { xs: 8, md: 14 }, pb: { xs: 6, md: 10 }`
- Page horizontal: `px: { xs: 2, sm: 4, md: 6 }`
- Card padding: `p: { xs: 2.5, md: 3.5 }`

**Bordes y radios:**
- Cards: `borderRadius: 2`, border `1px solid rgba(255,255,255,0.08)`
- Pills/chips: `borderRadius: 4` o `999`
- Hard rectangles para barras de acento (`borderRadius: 0`)

### Patrones obligatorios

**1. PageHero — toda página tiene hero.**

Cada página principal abre con un hero brutal:
- Label superior `// MODULE_NAME` en JetBrains Mono con dot pulsante
- Título a 5-7rem en Bricolage bold uppercase, letter-spacing `-0.04em`, line-height `0.95`
- Subtítulo italic en color soft
- Stats opcionales (KPI strip) con borders top/bottom
- Number fantasma de fondo (cuando aplique)

Usar `<BrutalistPageHero />` desde `src/components/brutalist/`.

**2. Section — bloques con número + título massive**

Cada sección importante:
- Label de número `01 / 08` con línea acento de 40×3px
- Título a 3-5rem
- Subtítulo italic
- Lede de un párrafo en Inter
- Contenido (cards, tablas, gráficos)

Usar `<BrutalistSection />`.

**3. Card — interactivos con hover translate**

Cards expandibles o de acción:
- Border `rgba(255,255,255,0.08)`
- Hover: `borderColor: accent`, `transform: translateX(6px)`, accent bar lateral aparece (`scaleY(0) → scaleY(1)`)
- Icon arrow rota 90° en estado abierto
- Number en JetBrains Mono `01`, `02`...

Usar `<BrutalistCard />`.

**4. KpiStrip — tres+ métricas con borders top/bottom.**

```
Total Activos       Pasivos              Utilidad Neta
$ 12,500,000        $ 8,000,000          -$ 8,000,000
```

Usar `<BrutalistKpiStrip />`.

**5. Chips y badges — siempre con prefijo `//`**

```
// API ONLINE     // 800999888-2     // POSTED
```

Usar `<BrutalistChip />`.

### Anti-patrones (NO HACER)

❌ MUI default look (botones azules redondos con shadow). Si usas MUI base, customízalo.
❌ Bordes `rgba(255,255,255,0.12)` muy visibles — siempre `0.06-0.08` para fondo, `0.15-0.20` para hover.
❌ Mezclar dos colores acento en la misma sección.
❌ Headlines en Inter — siempre Bricolage.
❌ Letras técnicas (NITs, códigos PUC, IDs) en sans-serif — siempre JetBrains Mono.
❌ Animaciones con `transition: 'all 0.3s ease'` — usar `cubic-bezier(0.2, 0.9, 0.3, 1)`.
❌ Cards con shadow drop. Brutalismo usa borders y color blocks, no sombras suaves.
❌ Loading spinners genéricos — usar `<LinearProgress>` con accent color o skeletons brutalistas.
❌ Empty states con texto centrado simple — siempre incluir mono label `// SIN DATOS` o equivalente.

### Cuándo se permite ROMPER el sistema

Solo dos casos:
1. **Datos densos** (tablas grandes, formularios largos): puedes usar layouts más compactos siempre que mantengas tipografía + colores + chips brutalistas.
2. **Estados de error críticos**: warnings/errores pueden usar layouts más conservadores para legibilidad.

En cualquier otro caso, **reusa las primitivas brutalist o créalas si faltan**. No inventes estilos paralelos.

### Referencias canónicas.

- **Página de referencia**: `/help` — la fuente de verdad visual
- **Tokens**: `src/styles/brutalist.ts`
- **Primitivas**: `src/components/brutalist/`
- **Manual PDF**: `src/components/help/generateManualPDF.ts` muestra cómo el sistema se traduce a otros medios

---

## Stack técnico

- **Framework**: Next.js 14.2 App Router
- **Componentes**: MUI v5 (customizado a brutalist)
- **Data**: TanStack Query v5
- **Estado global**: React Context (`CompanyContext` para empresa activa)
- **HTTP**: Axios
- **Charts**: Recharts (FinancialChart wrapper)
- **PDF**: jsPDF (lazy-loaded en `/help`)
- **Fuentes**: next/font (Bricolage Grotesque, JetBrains Mono, Inter)
- **Testing**: Vitest + Testing Library
- **Formateo**: Prettier (`.prettierrc` — tabWidth 4, singleQuote, printWidth 100)
- **Gestor paquetes**: pnpm (obligatorio, no npm)

## Testing

### Vitest

Tests ubicados en `src/test/`. Stack: Vitest + Testing Library.

**Estructura:**
- `src/test/setup.ts` — setup global (DOM APIs, mocks)
- `src/test/formatters.test.ts` — suite de ejemplo con 22 tests

**Ejecución:**
- `pnpm test` — run mode (una pasada)
- `pnpm test:watch` — watch mode
- `pnpm test:coverage` — coverage report (gate: 80%)

**En CI:**
1. `pnpm test` — tests unitarios
2. `pnpm test:coverage` — coverage check, falla si < 80%
3. Coverage report se sube como artifact

Cuando agregues features, escribe tests en `src/test/`.

## Formatting

### Prettier

Código se formatea automáticamente con Prettier.

**Config:**
- `.prettierrc` — tabWidth 4, singleQuote, printWidth 100
- `.prettierignore` — archivos excluidos

**Ejecución:**
- `pnpm format` — formatea recursivamente `src/**/*.{ts,tsx}`
- `pnpm format:check` — valida sin modificar (lo que corre en CI)

**En CI:**
- `pnpm format:check` corre como **primer paso** — si falla, pipeline se detiene

Pre-commit: corre siempre `format:check`.

## Pipeline CI

`.github/workflows/ci.yml` ejecuta en orden:

1. **Formato** (`pnpm format:check`) — Prettier
2. **Type-check** (`pnpm tsc --noEmit`) — TypeScript estricto
3. **Tests** (`pnpm test`) — Vitest
4. **Coverage** (`pnpm test:coverage`) — gate 80%
5. **Lint** (`pnpm lint`) — ESLint
6. **Build** (`pnpm build`) — Next.js production build

Cada paso debe pasar. Si cualquiera falla, el pipeline se detiene y no se puede mergear.

## Estado actual del producto

- **Dashboard:** El gráfico "Ingresos vs gastos" ahora es **en vivo** — lee desde `GET /api/v1/dashboard/monthly-trend` (hook `useMonthlyTrend()` en `src/hooks/useDashboard.ts`). Antes estaba hardcodeado.
- **Reports page:** Refactor brutalist — cards usan paleta tokens, borders `palette.line`, labels en monospace, sigue design system brutalist.
- **UI strings:** Dev-facing strings ("// SIN DATOS", "journal_entry_lines", etc.) reemplazadas con Spanish natural.
- La página `/upload` ya no es una subida simple: tiene **dos flujos** en la misma pantalla.
- **Via A** procesa documentos fuente, acepta PDF/XML/Excel/imágenes y dispara el pipeline contable completo.
- **Via B** recibe 3 PDFs base (`balance_general`, `estado_resultados`, `libro_auxiliar`) y deriva otros estados financieros.
- El estado de upload ahora conserva metadatos de proceso: `process_id`, `error_category`, `error_code`, `remediation`, `has_warnings`, `trace_url`.
- Cuando hay warnings o fallos, la UI muestra [`src/components/upload/ProcessAuditPanel.tsx`](src/components/upload/ProcessAuditPanel.tsx), que consume `useProcessTrace()` o `useIngestTrace()` y renderiza timeline, blockers y findings del auditor.
- `src/hooks/useUpload.ts` hace polling de ingesta y proceso; `src/hooks/useProcessing.ts` concentra queries de status/result/trace.
- En desktop, Via A usa un layout de dos columnas con dropzone a la izquierda y panel operativo a la derecha.
- **Cola de archivos reordenable:** la cola de uploads de Via A soporta drag-and-drop para reordenar documentos antes de enviar (`DraggableQueueList`, `reorderQueue` en `useUpload`).
- **Indicadores por archivo en bundle:** durante la extracción de un bundle multi-archivo, la fila del archivo actual muestra un `CircularProgress` (spinner) y los archivos ya procesados muestran ✓. El badge `+N ▾` es accesible por teclado (role button, aria-expanded).
- **Modo multi-archivo por defecto `documents`:** cuando el usuario selecciona varios archivos a la vez, el `multi_file_mode` arranca en `'documents'` (documentos separados) en vez de `'pages'` — evita el bundling silencioso de facturas independientes.
- **Selector de municipio en empresa:** `TopBar` y `/settings` usan un `Select` de MUI con lista de municipios colombianos (`useMunicipios()`). Si la ciudad guardada no está en la lista (ciudad personalizada o query vacía), se agrega como opción adicional para evitar valores fuera de rango.
- **Transacciones — eliminar:** se puede eliminar una transacción individual o todas las transacciones de un ingest. Las mutaciones usan `mutateAsync` con try/catch y muestran un `Alert` de error en español si el backend rechaza la operación.
- **Detalle de transacción — asientos contables:** `buildAgentTrace` (en `src/lib/agentTrace.ts`) serializa el objeto completo del agente como JSON en `detalle`, preservando campos `asientos` y `totales` para que `AgentStepCard` pueda renderizar la vista estructurada de asientos.

## Convenciones

- TypeScript estricto, `pnpm tsc --noEmit` debe pasar
- Hooks customizados en `src/hooks/`
- Llamadas API centralizadas en `src/lib/api.ts`
- Tipos en `src/types/index.ts`
- Empresa activa SIEMPRE filtra todos los datos (vía `CompanyContext`)
- **Tests obligatorios** — escribe tests en `src/test/` para features nuevas
- **Pre-commit:** `pnpm format:check` y `pnpm test` deben pasar
- **Gestor paquetes:** `pnpm` obligatorio (no npm ni yarn)

## Módulo Tributario (`/tax`)

La página `/tax` implementa un sistema completo de gestión tributaria con 5 pestañas:

### Tabs
1. **Resumen** - Dashboard con IVA, Retenciones, ICA, Provisión Renta + selector de período
2. **Declaraciones** - Generación de borradores DIAN (F300, F350, F110, ICA, F260) con editor interactivo
3. **Calendario** - Calendario tributario DIAN 2026 con alertas de vencimiento
4. **Certificados** - Generación F220 (certificados de retención) con selección múltiple
5. **Exógena** - Formatos 1001 (pagos+retenciones), 1007 (ingresos), 1008 (CxC), 1009 (CxP) y 2276 (rentas de trabajo) para medios magnéticos DIAN

### Componentes principales
- `PeriodSelector` - Selector de período con navegación (mes/bimestre/año)
- `DeclarationPanel` + `DraftEditor` - Generación y edición de declaraciones
- `TaxCalendarPanel` - Visualización de calendario con indicadores de urgencia
- `CertificatesPanel` - Lista de certificados F220 con descarga
- `ExogenaPanel` - Visualización y exportación de formatos exógena

### Endpoints utilizados
- `POST /api/v1/tax/declarations/generate` - Generar borrador
- `GET /api/v1/tax/declarations/{id}` - Obtener borrador
- `GET /api/v1/tax/declarations/{id}/pdf` - Descargar facsímil PDF (formato oficial, borrador)
- `PATCH /api/v1/tax/declarations/{id}/fields` - Actualizar campo
- `GET /api/v1/tax/calendar` - Calendario tributario
- `POST /api/v1/tax/certificates/f220` - Certificados F220
- `GET /api/v1/tax/exogena/{formato}` - Datos exógena

### Hooks
- `useTaxCalendar()` - Calendario con filtro por año
- `useGenerateDeclarationDraft()` - Mutación para generar borrador
- `useDeclarationDraft()` - Query para obtener borrador
- `useUpdateDraftField()` - Mutación para actualizar campo
- `useF220Certificates()` - Certificados por año
- `useExogenaFormat()` - Datos exógena por formato y año

## Notas para trabajo futuro

- Si tocas `/upload`, mantén el toggle Via A / Via B y su narrativa visual en la misma página.
- Los estados `done` con `has_warnings` no equivalen a éxito silencioso: deben seguir exponiendo auditoría y remediación.
- Si expones nuevos warnings o errores en Via B, intenta reutilizar `ProcessAuditPanel` antes de crear una UI paralela.
- No documentes `/upload` como "mock-only"; hoy la UI puede renderizar sin backend, pero el procesamiento real y la traza requieren API disponible.
- Si cambian endpoints del backend de ingesta/proceso, actualiza `README.md`, `CLAUDE.md`, `src/lib/api.ts` y los tipos asociados en la misma tarea.
- Para el módulo tributario, los campos marcados `requires_review: true` en los borradores deben resaltarse visualmente y permitir edición.
- **Borradores por casilla oficial:** los `DraftField` traen `seccion` y `es_subtotal`. `DraftEditor` agrupa por `seccion` (encabezado `// {SECCIÓN}`), muestra `// CASILLA {n}` (no "renglón"), no permite editar subtotales, y ofrece "PDF oficial" (`taxApiClient.downloadDeclarationPdf`, facsímil del formulario) junto al export CSV.
- Si agregas un Select con datos externos (municipios, listas de catálogo), siempre incluye el valor actual como `MenuItem` cuando no esté en la lista — patrón: `{value && !options.includes(value) && <MenuItem value={value}>{value}</MenuItem>}`.
- Operaciones destructivas (delete, cancel) deben usar `mutateAsync` + try/catch y mostrar feedback de error al usuario. No usar `mutate` fire-and-forget para acciones irreversibles.
- Las tasas nacionales estatutarias (retefuente servicios/bienes/arrendamiento, renta) están en la tabla `national_rates` del backend (migración `b8c9d0e1f2a3`). El endpoint `/api/v1/settings/national-rates` (Phase 3, pendiente) las expondrá. La sección `// TASAS NACIONALES` en `/settings` (Phase 6) permitirá editarlas sin deploy.

## Learnings del proyecto

### Convenciones de numeración
- Los módulos usan numeración 1-10 (sin ceros iniciales) consistente en:
  - Sidebar navigation (`number: '1'`)
  - Page heroes (`eyebrow="// MÓDULO_1 // DASHBOARD"`, `ghostNumber="1"`)
  - Guía de uso (`helpData.ts` sections)
- Siempre mantener sincronizada la numeración entre sidebar, páginas y guía.

### Anti-patrón: Hardcoded data
- **NUNCA** hardcodear NITs, nombres de empresa o datos sensibles como fallbacks
- Ejemplo de error: `activeNit ?? '800999888-10'` → Correcto: `activeNit ? { ... } : null`
- Las queries deben deshabilitarse (`enabled: false`) cuando no hay empresa seleccionada

### Patrón: Export downloads
- Usar `responseType: 'blob'` en axios para descargas
- Parsear `Content-Disposition` header para obtener filename
- Tipar correctamente: `ReportExportDownload { blob, filename, contentType }`
- Usar `URL.createObjectURL()` + `<a download>` para trigger de descarga

### Patrón: multi-archivo en upload
- `addFiles([...])` con N>1 crea un `FileUploadState` con `files: File[]` y `multi_file_mode: 'documents'` por defecto
- El usuario puede cambiar a `'pages'` desde el toggle en la cola (visible sólo cuando `status === 'idle'`)
- `multi_file_mode` se usa en `useUpload.ts` línea ~381: `fileState.multi_file_mode ?? 'pages'` — el fallback existe pero el default en addFiles es `'documents'`
- `current_file_index` del backend marca qué archivo está siendo procesado — usar para el spinner en `UploadProgressItem`

### Patrón: delete con feedback
- Obtener `mutateAsync` del hook de react-query (no `mutate`)
- Envolver en `async` handler con try/catch
- Estado local `deleteError: string | null` + `<Alert severity="error">` dismissible
- Limpiar el error en el catch del siguiente intento exitoso (`setDeleteError(null)` en el try)
