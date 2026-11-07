# Estado del proyecto previo al PDF

## Resultado de la preparación

Se prepararon criterios por RF, trazabilidad, correcciones específicas de IVS, cinco hallazgos de usabilidad, manual CLIENT/ADMIN y plan de capacitación, instalación/operación, migración de datos, recuperación y plan V&V. El diccionario fue obtenido desde PostgreSQL reconstruido. La campaña se amplió con sesión API, límites temporales y rollback; la restauración de datos sintéticos se ejecutó en otro esquema.

Expo se mantuvo en SDK 57, con parches compatibles recomendados por su CLI. Se aplicó npm audit fix sin --force. Antes: 6 entradas altas/16 moderadas/1 baja frontend. Después: 3 altas/11 moderadas, sin críticas; backend cero. Expo install --check, TypeScript, ESLint, 48 pruebas backend y 4 de notificaciones pasan. La auditoría frontend conserva hallazgos, por lo que el control global devuelve exit 1 de forma esperada. Consultar los reportes originales; no denominarlo seguridad aprobada.

La API publicada aceptó ambas cuentas dummy con sus roles correctos y pasó diez checks de login/identidad/permisos/consulta. Health respondió 6/6 durante una observación de aproximadamente 52 segundos. El primer login tardó 22,553 segundos; causa no instrumentada. No se atribuye automáticamente a cold start ni se excluye del resultado. La muestra no demuestra un SLA; /health tampoco comprueba BD.

## Bitácora de cambios y defectos de esta preparación

| ID | Requisito/área | Hallazgo y severidad | Cambio y verificación | Estado |
| --- | --- | --- | --- | --- |
| IVS-D01 | Reproducibilidad | make-admin.js contenía celular fijo, media | Exige argumento válido; instalación explica uso en sandbox; huella en manifiesto | Corregido local; no se ejecutó promoción en producción |
| IVS-D02 | Compatibilidad RC-08/09 | Dieciocho parches recomendados, media | Expo install --fix dentro de SDK 57; install --check PASS; controles y builds nuevos | Corregido en candidato local; app instalada no se presume actualizada |
| IVS-D03 | Seguridad dependencias | Seis altas npm iniciales, alta | Parches y audit fix compatible; seis→tres altas; backend cero | Parcial; tres altas frontend abiertas |
| IVS-D04 | Recuperación | Sin ensayo de restauración verificable, alta | ivs-recovery.cjs; archivo real sintético restaurado, igualdad, FK y secuencias | Cerrado en alcance de laboratorio; operativo pendiente |
| IVS-D05 | RF-03/04/07/17 y UI | Falta reejecución final de interfaz, media | ADB autorizado: 11 comprobaciones del APK, sesión, reserva, asistencia, cancelación e historial | Parcialmente cerrado; WhatsApp, móvil exhaustivo/web y push final pendientes |
| IVS-D06 | RC-05 rendimiento | Primer login publicado 22,553 s, media | Tiempo original conservado; sucesivas lecturas registradas | Abierto para diagnóstico; no se afirma causa |

Responsable de seguimiento: Hanssel. Ejecutor técnico nuevo: Codex autorizado. Fecha: 7/11/2026. Los commits/hashes finales se registran en el manifiesto y el release; la base sourceCommit de una ejecución no implica que incluya cambios locales posteriores. No se atribuye revisión de estos cambios a colaboradores que no la realizaron.

## Pendientes que requieren evidencia humana o acceso

- El bloqueo inicial de Computer Use se superó con ADB autorizado. El APK se instaló y se verificó: login por rol, logout ADMIN/CLIENT, recordar sesión tras reinicio, creación de #57, aceptación por API, asistencia UI, volver del diálogo sin mutar y cancelación/historial/horario libre. No se declara validación exhaustiva por plataforma.
- Integrantes y responsabilidades formales: I identifica Hanssel/Ruddy/Steven; cierre de Calidad identifica Hanssel. No modificar esa atribución por inferencia.
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

Los 5 puntos de defensa se trabajan aparte por instrucción del usuario. No se genera el PDF en esta fase.
