---
sidebar_position: 6
title: Proyecciones de meta
---

# Proyecciones de meta

Meta de recolección proyectada por empresa (expediente), **vigencia** y **uso**. Reemplaza `Proyecciones_2026.xlsx`.
Tabla `proyecciones`, vista `v_proyecciones`.

## Una fila por expediente, vigencia y uso

Una empresa con Uso 1 y Uso 2 tiene **dos filas** para la misma vigencia (`unique (expediente_id, vigencia, categoria_uso)`),
porque las fórmulas son distintas. Cada fila lleva solo los campos de su fórmula; los demás quedan en `null`.

| | Uso 1 | Uso 2 |
|---|---|---|
| Datos | Operador, puesta en el mercado, % meta (75 % por defecto) | Operador, base (propone lo **recolectado** en Uso 2 del periodo `vigencia − 1`, o manual), % incremento (10 %), población de puntos fijos, población de campañas, % meta de cobertura (propuesto desde `metas_cobertura`) |
| Calculado | `meta_recoleccion = puesta × % meta` | `meta_recoleccion = base × (1 + % incremento)`, `meta_puntos_fijos`, `meta_campanas` |

Las proyecciones son **una tabla aparte, no periodos de Uso 1**: la cantidad puesta en el mercado proyectada no coincide con
ningún periodo del histórico, así que es un dato nuevo. Por decisión del cliente (“proyecciones sin variación”) la vista ya no
compara contra el periodo anterior.

## Pantallas

- **Empresa → Proyecciones**: proyecciones de la empresa por vigencia, separadas por Uso 1 y Uso 2 según los usos que
  declare; alta, edición y borrado.
- **Empresas → Proyecciones de meta** (`/empresas/proyecciones`): consolidado de la vigencia con **meta y número de adheridos
  por operador** (`resumirProyecciones`), equivalente al resumen del Excel. Una empresa con ambos usos cuenta como dos adheridos
  (uno por fila).
