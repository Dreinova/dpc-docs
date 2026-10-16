---
sidebar_position: 1
title: Fuentes y mapeo
---

# Fuentes y mapeo

Las matrices de Excel son la fuente original. Se leen **siempre en solo lectura** (`openpyxl`), nunca se modifican y no se
versionan (`*.xlsx` en `.gitignore`: contienen datos de terceros).

## Archivos

| Archivo | Ubicación esperada | Qué contiene |
|---|---|---|
| `Matriz_Historico_Cantidadesges_DPC.xlsx` | `docs/FASE3/` | Directorio (`1_EMPRESAS`), histórico Uso 1 y Uso 2, `4_CANT_VALIDADAS`, `DOMINIOS` (DIVIPOLA, operadores, ejecutores, cobertura) |
| `Matriz_Gestores_DPC2026.xlsx` | `docs/FASE3/` | `GESTORES` (gestor por expediente y operador), `TIPO_GESTION` (kg por operador × gestor × tratamiento) |
| `Matriz_Mecanismos_Recoleccion_DPC2026.xlsx` | `docs/FASE3/` | `PR_CA`: puntos de recolección y centros de acopio |
| `Matriz_Operadores_DPC2026.xlsx` | `docs/FASE3/` | `OPERADORES` |
| `Matriz_Indicador_DPC2026.xlsx` | `docs/FASE3/` | `INICIALES`, `INDICADOR`, `REZAGO`, `OTROS` |
| `Certificados_Gestores.xlsx` | raíz del proyecto | `CERTIFICADOS` (entregas) y `Hoja2` (tabla dinámica, para conciliar) |
| `Proyecciones_<vigencia>.xlsx` | raíz del proyecto | `Hoja1`: proyección por expediente; la vigencia sale del nombre del archivo |

Volumen de la Fase 3: 212 expedientes, 476 filas de Uso 1, 90 de Uso 2, 602 de gestores, 4 772 de mecanismos, 243 de
Indicadores; 717 entregas certificadas y 72 proyecciones.

## Mapeo hoja → tablas

| Hoja | Tablas destino | Clave natural (idempotencia) |
|---|---|---|
| `1_EMPRESAS` | `titulares`, `representantes_legales`, `expedientes`, `expediente_tipos_uso` | NIT · código de expediente |
| `OPERADORES` | `operadores`, `operador_alias` | NIT · alias normalizado |
| `2_HISTORICO_USO1` | `registros_uso1`, `registro_uso1_operadores`, `registro_uso1_tratamientos` | (expediente, periodo) |
| `3_HISTORICO_USO2` | `registros_uso2`, `registros_uso2_cobertura`, operadores, tratamientos | (expediente, periodo) |
| `GESTORES` | `gestores`, `gestor_actividades`, `gestor_alias`, `operador_gestores`, `expediente_operadores`, `expediente_gestores` | NIT del gestor |
| `TIPO_GESTION` | `operador_gestor_tratamientos` (año de validación 2026) | (operador, gestor, año, tratamiento) |
| `PR_CA` | `mecanismos`, `expediente_mecanismos`, `expediente_operadores` | operador + coordenadas + dirección normalizada |
| `INICIALES` / `INDICADOR` / `REZAGO` / `OTROS` | `seguimientos` (año 2026, del nombre del archivo) | (expediente, año, tipo) |
| `CERTIFICADOS` | `certificados_gestion` | (operador, gestor, año, código, fecha de entrega, tratamiento, kg) |
| `Proyecciones · Hoja1` | `proyecciones` (siempre Uso 1) | (expediente, vigencia, uso) |
| `4_CANT_VALIDADAS`, `Hoja2`, resumen de proyecciones | — | Solo para **conciliar** totales |
| `DOMINIOS` | Catálogos (seed) | — |

## Reglas de normalización

| Situación en el Excel | Tratamiento |
|---|---|
| Espacios y mayúsculas inconsistentes (`'DPC0273-00 '`) | `trim` y mayúsculas; claves comparadas con `normalizar_clave` (sin tildes ni signos) |
| Operadores concatenados (`CORPORACION CAMPO LIMPIO - FUNDACION BIOENTORNO`) | Se separan en varios operadores del periodo |
| Mismo operador o gestor con varios nombres | Se relaciona **por NIT** y los otros nombres quedan como alias |
| Gestores de certificados con nombre distinto a la razón social | Tabla de equivalencias revisada a mano (`GESTOR_POR_NOMBRE`: 15 nombres → 15 NIT). Un nombre nuevo sin equivalencia es `ERROR` |
| `Sin determinar`, `No aplica`, `Pendiente` en columnas numéricas | Campo vacío; el texto se conserva en `marcas` (Indicadores, certificados) |
| Números como texto inequívocos (`742.00`, `5.9`) | Se convierten |
| Números ambiguos (`1.441.36`, `11,106,80`) | Campo vacío + advertencia `NUMERO_AMBIGUO` con el valor original |
| Fechas en español (`14 de abril de 2026`), `dd/mm/aaaa` | Se convierten. Fechas mal escritas (`23/05/202`) quedan vacías con el texto en `marcas`; **no se corrigen por suposición** |
| Celdas con dos valores (`2195\n2283`) | Concepto y auto se guardan como texto; si hay dos fechas se guarda la primera y el original en `marcas` |
| Sumas tecleadas como fórmula (`=332.2+12.9+…`) | Se importa el resultado |
| Municipio cacheado o “No encontrado” | Se **recalcula** desde la DIVIPOLA; si no existe, vacío + advertencia |
| Coordenadas fuera del rango CTM12 | Vacías; el valor original va a observaciones |
| Fila de totales al final de INDICADOR | Se omite (se usa para conciliar) |
| Duplicado exacto | Se carga una vez |
| Duplicados contradictorios de Uso 1 | Se cargan según la decisión del cliente (`DECISIONES_DUPLICADOS_USO1` en el importador) |

## Severidad de incidencias

| Severidad | Efecto |
|---|---|
| `ERROR` | La fila **no se carga** (p. ej. `EXPEDIENTE_NO_EXISTE`, `RELACION_SIN_RESOLVER`, gestor sin equivalencia) |
| `ADVERTENCIA` | Se carga con el campo vacío o un supuesto explícito (p. ej. `NUMERO_AMBIGUO`, `DIFERENCIA_EXISTENTE`) |
| `INFO` | Informativa |

El detalle completo de hallazgos, conflictos y cifras de conciliación está en `docs/05-fase3-analisis.md` y
`docs/06-certificados-proyecciones.md` del repositorio.
