# PAE Contable — Guía para agentes de IA

> Referencia rápida para agentes de codificación (Claude Code, Copilot, Cursor, etc.) que trabajen en este repositorio.

---

## Stack y herramientas

- **Framework:** Next.js 14.2 App Router, TypeScript estricto
- **UI:** MUI v5 (customizado — ver sistema brutalist en `src/styles/brutalist.ts`)
- **Autenticación:** Clerk v6 (`@clerk/nextjs@^6`). `clerkMiddleware()` en `src/middleware.ts`. Hooks: `useUser`, `useAuth`, `useClerk`. Bearer token via `window.Clerk.session.getToken()` en `src/lib/api/core/apiClient.ts`. Env vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`.
- **Data:** TanStack Query v5
- **HTTP:** `ApiClient` base en `src/lib/api/core/apiClient.ts`; clientes por dominio en `src/lib/api/clients/`.
- **Tests:** Vitest + Testing Library (`src/test/`)
- **Gestor de paquetes:** `pnpm` — nunca npm ni yarn

---

## Reglas de desarrollo

### Antes de cualquier edición

- Re-leer el archivo antes de editar. Nunca confiar en memoria de sesiones anteriores.
- Para archivos > 500 líneas: leer en chunks con `offset`/`limit`.
- Ejecutar `pnpm tsc --noEmit` después de cada cambio TypeScript.

### Tests obligatorios

Todo feature o fix nuevo debe tener tests en `src/test/`. Seguir flujo TDD:

1. Escribir test (RED)
2. Verificar que falla
3. Implementar fix (GREEN)
4. Verificar que pasa
5. `pnpm tsc --noEmit`

Gate de cobertura: **80%** (`pnpm test:coverage`).

### Git

- **NUNCA** hacer commit, push, amend o reset sin instrucción explícita del usuario.
- Mostrar `git diff --stat` primero, redactar mensaje, esperar aprobación.

---

## Arquitectura de `/upload`

### Estados de un `FileUploadState`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `file` | `File` | Archivo principal (o primero del bundle) |
| `files` | `File[] \| undefined` | Todos los archivos del bundle (multi-file) |
| `multi_file_mode` | `'pages' \| 'documents'` | Modo de procesamiento del bundle. **Default: `'documents'`** |
| `current_file_index` | `number \| null` | Índice del archivo siendo procesado (backend lo envía en polling) |
| `status` | `FileUploadState['status']` | idle → uploading → extracting → processing → done/error/review |
| `ingest_id` | `string \| undefined` | ID de ingesta backend |
| `process_id` | `string \| undefined` | ID de proceso backend |
| `has_warnings` | `boolean \| undefined` | Si el auditor detectó observaciones |

### `addFiles` en `useUpload.ts`

- 1 archivo → `FileUploadState` sin `files`, sin `multi_file_mode`
- N>1 archivos → `FileUploadState` con `files: newFiles`, `multi_file_mode: 'documents'`
- El usuario puede cambiar a `'pages'` desde el toggle en `UploadProgressItem` (solo cuando `status === 'idle'`)

### `UploadProgressItem` — indicadores por archivo

Durante `status === 'extracting'`, el `current_file_index` del backend determina qué archivo muestra:
- `i < current_file_index` → ✓ (completado)
- `i === current_file_index` → `<CircularProgress size={10} />` (en proceso)
- `i > current_file_index` → `•` (pendiente)

El badge `+N ▾` que despliega la lista de archivos es un `<button>` con `aria-expanded`, `tabIndex={0}` y manejador `onKeyDown` para Enter/Space.

### Cola reordenable

`DraggableQueueList` implementa drag-and-drop sobre la cola de Via A. `reorderQueue` en `useUpload` actualiza el array de forma inmutable. El orden en la cola determina el orden de archivos en el FormData enviado al backend.

---

## Transacciones

### Eliminar transacciones

`/transactions` tiene dos operaciones destructivas:
- **Eliminar individual:** `useDeleteTransaction().mutateAsync(id)`
- **Eliminar por ingest:** `useDeleteTransactionsByIngest().mutateAsync(ingestId)`

Ambas usan `mutateAsync` con try/catch. Si el backend rechaza, se muestra un `<Alert severity="error">` con mensaje en español y botón de cierre. **No usar `mutate` fire-and-forget para acciones destructivas.**

### Detalle de transacción — traza de agentes

`buildAgentTrace(reasoning)` (en `src/lib/agentTrace.ts`) convierte el JSON de razonamiento del agente en `AgentStep[]`. El campo `detalle` de cada step es **siempre** `JSON.stringify(obj, null, 2)` — nunca solo `obj.resumen` — para que `AgentStepCard` pueda renderizar la vista estructurada de `asientos` y `totales`.

---

## Selects con datos externos

Patrón obligatorio cuando el valor guardado puede no estar en la lista cargada (municipios, catálogos):

```tsx
<Select value={ciudad} ...>
    <MenuItem value="">
        <em>Sin especificar</em>
    </MenuItem>
    {/* Preservar valor actual si no está en la lista */}
    {ciudad && !municipios.includes(ciudad) && (
        <MenuItem value={ciudad}>
            {ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}
        </MenuItem>
    )}
    {municipios.map((m) => (
        <MenuItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</MenuItem>
    ))}
