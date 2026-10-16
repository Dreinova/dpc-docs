---
sidebar_position: 1
title: Modelo de datos
---

# Modelo de datos

PostgreSQL 17 en Supabase. Extensiones: `pgcrypto` (UUID, `crypt`) y `unaccent` (normalización de claves).
Esquemas: `public` (datos, expuesto por PostgREST), `audit` (bitácora) y `staging` (importación).

## Diagrama

```text
                               ┌──────────────┐
         representantes_legales│  titulares   │ nit (único), dv, razón social, ciiu[], contacto, municipio
         (vigente / histórico) └──────┬───────┘
                                      │ 1:N
                               ┌──────▼───────┐
                               │ expedientes  │ código DPC… (único), estado, profesional
                               └──────┬───────┘
   ┌──────────────┬───────────────┬───┴────────────┬──────────────────┬────────────────┬──────────────┐
expediente_    expediente_     registros_uso1   registros_uso2     proyecciones     seguimientos
tipos_uso      operadores        │ operadores     │ cobertura (1:1)  (vigencia × uso) (año × tipo)
   │              │  │           │ tratamientos   │ operadores
tipos_uso         │  │                            │ tratamientos
                  │  ├── expediente_gestores ─────┬── expediente_certificados
                  │  └── expediente_mecanismos    │
                  ▼                               ▼
             operadores ◄── operador_gestores ──► gestores ── gestor_actividades, gestor_alias
               │  │               │
 operador_alias│  └► mecanismos   ├── operador_gestor_tratamientos (kg reportados, TIPO_GESTION)
                                  └── certificados_gestion (entregas certificadas)

 Catálogos: departamentos, municipios (DIVIPOLA), tipos_uso, tipos_tratamiento, tipos_mecanismo,
            actividades_gestor, profesionales, metas_cobertura, estados_san
 Usuarios:  perfiles (1:1 auth.users)        Auditoría: audit.eventos        Importación: staging.*
```

## Columnas comunes

| Columna | Uso |
|---|---|
| `id uuid` | Llave primaria (`gen_random_uuid()`), salvo tablas de asociación con llave compuesta |
| `origen jsonb` | `{archivo, hoja, fila, lote}` si la fila vino de una importación; `null` si se creó en la aplicación |
| `creado_en`, `creado_por` | Sello de creación (`creado_por` = `auth.uid()` por defecto) |
| `actualizado_en`, `actualizado_por` | Sello de la última modificación (trigger `trg_sello` → `sellar_actualizacion()`) |
| `marcas jsonb` | Textos originales del Excel que no eran valores (“Sin determinar”, “No aplica”, fechas mal escritas…) en `seguimientos` y `certificados_gestion` |

## Catálogos

Escritura solo para `admin`. Se cargan con el seed.

| Tabla | Contenido |
|---|---|
| `departamentos`, `municipios` | DIVIPOLA (código DANE de 2 y 5 dígitos) con `autoridad_ambiental` por municipio |
| `tipos_uso` | `AGRICOLA`, `VETERINARIO`, `SALUD_PUBLICA`, `INDUSTRIAL` (categoría `USO_1`); `DOMESTICO` (`USO_2`) |
| `tipos_tratamiento` | `CELDA_SEGURIDAD`, `INCINERACION`, `COPROCESAMIENTO`, `APROVECHAMIENTO` (Reciclaje y Valoración del Excel = Aprovechamiento) |
| `tipos_mecanismo` | `PUNTO_RECOLECCION`, `CENTRO_ACOPIO` |
| `actividades_gestor` | `ALMACENAMIENTO`, `APROVECHAMIENTO`, `VALORIZACION`, `DISPOSICION_FINAL` |
| `profesionales` | Ejecutores y revisores (`rol` `EJECUTOR`/`REVISOR`), opcionalmente vinculados a un `perfil_id` |
| `metas_cobertura` | % de meta de cobertura de Uso 2 por periodo: 2014 → 35 % … 2020 → 65 %, 2021 en adelante → 70 % |
| `estados_san` | 12 estados del proceso sancionatorio (Aplica SAN, Indagación preliminar … Sancionado, No aplica SAN) |

Tipos enumerados: `rol_app` (`admin`, `editor`, `consulta`), `categoria_uso` (`USO_1`, `USO_2`),
`estado_expediente` (`ACTIVO`, `ARCHIVADO`).

## Directorio

| Tabla | Clave y reglas |
|---|---|
| `titulares` | `nit` único (`bigint > 0`), `dv` 0–9, `razon_social` no vacía, `ciiu text[]` (una celda del Excel podía traer varios códigos). Dirección, municipio, teléfono y correo **son del titular** (decisión del cliente). |
| `representantes_legales` | Un solo `vigente` por titular (índice único parcial). Al cambiar el nombre, el anterior queda con `vigente = false` y `vigente_hasta`. |
| `expedientes` | `codigo` único con formato `DPC0000`, `DPC0000-00` o `DPC0000-00-0000` (mayúsculas, sin espacios, validado con `check`). FK al titular. `estado` `ACTIVO`/`ARCHIVADO`. |
| `expediente_tipos_uso` | PK `(expediente_id, tipo_uso)`. Determina qué pestañas (Uso 1 / Uso 2) tiene la empresa. |

## Operadores, gestores y mecanismos

