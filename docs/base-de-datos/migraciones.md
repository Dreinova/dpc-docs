---
sidebar_position: 5
title: Migraciones
---

# Migraciones

Esquema versionado en `supabase/migrations/`. Se aplican en orden por nombre (fecha + número).

| # | Archivo | Contenido |
|---|---|---|
| 1 | `20261007000001_catalogos_y_seguridad.sql` | Extensiones, esquemas `audit` y `staging`, `perfiles` y roles, funciones de seguridad, `audit.eventos` y `audit.registrar()`, sellos, catálogos (DIVIPOLA, tipos, actividades, profesionales, metas de cobertura) |
| 2 | `20261007000002_nucleo.sql` | Titulares, representantes, expedientes, tipos de uso, operadores (+ alias), gestores (+ alias, actividades), relaciones operador–gestor y expediente–operador/gestor/mecanismo, tratamientos operador×gestor, mecanismos, `registros_uso1` con calculados, operadores y tratamientos del periodo; activa auditoría |
| 3 | `20261007000003_vistas_rpc_rls.sql` | Vistas `v_directorio`, `v_registros_uso1`, `v_cantidades_validadas`; RPC `guardar_expediente`, `guardar_registro_uso1`, `historial_auditoria`; RLS de todas las tablas |
| 4 | `20261007000004_staging_importacion.sql` | `staging.lotes`, `archivos`, `filas`, `incidencias` |
| 5 | `20261008000005_endurecimiento.sql` | `search_path` fijo y permisos de ejecución (asesor de seguridad de Supabase) |
| 6 | `20261008000006_uso2.sql` | Uso 2: registros, cobertura (1:1), operadores, tratamientos, triggers, `v_registros_uso2`, nueva `v_cantidades_validadas` (Uso 1 ∪ Uso 2), `guardar_registro_uso2`; auditoría resuelve el expediente también desde Uso 2 |
| 7 | `20261009000007_fase3_indicadores_importacion.sql` | Ajustes de Uso 2 con el histórico completo (nulos en importación, origen de la base `RECOLECTADA_ANTERIOR`/`META_ANTERIOR`), `normalizar_clave()`, `estados_san`, `seguimientos` + `v_seguimientos` + RPC, `staging.resultados` |
| 8 | `20261009000008_importador.sql` | `staging.iniciar_lote`, `registrar_incidencias`, `resultado`, `importar`, `revertir_lote`, `v_conciliacion_validadas` |
| 9 | `20261010000009_certificados_proyecciones.sql` | `certificados_gestion`, `v_certificados_gestion`, `v_conciliacion_certificados`, `proyecciones`, `v_proyecciones`, importador y reversión ampliados |
| 10 | `20261013000010_expediente_certificados.sql` | `expediente_certificados`: certificados que presenta la empresa (reemplaza la pestaña “Tipo de tratamiento”) |
| 11 | `20261013000011_gestion_individual.sql` | `operadores.gestion_individual` (COLECTA = `true`) y trigger que impide asignar un certificado individual a dos empresas |
| 12 | `20261013000012_certificados_automaticos.sql` | Gestión global: certificados añadidos automáticamente a las empresas que usan el gestor; carga retroactiva |
| 13 | `20261013000013_proyecciones_uso2.sql` | `proyecciones.categoria_uso`, campos de Uso 2, nueva clave única `(expediente, vigencia, uso)`, `meta_recoleccion` según categoría, metas de puntos y campañas; `v_proyecciones` sin comparación con el periodo anterior |

## Crear una migración

1. Archivo nuevo en `supabase/migrations/` con prefijo `AAAAMMDDhhmmss_` mayor que el último.
2. Para cada tabla de datos nueva: `select public.activar_auditoria('public.<tabla>')`, RLS con las cuatro políticas
   (`lectura`, `insercion`, `edicion`, `eliminacion`) y `origen jsonb` si se podrá importar.
3. Funciones nuevas: `set search_path`, `revoke execute … from public, anon` y `grant … to authenticated` si son RPC.
4. Si la importación debe poder revertir la tabla, añadirla a `staging.revertir_lote()` en el orden correcto.
5. Probar en local: `npm run db:reset` y `npm test` (las pruebas de BD aplican **todas** las migraciones sobre PGlite).
6. Regenerar tipos si hace falta: `npm run db:tipos`.

:::caution 
Columnas generadas
No se puede cambiar la expresión de una columna generada: hay que borrarla y crearla de nuevo, y antes borrar las vistas que
dependen de ella (ver la migración 13 con `meta_recoleccion` y `v_proyecciones`).
:::

## Aplicar en producción

Ver [Despliegue](../operacion/despliegue.md#migraciones-en-producción): `supabase db push` con el proyecto enlazado o el SQL
Editor, **antes** de publicar la versión de la aplicación que las necesita.
