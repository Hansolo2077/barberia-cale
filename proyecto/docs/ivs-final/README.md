> **Referencia actual:** [revisión final de observaciones y reproducción r3](revision-observaciones.md). Calendarios, web y RNF-01 actualizado; los cuerpos fechados anteriores se conservan como antecedentes.

> **RNF-01 vigente, revisión 1 (CR-RNF-01-20261107):** objetivo HTTP <1 segundo en condiciones normales, servicio activo; latencia inicial registrada aparte. Autorizado por Hanssel el 07/11/2026. Las 45 muestras activas cumplen el objetivo revisado; se preservan el antecedente de 500 ms y sus desviaciones. Ver [justificación, evaluación y seguimiento](revision-rnf-01.md).

# Preparación del expediente final de IVS

> Cierre funcional posterior, 07/11/2026: APK 1.0.1 comprobado nuevamente, 23 casos UI conformes; 27/27 integración reejecutados; 50 backend + 4 notificaciones + 3 seguridad de navegación. API pública identificada por SHA 51a6a28314452045d912d8f0940190a24c344bfb. Las cifras/pendientes del primer corte se conservan como antecedentes y quedan actualizados por [cierre funcional](cierre-funcional.md).


Este expediente técnico prepara el PDF de Implementación y Validación de Software, conforme a Guia_Entrega_Final_Proyecto_Integrador_IVS_2026. Corte de trabajo: 7 de noviembre de 2026, Guatemala. El PDF consolidado se entrega en la carpeta Parcial III; el video se prepara aparte.

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

Responsable de esta preparación: Hanssel, con asistencia de herramientas automatizadas. Las revisiones históricas de Ruddy y Steven conservan su atribución y alcance; no se les atribuye aprobación de cambios nuevos. La portada proporcionada identifica a Steven Rosales, Ruddy Galo y Hanssel Nuñez como integrantes de la entrega IVS.

Los resultados nuevos son del checkout local y sus huellas. La app instalada y los servicios publicados no se consideran actualizados por haber modificado el repositorio. No se incorporan contraseñas al expediente público.

Actualización de cierre: el APK release fue compilado, instalado y probado por ADB tras autorización del usuario. [interfaz-apk.json](../../../docs/evidencias_pruebas/ivs-2026-11-07/interfaz-apk.json) conserva once comprobaciones conformes y doce capturas públicas seleccionadas. Se comprobó una cita dummy de extremo a extremo, con aceptación por API ADMIN, asistencia y cancelación por UI, historial y horario liberado. Los bloqueos iniciales de Computer Use se resolvieron mediante ADB; permanecen sin probar WhatsApp, cron/push final, iOS y recorrido web.


## Actualización de seguridad 1.0.1

El cierre posterior del 07/11/2026 elimina las tres alertas altas de la cadena Expo Router/query-string/decoder: auditoría frontend actual 0 altas, 11 moderadas y 0 críticas; backend 0. Se mantienen los resultados del release 1.0.0 como antecedentes fechados, no como pruebas del nuevo binario. Véase [corrección, reproducción y límites](seguridad-frontend.md) y los [controles posteriores](../../../docs/evidencias_pruebas/ivs-2026-11-07/seguridad-frontend/controles.json). El nueva versión de entrega se identifica como v1.0.1-ivs.20261107; no se sustituye el release previo.

- [RNF-01: aclaración y medición publicada](rendimiento-publicado.md).
