---
sidebar_position: 7
title: Exportaciones, auditoría y configuración
---

# Exportaciones, auditoría y configuración

## Exportaciones (`/exportaciones`)

Descargas a Excel en un solo lugar. Cada tarjeta elige sus filtros y genera el archivo al momento con los datos vigentes,
**con las mismas columnas de las matrices originales**.

| Exportación | Filtros | Hojas |
|---|---|---|
| Certificados de gestión | Año de validación (por defecto 2026, o todos), operador, gestor, validado, incluir conciliación | `CERTIFICADOS` (columnas de `Certificados_Gestores.xlsx` y luego las que agrega el sistema), `RESUMEN` por operador, `CONCILIACION` opcional |
| Indicadores | Año de seguimiento | `INDICADOR`, `REZAGO` (columnas de `Matriz_Indicador_DPC2026`) |

Detalles:

- Con un año concreto, la columna de validación se llama como en la matriz (`VALIDADO_2026`); con todos los años se exporta el
  año en una columna aparte.
- Fechas y números salen como valores de Excel (formato de fecha `d "de" mmmm "de" yyyy`); los números largos guardados como texto
  (radicados) salen como número.
- Si un valor no existe pero la matriz tenía un texto (“Sin determinar”), se exporta ese texto (desde `marcas`).
- Nombres de archivo aptos para Windows (sin tildes ni signos).

## Auditoría (`/auditoria`)

Últimos 200 cambios del sistema: quién, cuándo, qué tabla y registro, qué campos y sus valores antes y después. La misma
información, filtrada por empresa, está en la pestaña *Historial de cambios* del detalle de la empresa. Ver
[Auditoría](../base-de-datos/auditoria.md).

## Configuración (`/configuracion`)

Muestra los catálogos (tipos de uso, tipos de tratamiento, tipos de mecanismo, profesionales) y cuántos departamentos y
municipios de la DIVIPOLA hay cargados. En la interfaz son **de solo lectura**; los cambios a catálogos los hace un administrador
directamente en la base (la RLS solo permite escribirlos al rol `admin`).

## Mi cuenta (`/cuenta`)

Datos del usuario y cambio de contraseña.
