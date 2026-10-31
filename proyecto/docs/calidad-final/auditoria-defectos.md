# Auditoría de cierre y registro central de defectos

Revisión técnica interna del 31/10/2026. Responsable de ejecución: Hanssel con asistencia de herramientas. No constituye aprobación de Ruddy o Steven para estos cambios nuevos. Las revisiones anteriores se atribuyen exclusivamente a sus autores y alcance registrados.

| Control | Criterio | Estado | Evidencia / observación |
| --- | --- | --- | --- |
| AUD-01 | Línea base RF-01 a RF-22 identificada | Conforme | Requisitos vigentes y plan-calidad-final.md |
| AUD-02 | Correcciones I y II trazables | Parcial | correcciones.md; pendientes reconocidos |
| AUD-03 | Credenciales expuestas rotadas | Conforme | [rotacion-accesos.json](../../../docs/evidencias_pruebas/parcial-iii/rotacion-accesos.json) |
| AUD-04 | Autorización real por rol | Conforme | PF-04/10/22 y LIVE-03 a LIVE-07 |
| AUD-05 | Concurrencia sin doble reserva | Conforme | PF-12; exactamente una activa |
| AUD-06 | Recordatorios exclusivos y reintentables; recepción | Conforme para escenarios probados | PF-18 a PF-21; NF-01 recepción visible y NF-02 a NF-04 asistencia; correlación reloj/build/job pendiente |
| AUD-07 | TypeScript, lint y pruebas automáticas | Conforme | [controles.json](../../../docs/evidencias_pruebas/parcial-iii/controles.json) |
| AUD-08 | Seguridad alta/crítica de dependencias | No conforme | Backend cero; frontend 6 altas |
| AUD-09 | Cuatro KPI con resultados y decisiones | Conforme | kpi-pdca.md |
| AUD-10 | DoD, backlog y flujo de cambios | Conforme documental | dod-devops-backlog.md; CI nuevo sin ejecución remota |
| AUD-11 | Defectos con ID y evidencia de cierre | Conforme documental | Registro siguiente; estados históricos/locales explícitos |
| AUD-12 | Revisión técnica independiente existente | Conforme histórico | revisiones-github.json; PR #1–#6; Steven PR #4 posterior al merge |
| AUD-13 | Compatibilidad integral Android/web | Parcial | Bundle web y registro móvil; UI final sin campaña completa |
| AUD-14 | Rendimiento y usabilidad | Parcial | HTTP p95 medido; SUS y feedback visual no medidos |
| AUD-15 | Evidencia identificada y sin secretos | Revisión mediante manifiesto | manifest.json; nuevos accesos solo .quality-private |
| AUD-16 | Dependencias alineadas con recomendación Expo | No conforme | expo-compatibility.txt; 18 parches recomendados, BQ-09 |


## Registro de seguimiento

Responsable de todas las acciones de implementación/documentación: Hanssel. Un revisor externo solo se asigna cuando acepta participar.

| ID | Defecto / hallazgo | Severidad | Reproducción / evidencia | Estado | Corrección puntual | Verificación / regresión | Acción contra la causa |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DEF-01 | Calendario mezclaba selección/cancelación | Media | PR #2 / 057ffe6 | Cerrado histórico | Separación de eventos | Review Ruddy PR #2; no se reejecutó UI final | Conservar caso UI BQ-06 |
| DEF-02 | Cancelar alteraba rango de agenda | Media | PR #3 / d7c025d | Cerrado histórico | Conservar rango al cancelar | Review Ruddy PR #3; no se reejecutó UI final | Conservar caso UI BQ-06 |
| H-01 | Registro de defectos disperso | Media | II p.15; este registro | Cerrado documental | Registro único con ID, causa y cierre | Este archivo, trazabilidad y evidencias | Actualizarlo en cada cambio |
| H-02 | Métricas manuales | Media | II p.15; despliegue.json | Atendido en la automatización gradual original | Instrumentación HTTP y p95 | Muestras y runner reproducible | Continuar ampliación UI y frío: BQ-04 |
| DEF-03 | Dos claves publicadas en PDF | Alta | Retroalimentación II; rotacion-accesos.json | Corregido; riesgo JWT abierto | Cambiar claves y comprobar 401/200 | Dos roles PASS; nuevos valores solo locales | No publicar secretos; seguir BQ-08 |
| DEF-04 | body-parser vulnerable a cuerpo comprimido | Alta | audit-backend-antes.json; GHSA-27r3-jxmh-p828 | Corregido local; despliegue pendiente | Actualizar a 2.4.0 | Audit backend cero; json-parser.integration.test.js | Regresión automática; BQ-02 |
| DEF-05 | Dependencia de navegación vulnerable | Alta | audit-frontend-antes.json | Corregido local; despliegue pendiente | core 7.24.0 y routers 7.6.5 | Una entrada alta menos; pruebas/bundle | Mantener lockfiles y revisar avisos |
| H-03 | Vulnerabilidades frontend remanentes | Alta | audit-frontend.json | Abierto | 6 altas, 26 moderadas y 2 bajas visibles | No hay cierre ni excepción aprobada | BQ-01: resolver compatibles y repetir análisis |
| H-04 | Documento PR #8 decía sin merge | Media | GitHub PR #8 merged; revisiones-github.json | Cerrado en lectura vigente | Añadir estado actual sin reescribir medición histórica | Commit merge ab73b3a, 17/10 | No confundir merge con seguridad aprobada |
| H-05 | Entorno inicial Android sin script utilizable | Media | Inspección inicial: Unable to load script | Usuario confirma app corriendo; campaña UI propia pendiente | Compilación release de verificación | Consultar compilaciones.json; inspección visual detenida con Escape | No extrapolar observación inicial al estado actual ni declarar campaña UI aprobada |
| DEF-06 | node-forge 1.4.0 vulnerable | Alta | audit-frontend-antes.json | Corregido local; despliegue pendiente | Actualizar dentro de ^1.3.3 a 1.4.2 | audit-frontend.json y controles.json | Revisar parches publicados en cada corte |
| H-06 | 18 paquetes tienen parches SDK 57 recomendados | Media | expo-compatibility.txt | Abierto | Mantenimiento pendiente sin cambio de SDK | Comprobación devuelve 1; no se oculta | BQ-09; repetir compilaciones al alinear |


Los reportes npm crudos mantienen el detalle de dependencias, rango afectado y fixAvailable. La existencia de una propuesta npm que cambia SDK no demuestra compatibilidad. No se ejecutó audit fix --force ni se ocultaron resultados fallidos.
