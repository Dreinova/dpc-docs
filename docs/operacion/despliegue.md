---
sidebar_position: 3
title: Despliegue
---

# Despliegue

| Pieza | Dónde |
|---|---|
| Código | GitHub, repositorio privado `base-dpc` |
| Base de datos | Supabase Cloud, organización Creathin, proyecto `base-dpc` (us-east-1) |
| Frontend | Vercel, equipo Creathin, proyecto `base-dpc` (framework Vite, SPA con reescritura a `index.html`) |

## CI/CD (GitHub Actions)

| Workflow | Cuándo | Pasos |
|---|---|---|
| `ci.yml` (CI) | Push a cualquier rama **excepto** `master`, y pull requests | `npm ci` → `npm run typecheck` → `npm test` → `npx vite build` |
| `deploy-vercel.yml` (Despliegue Vercel) | Push a `master` o ejecución manual | `npm ci` → `typecheck` → `test` → `vercel pull --environment=production` → `vercel build --prod` → `vercel deploy --prebuilt --prod` |

- Node 24 en ambos.
- El despliegue usa `concurrency: vercel-produccion` (sin cancelar el que está en curso).
- Requiere el secreto **`VERCEL_TOKEN`** en GitHub (Settings → Secrets and variables → Actions). Los ids de organización y
  proyecto de Vercel están en el workflow.
- Si las pruebas o los tipos fallan, no se publica.

## Variables en Vercel

`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (clave publicable; los datos los protege la RLS). Son variables de compilación de
Vite: un cambio requiere un nuevo despliegue.

En Supabase → Authentication → URL Configuration, la *Site URL* y las *Redirect URLs* deben incluir el dominio de Vercel para
que funcionen los enlaces de invitación y recuperación.

## Migraciones en producción

Las migraciones **no se aplican solas** con el despliegue. Para cada migración nueva:

1. Aplicarla con `supabase db push` (proyecto enlazado con `supabase link`) o pegarla en el SQL Editor.
2. **Después** publicar la aplicación (push a `master`), para que las pantallas encuentren sus tablas.

Si la migración acompaña una carga de datos, seguir el [procedimiento de importación en producción](../importacion/proceso.md#procedimiento-en-producción)
(respaldo, ensayo, carga, verificación).

## Usuarios de producción

1. Supabase → Authentication → Users → *Invite user*.
2. El usuario recibe el correo, entra por el enlace y define su contraseña en la aplicación.
3. Todo usuario nuevo entra como `consulta`. Para darle otro rol:

```sql
update public.perfiles set rol = 'editor', nombre = 'Nombre Apellido'
where id = (select id from auth.users where email = 'correo@dominio');
```

## Datos de producción

- Catálogos y titulares de prueba DPC0004 (Uso 1) y DPC0002 (Uso 2) con el seed de producción
  (`generar_seed_fase1.py --produccion`, sin usuarios de prueba).
- Importación completa de la Fase 3 aplicada el 2026-10-09 (un lote, con respaldo previo en el esquema `respaldo_pre_fase3`).
- Certificados y proyecciones: migración 9 y su importación (ver `docs/06-certificados-proyecciones.md` §7 para el estado).
