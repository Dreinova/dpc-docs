# Gestión DPC · Documentación técnica

Sitio [Docusaurus](https://docusaurus.io/) con la documentación técnica del proyecto `BASES DPC` (aplicación de gestión de
planes posconsumo: React + Supabase).

```bash
npm install
npm run start   # servidor local con recarga en vivo
npm run build   # sitio estático en build/ (falla si hay enlaces rotos)
npm run serve   # sirve build/
```

El contenido está en `docs/` (Markdown; la barra lateral se genera desde las carpetas):

| Carpeta | Contenido |
|---|---|
| `docs/index.md` | Introducción |
| `docs/arquitectura/` | Visión general, frontend, autenticación y seguridad |
| `docs/base-de-datos/` | Modelo, reglas de cálculo, vistas y funciones, auditoría, migraciones |
| `docs/modulos/` | Pantallas por módulo |
| `docs/importacion/` | Fuentes Excel y proceso de importación |
| `docs/operacion/` | Desarrollo local, pruebas, despliegue |
| `docs/referencia/` | Decisiones del cliente, pendientes, glosario |

Los `.md` se procesan como CommonMark (`markdown.format: 'detect'`), así que se pueden escribir fórmulas con `<`, `>` y `{}`
sin escaparlas.
