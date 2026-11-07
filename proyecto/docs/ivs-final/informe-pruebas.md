# Resultados de verificación y validación

> Cierre funcional posterior, 07/11/2026: APK 1.0.1 comprobado nuevamente, 23 casos UI conformes; 27/27 integración reejecutados; 50 backend + 4 notificaciones + 3 seguridad de navegación. API pública identificada por SHA 51a6a28314452045d912d8f0940190a24c344bfb. Las cifras/pendientes del primer corte se conservan como antecedentes y quedan actualizados por [cierre funcional](cierre-funcional.md).


> Estado actual 1.0.1: 0 alertas altas y 11 moderadas frontend; backend 0. Las cifras 3 altas y el APK 1.0.0 de las secciones originales son antecedentes del primer corte. Véase [cierre de seguridad](seguridad-frontend.md) y [nuevo release](notas-release-1.0.1.md).

Corte: 7/11/2026. Ejecutor técnico: Codex con autorización de Hanssel. Cada grupo mantiene su ambiente y método; no se suman como cobertura total ni como escenarios independientes cuando se repiten.

| Grupo | Ejecutadas | Aprobadas | Fallidas | Alcance |
| --- | --- | --- | --- | --- |
| Backend automatizado | 48 | 48 | 0 | Suites Node con casos de controladores, servicios, middleware y utilidades |
| Notificaciones frontend automatizadas | 4 | 4 | 0 | Registro de dispositivo y eventos; no es entrega física de push |
| Integración inicial HTTP/PostgreSQL | 23 | 23 | 0 | Reejecución de campaña previa en esquemas efímeros |
| Integración ampliada | 26 | 26 | 0 | Sesión API, límites alrededor de 60 minutos y rollback |
| Regresión final HTTP/PostgreSQL | 27 | 27 | 0 | Incluye límite exacto inclusivo con NOW transaccional real |
| Restauración de datos sintéticos | 4 | 4 | 0 | Archivo exportado/leído, reconstrucción e importación, igualdad, FK y secuencias |
| Despliegue API por roles | 10 | 10 | 0 | Login, identidad, permisos y consultas; sin mutaciones de negocio |
| Protocolo manual del APK | 11 | 11 | 0 | Arranque, roles, sesión/reinicio, reserva, asistencia, cancelación e historial |

TypeScript, ESLint, Expo install --check, exportación web de doce rutas y assembleRelease: conformes. Auditoría npm frontend no conforme: tres altas y once moderadas, sin críticas; backend cero. La campaña de pruebas aprobada no anula esos hallazgos.

## Recorrido reproducido en el APK

APK SHA-256: 1f5a47c47b7f02507228fc681c74e8a36e11f4105b6b4739df27d0f10b2c9faf. Paquete com.hanssel957.barberiacale, versión 1.0.0, Android emulado 1080×2280. Se verificó por separado Expo Go; sus capturas no se presentan como APK.

CLIENT ingresó con recordar activado y conservó la sesión después de force-stop y nuevo arranque. Desde Agendar se comprobó un bloque no seleccionable y se creó la cita #57 para 8/11/2026 10:00. La consulta API propia confirmó PENDING y Próximas mostró una cita. ADMIN la aceptó mediante API; la interfaz CLIENT recuperó Confirmada. CLIENT confirmó asistencia desde Mis citas y la API devolvió CONFIRMED.

El diálogo de cancelación mostró Volver y Sí, cancelar. Volver mantuvo ACCEPTED/CONFIRMED. Al confirmar la cancelación, Próximas pasó a cero, Historial mostró Cancelada y la consulta de disponibilidad confirmó el bloque libre. El registro quedó CANCELLED, sin borrar el historial. No se enviaron mensajes de WhatsApp ni recordatorios manuales. Finalmente CLIENT cerró sesión y el reinicio mostró acceso público; ADMIN también había cerrado sesión correctamente.

Fuentes originales: [interfaz-apk.json](../../../docs/evidencias_pruebas/ivs-2026-11-07/interfaz-apk.json), [recorrido-cita.json](../../../docs/evidencias_pruebas/ivs-2026-11-07/recorrido-cita.json) y [capturas](../../../docs/evidencias_pruebas/ivs-2026-11-07/capturas/). Los originales XML y capturas no seleccionadas permanecen privados; el reporte conserva huellas y confirma paquete/fecha.

## Rendimiento y límites

La regresión local con PostgreSQL remoto obtuvo p95 de 165,491 ms en login, 413,773 ms en disponibilidad y 262,846 ms en mis citas, con quince muestras seriales por flujo. Es HTTP completo hasta JSON, no feedback visual ni carga concurrente sostenida. El primer login observado en el servicio publicado tardó 22,553 segundos; causa no identificada. Health respondió seis veces en una ventana breve; no demuestra disponibilidad mensual ni SLA.

No se ejecutaron de forma integral: iOS, recorrido web, nueva recepción cron/push vinculada a este build, WhatsApp, COMPLETED desde UI, recordar=false tras reinicio y orden/filtros exhaustivos con múltiples registros. Tampoco hay respuestas SUS ni aprobación de usuarios del negocio. Estos escenarios están no ejecutados, no se incluyen en el denominador de las once comprobaciones manuales, y no se declaran fallos funcionales sin haberlos probado.

La decisión continúa siendo piloto controlado. Los defectos y riesgos residuales se mantienen en estado-preparacion.md, con responsables y evidencia; el PDF debe conservarlos.


## Actualización de seguridad 1.0.1

El cierre posterior del 07/11/2026 elimina las tres alertas altas de la cadena Expo Router/query-string/decoder: auditoría frontend actual 0 altas, 11 moderadas y 0 críticas; backend 0. Se mantienen los resultados del release 1.0.0 como antecedentes fechados, no como pruebas del nuevo binario. Véase [corrección, reproducción y límites](seguridad-frontend.md) y los [controles posteriores](../../../docs/evidencias_pruebas/ivs-2026-11-07/seguridad-frontend/controles.json). El nuevo candidato se identifica como v1.0.1-ivs.20261107; no se sustituye el release previo.
