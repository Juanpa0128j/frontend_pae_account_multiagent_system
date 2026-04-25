# PAE Contable — Frontend

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

**1. PageHero — toda página tiene hero**

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

**4. KpiStrip — tres+ métricas con borders top/bottom**

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

### Referencias canónicas

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

## Estado actual del producto

- La página `/upload` ya no es una subida simple: tiene **dos flujos** en la misma pantalla.
- **Via A** procesa documentos fuente y dispara el pipeline contable completo.
- **Via B** recibe 3 PDFs base (`balance_general`, `estado_resultados`, `libro_auxiliar`) y deriva otros estados financieros.
- El estado de upload ahora conserva metadatos de proceso: `process_id`, `error_category`, `error_code`, `remediation`, `has_warnings`, `trace_url`.
- Cuando hay warnings o fallos, la UI muestra [`src/components/upload/ProcessAuditPanel.tsx`](src/components/upload/ProcessAuditPanel.tsx), que consume `useProcessTrace()` y renderiza timeline, blockers y findings del auditor.
- `src/hooks/useUpload.ts` hace polling de ingesta y proceso; `src/hooks/useProcessing.ts` concentra queries de status/result/trace.

## Convenciones

- TypeScript estricto, `npx tsc --noEmit` debe pasar
- Hooks customizados en `src/hooks/`
- Llamadas API centralizadas en `src/lib/api.ts`
- Tipos en `src/types/index.ts`
- Empresa activa SIEMPRE filtra todos los datos (vía `CompanyContext`)
- Pre-commit: build limpio (`npm run build`)

## Notas para trabajo futuro

- Si tocas `/upload`, mantén el toggle Via A / Via B y su narrativa visual en la misma página.
- Los estados `done` con `has_warnings` no equivalen a éxito silencioso: deben seguir exponiendo auditoría y remediación.
- No documentes `/upload` como "mock-only"; hoy la UI puede renderizar sin backend, pero el procesamiento real y la traza requieren API disponible.
- Si cambian endpoints del backend de ingesta/proceso, actualiza `README.md`, `CLAUDE.md`, `src/lib/api.ts` y los tipos asociados en la misma tarea.
