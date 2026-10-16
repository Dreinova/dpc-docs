---
sidebar_position: 3
title: Indicadores
---

# Indicadores (`/indicadores`)

Seguimiento anual de los expedientes por parte de la autoridad. Reemplaza las hojas `INICIALES`, `INDICADOR`, `REZAGO` y
`OTROS` de `Matriz_Indicador_DPC2026`. Tabla `seguimientos`, vista `v_seguimientos`, RPC `guardar_seguimiento` y
`eliminar_seguimiento`.

## Tipos y modalidad

| Tipo (hoja de origen) | Secciones que aplican |
|---|---|
| `INICIAL` (Iniciales) | Modalidad, concepto técnico, auto, ejecutoria, valor liquidado, observaciones, ejecutor, revisor |
| `INDICADOR` | Todo lo anterior + último informe (radicado y fecha) + proceso sancionatorio + metas y cantidades |
| `REZAGO` | Igual que Indicador + **vigencia de origen** |
| `OTROS` | Iniciales + proceso sancionatorio (sin metas ni último informe) |

**Modalidad** es la columna `TIPO_SEGUIMIENTO` del Excel (*Documental* / *Con visita*). En el sistema, **tipo de seguimiento**
es la hoja de origen, como pidió el cliente.

Hay un seguimiento por `(expediente, año de seguimiento, tipo)`. El año de referencia de la matriz vigente es **2026**
(`ANIO_REFERENCIA`).

## Metas y cálculos

Solo Indicador y Rezago: meta, cantidad gestionada, cantidad validada (ANLA), % meta, meta de puntos fijos, puntos de
recolección, meta de campañas, campañas. La base calcula `porcentaje_cumplimiento` y `porcentaje_cobertura` (70 % fijo).
Ver [Reglas de cálculo](../base-de-datos/calculos.md#indicadores-seguimientos).

El formulario tiene **Traer datos de Uso 1 / Uso 2**: copia a los campos del formulario los valores de un periodo del
histórico del mismo expediente (cantidades, % meta o % incremento y, en Uso 2, cobertura). Los valores quedan editables.

## Cambio de tipo

Cambiar el tipo de un seguimiento guardado puede dejar datos fuera (p. ej. metas al pasar a Iniciales). La aplicación muestra
qué campos se perderían (`camposQueSePierden`) y pide confirmación; la base lo exige también: sin `confirmar_cambio_tipo` lanza
`CAMBIO_TIPO_REQUIERE_CONFIRMACION`. Nunca se borra información en silencio.

## Textos que no son valores

La matriz traía “Sin determinar”, “No aplica”, “Pendiente” o celdas con dos fechas. En la base el campo queda vacío y el texto
original se conserva en `marcas`; la pantalla y la exportación lo muestran. Los seguimientos importados sin datos (101 filas de
INDICADOR solo con expediente y titular) aparecen con la insignia **Pendiente**.

## Exportación

**Exportar a Excel** (también en [Exportaciones](exportaciones-auditoria-configuracion.md)) descarga un libro con solo las hojas **INDICADOR** y
**REZAGO**, con las columnas y el orden de la matriz original, filtrado por el año y la búsqueda en pantalla. Iniciales y Otros
no se exportan porque no validan cantidades.
