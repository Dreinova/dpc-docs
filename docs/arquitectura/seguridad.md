---
sidebar_position: 3
title: Autenticación y seguridad
---

# Autenticación y seguridad

## Usuarios y roles

- Autenticación con **Supabase Auth** por correo y contraseña. El registro público está deshabilitado: los usuarios los
  **invita un administrador** desde Supabase → Authentication → Users → *Invite user*.
- Cada usuario tiene una fila en `public.perfiles` (1:1 con `auth.users`), creada por el trigger `trg_auth_crear_perfil`
  (`crear_perfil_usuario()`): toma `nombre` y `rol` de `raw_user_meta_data` si vienen; si no, nombre = parte local del correo y
  rol = `consulta`.
- El **nombre del perfil** es el que aparece en la auditoría (“Editado por Laura Delgado”).

| Rol (`rol_app`) | Puede |
|---|---|
| `admin` | Todo, incluidos catálogos (DIVIPOLA, tipos, profesionales, metas de cobertura, estados SAN) y perfiles |
| `editor` | Leer todo y crear/editar/eliminar datos (expedientes, periodos, operadores, gestores, mecanismos, certificados, proyecciones, seguimientos) |
| `consulta` | Solo lectura |

Para cambiar el rol de un usuario (SQL Editor de Supabase):

```sql
update public.perfiles
set rol = 'editor', nombre = 'Nombre Apellido'
where id = (select id from auth.users where email = 'correo@dominio');
```

Un perfil con `activo = false` pierde el rol (`rol_actual()` devuelve `null`) y queda sin permisos de escritura.

## Contraseñas

| Flujo | Cómo funciona |
|---|---|
| Invitación | El enlace de Supabase llega con `type=invite`. `lib/supabase.ts` lo detecta **antes** de crear el cliente (que limpia la URL) y la app muestra *Definir contraseña*. |
| Recuperación | Desde el login, `resetPasswordForEmail` envía un enlace con `type=recovery` (y el evento `PASSWORD_RECOVERY`) → *Definir contraseña*. |
| Cambio | *Mi cuenta* (`/cuenta`) con `updateUser({ password })`. Mínimo 8 caracteres. |

## Row Level Security

Todas las tablas de `public` tienen RLS. Las políticas se crean con bucles en las migraciones:

| Tipo de tabla | `select` | `insert` / `update` / `delete` |
|---|---|---|
| Datos (titulares, expedientes, registros, operadores, gestores, mecanismos, certificados, proyecciones, seguimientos…) | `authenticated` | `puede_editar()` (admin o editor) |
| Catálogos (`departamentos`, `municipios`, `tipos_*`, `actividades_gestor`, `profesionales`, `metas_cobertura`, `estados_san`) | `authenticated` | `es_admin()` |
| `perfiles` | `authenticated` | `es_admin()` |

Funciones de apoyo (`security definer`, `search_path` fijo): `rol_actual()`, `puede_editar()`, `es_admin()`.
Las RPC de escritura llaman además a `exigir_edicion()`, que lanza `42501` si el usuario no puede editar.

El usuario `anon` no tiene acceso a datos: todas las políticas son para `authenticated`, y a `anon` se le revocó la ejecución
de las funciones.

## Esquemas no expuestos

- `audit`: la bitácora. Se revocan todos los permisos a `anon` y `authenticated`; solo se lee mediante
  `public.historial_auditoria()` (`security definer`, exige `auth.uid()`, máximo 500 filas).
- `staging`: área de importación. Sin permisos para la API; sus funciones solo se invocan con conexión directa (`psql`).

## Endurecimiento (migración 5)

Aplicado según el asesor de seguridad de Supabase:

- `search_path` fijo en todas las funciones.
- `crear_perfil_usuario()` no es invocable desde la API.
- `rol_actual`, `puede_editar`, `es_admin`, `historial_auditoria` y las RPC de escritura: `execute` solo para `authenticated`.
- `activar_auditoria()` no es invocable por la API.

## Claves y secretos

| Dato | Dónde | Notas |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `.env.local` (local) y variables de Vercel | La clave anónima es **publicable**: los datos los protege la RLS. |
| `DPC_DB_URL` | Variable de entorno del equipo que importa | Cadena de conexión directa a Postgres (producción). Los scripts nunca la imprimen ni la escriben en archivos. |
| `DPC_DB_URL_LOCAL` | Variable de entorno | Para forzar la base local en los importadores (`--db-env DPC_DB_URL_LOCAL`). |
| `VERCEL_TOKEN` | Secreto de GitHub Actions | Despliegue a Vercel. |

:::warning Datos reales fuera del repositorio
Los Excel (`*.xlsx`) y la carpeta `supabase/importacion/` (SQL y reportes con datos reales) están en `.gitignore`.
Los usuarios de desarrollo (`admin@dpc.local`, `editor@dpc.local`, `consulta@dpc.local`) existen **solo** en la base local
(`scripts/excel/usuarios_locales.sql`); el seed de producción se genera sin ellos (`--produccion`).
:::