| Tabla | Clave y reglas |
|---|---|
| `operadores` | `nit` único (admite nulo: APROVET y BIOECOLÓGICA no tienen NIT en los Excel), `nombre` único, `gestion_individual` (ver [Certificados](../modulos/certificados.md)) |
| `operador_alias` | Nombres alternativos con que el operador aparece en los Excel (“CORPORACION POSCONSUMO CIERRA EL CICLO”) |
| `expediente_operadores` | PK `(expediente_id, operador_id)`, `vigente`. Borrarla arrastra en cascada los gestores y mecanismos asociados al expediente por ese operador. |
| `gestores` | `nit` único; planta, municipio (→ autoridad ambiental), licencia, capacidad |
| `gestor_alias`, `gestor_actividades` | Nombres alternativos; actividades autorizadas |
| `operador_gestores` | Catálogo: con qué gestores trabaja cada operador |
| `expediente_gestores` | PK `(expediente, operador, gestor)`. **FK compuesta** a `expediente_operadores` y a `operador_gestores`: solo se puede elegir un gestor de un operador vinculado al expediente. Quitarla no toca los catálogos. |
| `operador_gestor_tratamientos` | kg por operador × gestor × tratamiento × `anio_validacion` (hoja `TIPO_GESTION`; 2026 para lo cargado) |
| `mecanismos` | Pertenecen a un operador. Tipo, municipio, dirección, punto de referencia, `coord_norte`/`coord_este` en **CTM12 (EPSG:9377)** |
| `expediente_mecanismos` | PK `(expediente, mecanismo)`. FK compuesta `(mecanismo, operador)` y `(expediente, operador)`: mismo principio que gestores |

## Uso 1 (agrícola, veterinario, salud pública, industrial)

| Tabla | Clave y reglas |
|---|---|
| `registros_uso1` | `unique (expediente_id, periodo_recoleccion)`. Datos fuente: año de revisión, puesta en el mercado, % meta, gestionada, validada vig. seguimiento, validada vig. posteriores, abonada vig. posterior, desuso generados/validados, observaciones, profesional. **Calculados (generados)**: `meta_recoleccion`, `total_validado`, `porcentaje_cumplimiento`, `cumple_meta`. |
| `registro_uso1_operadores` | Operador(es) del periodo (en el Excel venían concatenados en un texto) |
| `registro_uso1_tratamientos` | kg por tipo de tratamiento, PK `(registro, tipo)` |

Triggers: `registros_uso1_defaults()` pone `anio_revision_informe = periodo + 1` si llega vacío; `validar_expediente_uso1()` exige
que el expediente tenga un tipo de uso de categoría `USO_1`.

## Uso 2 (doméstico)

| Tabla | Clave y reglas |
|---|---|
| `registros_uso2` | `unique (expediente_id, periodo_recoleccion)`. Base de la meta (`cant_base_meta` + `origen_base_meta` ∈ `MANUAL`, `RECOLECTADA_ANTERIOR`, `META_ANTERIOR`), `% incremento`, recolectada, validada, validada vig. posteriores, abonada vig. posterior, desuso, observaciones. Calculados: meta, total, % cumplimiento, cumple. |
| `registros_uso2_cobertura` | 1:1 con el registro; la crea el trigger `crear_cobertura_uso2()` copiando el % de `metas_cobertura` del periodo. Poblaciones (habitantes), puntos fijos y campañas validados (unidades). Calculados: meta de puntos, meta de campañas, % población cubierta, cumple cobertura. |
| `registro_uso2_operadores`, `registro_uso2_tratamientos` | Igual que Uso 1 |

Triggers: `validar_expediente_uso2()` (exige uso doméstico) y `registros_uso2_exigir_campos()` (año de revisión y % de
incremento obligatorios, salvo en importación, porque el histórico real tiene periodos sin ellos).

## Certificados y proyecciones

| Tabla | Clave y reglas |
|---|---|
| `certificados_gestion` | **Una fila por entrega certificada** (un mismo código de certificado puede cubrir varias entregas). FK compuesta a `operador_gestores`. `tipo_tratamiento` + `descripcion_gestion` (texto original), `cantidad_kg > 0`, `anio_validacion`, `validado`. Clave natural `unique nulls not distinct (operador, gestor, año, código, fecha de entrega, tratamiento, kg)`. |
| `expediente_certificados` | Certificados que la empresa presenta. FK compuesta a `expediente_gestores` (el gestor debe estar asociado a la empresa por ese operador) y a `certificados_gestion (id, operador, gestor)`. |
| `proyecciones` | `unique (expediente_id, vigencia, categoria_uso)`. Uso 1: puesta en el mercado y % meta. Uso 2: base, origen de la base, % incremento, poblaciones y % de cobertura. Calculados: `meta_recoleccion` (según la categoría), `meta_puntos_fijos`, `meta_campanas`. |

## Indicadores

| Tabla | Clave y reglas |
|---|---|
| `seguimientos` | `unique (expediente_id, anio_seguimiento, tipo)`. `tipo` ∈ `INICIAL`, `INDICADOR`, `REZAGO`, `OTROS` (la hoja de origen); `modalidad` ∈ `DOCUMENTAL`, `CON_VISITA`. Último informe, concepto técnico, auto, ejecutoria, valor liquidado, proceso sancionatorio (`expediente_san`, `hechos`, `estado_san`), `vigencia_origen` (solo Rezago), metas y cantidades (solo Indicador y Rezago), ejecutor y revisor. Calculados: `porcentaje_cumplimiento`, `porcentaje_cobertura`. |

Restricciones: `seguimientos_sin_metas` (Iniciales y Otros no llevan metas ni cantidades) y
`seguimientos_vigencia_origen_rezago` (la vigencia de origen solo aplica a Rezago).

## Usuarios

`perfiles (id → auth.users, nombre, rol, activo)`. Ver [Autenticación y seguridad](../arquitectura/seguridad.md).
