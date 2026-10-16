---
slug: /
sidebar_position: 1
title: Introducción
---

# Gestión DPC · Documentación técnica

**Gestión DPC** es la aplicación web que reemplaza progresivamente las matrices de Excel con que se hace el seguimiento
de los **planes posconsumo de envases de plaguicidas (DPC)**: directorio de empresas (titulares y expedientes), histórico de
cantidades recolectadas por periodo (Uso 1 y Uso 2), cobertura poblacional, operadores logísticos, gestores, mecanismos de
recolección, certificados de gestión, proyecciones de meta y el seguimiento anual de la autoridad (Indicadores).

El objetivo del sistema es que **la base de datos sea la fuente de verdad**: las reglas de negocio y los cálculos viven en
PostgreSQL (columnas generadas, llaves foráneas, `check`, triggers y RLS), cada cambio queda auditado y los históricos no se
sobrescriben. La interfaz solo muestra datos y envía datos fuente.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 · TypeScript (estricto) · Vite · Tailwind CSS 4 · React Router 7 · TanStack Query 5 · React Hook Form + Zod · Leaflet · ExcelJS |
| Backend | Supabase: PostgreSQL 17, Auth (correo y contraseña, invitaciones), PostgREST, Row Level Security |
| Importación | Python 3 + `openpyxl` (lectura de Excel) y funciones SQL en el esquema `staging` |
| Pruebas | Vitest · PGlite (Postgres embebido, sin Docker) · `unittest` para los importadores |
| Despliegue | GitHub Actions → Vercel (frontend) · Supabase Cloud (base de datos) |

## Repositorio

El código vive en `BASES DPC/` (repositorio privado `base-dpc` en GitHub). Estructura:

```text
supabase/
  migrations/      Esquema versionado (13 migraciones)
  seed.sql         Generado desde los Excel: catálogos + titulares de prueba
  importacion/     SQL y reportes generados por los importadores (no se versionan: datos reales)
scripts/excel/     Seed, importadores y sus pruebas (Python)
src/
  domain/          Tipos, fórmulas y validaciones (sin React ni Supabase)
  services/        Acceso a datos (Supabase); la UI no consulta tablas directamente
  features/        Pantallas por módulo
  components/      UI reutilizable y layout
  auth/            Sesión, login y definición de contraseña
  lib/             Cliente Supabase, entorno, errores, formato, claves de caché
tests/
  domain/          Pruebas de fórmulas, validaciones y exportaciones
  db/              Pruebas contra Postgres real (PGlite) con todas las migraciones
docs/              Análisis de los Excel y decisiones (01–06)
```

## Cómo leer esta documentación

| Sección | Para qué |
|---|---|
| [Arquitectura](arquitectura/vision-general.md) | Capas, flujo de datos, frontend y seguridad |
| [Base de datos](base-de-datos/modelo.md) | Tablas, cálculos, vistas, funciones, auditoría y migraciones |
| [Módulos](modulos/empresas-y-expedientes.md) | Qué hace cada pantalla y con qué datos trabaja |
| [Importación de Excel](importacion/proceso.md) | Cómo se migran las matrices: staging, idempotencia, reversión |
| [Operación](operacion/desarrollo-local.md) | Puesta en marcha local, pruebas y despliegue |
| [Referencia](referencia/decisiones.md) | Decisiones del cliente, pendientes y glosario |

:::info Documentos de análisis del repositorio
Esta documentación resume y actualiza los análisis de `docs/01…06` del repositorio (inventario de los Excel, contradicciones
encontradas, conciliaciones con cifras). Cuando necesite el detalle fila por fila de un Excel, consulte esos archivos.
:::
