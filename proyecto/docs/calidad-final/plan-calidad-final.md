# Línea base y Plan de Calidad final

## Identificación y estado

Sistema Barbería Cale 1.0.0. Autor y responsable del cierre: Hanssel Arnulfo Nuñez Castañeda. Rama de preparación: chore/cierre-calidad-parcial-iii. Commit base: ab73b3a18839f08825bc441f024e426455b41d4e. Las pruebas de este paquete se ejecutaron con cambios locales; el manifiesto identifica sus archivos exactos mediante SHA-256. No presentar el commit base como si incluyera estos cambios.

API: https://barberia-cale.onrender.com/api. Web: https://barberiacale.netlify.app/. PostgreSQL de pruebas: versión 17.6. Node local: v24.16.0. Expo 57.0.15 y React Native 0.86.2. El endpoint health no permite identificar el SHA desplegado; la igualdad entre despliegue y checkout no está demostrada. El APK anterior instalado en Pixel 4 no cargó JavaScript; consultar el registro de compilación móvil antes de afirmar ejecución Android final.

Implementado según línea base: RF-01 a RF-22. Los estados de implementación y verificación son distintos. Exclusiones: pagos, inventario, múltiples sucursales, selección de barbero, recuperación automática de clave, iOS validado, web push y WhatsApp empresarial automático. Se conservan las reglas de 24 horas, una cita activa por día, dos por siete días y cancelación hasta 60 minutos antes.

Cambios desde el II Parcial: CI con pruebas y análisis, endurecimiento del pipeline en PR #7/#8, campaña aislada HTTP/PostgreSQL, p95 instrumentado, rotación de accesos, registros centralizados, actualización compatible body-parser 2.3.0 → 2.4.0, @react-navigation/core 7.21.13 → 7.24.0 con routers 7.6.5 y node-forge 1.4.0 → 1.4.2. No se cambió de SDK.

## Objetivos y criterios

| ID | Objetivo | Control y criterio | Resultado / límite |
| --- | --- | --- | --- |
| OC-01 | Integridad de reservas | RC-03/04: rechazos de límites y exactamente una reserva concurrente | PF-07/08/12/13 conformes |
| OC-02 | Proteger acceso y credenciales | RC-01/02: 401/403 sin mutación; hash; claves anteriores inválidas | PF-01/04/10/22 y rotación conformes; JWT previos no revocados |
| OC-03 | Desempeño | RC-05 conserva feedback visual ≤1 s; KPI adicional HTTP p95 ≤1000 ms | HTTP medido; feedback visual y cold start no instrumentados |
| OC-04 | Recordatorios fiables | RC-11: claim exclusivo, reintento y ausencia de duplicados | PF-18 a PF-21 conformes en SQL; NF-01 a NF-04 documentan recepción y respuesta visibles |
| OC-05 | Regresión y compatibilidad | RC-08/09: TypeScript, lint, pruebas y empaquetado sin bloqueos | Consultar controles y compilaciones; pruebas UI completas pendientes |
| OC-06 | Seguridad de dependencias | 0 vulnerabilidades altas/críticas para liberar generalmente | Backend conforme; frontend no cumple |


## Responsabilidades y RACI

R ejecuta; A aprueba; C consulta; I recibe información. Esta matriz asigna el trabajo futuro sin atribuir aprobaciones inexistentes.

| Actividad | Hanssel | Ruddy / Steven | Representante de Cale Shop |
| --- | --- | --- | --- |
| Requisitos, desarrollo y documentación | R/A | C cuando participe | I |
| Pruebas, KPI y registro de defectos | R/A | C cuando participe | I |
| Revisión independiente de un PR | R en preparar y resolver | R en revisión si la acepta; no se presume aprobación | I |
| Validación de uso y SUS | R en organizar | I | R en responder; A en aceptación de negocio si participa |
| Decisión técnica de liberar | R/A | C | C |


## Procesos y cronograma de control

Antes de cada cambio: identificar RF/RC y criterio de aceptación. En cada PR: revisión de diff, TypeScript, ESLint y pruebas automatizadas. Después de una corrección de riesgo: repetir campaña representativa y conservar antes/después. Antes de liberar: auditoría de dependencias, accesos, evidencias, compilación y matriz de trazabilidad. Durante el piloto: revisión semanal de defectos y observaciones; medir nuevamente tras cambios de infraestructura. El corte del 31/10 conserva fechas UTC por ejecución, con zona de presentación Guatemala.

Registros obligatorios: ID, versión o huella de archivos, fecha, ambiente, pasos/datos, esperado, obtenido, estado y evidencia. Estados permitidos: ejecutado conforme, ejecutado no conforme, parcial y no medido. Un archivo de prueba existente no equivale a prueba ejecutada; un pipeline diseñado no equivale a CI remoto aprobado.

## Riesgos y decisión

Riesgos residuales: dependencias frontend vulnerables; tokens de sesión anteriores a la rotación; ausencia de estudio SUS; correlación de versión/reloj/job de las capturas de notificaciones y compatibilidad móvil aún incompletas; cold start de Render no medido hoy; falta de SHA de despliegue. La recepción de push y la confirmación visible del cliente y ADMIN sí están documentadas. Mitigación: piloto, acceso limitado, claves privadas, backlog con criterio de cierre y nueva verificación antes de liberar.

## Aplicación de estándares

ISO 9000: vocabulario consistente en requisitos, defectos y evidencias. ISO 9001: controles de proceso, registros, tratamiento de no conformidades y PDCA. ISO/IEC/IEEE 12207: requisitos → cambios → construcción → verificación → entrega y mantenimiento. Las evidencias de aplicación son las matrices, Git, pruebas y registros de este paquete; no se declara certificación.

Para conservar comparabilidad, los nombres de atributos de los parciales se mantienen como base académica del modelo ISO/IEC 25010:2011. Se explicita que esa edición fue retirada y reemplazada; no se presenta como edición vigente. La edición 2023 tiene nueve características y requiere una migración explícita del modelo; no se mezclan nombres sin explicar. Referencias oficiales: [ISO 2011](https://www.iso.org/standard/35733.html), [ISO 2023](https://www.iso.org/standard/78176.html). SUS ≥70 es un criterio interno previamente fundamentado, no una obligación de ISO ni un resultado medido.
