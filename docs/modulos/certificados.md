---
sidebar_position: 5
title: Certificados de gestión
---

# Certificados de gestión

Según el cliente, **los gestores tienen los certificados** y **las empresas tienen las proyecciones**. Reemplaza
`Certificados_Gestores.xlsx`.

## Qué es una fila

**Una fila es una entrega certificada, no un certificado.** El mismo código cubre varias entregas con fechas y kg distintos
(p. ej. “Certificado # 025” de MAYCO tiene 4 entregas). Cada entrega tiene: operador y gestor (el gestor debe trabajar con ese
operador), código (texto: numérico, alfanumérico o “Certificado # 025”), fecha de entrega de residuos, fecha de expedición,
tipo de tratamiento (catálogo) + descripción original (“Incineración con aprovechamiento energético”), kg, año de validación y
si se validó.

Clasificación del texto original en el catálogo: Co-procesamiento → Coprocesamiento; Incineración e “Incineración con
aprovechamiento energético” → Incineración; Aprovechamiento, “Aprovechamiento y valorización” y “Aprovechamiento en
alternativas plásticas” → Aprovechamiento; Celda de seguridad.

## Pantalla `/gestores/certificados`

- Entregas por operador y gestor con filtros de año, validación y código; totales validados por operador (equivalen a la tabla
  dinámica de *Hoja2* del Excel).
- Alta, edición, borrado y **marcado masivo** como validado / no validado.
- Avisos por entrega (`avisosCertificado`): textos del Excel que no eran fechas (`23/05/202`), entrega posterior a la
  expedición, fechas fuera de rango. **Nunca se corrigen solos**: los corrige el usuario.
- Pestaña **Conciliación con cantidades reportadas**: `v_conciliacion_certificados` frente a `operador_gestor_tratamientos`
  (hoja TIPO_GESTION), con estado Coincide / Difiere / Sin certificados / Sin reporte.

## Certificados de la empresa

Pestaña *Certificados* de Uso 1 y Uso 2 en el detalle de la empresa (`expediente_certificados`). Solo se ofrecen certificados de
pares operador × gestor asociados a la empresa. Muestra el totalizador **certificado frente a validado**.

### Gestión global vs. individual

`operadores.gestion_individual` define cómo se reparten los certificados de un operador:

| | Gestión global (todos menos COLECTA) | Gestión individual (COLECTA) |
|---|---|---|
| Reparto | El certificado es compartido por todas las empresas que usan ese gestor con ese operador | Cada certificado es de **una sola empresa** |
| Al crear un certificado | Se añade solo a esas empresas (`trg_anadir_a_empresas`) | No se añade a ninguna |
| Al asociar un gestor a la empresa | La empresa recibe los certificados existentes (`trg_anadir_certificados`) | Nada |
| Añadir a mano | Sí | Sí; si otra empresa ya lo tiene, la base lo rechaza (`trg_certificado_individual`) y la pantalla lo muestra como ocupado |
| Quitar | La empresa puede quitar los que no presentó; no vuelven a aparecer solos | Libera el certificado |
