---
sidebar_position: 2
title: Proceso de importación
---

# Proceso de importación

Dos importadores con las mismas reglas:

| Script | Función SQL | Archivos |
|---|---|---|
| `scripts/excel/importar_fase3.py` | `staging.importar(lote, datos)` | Las cinco matrices de `docs/FASE3/` |
| `scripts/excel/importar_certificados_proyecciones.py` | `staging.importar_certificados_proyecciones(lote, datos)` | `Certificados_Gestores*.xlsx` y `Proyecciones_*.xlsx` de la raíz |

## Flujo

```text
  Excel (solo lectura)
      │  openpyxl
      ▼
  Python: normaliza, valida, clasifica incidencias, calcula SHA-256 de cada archivo
      │  genera supabase/importacion/<carga>_<fecha>.sql   (gitignorado: datos reales)
      ▼
  psql  ── una sola transacción ──────────────────────────────────────────────
  │  staging.iniciar_lote(lote, descripción, archivos)
  │  staging.registrar_incidencias(lote, incidencias)
  │  staging.importar(lote, datos)        → inserta solo lo que no existe
  └───────────────────────────────────────────────────────────────────────────
      │
      ▼
  supabase/importacion/reporte_<carga>_<fecha>.md   (conteos, incidencias, conciliación)
```

## Garantías

- **Solo inserta**: cada fila entra únicamente si su clave natural no existe (`on conflict do nothing`). Nunca actualiza ni borra.
- **Idempotente**: repetir la importación no inserta nada. Probado en local y en producción.
- **No sobrescribe**: si un dato existente difiere del Excel se registra `DIFERENCIA_EXISTENTE` y se conserva el de la base.
- **Trazable**: cada fila guarda `origen = {archivo, hoja, fila, lote}`; la auditoría la marca con origen `importacion`.
- **Atómico**: todo el lote en una transacción.
- **Conciliado**: el reporte compara lo cargado con los totales del Excel (`4_CANT_VALIDADAS`, `Hoja2`, resumen de
  proyecciones) y recalcula las fórmulas para compararlas con los valores cacheados del Excel.

`staging.resultados` guarda, por lote y entidad: detectadas, insertadas, existentes y omitidas.

## Ejecución

```bash
# Fase 3 (matrices de docs/FASE3)
python -P scripts/excel/importar_fase3.py --ejecutar --ensayo      # carga completa y ROLLBACK: revisar el reporte
python -P scripts/excel/importar_fase3.py --ejecutar               # carga real
python -P scripts/excel/importar_fase3.py --solo-sql               # solo genera el SQL, no toca ninguna base
python -P scripts/excel/importar_fase3.py --reporte <lote>         # rehace el reporte de un lote aplicado

# Certificados y proyecciones (forzando la base local)
python -P scripts/excel/importar_certificados_proyecciones.py --ejecutar --ensayo --db-env DPC_DB_URL_LOCAL
python -P scripts/excel/importar_certificados_proyecciones.py --ejecutar --db-env DPC_DB_URL_LOCAL
```

Atajos de npm: `npm run importar` (Fase 3 con `--ejecutar`) y `npm run importar:certificados` (con `--db-env DPC_DB_URL_LOCAL`).

| Opción | Efecto |
|---|---|
| `--excel-dir` | Carpeta de los Excel (por defecto `docs/FASE3` o la raíz) |
| `--salida-dir` | Dónde escribir SQL y reporte (por defecto `supabase/importacion`) |
| `--solo-sql` | Genera el SQL sin ejecutarlo |
| `--ejecutar` | Ejecuta con `psql` y escribe el reporte |
| `--ensayo` | Ejecuta todo y lo deshace (rollback) |
| `--db-env` | Variable de entorno con la cadena de conexión (por defecto `DPC_DB_URL`); si no existe, la base local de `supabase start` |

:::danger 
La variable por defecto apunta a producción
En el equipo de trabajo, `DPC_DB_URL` apunta a **producción**. Para trabajar en local use `--db-env DPC_DB_URL_LOCAL` (o
`npm run importar:certificados`). La cadena de conexión nunca se imprime ni se escribe en archivos.
:::

`python -P` evita que Python agregue el directorio actual a `sys.path`. Requiere `psql` en el `PATH` y `openpyxl` instalado.

## Reversión

```sql
select staging.revertir_lote('<id del lote>');
```

Borra solo lo que insertó ese lote (`origen ->> 'lote'`), en orden inverso de dependencias: certificados, proyecciones,
seguimientos, registros Uso 2 y Uso 1, mecanismos, tratamientos, gestores, expedientes, representantes, titulares, operadores.
El lote queda `REVERTIDO`. Si algo creado después depende de esos datos (p. ej. un periodo digitado en la aplicación sobre un
expediente importado), **las llaves foráneas detienen la reversión completa** y no se borra nada.

Probado: revertir la carga completa devuelve la base exactamente al estado previo y volver a importar la reconstruye.

## Pruebas

```bash
python -P scripts/excel/test_importar_fase3.py                     # normalización (sin Excel ni base)
python -P scripts/excel/test_importar_certificados_proyecciones.py
npm test                                                           # incluye tests/db/importador.db.test.ts y certificados_proyecciones.db.test.ts
```

## Procedimiento en producción

Seguido en la Fase 3 (2026-10-09) y recomendado para cualquier carga:

1. Confirmar el destino (proyecto de Supabase de producción).
2. **Respaldo** lógico de las tablas de `public` y verificación de conteos.
3. Aplicar las migraciones que la carga necesita.
4. Ensayo con `--ensayo` y revisión del reporte.
5. Carga real (un lote, una transacción); guardar el número de lote que imprime.
6. Segunda ejecución para comprobar que no inserta nada.
7. Si algo no cuadra: `staging.revertir_lote(lote)`.
8. Publicar la aplicación solo después de aplicar las migraciones.

Resultado en producción de la Fase 3: 207 titulares, 212 expedientes, 459 periodos de Uso 1, 90 de Uso 2, 17 gestores,
1 535 mecanismos, 4 645 vínculos mecanismo–expediente y 236 seguimientos.

## Seed

`scripts/excel/generar_seed_fase1.py` genera `supabase/seed.sql` (no se edita a mano): catálogos completos (DIVIPOLA, tipos,
operadores, profesionales, cobertura) y los titulares de prueba **DPC0004** (Uso 1) y **DPC0002** (Uso 2). Usa UUID
deterministas (`uuid5`) para que el seed sea reproducible.

```bash
npm run db:seed:generar                                                   # seed local (incluye usuarios de desarrollo)
python scripts/excel/generar_seed_fase1.py --produccion --salida <archivo> # sin usuarios de prueba
```
