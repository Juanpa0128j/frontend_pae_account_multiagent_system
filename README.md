# PAE Contable — Frontend

> Interfaz web del sistema multiagente de contabilidad colombiana, desarrollado por **Antigravity**

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
│              │  src/lib/api/      │               │
│              │  (ApiClient+Bearer)│               │
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

## Autenticación (Clerk)

La autenticación usa **Clerk v6** (`@clerk/nextjs@^6` + `@clerk/localizations`). Supabase Auth fue eliminado completamente en este branch.

- `<ClerkProvider>` envuelve el layout raíz con localización `esES` y apariencia brutalist personalizada (`src/lib/clerk/appearance.ts`).
- `clerkMiddleware()` en `src/middleware.ts` protege todas las rutas excepto `/login` y `/signup`.
- Las rutas de autenticación son `src/app/(auth)/login/[[...rest]]/page.tsx` (`<SignIn />`) y `src/app/(auth)/signup/[[...rest]]/page.tsx` (`<SignUp />`).
- El estado de usuario se consume con hooks de Clerk: `useUser`, `useAuth`, `useClerk`.
- Todos los requests HTTP al backend incluyen el token Bearer de Clerk, obtenido en `ApiClient` vía `window.Clerk.session.getToken()` (interceptor en `src/lib/api/core/apiClient.ts`).
- El cambio de contraseña y gestión de sesiones se realiza a través de `<UserProfile />` de Clerk, embebido en `/settings`.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.35 |
| Lenguaje | TypeScript | 5.x |
| UI Components | Material UI (MUI) | v5 |
| Estado / Caché | TanStack Query | v5 |
| Autenticación | @clerk/nextjs + @clerk/localizations | ^6 |
| HTTP | Axios | 1.x |
| Gráficas | Recharts | 2.x |
| Subida de archivos | react-dropzone | 14.x |
| Formularios | React Hook Form + Zod | — |
| Fuentes | next/font local (Inter, Bricolage Grotesque, JetBrains Mono) | — |

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
│   ├── settings/page.tsx       # Configuración
│   └── (auth)/                 # Rutas públicas de autenticación (Clerk)
│       ├── login/[[...rest]]/  # <SignIn /> — solo ruta /login
│       └── signup/[[...rest]]/ # <SignUp /> — solo ruta /signup
│
├── components/
│   ├── layout/                 # AppShell, Sidebar, TopBar, PageHeader
│   ├── agent/                  # AgentTimeline, AgentStepCard, AgentReasoningPanel
│   ├── transactions/           # TransactionTable, TransactionDetail
│   ├── books/                  # BookTable, AccountFilter
│   ├── reports/                # FinancialChart, ReportCard
│   ├── upload/                 # DropZone, FilePreview, UploadProgress, ProcessAuditPanel, ViaBMultiDropZone, ViaBAssignDialog
│   └── common/                 # DataTable, MoneyDisplay, StatusBadge, PeriodSelector
│
├── hooks/                      # TanStack Query hooks (todos con mock fallback)
│   ├── useTransactions.ts
│   ├── useUpload.ts
│   ├── useProcessing.ts
│   ├── useBooks.ts
│   ├── useReports.ts
│   ├── useTax.ts
│   ├── useDashboard.ts
│   ├── useChat.ts
│   ├── useSettings.ts
│   └── useHealthCheck.ts
│
├── lib/
│   ├── api/                    # Clientes HTTP por dominio (Axios)
│   │   ├── core/               # ApiClient base + interceptor Bearer (Clerk)
│   │   └── clients/            # Clientes por dominio (ingest, process, report, tax…)
│   ├── clerk/                  # Configuración de apariencia Clerk
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

**Dashboard en vivo:** El gráfico "Ingresos vs gastos" ahora lee datos en tiempo real desde `GET /api/v1/dashboard/monthly-trend` mediante el hook `useMonthlyTrend()` en `src/hooks/useDashboard.ts`. Antes estaba hardcodeado.

### Flujo actual de `/upload`

La pantalla de carga tiene dos flujos:

