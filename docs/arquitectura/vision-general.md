---
sidebar_position: 1
title: Visión general
---

# Visión general

## Principios

| Principio | Cómo se cumple |
|---|---|
| La base de datos es la fuente de verdad | Las reglas viven en PostgreSQL: columnas generadas, FK (incluidas FK compuestas), `check`, triggers y RLS. |
| Los cálculos pertenecen al sistema | Meta, total validado, % de cumplimiento, cumple/no cumple y metas de cobertura son **columnas generadas**: Postgres rechaza cualquier escritura directa sobre ellas. El frontend replica las fórmulas solo para la vista previa mientras se escribe. |
| Históricos sin sobrescribir | Un registro por `(expediente, periodo)`. El representante legal anterior queda como histórico (`vigente = false`). El % de meta de cobertura se copia al registro al crearlo. |
| Relaciones normalizadas | Titular ≠ expediente. Operadores, gestores y mecanismos son catálogos únicos; los expedientes se asocian por tablas intermedias con FK compuestas que impiden asociaciones incoherentes. |
| Trazabilidad | Trigger genérico `audit.registrar()` en todas las tablas de datos y columna `origen` (archivo, hoja, fila, lote) en lo importado. |
| Migración controlada y reversible | Esquema `staging`: lotes, incidencias, resultados; importación idempotente y `staging.revertir_lote()`. |

## Componentes

```text
 ┌────────────────────────────── Navegador ──────────────────────────────┐
 │  React SPA (Vite)                                                     │
 │   features/  ── pantallas por módulo                                  │
 │      │  usa                                                           │
 │   domain/    ── fórmulas, esquemas Zod, exportaciones (puro, probado) │
 │   services/  ── única capa que habla con Supabase                     │
 │      │  supabase-js (JWT del usuario)                                 │
 └──────┼────────────────────────────────────────────────────────────────┘
        │ HTTPS
 ┌──────▼──────────────────────── Supabase ──────────────────────────────┐
 │  Auth (GoTrue)      PostgREST (/rest/v1)                              │
 │                         │  rol authenticated + auth.uid()             │
 │  PostgreSQL 17          ▼                                             │
 │   public   tablas + vistas security_invoker + RPC + RLS               │
 │   audit    eventos (solo triggers; lectura vía historial_auditoria)   │
 │   staging  lotes, incidencias, importar(), revertir_lote()            │
 └──────▲────────────────────────────────────────────────────────────────┘
        │ psql (cadena de conexión en DPC_DB_URL)
 ┌──────┴───────────────┐
 │ scripts/excel/*.py   │  Lee los Excel en solo lectura, genera SQL y reporte
 └──────────────────────┘
```

- **Lecturas**: los servicios consultan principalmente **vistas** (`v_directorio`, `v_registros_uso1`, `v_seguimientos`…) que
  se declaran con `security_invoker = true`, de modo que respetan la RLS de quien consulta.
- **Escrituras compuestas** (titular + representante + expediente + usos; periodo + operadores + tratamientos; seguimientos)
  van por **funciones RPC** (`guardar_expediente`, `guardar_registro_uso1`, `guardar_registro_uso2`, `guardar_seguimiento`)
  que se ejecutan en una sola transacción y con `security invoker` (aplican la RLS del usuario).
- **Escrituras simples** (operadores, gestores, mecanismos, certificados, proyecciones, asociaciones) se hacen con
  `insert/update/delete` directos sobre la tabla; la RLS y las restricciones de la base deciden si son válidas.
- **Importación**: no pasa por la API. Los scripts Python se conectan con `psql` y llaman funciones del esquema `staging`,
  que no está expuesto a PostgREST.

## Entidades principales

```text
Titular (NIT) ──1:N── Expediente (DPC0004, DPC0089-00, …)
                         ├── Tipos de uso declarados (Uso 1: agrícola, veterinario, salud pública, industrial · Uso 2: doméstico)
                         ├── Operadores vinculados (N:M) ──┐
                         ├── Gestores usados ──────────────┼── solo entre los del operador vinculado (FK compuesta)
                         ├── Mecanismos usados ────────────┘
                         ├── Certificados presentados ───── solo de gestores que usa la empresa
                         ├── Registros Uso 1 (1 por periodo) → operadores, tratamientos
                         ├── Registros Uso 2 (1 por periodo) → cobertura (1:1), operadores, tratamientos
                         ├── Proyecciones (1 por vigencia y uso)
                         └── Seguimientos (Indicadores: 1 por año y tipo)

Operador logístico ── Gestores (N:M) ── Certificados de gestión (entregas)
                   └─ Mecanismos de recolección (pertenecen a un operador)
```

Ver el detalle en [Modelo de datos](../base-de-datos/modelo.md).

## Fases del proyecto

| Fase | Alcance | Migraciones |
|---|---|---|
| 1 | Análisis de los Excel, esquema, directorio, Uso 1, auditoría, RLS; titular de prueba DPC0004 | 1–5 |
| 2 | Uso 2 (doméstico): cantidades, cobertura, desuso, tratamientos; dashboard consolidado | 6 |
| 3 | Importación completa y repetible de las matrices; módulo Indicadores | 7–8 |
| Posteriores | Certificados de gestores y proyecciones de meta; certificados por empresa; gestión individual vs. global; proyecciones de Uso 2; mapa y exportaciones | 9–13 |
