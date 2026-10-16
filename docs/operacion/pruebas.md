---
sidebar_position: 2
title: Pruebas
---

# Pruebas

```bash
npm test            # todas las pruebas (Vitest)
npm run typecheck   # tipos de la app y de las pruebas
```

Vitest busca `tests/**/*.test.ts`, con 60 s de tiempo máximo por prueba (las de base de datos aplican todas las migraciones).

## Pruebas de dominio (`tests/domain/`)

Funciones puras de `src/domain/`, sin base de datos.

| Archivo | Qué verifica |
|---|---|
| `calculos.test.ts` | Fórmulas de Uso 1 y validación de formularios |
| `uso2.test.ts` | Recolección de Uso 2 con valores del Excel (DPC0002), periodo anterior y propuesta de base, cobertura |
| `dashboard.test.ts` | Consolidado por año de revisión y por expediente |
| `seguimientos.test.ts` | Campos por tipo, validaciones, cálculos y datos traídos de Uso 1 / Uso 2 |
| `certificadosProyecciones.test.ts` | Resumen por operador, formulario, proyecciones, totalizador certificado frente a validado |
| `exportarSeguimientos.test.ts`, `exportarCertificados.test.ts` | Alcance, columnas y valores de las exportaciones |
| `coordenadas.test.ts` | Conversión CTM12 → latitud/longitud |
| `paginacion.test.ts` | Numeración de páginas |

## Pruebas de base de datos (`tests/db/`)

Corren contra **PostgreSQL real embebido con PGlite** (sin Docker). `tests/db/pglite.ts`:

1. Crea una base PGlite con las extensiones `pgcrypto`, `unaccent` y `btree_gist`.
2. Simula lo mínimo de Supabase: roles `anon` y `authenticated`, esquema `auth` con `auth.users`, `auth.identities` y
   `auth.uid()` (lee `request.jwt.claim.sub`).
3. Aplica **todas** las migraciones en orden y, si se pide, el seed.
4. `comoUsuario(db, 'admin' | 'editor' | 'consulta', fn)` ejecuta `fn` con el rol `authenticated` y el JWT del usuario, para
   probar RLS y permisos.

| Archivo | Qué verifica |
|---|---|
| `migraciones.db.test.ts` | Que las migraciones y el seed se aplican sin errores |
| `uso1.db.test.ts` | Seed de DPC0004, columnas generadas iguales al dominio y al Excel, escritura por RPC, permisos y auditoría |
| `uso2.db.test.ts` | Histórico de DPC0002, escritura, dashboard con una empresa de Uso 1 + Uso 2 |
| `seguimientos.db.test.ts` | Tipos, edición, cambio de tipo con confirmación, consulta, eliminación y permisos |
| `importador.db.test.ts` | Idempotencia, no sobrescritura, relaciones e integridad, reversión |
| `certificados_proyecciones.db.test.ts` | Certificados, proyecciones y su importador |
| `expediente_certificados.db.test.ts` | Certificados de la empresa; gestión individual (COLECTA) frente a global |

## Pruebas de los importadores (Python)

```bash
python -P scripts/excel/test_importar_fase3.py
python -P scripts/excel/test_importar_certificados_proyecciones.py
```

`unittest` sobre la normalización (números, textos sin valor, fechas, operadores compuestos, equivalencias de gestores), sin
Excel ni base de datos.

## Regla práctica

Toda fórmula nueva va en una columna generada **y** en `src/domain/`, con una prueba de dominio y una de base de datos que
comprueben que ambas dan el mismo resultado (idealmente contra un valor real del Excel).
