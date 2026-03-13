# Frontend-Backend Sync Status

Fecha: 2026-03-11

## Resumen ejecutivo

El frontend fue actualizado para alinearse con los cambios recientes del backend sin modificar el backend.

Estado actual:

- Frontend sincronizado con los endpoints actuales del backend para dashboard, health, transactions detail y settings.
- Frontend compila y pasa lint correctamente.
- El mayor riesgo restante no está en el frontend sino en validación runtime del backend con base de datos real.
- Existe una discrepancia detectada en un test del backend (`test_process_api.py`) respecto al contrato actual del endpoint `GET /api/v1/process/result/{process_id}`.

## Cambios aplicados en frontend

### 1. Dashboard

Se conectó el dashboard a `GET /api/v1/dashboard/stats` para consumir contadores reales.

Archivos relevantes:

- `src/app/page.tsx`
- `src/hooks/useDashboard.ts`
- `src/hooks/index.ts`

### 2. Health Check

Se centralizó el consumo del health check en `src/lib/api.ts` y se corrigió la normalización del payload para evitar errores de tipos.

Archivos relevantes:

- `src/lib/api.ts`
- `src/hooks/useHealthCheck.ts`

### 3. Transactions Detail

La vista de detalle de transacción dejó de depender solo de mock local y ahora usa `GET /api/v1/transactions/{id}`.

Archivos relevantes:

- `src/lib/api.ts`
- `src/hooks/useTransactions.ts`
- `src/app/transactions/[id]/page.tsx`

### 4. Settings

Se añadieron contratos, funciones API y hooks para los endpoints nuevos:

- `GET /api/v1/settings/company/{nit}`
- `PUT /api/v1/settings/company/{nit}`
- `POST /api/v1/settings/company/{nit}/setup`

La página `/settings` ahora puede:

- consultar configuración por NIT,
- guardar configuración manual,
- ejecutar setup automático con ciudad, CIIU e IVA.

Archivos relevantes:

- `src/lib/api.ts`
- `src/hooks/useSettings.ts`
- `src/app/settings/page.tsx`
- `src/hooks/index.ts`

### 5. Books

Se alineó el tipo `BookType` con la capacidad real del backend, agregando `balance`, y se corrigieron las pantallas de libros para que el build no falle.

Archivos relevantes:

- `src/types/index.ts`
- `src/app/books/page.tsx`
- `src/app/books/[type]/page.tsx`

### 6. Reports y Tax

El backend actual devuelve respuestas genéricas con forma `report` + `data`, mientras que la UI esperaba estructuras más detalladas.

Para evitar roturas runtime, `src/lib/api.ts` normaliza ambas variantes y devuelve una forma estable para la UI.

## Validaciones ejecutadas

### Frontend

Comandos ejecutados:

- `npm run lint`
- `npm run build`

Resultado:

- `lint`: OK
- `build`: OK

### Backend

Comandos ejecutados:

- `uv run pytest tests/test_api_endpoints.py -q`
- `uv run pytest tests/test_validation_system.py -q`
- `uv run pytest tests/test_database.py -q`
- `uv run pytest tests/test_process_api.py -q`

Resultado observado:

- `test_api_endpoints.py`: 4 skipped
- `test_validation_system.py`: 40 passed
- `test_database.py`: 26 skipped
- `test_process_api.py`: 1 failed, 5 passed

## Hallazgos relevantes

### 1. Test backend desactualizado

El test `tests/test_process_api.py` espera una clave `detail` en la respuesta `202` de `GET /api/v1/process/result/{process_id}`.

Sin embargo, el contrato actual del backend devuelve `message`.

Esto no rompe el frontend, pero sí indica que el test backend está desalineado respecto al contrato efectivo.

### 2. Dependencia de base de datos para smoke tests reales

Cuando se intentó validar endpoints reales con `TestClient`, los endpoints que dependen de DB fallaron por falta de conexión a PostgreSQL local (`localhost:5432`).

Esto impide certificar en este entorno el flujo completo de settings o cualquier integración real que requiera base de datos activa.

## Riesgo actual

Riesgo frontend: bajo.

- El frontend está tipado, compila y cubre los endpoints nuevos relevantes.
- Existen fallbacks en varias pantallas para evitar crashes si el backend responde vacío o no está disponible.

Riesgo backend/integración: medio.

- Falta validar algunos flujos contra una base de datos activa.
- Hay al menos un test backend desactualizado respecto al contrato actual.

## Recomendación operativa

Sin tocar backend, la validación manual más útil en ambiente local es:

1. Abrir dashboard y verificar contadores.
2. Entrar a settings y probar carga por NIT.
3. Ejecutar setup automático con ciudad y CIIU.
4. Guardar cambios manuales en settings.
5. Abrir detalle de una transacción real.
6. Revisar libros incluyendo `balance`.

Si todo eso responde correctamente con backend y DB levantados, el frente puede considerarse sincronizado para el estado actual del proyecto.
