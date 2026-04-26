# PAE Contable — Frontend

> Interfaz web del sistema multiagente de contabilidad colombiana, desarrollado por **Antigravity**.

---

## Índice

- [PAE Contable — Frontend](#pae-contable--frontend)
  - [Índice](#índice)
  - [Descripción](#descripción)
  - [Arquitectura](#arquitectura)
  - [Stack tecnológico](#stack-tecnológico)
  - [Estructura del proyecto](#estructura-del-proyecto)
  - [Conexión con el backend](#conexión-con-el-backend)
    - [Modo offline (fallback mock)](#modo-offline-fallback-mock)
  - [Inicio rápido](#inicio-rápido)
    - [Prerrequisitos](#prerrequisitos)
    - [Instalación](#instalación)
  - [Variables de entorno](#variables-de-entorno)
  - [Páginas disponibles](#páginas-disponibles)
  - [Diseño y tema visual](#diseño-y-tema-visual)
  - [Onboarding para desarrolladores](#onboarding-para-desarrolladores)
  - [Build y despliegue](#build-y-despliegue)

---

## Descripción

**PAE Contable** es el frontend del sistema inteligente de contabilidad colombiana. Consume una API REST (FastAPI) que orquesta múltiples agentes de IA para:

- Procesar documentos contables (XML, PDF, CSV, JSON)
- Clasificar transacciones según el PUC colombiano
- Generar libros contables (Diario, Mayor, Auxiliar)
- Calcular impuestos (IVA, Retenciones)
- Producir reportes financieros (Balance General, Estado de Resultados)
- Mostrar trazas de proceso, observaciones del auditor y acciones de remediación cuando un flujo falla o queda con warnings

La UI combina dos modos:

- **Visualización / exploración:** varias pantallas siguen teniendo fallback a datos mock para poder revisar la UI sin backend.
- **Procesamiento real:** el flujo de `/upload` depende del backend para ingesta, contabilización y trazas de ingest/proceso.

---

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│              Navegador (Next.js 14 SSR)          │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   Pages  │  │Components│  │    Hooks     │   │
│  │(App Dir) │  │  (MUI)   │  │(TanStack Q.) │   │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │               │            │
│       └──────────────┴───────────────┘            │
│                       │                           │
│              ┌─────────▼──────────┐               │
│              │    src/lib/api.ts  │               │
│              │  (Axios + helpers) │               │
│              └─────────┬──────────┘               │
└────────────────────────┼────────────────────────- ┘
                         │ HTTP (NEXT_PUBLIC_API_URL)
                         ▼
         ┌───────────────────────────────┐
         │  FastAPI Backend (port 8000)  │
         │                               │
         │  /api/v1/ingest/upload        │
         │  /api/v1/ingest/{id}          │
         │  /api/v1/ingest/{id}/trace    │
         │  /api/v1/process/accounting/{ingest_id} │
         │  /api/v1/process/status/{process_id}    │
         │  /api/v1/process/{id}/trace   │
         │  /api/v1/transactions         │
         │  /api/v1/books                │
          │  /api/v1/reports/balance      │
          │  /api/v1/reports/income       │
          │  /api/v1/tax/iva              │
          │  /api/v1/tax/withholdings     │
          │  /api/v1/tax/declarations/*   │
          │  /api/v1/tax/calendar         │
          │  /api/v1/tax/certificates/f220│
          │  /api/v1/tax/exogena/*        │
          │  /api/v1/health               │
          └───────────────────────────────┘
```

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.3 |
| Lenguaje | TypeScript | 5.x |
| UI Components | Material UI (MUI) | v5 |
| Estado / Caché | TanStack Query | v5 |
| HTTP | Axios | 1.x |
| Gráficas | Recharts | 2.x |
| Subida de archivos | react-dropzone | 14.x |
| Formularios | React Hook Form + Zod | — |
| Fuentes | next/font/google (Inter) | — |

---

## Estructura del proyecto

```
src/
├── app/                        # Rutas (Next.js App Router)
│   ├── layout.tsx              # Layout raíz: ThemeRegistry + QueryClient
│   ├── page.tsx                # Dashboard / Inicio
│   ├── upload/page.tsx         # Via A / Via B + auditoría del proceso
│   ├── transactions/
│   │   ├── page.tsx            # Lista de transacciones
│   │   └── [id]/page.tsx       # Detalle de transacción (timeline agente)
│   ├── books/
│   │   ├── page.tsx            # Libros contables (tabs)
│   │   └── [type]/page.tsx     # Vista completa: diario | mayor | auxiliar
│   ├── reports/page.tsx        # Reportes financieros
│   ├── tax/
│   │   ├── page.tsx            # Módulo tributario completo (5 tabs)
│   │   └── components/         # TaxTabs, SummaryPanel, DeclarationPanel, DraftEditor, TaxCalendarPanel, CertificatesPanel, ExogenaPanel
│   ├── evaluation/page.tsx     # Evaluación del agente
│   └── settings/page.tsx       # Configuración
│
├── components/
│   ├── layout/                 # AppShell, Sidebar, TopBar, PageHeader
│   ├── agent/                  # AgentTimeline, AgentStepCard, AgentReasoningPanel
│   ├── transactions/           # TransactionTable, TransactionDetail
│   ├── books/                  # BookTable, AccountFilter
│   ├── reports/                # FinancialChart, ReportCard
│   ├── upload/                 # DropZone, FilePreview, UploadProgress, ProcessAuditPanel
│   └── common/                 # DataTable, MoneyDisplay, StatusBadge, PeriodSelector
│
├── hooks/                      # TanStack Query hooks (todos con mock fallback)
│   ├── useTransactions.ts
│   ├── useUpload.ts
│   ├── useProcessing.ts
│   ├── useBooks.ts
│   ├── useReports.ts
│   ├── useTax.ts
│   └── useHealthCheck.ts
│
├── lib/
│   ├── api.ts                  # Axios client + todas las funciones de API
│   ├── formatters.ts           # Formateo de moneda, fechas, etc.
│   └── queryClient.ts          # Singleton de TanStack Query
│
├── styles/
│   └── theme.ts                # Tema MUI dark (paleta Antigravity)
│
└── types/
    └── index.ts                # Interfaces TypeScript globales
```

---

## Conexión con el backend

La variable `NEXT_PUBLIC_API_URL` controla la URL base de la API:

```ts
// src/lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

Todos los endpoints siguen el patrón `/api/v1/<recurso>`.

### Flujo actual de `/upload`

La pantalla de carga tiene dos flujos:

- **Via A:** sube documentos fuente, acepta PDF/XML/Excel/imágenes, espera a que la ingesta deje transacciones staged y luego dispara `processAccounting`.
- **Via B:** recibe 3 PDFs de primer nivel (`balance_general`, `estado_resultados`, `libro_auxiliar`), persiste los estados base y ahora también puede exponer auditoría de ingesta antes de derivar los demás documentos.

Cuando el backend responde con warnings o errores, la UI persiste metadatos como:

- `process_id`
- `error_category`
- `error_code`
- `remediation`
- `has_warnings`
- `trace_url`

Con eso, [`ProcessAuditPanel`](src/components/upload/ProcessAuditPanel.tsx) puede cargar trazas estructuradas de proceso o de ingesta y mostrar timeline, blockers, retries y mensajes del auditor tanto para Via A como para Via B.

En desktop, la pantalla de Via A usa una composición de dos columnas:

- **izquierda:** dropzone principal
- **derecha:** cola de archivos, CTA, auditoría y preview de extracción

### Modo offline (fallback mock)

Muchas vistas siguen este patrón:

```ts
async queryFn() {
  try {
    const data = await getRealApiFunction();
    return data;
  } catch {
    return MOCK_DATA; // UI siempre renderiza
  }
}
```

El `TopBar` muestra el estado de conectividad en tiempo real (verde / ámbar / rojo).

`/upload` es la excepción importante: la UI renderiza, pero para probar la ingesta real y la auditoría del proceso necesitas backend activo.

---

## Inicio rápido

### Prerrequisitos

- Node.js ≥ 18
- npm ≥ 9 (o pnpm / yarn)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd frontend_pae_account_multiagent_system

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local si el backend no está en localhost:8000

# 4. Iniciar servidor de desarrollo
npm run dev
```

Abrir `http://localhost:3000` en el navegador. Si ese puerto ya está ocupado, Next.js usará el siguiente disponible (`3001`, `3002`, etc.).

---

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|------------------|
| `NEXT_PUBLIC_API_URL` | URL base del backend FastAPI | `http://localhost:8000` |
| `NEXT_PUBLIC_COMPANY_NIT` | NIT inicial sugerido para la empresa activa | opcional |

Crear `.env.local` (no se commitea) a partir de `.env.example`.

---

## Páginas disponibles

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard con estadísticas y actividad reciente |
| `/upload` | Carga de documentos con toggle Via A / Via B, soporte de imágenes en Via A, auditoría de proceso/ingesta y layout de control lateral en desktop |
| `/transactions` | Lista de transacciones con botón "Contabilizar" |
| `/transactions/[id]` | Detalle con timeline del agente y panel de razonamiento |
| `/books` | Libros contables con tabs y filtros |
| `/books/diario` | Vista completa del Libro Diario |
| `/books/mayor` | Vista completa del Libro Mayor |
| `/books/auxiliar` | Vista completa del Libro Auxiliar |
| `/reports` | Reportes financieros con gráficas y descarga JSON |
| `/tax` | Módulo tributario completo: Resumen (IVA, Retenciones, ICA, Renta), Declaraciones (F300, F350, F110, ICA, F260), Calendario DIAN, Certificados F220, Exógena (1001, 2276) |
| `/evaluation` | Evaluación del agente (métricas de calidad) |
| `/chat` | Chat IA con el agente Reportero. Incluye panel de razonamiento colapsable que muestra paso a paso la trazabilidad del agente (intent → params → datos → RAG → generación). |
| `/settings` | Configuración del sistema |
| `/help` | Referencia canónica del sistema visual brutalist editorial |

---

## Diseño y tema visual

El tema sigue la identidad visual de **Antigravity**:

| Token | Valor | Uso |
|-------|-------|-----|
| Background | `#0A0E1A` | Fondo de página |
| Surface | `#111827` | Cards, sidebar |
| Primary | `#6366F1` | Indigo — acciones principales |
| Secondary | `#10B981` | Emerald — datos positivos / éxito |
| Warning | `#F59E0B` | Amber — alertas |
| Error | `#EF4444` | Rojo — errores / negativos |
| Text primary | `#F9FAFB` | Texto principal |
| Text secondary | `#9CA3AF` | Texto secundario |

El tema está definido en [src/styles/theme.ts](src/styles/theme.ts).

---

## Onboarding para desarrolladores

- [ ] Clonar repo y ejecutar `npm install`
- [ ] Copiar `.env.example` → `.env.local`
- [ ] Verificar que el backend esté corriendo en la URL configurada en `NEXT_PUBLIC_API_URL`
- [ ] Ejecutar `npm run dev` y abrir el puerto que Next asigne (`3000` por defecto)
- [ ] Verificar chip "API Online" en la barra superior (verde = conectado)
- [ ] Probar `/upload` en ambos modos: Via A y Via B
- [ ] Forzar o reproducir un caso con warning/error para validar `ProcessAuditPanel`
- [ ] Probar "Contabilizar" en `/transactions` (requiere backend o verás datos mock)
- [ ] Revisar `/transactions/[id]` para ver el timeline y panel de razonamiento del agente
- [ ] Probar `/chat`: cambiar de empresa en el sidebar, enviar "balance general" y confirmar que el panel `// RAZONAMIENTO` muestra los pasos del agente (intent → params → gathering_data → rag → generating → complete) y que las cifras varían entre NITs distintos
- [ ] Revisar `/reports` y descargar un reporte como JSON
- [ ] Ejecutar `npm run build` para verificar que no hay errores de TypeScript

---

## Build y despliegue

```bash
# Build de producción
npm run build

# Iniciar servidor de producción
npm start

# Lint
npm run lint
```

Para despliegue en **Vercel** (recomendado para Next.js):

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Agregar la variable de entorno `NEXT_PUBLIC_API_URL` apuntando al backend de producción
3. Vercel detecta automáticamente Next.js y ejecuta el build

---
