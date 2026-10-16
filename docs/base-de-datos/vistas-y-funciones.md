---
sidebar_position: 3
title: Vistas, funciones y triggers
---

# Vistas, funciones y triggers

## Vistas

Todas con `security_invoker = true`: respetan la RLS del usuario que consulta.

| Vista | Contenido | La usa |
|---|---|---|
| `v_directorio` | Expediente + titular + representante vigente + municipio/departamento + tipos de uso (`tiene_uso1`, `tiene_uso2`) + operadores vigentes | Directorio, contadores |
| `v_registros_uso1` | Registro + operadores (ids y nombres) + tratamientos (jsonb) + profesional + quién creó/actualizó | Uso 1 |
| `v_registros_uso2` | Registro + cobertura + operadores + tratamientos + profesional + quién creó/actualizó | Uso 2, proyecciones Uso 2, “traer datos” en Indicadores |
| `v_cantidades_validadas` | Uso 1 ∪ Uso 2: `validada_kg` (sin abono) y `total_validado_kg` por expediente, uso y periodo | Dashboard |
| `v_seguimientos` | Seguimiento + expediente, titular, NIT, representante, estado SAN, ejecutor, revisor, autores | Indicadores, exportación |
| `v_certificados_gestion` | Entregas certificadas con nombres de operador, gestor (NIT, DV) y tratamiento | Certificados, exportación |
| `v_conciliacion_certificados` | Certificados validados frente a `operador_gestor_tratamientos` con estado | Pestaña Conciliación |
| `v_proyecciones` | Proyección + expediente, titular, operador, autores | Proyecciones |
| `staging.v_conciliacion_validadas` | kg validados por expediente, periodo y uso para comparar con `4_CANT_VALIDADAS` | Reporte del importador |

## Funciones RPC (expuestas a `authenticated`)

Todas llaman a `exigir_edicion()` (salvo la de lectura), corren con `security invoker` y en una transacción.

| Función | Qué hace |
|---|---|
| `guardar_expediente(p jsonb) → uuid` | Upsert del titular por NIT; si cambia el representante legal, cierra el vigente y crea uno nuevo; crea o actualiza el expediente; sincroniza `expediente_tipos_uso` si se envía `tipos_uso`. |
| `guardar_registro_uso1(p jsonb) → uuid` | Crea o actualiza un periodo de Uso 1. En la edición **solo actualiza las claves presentes** en el JSON (permite guardar por secciones: cantidades, desuso, observaciones). Sincroniza `operador_ids` y `tratamientos` si vienen. No acepta campos calculados. |
| `guardar_registro_uso2(p jsonb) → uuid` | Igual para Uso 2, más el objeto `cobertura` (poblaciones, puntos y campañas). |
| `guardar_seguimiento(p jsonb) → uuid` | Crea o edita un seguimiento. Normaliza: lo que no aplica al tipo se guarda vacío. Si se cambia el tipo de un registro con datos que el nuevo tipo no admite, lanza `CAMBIO_TIPO_REQUIERE_CONFIRMACION` salvo que llegue `confirmar_cambio_tipo: true`. Hace una sola escritura para que la auditoría registre un único evento. |
| `eliminar_seguimiento(p_id uuid)` | Elimina un seguimiento (con verificación de permisos). |
| `historial_auditoria(p_expediente_id, p_tabla, p_registro_id, p_limite)` | Lee `audit.eventos` filtrando por expediente, tabla o registro; máximo 500 filas, más recientes primero. |

Funciones de seguridad: `rol_actual()`, `puede_editar()`, `es_admin()`, `exigir_edicion()`.
Utilidad: `normalizar_clave(text)` → mayúsculas, sin tildes y sin caracteres no alfanuméricos (misma regla que el importador
en Python, para comparar nombres de operadores, gestores y profesionales).

## Triggers

| Trigger | Tabla | Momento | Función |
|---|---|---|---|
| `trg_auth_crear_perfil` | `auth.users` | after insert | `crear_perfil_usuario()`: crea el perfil |
| `trg_audit` | Todas las tablas de datos | after insert/update/delete | `audit.registrar()`: bitácora |
| `trg_sello` | Tablas con `actualizado_en` | before update | `sellar_actualizacion()` / `sellar_cobertura()` |
| `trg_registros_uso1_defaults` | `registros_uso1` | before insert | Año de revisión = periodo + 1 si viene vacío |
| `trg_registros_uso1_validar` | `registros_uso1` | before insert/update de `expediente_id` | Exige uso de categoría Uso 1 |
| `trg_registros_uso2_validar` | `registros_uso2` | before insert/update de `expediente_id` | Exige uso doméstico |
| `trg_registros_uso2_exigir_campos` | `registros_uso2` | before insert/update | Año de revisión y % incremento obligatorios fuera de la importación |
| `trg_registros_uso2_cobertura` | `registros_uso2` | after insert | Crea la fila de cobertura con el % de `metas_cobertura` |
| `trg_certificado_individual` | `expediente_certificados` | before insert/update | Con operador de gestión individual, el certificado solo puede estar en una empresa (bloqueo `pg_advisory_xact_lock` para evitar carreras) |
| `trg_anadir_a_empresas` | `certificados_gestion` | after insert | Operador de gestión global: añade el certificado nuevo a todas las empresas que usan ese gestor con ese operador |
| `trg_anadir_certificados` | `expediente_gestores` | after insert | Operador de gestión global: la empresa recibe los certificados existentes del gestor asociado |

:::note 
Certificados quitados no vuelven solos
Los dos triggers de gestión global solo actúan al **crear** un certificado o al **asociar** un gestor. Si la empresa quita un
certificado que no presentó, no reaparece en ediciones posteriores.
:::

## Funciones del esquema `staging`

No expuestas a la API (`revoke all … from public, anon, authenticated`). Ver [Importación](../importacion/proceso.md).

| Función | Qué hace |
|---|---|
| `staging.iniciar_lote(id, descripcion, archivos)` | Registra el lote y sus archivos (nombre, SHA-256, tamaño) |
| `staging.registrar_incidencias(lote, incidencias)` | Guarda las incidencias detectadas al leer los Excel |
| `staging.resultado(...)` | Acumula por entidad: detectadas, insertadas, existentes, omitidas |
| `staging.profesional_id(nombre)` | Busca un profesional por nombre normalizado |
| `staging.importar(lote, datos)` | Carga las matrices (Fase 3) en orden de dependencias, solo lo que no existe |
| `staging.importar_certificados_proyecciones(lote, datos)` | Carga certificados y proyecciones |
| `staging.revertir_lote(lote)` | Borra solo lo que insertó ese lote, en orden inverso |
