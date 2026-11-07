> **Aclaración de rendimiento posterior al cierre:** RNF-01 exige <500 ms en condiciones normales y contempla latencia inicial por cold start. Se separa la primera solicitud y se conservan 45 muestras del servicio activo: login p95 905,670 ms; disponibilidad 651,064 ms; mis citas 308,141 ms. IVS-D06 sigue abierto por desviaciones observadas, sin deducir incumplimiento general del arranque inicial. Ver [medición y alcance](rendimiento-publicado.md).

# Estado del proyecto previo al PDF

> Cierre funcional posterior, 07/11/2026: APK 1.0.1 comprobado nuevamente, 23 casos UI conformes; 27/27 integración reejecutados; 50 backend + 4 notificaciones + 3 seguridad de navegación. API pública identificada por SHA 51a6a28314452045d912d8f0940190a24c344bfb. Las cifras/pendientes del primer corte se conservan como antecedentes y quedan actualizados por [cierre funcional](cierre-funcional.md).


> Estado actual 1.0.1: 0 alertas altas y 11 moderadas frontend; backend 0. Las cifras 3 altas y el APK 1.0.0 de las secciones originales son antecedentes del primer corte. Véase [cierre de seguridad](seguridad-frontend.md) y [nuevo release](notas-release-1.0.1.md).

## Resultado de la preparación

Se prepararon criterios por RF, trazabilidad, correcciones específicas de IVS, cinco hallazgos de usabilidad, manual CLIENT/ADMIN y plan de capacitación, instalación/operación, migración de datos, recuperación y plan V&V. El diccionario fue obtenido desde PostgreSQL reconstruido. La campaña se amplió con sesión API, límites temporales y rollback; la restauración de datos sintéticos se ejecutó en otro esquema.

Expo se mantuvo en SDK 57, con parches compatibles recomendados por su CLI. Se aplicó npm audit fix sin --force. Antes: 6 entradas altas/16 moderadas/1 baja frontend. Después: 3 altas/11 moderadas, sin críticas; backend cero. Expo install --check, TypeScript, ESLint, 48 pruebas backend y 4 de notificaciones pasan. La auditoría frontend conserva hallazgos, por lo que el control global devuelve exit 1 de forma esperada. Consultar los reportes originales; no denominarlo seguridad aprobada.

La API publicada aceptó ambas cuentas dummy con sus roles correctos y pasó diez checks de login/identidad/permisos/consulta. Health respondió 6/6 durante una observación de aproximadamente 52 segundos. El primer login tardó 22,553 segundos; causa no instrumentada. No se atribuye automáticamente a cold start; la observación se conserva por separado y no demuestra por sí sola incumplimiento en condiciones normales. La muestra no demuestra un SLA; /health tampoco comprueba BD.

## Bitácora de cambios y defectos de esta preparación

| ID | Requisito/área | Hallazgo y severidad | Cambio y verificación | Estado |
| --- | --- | --- | --- | --- |
| IVS-D01 | Reproducibilidad | make-admin.js contenía celular fijo, media | Exige argumento válido; instalación explica uso en sandbox; huella en manifiesto | Corregido local; no se ejecutó promoción en producción |
| IVS-D02 | Compatibilidad RC-08/09 | Dieciocho parches recomendados, media | Expo install --fix dentro de SDK 57; install --check PASS; controles y builds nuevos | Corregido en candidato local; app instalada no se presume actualizada |
| IVS-D03 | Seguridad dependencias | Seis altas npm iniciales, alta | Parches y audit fix compatible; seis→tres altas; backend cero | Altas cerradas en 1.0.1; once moderadas abiertas (ver actualización) |
| IVS-D04 | Recuperación | Sin ensayo de restauración verificable, alta | ivs-recovery.cjs; archivo real sintético restaurado, igualdad, FK y secuencias | Cerrado en alcance de laboratorio; operativo pendiente |
| IVS-D05 | RF-03/04/07/17 y UI | Falta reejecución final de interfaz, media | ADB autorizado: 11 comprobaciones del APK, sesión, reserva, asistencia, cancelación e historial | Parcialmente cerrado; WhatsApp, móvil exhaustivo/web y push final pendientes |
| IVS-D06 | RC-05 rendimiento | Primer login publicado 22,553 s, media | Tiempo original conservado; sucesivas lecturas registradas | Abierto para diagnóstico; no se afirma causa |

