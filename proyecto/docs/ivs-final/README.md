# Preparación del expediente final de IVS

Este expediente técnico prepara el PDF de Implementación y Validación de Software, conforme a Guia_Entrega_Final_Proyecto_Integrador_IVS_2026. Corte de trabajo: 7 de noviembre de 2026, Guatemala. El PDF y el video se preparan aparte.

| Registro | Uso |
| --- | --- |
| [Aceptación y trazabilidad](aceptacion-trazabilidad.md) | RF-01 a RF-22, criterios observables y casos con alcance explícito |
| [Correcciones IVS](correcciones-ivs.md) | Observaciones reales de I/II, evidencia y estado |
| [Usabilidad](usabilidad.md) | Cinco hallazgos, revisión de código, evidencia histórica y verificación pendiente |
| [Instalación y operación](instalacion-operacion.md) | Entornos, instalación desde cero, SQL, datos de prueba y administración |
| [Migración y recuperación](migracion-recuperacion.md) | Procedimiento de migración y ensayo ejecutado de restauración |
| [Manual y capacitación](manual-capacitacion.md) | Operación CLIENT/ADMIN, ejercicios y evaluación |
| [Plan de V&V](plan-vv.md) | Riesgos, técnicas, criterios, casos y tratamiento de defectos |
| [Informe de pruebas](informe-pruebas.md) | Resultados por grupo, recorrido del APK, capturas y límites |
| [Estado para generar PDF](estado-preparacion.md) | Cierres, limitaciones y datos que requieren confirmación humana |
| [Evidencias nuevas](../../../docs/evidencias_pruebas/ivs-2026-11-07/README.md) | Resultados originales; conservar fechas y límites |

Las fuentes de arquitectura y el modelo ER están en [arquitectura actual](../arquitectura-actual/Arquitectura_y_Diseno_Actual_Barberia_Cale.md). El [diccionario verificado](../../../docs/evidencias_pruebas/ivs-2026-11-07/diccionario.md) se genera desde el esquema real reconstruido con sus cuatro migraciones.

Responsable de esta preparación: Hanssel, con asistencia de Codex. Las revisiones históricas de Ruddy y Steven conservan su atribución y alcance; no se les atribuye aprobación de cambios nuevos. La composición formal de la entrega está por confirmar. Los tres figuran en la evaluación de I; el documento de Calidad identifica a Hanssel.

Los resultados nuevos son del checkout local y sus huellas. La app instalada y los servicios publicados no se consideran actualizados por haber modificado el repositorio. No se incorporan contraseñas al expediente público.

Actualización de cierre: el APK release fue compilado, instalado y probado por ADB tras autorización del usuario. [interfaz-apk.json](../../../docs/evidencias_pruebas/ivs-2026-11-07/interfaz-apk.json) conserva once comprobaciones conformes y doce capturas públicas seleccionadas. Se comprobó una cita dummy de extremo a extremo, con aceptación por API ADMIN, asistencia y cancelación por UI, historial y horario liberado. Los bloqueos iniciales de Computer Use se resolvieron mediante ADB; permanecen sin probar WhatsApp, cron/push final, iOS y recorrido web.
