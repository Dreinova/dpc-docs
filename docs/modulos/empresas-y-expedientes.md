---
sidebar_position: 1
title: Dashboard y empresas
---

# Dashboard y empresas

## Dashboard (`/`)

Cantidades validadas por **año de revisión del informe** (Uso 1 + Uso 2), guardadas en kg y consolidadas en toneladas.

- Selector de año (por defecto el más reciente con datos).
- Indicadores: expedientes revisados, con Uso 1, con Uso 2, con ambos usos y total validado (t y kg).
- Tabla por expediente (un expediente con ambos usos aparece una sola vez) y búsqueda del histórico de un expediente por código.
- Datos: `v_cantidades_validadas` → `domain/dashboard.ts` (`resumirAnioRevision`, `consolidarPorExpediente`,
  `historicoExpediente`). Ver la regla en [Reglas de cálculo](../base-de-datos/calculos.md#consolidado-de-cantidades-validadas-dashboard).

## Directorio (`/empresas`)

Búsqueda por expediente, titular, NIT o representante legal, con filtros de estado (activo/archivado) y uso (Uso 1/Uso 2).
Los filtros van en la URL. Datos: `v_directorio`. Desde aquí se entra al consolidado de [proyecciones](proyecciones.md).

:::note Alta de empresas
La interfaz edita empresas existentes; no tiene un botón para crear una nueva. Los expedientes llegan por la
[importación](../importacion/proceso.md). La RPC `guardar_expediente` sí admite crear (sin `id`), por si se agrega esa opción.
:::

## Detalle de la empresa (`/empresas/:id`)

Encabezado con razón social, estado, expediente y NIT. Pestañas (parámetro `?tab=`):

| Pestaña | Contenido |
|---|---|
| Información general | Titular (NIT, DV, razón social, CIIU, contacto, municipio), representante legal vigente, expediente (código, estado, profesional, observaciones), tipos de uso y **operadores vinculados** |
| Uso 1 | Solo si el expediente declara algún uso de categoría Uso 1. Ver [Uso 1 y Uso 2](uso1-y-uso2.md) |
| Uso 2 · Doméstico | Solo si declara uso doméstico |
| Proyecciones | Proyecciones de meta de la empresa por vigencia y uso |
| Historial de cambios | Bitácora de auditoría del expediente y de todos sus registros |

La pestaña por defecto es Uso 1 si existe, si no Uso 2, si no Información general.

### Guardar la información general

Un solo llamado a `guardar_expediente(jsonb)`:

1. Upsert del **titular por NIT** (si el NIT ya existe, actualiza sus datos: el titular es compartido por sus expedientes).
2. Si el representante legal cambió, el anterior queda como histórico y se crea el nuevo vigente.
3. Crea o actualiza el expediente (código normalizado a mayúsculas).
4. Sincroniza los tipos de uso.

Validaciones (`esquemaInfoGeneral`): formato de expediente `DPC0000[-00[-0000]]`, NIT obligatorio, DV 0–9, municipio
perteneciente al departamento.

### Operadores del expediente

Un expediente puede trabajar con **varios operadores a la vez** (`expediente_operadores`, con marca `vigente`). Los gestores y
mecanismos del expediente solo se pueden elegir entre los de estos operadores. **Desvincular** un operador borra en cascada los
gestores y mecanismos asociados al expediente por ese operador (no toca los catálogos).