- **Via A:** sube documentos fuente, acepta PDF/XML/Excel/imágenes, espera a que la ingesta deje transacciones staged y luego dispara `processAccounting`.
- **Via B:** recibe hasta 4 PDFs de primer nivel (`balance_general`, `estado_resultados`, `libro_auxiliar`, y opcionalmente `balance_general_anterior` del período previo para NIC 7), persiste los estados base y expone auditoría de ingesta antes de derivar los demás documentos. El componente `ViaBMultiDropZone` permite arrastrar y soltar 1–4 archivos a la vez; `ViaBAssignDialog` muestra un diálogo de confirmación donde el usuario puede corregir la clasificación automática por nombre de archivo antes de iniciar la carga.

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

#### Cola de archivos

La cola de Via A soporta **drag-and-drop para reordenar** documentos antes de enviar ([`DraggableQueueList`](src/components/upload/DraggableQueueList.tsx)). El orden en la cola determina el orden de procesamiento en el bundle.

Cuando se seleccionan **múltiples archivos a la vez**, el modo por defecto es `documents` (documentos separados). El usuario puede cambiarlo a `pages` (páginas de un mismo documento) desde el toggle en la fila de la cola mientras el estado sea `idle`.

Durante la extracción de un bundle:
- El archivo que se está procesando muestra un spinner `CircularProgress`
- Los archivos ya completados muestran ✓
- El badge `+N ▾` es accesible por teclado (Enter/Space, `aria-expanded`)

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
- pnpm ≥ 8 (gestor oficial para este proyecto)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd frontend_pae_account_multiagent_system

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Completar NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY y ajustar NEXT_PUBLIC_API_URL si el backend no está en localhost:8000

# 4. Iniciar servidor de desarrollo
pnpm dev
```

Abrir `http://localhost:3000` en el navegador. Si ese puerto ya está ocupado, Next.js usará el siguiente disponible (`3001`, `3002`, etc.).

---

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|------------------|
| `NEXT_PUBLIC_API_URL` | URL base del backend FastAPI | `http://localhost:8000` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clave pública de Clerk (Clerk Dashboard → API Keys) | obligatoria |
| `CLERK_SECRET_KEY` | Clave secreta de Clerk (solo servidor) | obligatoria |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Ruta de sign-in | `/login` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Ruta de sign-up | `/signup` |

Crear `.env.local` (no se commitea) a partir de `.env.example`.

---

## Formato y Linting

### Prettier

Código formateado con Prettier. Configuración en `.prettierrc`:
- `tabWidth: 4`
- `singleQuote: true`
- `printWidth: 100`

```bash
# Formatear código
pnpm format

# Verificar formato (sin modificar)
pnpm format:check
```

El pre-commit CI ejecuta `format:check` como primer paso — debe pasar antes de continuar.

### ESLint

```bash
# Lint del código (TypeScript, React)
pnpm lint
```

---

## Testing

### Vitest

Tests ubicados en `src/test/`. Stack: **Vitest + Testing Library**.

**Configuración:**
- `vitest.config.ts` — configuración base
- `src/test/setup.ts` — setup global (DOM APIs, mocks)
- `src/test/formatters.test.ts` — suite de ejemplo (22 tests para formatters)

**Ejecutar tests:**

```bash
# Tests en modo run
pnpm test

# Tests en watch mode
pnpm test:watch

# Coverage (requiere 80% para gate)
pnpm test:coverage
```

Coverage report se genera en `coverage/` — se sube como artifact en CI.

### Cobertura mínima

Gate en CI: **80% de cobertura** en líneas, ramas y funciones. Si cae por debajo, CI fallará.

---

## Pipeline CI

Ejecutado en GitHub Actions (`.github/workflows/ci.yml`). Pasos en orden:

1. **Formato** (`pnpm format:check`) — valida Prettier
2. **Type-check** (`pnpm tsc --noEmit`) — valida TypeScript estricto
3. **Tests unitarios** (`pnpm test`) — Vitest
4. **Coverage** (`pnpm test:coverage`) — gate 80%, sube report como artifact
5. **Lint** (`pnpm lint`) — ESLint
6. **Build** (`pnpm build`) — Next.js build, valida compilación

