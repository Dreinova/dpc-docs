---
sidebar_position: 2
title: Reglas de cálculo
---

# Reglas de cálculo

Todas las fórmulas son **columnas generadas** (`generated always as … stored`): la base las calcula y nadie puede escribirlas.
El frontend replica las mismas fórmulas en `src/domain/` solo para la vista previa del formulario; las pruebas
`tests/db/*.db.test.ts` comprueban que TypeScript y Postgres den el mismo resultado y que coincidan con los valores del Excel.

Unidades: cantidades en **kg**; poblaciones en **habitantes**; puntos fijos y campañas en **unidades**; porcentajes como
fracción (0,75 = 75 %). Un resultado `null` se muestra como **“Sin determinar”**.

## Uso 1

Fuente: hoja `2_HISTORICO_USO1`, confirmada por el cliente (2026-10-07).

```text
META_RECOLECCION        = CANT_PUESTA_MERCADO × %_META
TOTAL_VALIDADO          = VALIDADA_VIG_SEG + VALIDADA_VIG_POST + ABONADA_VIG_POST        (nulos = 0)
%_CUMPLIMIENTO          = TOTAL_VALIDADO × %_META / META_RECOLECCION                     (null si META ≤ 0 o nula)
CUMPLE                  ⇔ %_CUMPLIMIENTO ≥ %_META
```

- El **% de meta lo digita el profesional en cada periodo** (75 % en los años recientes; hacia atrás baja de 5 en 5). No hay
  valor por defecto.
- Como `META = PUESTA × %META`, el % de cumplimiento equivale a `TOTAL / PUESTA`. El cliente confirmó esta definición del
  Excel frente a la alternativa `TOTAL / META` que se había conversado.
- El año de revisión del informe se sugiere como `periodo + 1`, pero se guarda aparte (son independientes).

Ejemplo (DPC0004, periodo 2023): meta = 2 715,5 × 0,75 = **2 036,625**; total = 0 + 2 807,76 + 0 = **2 807,76**;
% = 2 807,76 × 0,75 / 2 036,625 = **103,4 %** → cumple.

## Uso 2 · recolección

Fuente: hoja `3_HISTORICO_USO2`.

```text
META_RECOLECCION        = BASE + BASE × %_INCREMENTO                                     (null sin base)
TOTAL_VALIDADO          = VALIDADA + VALIDADA_VIG_POST + ABONADA_VIG_POST
%_CUMPLIMIENTO          = TOTAL_VALIDADO × %_INCREMENTO / META                           (el Excel usa 10 % fijo)
CUMPLE                  ⇔ TOTAL_VALIDADO ≥ META                                          (⇔ %CUMPLIMIENTO ≥ %INCREMENTO)
```

**Base de la meta** (`cant_base_meta`): es un dato del registro, editable, con su origen en `origen_base_meta`:

| Origen | Significado |
|---|---|
| `RECOLECTADA_ANTERIOR` | Lo recolectado en el periodo anterior. Es la regla del cliente y la que **propone** el formulario (45 de 76 periodos del histórico la siguen). |
| `META_ANTERIOR` | La meta del periodo anterior (caso de DPC0002, por ajuste del concepto técnico 3127). |
| `MANUAL` | Digitada. Obligatoria si no hay periodo anterior; el sistema nunca inventa la base. |

`proponerBaseMeta()` solo mira el periodo inmediatamente anterior (`periodo − 1`).

## Uso 2 · cobertura poblacional

```text
%_META_COBERTURA        = metas_cobertura[periodo]          (copiado al registro al crearlo)
META_PUNTOS_FIJOS       = POBLACIÓN_PUNTOS_FIJOS × %_META_COBERTURA / 50 000
META_CAMPAÑAS           = POBLACIÓN_CAMPAÑAS × %_META_COBERTURA / 100 000
%_POBLACIÓN_CUBIERTA    = (PUNTOS_VALIDADOS × 50 000 + CAMPAÑAS_VALIDADAS × 100 000) / (POB_PUNTOS + POB_CAMPAÑAS)
CUMPLE_COBERTURA        ⇔ %_POBLACIÓN_CUBIERTA ≥ %_META_COBERTURA
```

- Un punto fijo cubre 50 000 habitantes y una campaña 100 000 (`HABITANTES_POR_PUNTO_FIJO`, `HABITANTES_POR_CAMPANA`).
- El % de meta se **copia** al registro para que un cambio futuro en `metas_cobertura` no reescriba periodos ya evaluados.
- La cobertura se muestra con 2 decimales para no redondear 69,98 % a 70 % (DPC0002 2024 no cumple).

## Indicadores (seguimientos)

Fórmulas propias de la matriz Indicador, con los valores **digitados en el seguimiento** (no los del histórico):

```text
%_CUMPLIMIENTO          = CANT_VALIDADA_KG × %_META / META                 (si META > 0)
%_COBERTURA             = (PUNTOS + CAMPAÑAS) × 70 % / (META_PUNTOS + META_CAMPAÑAS)
```

El 70 % es fijo en la matriz (`FACTOR_COBERTURA`). Este “% cobertura” mide puntos y campañas logrados frente a la meta; **no**
es el “% población cubierta” de Uso 2. El formulario permite **traer** los valores de un periodo de Uso 1 o Uso 2 del mismo
expediente (`metasDesdeUso1`, `metasDesdeUso2`).

## Proyecciones

```text
Uso 1:  META_RECOLECCION = CANT_PUESTA_MERCADO × %_META                (75 % por defecto, editable)
Uso 2:  META_RECOLECCION = BASE + BASE × %_INCREMENTO                  (10 % por defecto; base = recolectado del año anterior o manual)
        META_PUNTOS_FIJOS = POBLACIÓN_PUNTOS_FIJOS × %_COBERTURA / 50 000
        META_CAMPAÑAS     = POBLACIÓN_CAMPAÑAS × %_COBERTURA / 100 000
```

## Consolidado de cantidades validadas (dashboard)

Reemplaza la hoja `4_CANT_VALIDADAS`. Vista `v_cantidades_validadas` (una fila por expediente, uso y periodo):

```text
validada_kg (Uso 1) = VALIDADA_VIG_SEG + VALIDADA_VIG_POST          (sin lo abonado)
validada_kg (Uso 2) = VALIDADA + VALIDADA_VIG_POST                  (sin lo abonado)
toneladas           = kg / 1000
```

- No incluye lo abonado en vigencia posterior porque, según el cliente, duplicaría la cantidad. El total por registro (con
  abono) se sigue mostrando en cada periodo.
- El Excel convertía mal (`kg × 1000`); el sistema usa `kg / 1000`.
- El consolidado por **año de revisión** y por expediente (un expediente con ambos usos aparece una vez) está en
  `src/domain/dashboard.ts`.

## Conciliación de certificados

Vista `v_conciliacion_certificados`, por operador × gestor × tratamiento × año:

| Estado | Condición |
|---|---|
| `COINCIDE` | `abs(kg certificados validados − kg reportados) < 0,005` |
| `DIFIERE` | Hay certificados y reporte, y no coinciden |
| `SIN_CERTIFICADOS` | Hay reporte (`operador_gestor_tratamientos`) pero ninguna entrega certificada |
| `SIN_REPORTE` | Hay entregas certificadas pero nada reportado |
