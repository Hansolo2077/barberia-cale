# Evidencias técnicas del cierre del Parcial III

Corte 31/10/2026. Índice de apoyo: [preparación técnica](../../../proyecto/docs/calidad-final/README.md). No contiene el PDF final.

| ID | Artefacto | Alcance |
| --- | --- | --- |
| EV-01 | [controles.json](controles.json) | TypeScript, ESLint, pruebas y npm audit actuales |
| EV-02 | [integracion.json](integracion.json) | Primera campaña real: 23 casos |
| EV-03 | [integracion-regresion.json](integracion-regresion.json) | Reejecución tras parches compatibles |
| EV-04 | [despliegue.json](despliegue.json) | API/web publicados, roles y p95 con muestras crudas |
| EV-05 | [rotacion-accesos.json](rotacion-accesos.json) | Claves anteriores rechazadas y nuevas verificadas; sin valores |
| EV-06 | [revisiones-github.json](revisiones-github.json) | Metadatos y revisiones auténticas de PR #1–#8 |
| EV-07 | [audit-backend-antes.json](audit-backend-antes.json) / [después](audit-backend.json) | Misma herramienta, antes/después del parche |
| EV-08 | [audit-frontend-antes.json](audit-frontend-antes.json) / [después](audit-frontend.json) | Paquetes afectados; no equivale a Snyk |
| EV-09 | [manifest.json](manifest.json) | SHA-256 de evidencias y fuentes; no incluye secretos |
| EV-10 | [compilaciones.json](compilaciones.json) | Resultado de compilación web/Android y limitaciones de UI |
| EV-11 | [notificaciones-visuales.json](notificaciones-visuales.json) | Cuatro imágenes inspeccionadas; recepción Android, confirmación CLIENT y ADMIN; originales en Others/Notificaciones |


Los TXT de suites incluyen resultados TAP. Los JSON de integración conservan pasos, precondiciones, datos sintéticos, esperado/obtenido, estado y fechas. Los informes anteriores de Sonar/Snyk se conservan en ../pr8 y ../dependencias con sus fechas originales; no se presentan como escaneos del 31/10.