Si cualquier paso falla, el pipeline se detiene. Todos deben pasar para merge.

---

## Páginas disponibles

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard con estadísticas y actividad reciente |
| `/upload` | Carga de documentos con toggle Via A / Via B, soporte de imágenes en Via A, multi-drop de hasta 4 PDFs en Via B con diálogo de asignación, auditoría de proceso/ingesta y layout de control lateral en desktop |
| `/transactions` | Lista de transacciones con estados y filtros. Permite eliminar transacciones individuales o por ingest (con confirmación y feedback de error en caso de fallo). |
| `/transactions/[id]` | Detalle con timeline del agente y panel de razonamiento. Los pasos de agente muestran asientos contables (`asientos`, `totales`) cuando el backend los incluye en la traza. |
| `/books` | Libros contables con tabs y filtros |
| `/books/diario` | Vista completa del Libro Diario |
| `/books/mayor` | Vista completa del Libro Mayor |
| `/books/auxiliar` | Vista completa del Libro Auxiliar |
| `/reports` | Reportes financieros con gráficas, descarga JSON y export PDF/Excel |
| `/tax` | Módulo tributario completo: Resumen (IVA, Retenciones, ICA, Renta), Declaraciones (F300, F350, F110, ICA, F260), Calendario DIAN, Certificados F220, Exógena (1001, 2276) |
| `/chat` | Chat IA con el agente Reportero. Incluye panel de razonamiento colapsable que muestra paso a paso la trazabilidad del agente (intent → params → datos → RAG → generación). |
| `/settings` | Configuración del sistema. Incluye selector de municipio con fallback para ciudades personalizadas no presentes en la lista. Gestión de cuenta (contraseña, sesiones) vía `<UserProfile />` de Clerk. |
| `/help` | Referencia canónica del sistema visual brutalist editorial |
| `/login` | Página de inicio de sesión (Clerk `<SignIn />`) |
| `/signup` | Página de registro (Clerk `<SignUp />`) |
| `/companies` | Selección de empresa activa tras autenticación |

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

- [ ] Clonar repo y ejecutar `pnpm install`
- [ ] Copiar `.env.example` → `.env.local` y completar `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`
- [ ] Verificar que el backend esté corriendo en la URL configurada en `NEXT_PUBLIC_API_URL`
- [ ] Ejecutar `pnpm dev` y abrir el puerto que Next asigne (`3000` por defecto)
- [ ] Verificar chip "API Online" en la barra superior (verde = conectado)
- [ ] Ejecutar `pnpm test` para verificar que los tests pasan y coverage >= 80%
- [ ] Ejecutar `pnpm format:check` para verificar formato Prettier
- [ ] Probar `/upload` en ambos modos: Via A y Via B
- [ ] Forzar o reproducir un caso con warning/error para validar `ProcessAuditPanel`
- [ ] Probar "Contabilizar" en `/transactions` (requiere backend o verás datos mock)
- [ ] Revisar `/transactions/[id]` para ver el timeline y panel de razonamiento del agente
- [ ] Probar `/chat`: cambiar de empresa en el sidebar, enviar "balance general" y confirmar que el panel `// RAZONAMIENTO` muestra los pasos del agente (intent → params → gathering_data → rag → generating → complete) y que las cifras varían entre NITs distintos
- [ ] Revisar `/reports`, ver gráficos (ahora leen datos en vivo del backend) y descargar en JSON, PDF o Excel
- [ ] Ejecutar `pnpm build` para verificar que no hay errores de TypeScript

---

## Build y despliegue

```bash
# Build de producción
pnpm build

# Iniciar servidor de producción
pnpm start

# Lint
pnpm lint
```

Para despliegue en **Vercel** (recomendado para Next.js):

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Agregar la variable de entorno `NEXT_PUBLIC_API_URL` apuntando al backend de producción
3. Vercel detecta automáticamente Next.js y ejecuta el build

---
