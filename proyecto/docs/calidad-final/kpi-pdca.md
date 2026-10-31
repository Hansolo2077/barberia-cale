# KPI finales y mejora del proceso

Tablero del 31/10/2026. Responsable: Hanssel. Frecuencia: antes de cada liberación y tras cambios relevantes. Las líneas base de campañas diferentes se distinguen; los resultados de pruebas no constituyen cobertura de código ni de requisitos.

| ID | Fórmula / medida | Línea base | Valor actual | Meta | Estado | Decisión | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KPI-01 | Aprobadas / ejecutadas ×100 | II: 10/10; campaña distinta | 23/23 = 100% | 100% | Cumplido | Mantener regresión; correlacionar capturas de notificación sin sumarlas como ejecuciones propias | [integracion-regresion.json](../../../docs/evidencias_pruebas/parcial-iii/integracion-regresion.json) |
| KPI-02 | Controles automáticos de código/pruebas conformes / 4 ×100 | II: sin CI consolidado | 4/4 = 100% | 100% | Cumplido | Conservar como gate y comprobar CI remoto | [controles.json](../../../docs/evidencias_pruebas/parcial-iii/controles.json) |
| KPI-03 | Paquetes altos/críticos npm backend | Antes hoy: 1 | Actual: 0 | 0 | Cumplido | Conservar parche y prueba de cuerpo comprimido | [audit-backend.json](../../../docs/evidencias_pruebas/parcial-iii/audit-backend.json) |
| KPI-04 | Paquetes altos/críticos npm frontend | Antes hoy: 8 | Actual: 6 | 0 | No cumplido | No liberar generalmente; seguir BQ-01 | [audit-frontend.json](../../../docs/evidencias_pruebas/parcial-iii/audit-frontend.json) |
| KPI-05 | Accesos expuestos con clave anterior 401 y nueva 200 / 2 ×100 | II: 2 claves publicadas | 2/2 = 100% | 100% | Cumplido | Acceso privado y revocación de sesiones pendiente | [rotacion-accesos.json](../../../docs/evidencias_pruebas/parcial-iii/rotacion-accesos.json) |
| KPI-HTTP-login | p95 nearest-rank HTTP en ms | II: cronómetro visual; no comparable directamente | 708.703 ms; n=10 | ≤1000 ms | Cumplido | Mantener serie instrumentada y separar UI/frío | [despliegue.json](../../../docs/evidencias_pruebas/parcial-iii/despliegue.json) |
| KPI-HTTP-disponibilidad | p95 nearest-rank HTTP en ms | II: cronómetro visual; no comparable directamente | 358.066 ms; n=30 | ≤1000 ms | Cumplido | Mantener serie instrumentada y separar UI/frío | [despliegue.json](../../../docs/evidencias_pruebas/parcial-iii/despliegue.json) |
| KPI-HTTP-mis_citas | p95 nearest-rank HTTP en ms | II: cronómetro visual; no comparable directamente | 279.694 ms; n=30 | ≤1000 ms | Cumplido | Mantener serie instrumentada y separar UI/frío | [despliegue.json](../../../docs/evidencias_pruebas/parcial-iii/despliegue.json) |
| KPI-SUS | Puntuación SUS media | Sin estudio ejecutado | No medido | ≥70 | No medido | Organizar usuarios reales y conservar respuestas | Plan de Calidad; BQ-05 |


## Interpretación de rendimiento

Las muestras crudas están en despliegue.json. HTTP incluye solicitud hasta cuerpo JSON completamente recibido. Login tiene 10 muestras para respetar el rate limit compartido; disponibilidad y citas tienen 30 cada una. Concurrencia 1, una petición de calentamiento por flujo, Windows/Node fetch hacia Render. Se mide p95 por ordenación y posición ceil(0.95 × n); no se aproxima con media. No se midió el feedback visible del RC-05 ni un arranque en frío deliberado. El cronómetro del II se conserva como observación histórica y no se inventa una mejora porcentual entre métricas distintas.

## Ciclo PDCA verificable de seguridad de dependencias

PLAN: auditoría inicial del 31/10 detectó 1 alta en backend y 8 altas en frontend. Objetivo: resolver parches compatibles sin saltar de Expo SDK ni debilitar verificaciones. Responsable: Hanssel. Criterio global: cero altas/críticas antes de liberar; criterio del cambio: eliminar body-parser vulnerable y el aviso compatible de navegación sin romper regresión.

DO: body-parser 2.3.0 → 2.4.0; @react-navigation/core 7.21.13 → 7.24.0 y routers 7.6.5; node-forge 1.4.0 → 1.4.2, cuyo parche compatible fue confirmado en el registro el 31/10. Se añadió una regresión HTTP de JSON comprimido con bytes finales y comprobación posterior de servidor vivo. Se registró la fuente del aviso [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828).

CHECK: backend 1 → 0 altas; frontend 8 → 6 altas. Reportes antes/después de la misma herramienta y corte. Campaña real inicial 23/23, regresión 23/23. TypeScript/lint y suites: consultar controles.json actualizado. No se extrapola npm a Snyk.

ACT: aceptar los parches compatibles como mejora local; conservar la regresión y el control npm, y mantener abiertas las vulnerabilidades restantes. No autorizar liberación general. Repetir el ciclo al existir parches compatibles y verificar el SHA desplegado. La revisión/ejecución remota de la ampliación de CI sigue pendiente; no se presenta como aprobada.

El ciclo histórico del calendario se mantiene como antecedente en DEF-01/02; no se reutiliza como resultado nuevo. La mejora nueva de esta campaña es la medición reproducible y la regresión de seguridad con registro central.
