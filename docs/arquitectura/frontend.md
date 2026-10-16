---
sidebar_position: 2
title: Frontend
---

# Frontend

SPA en **React 19 + TypeScript estricto** compilada con **Vite**. Estilos con **Tailwind CSS 4** (plugin `@tailwindcss/vite`).
El alias `@/` apunta a `src/`.

## Capas

| Carpeta | Responsabilidad | Regla |
|---|---|---|
| `src/domain/` | Tipos, fórmulas (`uso1/calculos.ts`, `uso2/calculos.ts`, `seguimientos.ts`, `proyecciones.ts`, `certificados.ts`), esquemas Zod de formularios, consolidado del dashboard, conversión de coordenadas, armado de hojas de exportación | Sin React ni Supabase. Todo lo de aquí tiene pruebas en `tests/domain/`. |
| `src/services/` | Acceso a datos con `supabase-js`: consultas a vistas, RPC y escrituras | **La UI no consulta tablas directamente**: siempre pasa por un servicio. Los errores se traducen con `exigir()` / `traducirError()`. |
| `src/features/` | Pantallas por módulo (dashboard, empresas, uso1, uso2, indicadores, operadores, gestores, mecanismos, certificados, proyecciones, exportaciones, auditoría, configuración, registros compartidos) | Usan TanStack Query y los componentes de `components/`. |
| `src/components/` | UI reutilizable (`ui/index.tsx`: botones, tarjetas, tablas, pestañas, insignias, estados vacío/error; `ui/feedback.tsx`: avisos, diálogos y confirmaciones; `ui/paginacion.tsx`) y layout | Sin acceso a datos. |
| `src/auth/` | `AuthProvider`, login, recuperación y definición de contraseña | |
| `src/lib/` | Cliente Supabase, variables de entorno, errores, formato numérico/fechas (`es-CO`), claves de caché | |

## Arranque y enrutamiento

`main.tsx` monta, en este orden: `QueryClientProvider` → `AuthProvider` → `ProveedorAvisos` → `BrowserRouter` → `App`.

`App.tsx` decide qué mostrar:

1. Sin `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` → pantalla `SinConfiguracion`.
2. Cargando sesión → indicador de carga.
3. Sin sesión → `LoginPage`.
4. Llegó por enlace de invitación o recuperación → `DefinirClavePage` (definir contraseña).
5. Con sesión → rutas dentro de `AppLayout` (menú lateral, usuario y rol, cerrar sesión).

| Ruta | Pantalla |
|---|---|
| `/` | Dashboard |
| `/empresas` | Directorio de empresas |
| `/empresas/proyecciones` | Consolidado de proyecciones de meta |
| `/empresas/:id` | Detalle de la empresa (expediente) con pestañas `?tab=general|uso1|uso2|proyecciones|historial` |
| `/operadores`, `/operadores/:id` | Operadores logísticos y su detalle (gestores y mecanismos del operador) |
| `/gestores` | Gestores |
| `/gestores/certificados` | Certificados de gestión y conciliación |
| `/mecanismos`, `/mecanismos/mapa` | Mecanismos de recolección y mapa |
| `/indicadores`, `/indicadores/:id` | Seguimientos (Indicadores) y formulario de un seguimiento |
| `/exportaciones` | Descargas a Excel |
| `/auditoria` | Bitácora de cambios |
| `/configuracion` | Catálogos (solo lectura en la UI) |
| `/cuenta` | Mi cuenta (cambiar contraseña) |

`vercel.json` reescribe toda ruta a `index.html` para que el enrutamiento del lado del cliente funcione al recargar.

## Datos y caché

- **TanStack Query** con `staleTime: 30 s`, `retry: 1` y sin recarga al enfocar la ventana.
- Las claves de caché están centralizadas en `src/lib/consultas.ts` (`claves.expediente(id)`, `claves.registrosUso1(id)`,
  `claves.certificadosExpediente(id)`…) para invalidar consultas relacionadas después de guardar.
- Los catálogos (`tipos_uso`, `tipos_tratamiento`, `tipos_mecanismo`, `actividades_gestor`, DIVIPOLA, `profesionales`) se cargan
  una vez (`useCatalogos`, `staleTime: Infinity`).
- **Límite de filas de PostgREST**: `max_rows = 1000`. `exigirTodas()` pide los datos en lotes con `range()` y un orden total
  (siempre termina en una columna única, normalmente `id`) para no quedar recortados en silencio. Se usa en listados grandes
  (municipios, mecanismos, certificados, seguimientos, directorio).
- `numeric` de Postgres llega como número o texto según el tamaño; los servicios lo normalizan a `number`.
- La **paginación** de las tablas es en el navegador (`usePaginacion`): la consulta trae todo y los filtros trabajan sobre el
  conjunto completo. El tamaño de página se recuerda en `localStorage` y la página actual va en la URL.

## Formularios y validación

- **React Hook Form + Zod** (`@hookform/resolvers`). Los esquemas están en `domain/` (`esquemaInfoGeneral`, `esquemaCantidades`,
  `esquemaCantidadesUso2`, `esquemaCoberturaUso2`, `esquemaSeguimiento`, `esquemaCertificado`, `esquemaProyeccionUso1/Uso2`).
- Los números aceptan formato colombiano y anglosajón (`"1.234,5"` y `"1234.5"`) mediante `aNumero()`; vacío → `null`.
- Los porcentajes se capturan en % (75) y se guardan como fracción (0,75).
- Los **campos calculados no forman parte de los formularios**: se muestran como vista previa (`DatoCalculado`) con las mismas
  fórmulas que la base, y al guardar se leen los valores reales de las columnas generadas.

## Errores

`traducirError()` convierte los códigos de Postgres/PostgREST en mensajes en español:

| Código | Mensaje |
|---|---|
| `23505` | Ya existe un registro con esos datos (p. ej. el mismo periodo para este expediente) |
| `23503` | La relación no es válida: el elemento debe pertenecer a un operador vinculado al expediente |
| `23514` | Mensaje de la función SQL (ya viene en español) o “Algún valor no cumple las reglas de validación” |
| `42501` | No tiene permisos para realizar esta acción |
| `P0002` / `PGRST116` | El registro no existe o fue eliminado |

## Exportación a Excel

`services/exportarExcel.ts` carga **ExcelJS** con `import()` dinámico solo al exportar (≈1 MB). Las hojas se arman en
`domain/exportarSeguimientos.ts` y `domain/exportarCertificados.ts` (con pruebas) con las **mismas columnas y el mismo orden que
las matrices originales**; fechas y números salen como valores de Excel y los textos que la matriz tenía en lugar de un número
(“Sin determinar”, “No aplica”) se conservan desde `marcas`.

## Mapa

`/mecanismos/mapa` usa **Leaflet** con teselas de OpenStreetMap. Las coordenadas se guardan en MAGNA-SIRGAS Origen Nacional
(CTM12, EPSG:9377) y se convierten a WGS84 en el navegador con `domain/coordenadas.ts` (series de Krüger de orden n⁴, precisión
milimétrica). Las que caen fuera del recuadro de Colombia se listan como “Coordenadas por revisar”.

## Convenciones

- Nombres de dominio en español en todo el código (tablas, columnas, funciones, componentes).
- TypeScript con `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`.
- `npm run build` ejecuta `tsc` antes de `vite build`: un error de tipos rompe la compilación.