Responsable de seguimiento: Hanssel. Ejecutor técnico nuevo: Codex autorizado. Fecha: 7/11/2026. Los commits/hashes finales se registran en el manifiesto y el release; la base sourceCommit de una ejecución no implica que incluya cambios locales posteriores. No se atribuye revisión de estos cambios a colaboradores que no la realizaron.

## Pendientes que requieren evidencia humana o acceso

- El bloqueo inicial de Computer Use se superó con ADB autorizado. El APK se instaló y se verificó: login por rol, logout ADMIN/CLIENT, recordar sesión tras reinicio, creación de #57, aceptación por API, asistencia UI, volver del diálogo sin mutar y cancelación/historial/horario libre. No se declara validación exhaustiva por plataforma.
- Integrantes de IVS conservados según la portada proporcionada: Steven Rosales, Ruddy Galo y Hanssel Nuñez. Las contribuciones se atribuyen según Git y las ejecuciones registradas.
- Registros reales de uso, incidencias, retroalimentación y aceptación de la barbería. Instrumento preparado; no medido todavía.
- Capacitación y evaluación práctica reales. El plan está listo, la ejecución no ocurrió aquí.
- Imágenes auténticas anteriores a mejoras UX: no localizadas. Hay capturas nuevas del APK para reserva/cancelación e inspección de código; quedan revisiones de tarjetas ADMIN y otros estados visuales.
- Aislamiento real de cuentas del piloto, política de contraseñas y revocación de sesiones previas. Ninguna contraseña fue rotada ni se cambiaron permisos del servicio operativo en esta preparación.

## Decisión y preparación del documento

El candidato se mantiene para evaluación académica/piloto controlado, con riesgos residuales. No se recomienda liberación general por hallazgos frontend y validación integral aún pendiente. La compilación Android y el recorrido reducido del APK sí fueron comprobados; no convierten los escenarios restantes en aprobados.

El PDF puede generarse con resultados y límites reales. Para declararlo completamente cerrado deben incorporarse las confirmaciones/evidencias pendientes o mantenerlas visibles con su impacto. Orden: portada/integrantes → resumen/alcance → correcciones I/II → requisitos/aceptación → usabilidad/interfaz → arquitectura/datos → instalación/migración/recuperación → manual/capacitación → plan/resultados V&V → defectos/regresión → trazabilidad → versión/repositorio → autoverificación → conclusiones/anexos.

| Rúbrica IVS | Material previo preparado | Condición pendiente |
| --- | --- | --- |
| Producto, 15 | Código, API/BD, capturas, 11 comprobaciones del APK y recorrido de cita con limpieza | Ampliar plataformas y escenarios restantes |
| Diseño, 10 | Diagramas, fuentes, modelo ER, diccionario, contratos | Integración gráfica legible y revisión de versión |
| V&V/trazabilidad, 12,5 | Plan, casos, regresión, recuperación, criterios por RF | UI y vínculos finales al release |
| Documentación/reproducibilidad, 7,5 | Guías, manual, capacitación, recuperación y manifiesto | Confirmaciones humanas y PDF consolidado |

Los 5 puntos de defensa se trabajan aparte por instrucción del usuario. El PDF consolidado se actualiza con el cierre de seguridad 1.0.1.


## Actualización de seguridad 1.0.1

El cierre posterior del 07/11/2026 elimina las tres alertas altas de la cadena Expo Router/query-string/decoder: auditoría frontend actual 0 altas, 11 moderadas y 0 críticas; backend 0. Se mantienen los resultados del release 1.0.0 como antecedentes fechados, no como pruebas del nuevo binario. Véase [corrección, reproducción y límites](seguridad-frontend.md) y los [controles posteriores](../../../docs/evidencias_pruebas/ivs-2026-11-07/seguridad-frontend/controles.json). El nuevo candidato se identifica como v1.0.1-ivs.20261107; no se sustituye el release previo.
