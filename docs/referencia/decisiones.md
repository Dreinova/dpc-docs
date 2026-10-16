---
sidebar_position: 1
title: Decisiones y pendientes
---

# Decisiones y pendientes

Decisiones tomadas con el cliente que explican por qué el sistema se comporta distinto a los Excel o a lo conversado.

## Decisiones

| Fecha | Tema | Decisión | En el sistema |
|---|---|---|---|
| 2026-10-07 | % de cumplimiento (Uso 1) | `total × % meta ÷ meta` (fórmula del Excel). Cumple solo si `% cumplimiento ≥ % meta`. | Columnas generadas; se quitó el “avance sobre la meta” |
| 2026-10-07 | % de meta de Uso 1 | Varía por año; lo digita cada profesional | Campo obligatorio por periodo, sin valor por defecto |
| 2026-10-07 | Total validado | Incluye lo abonado en vigencia posterior. El consolidado (hoja 4) no lo incluye para no duplicar | `total_validado` con abono; `v_cantidades_validadas.validada_kg` sin abono |
| 2026-10-07 | Reciclaje y Valoración | Son el mismo tratamiento: **Aprovechamiento** | Un solo código `APROVECHAMIENTO` |
| 2026-10-07 | Periodo de `TIPO_GESTION` / `OPERADORES` | Son las cantidades que se validan este año | `anio_validacion = 2026` |
| 2026-10-07 | Coordenadas | MAGNA-SIRGAS Origen Nacional (CTM12) | EPSG:9377 en `mecanismos` |
| 2026-10-07 | Contacto y representante | Son del titular | Columnas en `titulares` |
| 2026-10-09 | Duplicados contradictorios de Uso 1 (C1) | Se conservan las filas 78, 80 y 329; se descartan 82, 83, 331, 332 y 333 | `DECISIONES_DUPLICADOS_USO1` en el importador |
| 2026-10-09 | Expedientes del Indicador sin directorio (C2) | El cliente entregó los 6 NIT | Titulares y expedientes creados (`EXPEDIENTES_COMPLEMENTARIOS`); faltan dirección, representante, DV y usos |
| 2026-10-09 | INDICADOR sin datos (C3) | Se cargan como pendientes | 101 seguimientos con insignia *Pendiente* |
| 2026-10-09 | Base de la meta de Uso 2 (C4) | Editable; por regla, lo recolectado del periodo anterior; hay excepciones | Propuesta `RECOLECTADA_ANTERIOR`; DPC0002 marcado `META_ANTERIOR` |
| 2026-10 | Tipo de seguimiento | “Tipo” = hoja de origen; la columna `TIPO_SEGUIMIENTO` del Excel pasa a llamarse **Modalidad** | `seguimientos.tipo` y `seguimientos.modalidad` |
| 2026-10-13 | Certificados de COLECTA | COLECTA gestiona por empresa; los demás operadores, globalmente | `operadores.gestion_individual` |
| 2026-10-13 | Proyecciones | Sin variación frente al periodo anterior; proyecciones también para Uso 2 | Migración 13 |

## Pendientes

| # | Tema | Situación actual |
|---|---|---|
| C5 | % de cumplimiento de Uso 2 cuando el % de incremento no es 10 % (periodos 2020 con 5 %) | El Excel usa 10 % fijo y el sistema el % del periodo. El veredicto (total ≥ meta) es el mismo; cambia el número mostrado |
| C6 | NIT de BIOECOLÓGICA COLOMBIA S.A.S. (y APROVET) | Creados sin NIT |
| C7 | Valores digitados sobre fórmulas en el Excel (metas redondeadas, totales que no suman) | El sistema recalcula siempre; el cliente decide si algún valor manual era intencional |
| — | Datos faltantes de los 6 titulares de C2 | Dirección, representante, DV y usos por completar |
| — | Fechas mal escritas en certificados (`23/05/202`, `15/012026`, `01/10/205`) | Vacías con aviso; las corrige el usuario |
| — | Diferencias de clasificación de REPCO entre `TIPO_GESTION` y certificados | Visibles en la pestaña Conciliación |

## Diferencias con el Excel que son intencionales

- **Toneladas**: el Excel calculaba `kg × 1000`; el sistema `kg / 1000`.
- **Duplicados**: el Excel sumaba dos veces filas duplicadas en `4_CANT_VALIDADAS` (DPC0170-00 y DPC0043 2024); el sistema no.
- **Valores digitados encima de fórmulas**: el sistema los recalcula desde los datos fuente.
- **Formato condicional roto** en Uso 1 (`< #REF!`): reemplazado por la regla explícita de cumplimiento.
