---
sidebar_position: 4
title: Operadores, gestores y mecanismos
---

# Operadores, gestores y mecanismos

Son **catálogos únicos**: un operador, gestor o mecanismo existe una sola vez y los expedientes lo seleccionan. En los Excel
se repetían por cada expediente.

```text
Operador logístico ──N:M── Gestor            (operador_gestores)
        │
        └──1:N── Mecanismo de recolección     (mecanismos.operador_id)

Expediente ── usa ── operadores vinculados → sus gestores → sus mecanismos   (FK compuestas)
```

## Operadores logísticos (`/operadores`)

Datos: NIT y DV (opcionales: APROVET y BIOECOLÓGICA no tienen NIT en las fuentes), nombre único, representante, teléfono, correo,
activo y **gestión individual** de certificados. El detalle (`/operadores/:id`) tiene las pestañas *Gestores del operador*
(asociar o quitar gestores del catálogo del operador; muestra los kg por tratamiento de `operador_gestor_tratamientos`) y
*Mecanismos de recolección*.

Los nombres alternativos de los Excel (“CORPORACION POSCONSUMO CIERRA EL CICLO” = “CORPORACION CIERRA EL CICLO”) están en
`operador_alias` y los usa el importador.

Quitar un gestor de un operador falla si algún expediente lo está usando por ese operador.

## Gestores (`/gestores`)

Plantas de tratamiento o disposición: NIT/DV, razón social, dirección de la planta, municipio (con su **autoridad ambiental**,
derivada de la DIVIPOLA), licencia ambiental, capacidad instalada, actividades autorizadas (almacenamiento, aprovechamiento,
valorización, disposición final) y operadores con los que trabaja. Desde cada gestor hay un enlace a sus
[certificados](certificados.md).

## Mecanismos de recolección (`/mecanismos`)

Puntos de recolección y centros de acopio. Pertenecen a un operador; cada expediente selecciona los que usa. Campos: tipo,
municipio, dirección, punto de referencia (los centros de acopio rurales no tienen dirección), coordenadas norte/este y
observaciones. Filtros por operador y tipo.

### Coordenadas

Sistema **MAGNA-SIRGAS Origen Nacional (CTM12, EPSG:9377)**, confirmado por el cliente. Valores típicos: norte 1,8–2,7 M,
este 4,5–5,0 M.

### Mapa (`/mecanismos/mapa`)

Leaflet + OpenStreetMap (gratis, sin clave). Cada mecanismo es un punto con el color de su tipo (azul: punto de recolección;
ámbar: centro de acopio). Al hacer clic se ve operador, municipio, dirección, punto de referencia y coordenadas. Filtros por
operador y tipo; el mapa se ajusta a los puntos visibles.

Debajo del mapa: cuántos se ubicaron, cuántos no tienen coordenadas y cuántos caen fuera de Colombia, y la tabla
**Coordenadas por revisar** (probablemente norte y este invertidos o mal digitados).

En la importación, 120 filas tenían coordenadas fuera del rango CTM12; quedaron vacías con el valor original en observaciones.