</Select>
```

Aplica en: `TopBar.tsx` (dialogs de crear y editar empresa), `settings/page.tsx`.

---

## Sistema de diseño brutalist

Toda UI sigue el sistema brutalist editorial. Ver `CLAUDE.md` sección "DESIGN SYSTEM — BRUTALIST EDITORIAL" para tokens, primitivas y anti-patrones.

Referencia canónica visual: `/help`.

**No usar MUI default.** Siempre customizar con tokens de `src/styles/brutalist.ts`.

---

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `src/hooks/useUpload.ts` | Lógica de upload: addFiles, polling, reorderQueue, cancel |
| `src/hooks/useTransactions.ts` | Queries y mutaciones de transacciones (incluye delete) |
| `src/components/upload/UploadProgress.tsx` | UI de cola: UploadProgressItem, UploadProgress, badge a11y |
| `src/components/upload/DraggableQueueList.tsx` | Cola con drag-and-drop |
| `src/components/upload/ProcessAuditPanel.tsx` | Panel de auditoría post-proceso |
| `src/lib/agentTrace.ts` | `buildAgentTrace` — normaliza agent_reasoning (array o dict) a `AgentStep[]` |
| `src/app/transactions/[id]/page.tsx` | Detalle de transacción |
| `src/app/transactions/page.tsx` | Lista de transacciones + delete con error feedback |
| `src/components/layout/TopBar.tsx` | TopBar con dialogs de empresa (ciudad Select) |
| `src/app/settings/page.tsx` | Configuración del sistema (ciudad Select) |
| `src/lib/api/core/apiClient.ts` | `ApiClient` base — Axios + interceptor Bearer (Clerk) |
| `src/lib/api/clients/` | Clientes HTTP por dominio (ingest, process, report, tax, company…) |
| `src/types/index.ts` | Tipos TypeScript compartidos |
| `src/styles/brutalist.ts` | Tokens de diseño (paleta, fuentes, motion) |
| `src/test/` | Todos los tests unitarios |

---

## Pipeline CI

El pipeline falla si cualquiera de estos pasos falla:

1. `pnpm format:check` — Prettier
2. `pnpm tsc --noEmit` — TypeScript
3. `pnpm test` — Vitest (198+ tests)
4. `pnpm test:coverage` — cobertura ≥ 80%
5. `pnpm lint` — ESLint
6. `pnpm build` — Next.js build

Siempre verificar los 6 antes de reportar trabajo como completo.
