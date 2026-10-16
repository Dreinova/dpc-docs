---
sidebar_position: 4
title: Auditoría
---

# Auditoría

Cada inserción, modificación y eliminación en las tablas de datos queda en `audit.eventos`, escrita por triggers. La tabla no
se edita ni se borra y no es accesible desde la API.

## Estructura de `audit.eventos`

| Columna | Contenido |
|---|---|
| `ocurrido_en` | Fecha y hora |
| `usuario_id`, `usuario_nombre` | `auth.uid()` y el nombre del perfil. Sin usuario (importación, seed) se usa `app.usuario_nombre` o `sistema`. |
| `tabla`, `registro_id` | Tabla afectada e id de la fila. En tablas de asociación sin `id` se arma una clave legible con los ids compuestos (`expediente:operador:gestor…`). |
| `accion` | `INSERT`, `UPDATE`, `DELETE` |
| `campos_cambiados` | En `UPDATE`, las columnas que cambiaron (sin `actualizado_en` ni `actualizado_por`). Si no cambió nada relevante, no se registra evento. |
| `datos_antes`, `datos_despues` | Fila completa en JSON |
| `expediente_id` | Expediente al que pertenece el cambio, para el historial de la empresa: directo, por `expediente_id` de la fila o, en tablas hijas, buscando el `registro_id` en `registros_uso1` y `registros_uso2` |
| `origen` | `app` (por defecto), `importacion` o `reversion`, según `app.origen` |

Índices: `(tabla, registro_id)`, `(expediente_id, ocurrido_en desc)`, `(ocurrido_en desc)`.

## Cómo se activa

```sql
select public.activar_auditoria('public.registros_uso1');          -- auditoría + sello de actualización
select public.activar_auditoria('public.expediente_operadores', false);  -- solo auditoría (tabla sin actualizado_en)
```

Una tabla de datos nueva debe llamar a `activar_auditoria()` en su migración.

## Cómo se consulta

- **Historial de la empresa**: pestaña *Historial de cambios* del detalle de la empresa (`historial_auditoria(p_expediente_id)`).
- **Auditoría general**: pantalla `/auditoria`.
- **Última actualización** de un periodo: las vistas exponen `creado_por_nombre` y `actualizado_por_nombre`.

Ejemplo en la interfaz: *“Editado por Laura Delgado — 07/10/2026 20:32 · cant_validada_vig_seg: 0 → 1700”*.

## Importaciones

Las funciones de `staging` fijan `app.origen = 'importacion'` y `app.usuario_nombre` (“Importación Fase 3”, “Importación
certificados y proyecciones”); la reversión usa `app.origen = 'reversion'`. Así la bitácora distingue lo cargado desde Excel de
lo digitado en la aplicación.
