---
sidebar_position: 2
title: Uso 1 y Uso 2
---

# Uso 1 y Uso 2

Ambos usos comparten titular, expediente, operadores, gestores, mecanismos, catálogos, auditoría y usuarios. Cambian las
fórmulas y la cobertura poblacional (solo Uso 2). Las fórmulas están en [Reglas de cálculo](../base-de-datos/calculos.md).

| | Uso 1 | Uso 2 · Doméstico |
|---|---|---|
| Tipos de uso | Agrícola, veterinario, salud pública, industrial | Doméstico |
| Tabla | `registros_uso1` | `registros_uso2` + `registros_uso2_cobertura` |
| Meta | Puesta en el mercado × % meta | Base × (1 + % incremento) |
| RPC | `guardar_registro_uso1` | `guardar_registro_uso2` |
| Pestañas | Información general · Histórico / Periodos · Cantidades · Desuso · Gestores · Certificados · Mecanismos | Histórico / Periodos · Cantidades · Cobertura · Desuso · Gestores · Certificados · Mecanismos |

## Histórico / Periodos

Un registro por **periodo de recolección** (`unique (expediente_id, periodo_recoleccion)`); los periodos anteriores no se
sobrescriben. Tabla con meta, total validado, % de cumplimiento e insignia Cumple / No cumple / Sin determinar. Al
seleccionar una fila se abre su detalle con la *última actualización* (quién y cuándo).

## Cantidades

Formulario con **solo datos fuente**; los calculados se ven como vista previa mientras se escribe y luego se leen de la base.

- **Uso 1**: periodo, año de revisión (sugerido periodo + 1), operador(es) del periodo, puesta en el mercado, % meta
  (obligatorio, lo digita el profesional), gestionada, validada en vigencia de seguimiento, validada en vigencias posteriores,
  abonada en vigencia posterior, kg por tipo de tratamiento, observaciones, profesional.
- **Uso 2**: periodo, año de revisión, operador(es), **base de la meta** con su origen (propone lo recolectado del periodo
  anterior; puede elegirse la meta anterior o digitarse), % incremento (10 % por defecto), recolectada, validada, validada
  vigencias posteriores, abonada, tratamientos, observaciones.

## Cobertura (Uso 2)

Población atendida por puntos fijos y por campañas (habitantes), puntos fijos y campañas validados (unidades). El % de meta de
cobertura del periodo viene de `metas_cobertura` y se copia al registro al crearlo. Muestra meta de puntos, meta de campañas,
% de población cubierta (2 decimales) y si cumple.

## Desuso

Plaguicidas en desuso generados y validados (kg). Componente compartido (`features/registros/Desuso.tsx`): la interfaz es la
misma para los dos usos y solo cambia la RPC que guarda.

## Gestores y mecanismos del expediente

- **Gestores**: por cada operador vinculado, se eligen gestores del catálogo de ese operador (`expediente_gestores`). La FK
  compuesta impide elegir un gestor de otro operador. Quitar un gestor del expediente quita también sus certificados de la empresa.
- **Mecanismos**: por cada operador vinculado, se eligen puntos de recolección y centros de acopio de ese operador
  (`expediente_mecanismos`), en bloque.

## Certificados de la empresa

Lista los certificados de los gestores que usa la empresa (por operador) y permite añadirlos o quitarlos
(`expediente_certificados`). Incluye el totalizador **certificado frente a validado** por operador o por gestor, y dentro de cada
uno por tratamiento. Reemplazó la antigua pestaña “Tipo de tratamiento”. Ver [Certificados](certificados.md) para la
diferencia entre gestión global e individual.

## Reglas que aplica la base

- El expediente debe tener declarado un uso de la categoría correspondiente (trigger); si no, el guardado falla.
- Cantidades no negativas; % meta en (0, 1]; % incremento en [0, 1].
- El año de revisión y el % de incremento de Uso 2 son obligatorios en la aplicación (en el histórico importado pueden faltar).
- Periodo duplicado → error `23505` (“Ya existe un registro con esos datos…”).
