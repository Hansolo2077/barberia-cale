# Evidencias técnicas del cierre del Parcial III

Corte 31/10/2026. Índice de apoyo: [preparación técnica](../../../proyecto/docs/calidad-final/README.md). No contiene el PDF final.

Los identificadores EV-01 a EV-12 coinciden con el Anexo F (página 43) del informe final. Las rutas se conservan al extraer el ZIP; la carpeta anexos/ pertenece al paquete de entrega.

| ID | Artefacto | Alcance |
| --- | --- | --- |
| EV-01 | [Capturas del II Parcial](../../arquitectura-actual/Capturas_App_Segundo_Parcial.md) | Banco histórico de pruebas visuales; figuras A1 a A8 del informe |
| EV-02 | [Análisis de calidad](../../analisis-calidad-seguridad.md) / [remediación PR #8](../../remediacion-seguridad-pr8.md) / [reportes PR #7/#8](../pr8/) | CI y remediación históricos; reportes Sonar/Snyk/DeepSource |
| EV-03 | [controles.json](controles.json) | Controles del 31/10: TypeScript, ESLint, 48 pruebas backend, 4 de notificaciones, auditoría y compatibilidad; TXT/JSON asociados |
| EV-04 | [integracion.json](integracion.json) | Campaña inicial: 23 escenarios reales HTTP/PostgreSQL |
| EV-05 | [integracion-regresion.json](integracion-regresion.json) | Regresión: reejecución de 23 escenarios, resultados y limpieza |
| EV-06 | [despliegue.json](despliegue.json) | Despliegue y p95: checks HTTP/roles y muestras crudas |
| EV-07 | [Backend antes](audit-backend-antes.json) / [después](audit-backend.json); [frontend antes](audit-frontend-antes.json) / [después](audit-frontend.json) | Auditorías npm comparables antes/después del mismo corte; no equivale a Snyk |
| EV-08 | [revisiones-github.json](revisiones-github.json) | Revisiones auténticas: autor, fecha, alcance, SHA y estado de PR |
| EV-09 | [cambio-accesos-evaluacion.json](cambio-accesos-evaluacion.json) | Accesos posteriores: hash, rechazo de clave histórica y login 200 por rol; rotacion-accesos.json es anterior |
| EV-10 | [compilaciones.json](compilaciones.json) / [web-build.txt](web-build.txt) / [android-build.txt](android-build.txt) | Web de 12 rutas; APK y huella; extractos de finalización y límites de UI |
| EV-11 | [notificaciones-visuales.json](notificaciones-visuales.json) | Rutas y huellas de originales; figuras B1 a B4 anonimizadas en anexos/figuras/ del ZIP |
| EV-12 | [manifest.json](manifest.json) | Integridad y organización: huellas de fuentes y evidencias; anexos/manifest-entrega.json en el ZIP |


Los TXT de suites incluyen resultados TAP. Los JSON de integración conservan pasos, precondiciones, datos sintéticos, esperado/obtenido, estado y fechas. Los informes anteriores de Sonar/Snyk se conservan en ../pr8 y ../dependencias con sus fechas originales; no se presentan como escaneos del 31/10.
