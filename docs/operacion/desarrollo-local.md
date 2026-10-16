---
sidebar_position: 1
title: Desarrollo local
---

# Desarrollo local

## Requisitos

- Node 22+ y npm (la CI usa Node 24)
- Docker Desktop (para Supabase local)
- Supabase CLI (`npm i -g supabase`)
- Python 3 con `openpyxl` y `psql` en el `PATH` (solo para regenerar el seed o importar Excel)

## Puesta en marcha

```bash
npm install
npm run db:start            # levanta Supabase local, aplica migraciones y seed
cp .env.example .env.local  # completar con la URL y la clave anon que muestra db:start
npm run dev                 # http://localhost:5173
```

`.env.local`:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<clave anon que imprime supabase start>
```

Si faltan estas variables, la aplicación muestra la pantalla *Sin configuración* en lugar de fallar.

## Servicios locales (`supabase/config.toml`)

| Servicio | Puerto |
|---|---|
| API (PostgREST, Auth) | 54321 |
| PostgreSQL | 54322 (`postgresql://postgres:postgres@127.0.0.1:54322/postgres`) |
| Studio | 54323 |
| Correo de prueba (Inbucket/Mailpit) | 54324: aquí llegan las invitaciones y recuperaciones de contraseña |

Configuración relevante: `project_id = "dpc-gestion"`, Postgres 17, `max_rows = 1000`, registro público deshabilitado
(`enable_signup = false`), `site_url = http://127.0.0.1:5173`.

## Usuarios de desarrollo

Definidos en `scripts/excel/usuarios_locales.sql` (la contraseña está en ese archivo). Existen solo en la base local.

| Correo | Rol |
|---|---|
| `admin@dpc.local` | Administrador |
| `editor@dpc.local` | Editor (Laura Delgado) |
| `consulta@dpc.local` | Solo lectura |

## Datos de prueba

El seed trae los catálogos y dos titulares de prueba: **DPC0004 – LABORATORIOS PROVET S.A.S.** (Uso 1: 4 periodos, 9 gestores,
91 mecanismos) y **DPC0002 – INDUSTRIAS KATORI S.A.S.** (Uso 2: 11 periodos 2014–2024). Para tener la base completa, ejecute la
[importación](../importacion/proceso.md) contra la base local.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | `tsc` + compilación de producción |
| `npm run preview` | Sirve la compilación |
| `npm run typecheck` | Tipos de la app y de las pruebas |
| `npm test` / `npm run test:watch` | Vitest |
| `npm run db:start` / `db:stop` | Levanta / detiene Supabase local |
| `npm run db:reset` | Recrea la base local desde migraciones + seed |
| `npm run db:seed:generar` | Regenera `supabase/seed.sql` desde los Excel |
| `npm run db:tipos` | Genera `src/lib/database.types.ts` desde la base local |
| `npm run importar` | Importa las matrices de `docs/FASE3` |
| `npm run importar:certificados` | Importa certificados y proyecciones a la base local |
