> **RNF-01 vigente, revisión 1 (CR-RNF-01-20261107):** objetivo HTTP <1 segundo en condiciones normales, servicio activo; latencia inicial registrada aparte. Autorizado por Hanssel el 07/11/2026. Las 45 muestras activas cumplen el objetivo revisado; se preservan el antecedente de 500 ms y sus desviaciones. Ver [justificación, evaluación y seguimiento](revision-rnf-01.md).

# Aceptación y trazabilidad final de IVS

> Cierre funcional posterior, 07/11/2026: APK 1.0.1 comprobado nuevamente, 23 casos UI conformes; 27/27 integración reejecutados; 50 backend + 4 notificaciones + 3 seguridad de navegación. API pública identificada por SHA 51a6a28314452045d912d8f0940190a24c344bfb. Las cifras/pendientes del primer corte se conservan como antecedentes y quedan actualizados por [cierre funcional](cierre-funcional.md).


Los códigos RF se conservan desde el Hito 1 ampliado. RF-18 a RF-22 ya estaban descritos en el Hito I entregado y están formalizados en requisitos-actuales.md; no se presentan como cinco funciones nuevas de noviembre. El cierre añade verificaciones, recuperación y documentación. Las exclusiones siguen siendo pagos, inventario, múltiples sucursales, selección de barbero, recuperación automática de clave, web push y validación equivalente de iOS.

El recorrido interfaz → componente → endpoint → datos está en la sección 14 de [arquitectura](../arquitectura-actual/Arquitectura_y_Diseno_Actual_Barberia_Cale.md). Esta tabla añade aceptación y evidencia. PF corresponde a regresion-final.json del corte IVS; capturas históricas son del 03/10 y NF del 31/10. Las once comprobaciones UI nuevas están en interfaz-apk.json y complementan esta matriz como se indica después.

| RF | Criterio observable de aceptación | Caso/evidencia | Estado de verificación |
| --- | --- | --- | --- |
| RF-01 | Registro válido devuelve 201, rol CLIENT y token; duplicado devuelve 409; no se devuelve hash | PF-01/02; capturas 47–50 | API/BD conforme; UI histórica |
| RF-02 | Credenciales válidas autentican y redirigen por rol; inválidas se rechazan; campos vacíos no avanzan | PF-03/24; IVS-LOGIN; UI-01/03 | API y redirección por rol conformes en APK |
| RF-03 | Al recordar sesión, reiniciar recupera identidad y revalida token; sin recordar no persiste | UI-04; PF-24 valida /me | Recordar=true y reinicio conformes; variante false pendiente |
| RF-04 | Cerrar sesión limpia identidad/token local, intenta desactivar dispositivo y vuelve al acceso público | UI-02/11 | Logout ambos roles y reinicio CLIENT sin identidad conformes |
| RF-05 | Fecha válida muestra diez bloques; solo anticipación y ocupación elegibles permiten seleccionar | PF-05/11; UI-05 | API/BD y selección/bloqueo UI conformes para caso probado |
| RF-06 | Reserva válida devuelve 201/PENDING; conflicto concurrente 201/409 con una activa; límites diario/semanal se rechazan | PF-06/07/08/12/13/26 | Conforme para escenarios ejecutados |
| RF-07 | Próximas muestra solo PENDING/ACCEPTED futuros, orden ascendente y datos del propietario | UI-06/07/10; PF-06 | Una cita futura y eliminación tras cancelar comprobadas; orden múltiple pendiente |
| RF-08 | Historial muestra estados cerrados y activos vencidos; cancelación permanece visible | PF-11; UI-10 | Cita #57 cancelada visible en historial; resto de variantes no exhaustivas |
| RF-09 | Solo propietario cancela activa con al menos 60 minutos; libera horario; confirmación permite volver sin mutar | PF-10/11/25/27; UI-09/10 | API, límite exacto y diálogo UI conformes en selección ejecutada |
| RF-10 | ADMIN consulta/busca/pagina; CLIENT y no autenticado reciben rechazo | PF-04/16; capturas 18/26 | API parcial: búsqueda/paginación UI final pendiente |
| RF-11 | Solo PENDING futura pasa a ACCEPTED; CLIENT recupera estado | PF-09; UI-07 | Aceptación API y recuperación UI CLIENT conformes; botón ADMIN final no probado |
| RF-12 | PENDING pasa a REJECTED y deja de bloquear | PF-14; capturas 43/44 | Conforme en caso ejecutado |
| RF-13 | Rango válido devuelve agenda y filtro; invertido se rechaza | PF-16; capturas 20/21/34 | API conforme; rango máximo exacto pendiente |
| RF-14 | ADMIN cancela ACCEPTED futura y libera horario; estados no elegibles se rechazan | PF-15; capturas 51–54 | Conforme en selección ejecutada |
| RF-15 | ADMIN completa ACCEPTED solo si llegó/pasó la hora; futura rechazada | PF-15 | API/BD conforme; cierre desde UI final pendiente |
| RF-16 | Sin token/inválido 401; rol incorrecto 403; otro cliente no altera cita ajena | PF-04/10/22/24; IVS-ROLE | Conforme para endpoints ejecutados; rutas UI pendientes |
| RF-17 | Tras aceptar/rechazar, abre WhatsApp con destinatario y mensaje contextual; usuario decide envío | UI-P04; captura 28 | Mensaje preparado histórico; no se realiza envío real de prueba |
| RF-18 | Registrar dispositivo repetido no duplica; solo propietario puede desactivarlo | PF-17 | API/BD conforme; permiso Android final pendiente |
| RF-19 | Worker reclama elegible una sola vez, revalida y marca; recepción visible se documenta separadamente | PF-21; NF-01 | SQL y recepción histórica; correlación build/job pendiente |
| RF-20 | CLIENT confirma ACCEPTED futura; repetir conserva primera fecha; pendientes se invalidan | PF-09/20; UI-08; NF-02/03 | Mis citas del APK y persistencia conformes; vía notificación final pendiente |
| RF-21 | ADMIN distingue estado de cita y asistencia y recupera la confirmación | PF-09; NF-04 | API y UI histórica; UI final pendiente |
| RF-22 | Solicitud manual es auditable; simultáneas no duplican; claim ajeno rechazado y fallo reintenta | PF-18/19/20 | SQL/servicio conforme; proveedor externo no contactado |

Los requisitos no funcionales conservan los RC del [plan previo](../calidad-final/plan-calidad-final.md): autorización, hash, integridad, concurrencia, respuesta visible, usabilidad, accesibilidad, controles técnicos, plataformas, persistencia y recordatorios. Su estado se evalúa por evidencia específica. p95 HTTP no sustituye respuesta visual; la compilación no prueba usabilidad; la restauración sintética no es restauración de producción.

## Actualización con el APK final

La tabla anterior conserva el alcance base de campaña API y antecedentes. El bloqueo inicial de interfaz fue superado por ADB autorizado. La siguiente evidencia actualiza las filas correspondientes; no declara aprobados los escenarios que quedan fuera.

| RF | Evidencia nueva del APK | Estado actualizado |
| --- | --- | --- |
| RF-02/16 | UI-01/03: acceso ADMIN y CLIENT al área correcta | Conforme para acceso; endpoints negativos también PF/IVS-ROLE |
| RF-03 | UI-04: recordar=true, force-stop y nuevo arranque recupera CLIENT | Conforme en esa variante; recordar=false pendiente |
| RF-04 | UI-02/11: logout ADMIN/CLIENT; reinicio CLIENT sin identidad | Conforme para variantes ejecutadas |
| RF-05 | UI-05: bloque deshabilitado no avanza; bloque elegible muestra resumen | Conforme para selección observada |
| RF-06/07 | UI-06 y recorrido-cita.json: creación UI de #57, API devuelve PENDING y Próximas muestra una | Conforme en recorrido único; orden múltiple no ensayado |
| RF-08/09 | UI-09/10: Volver conserva ACCEPTED; cancelar pasa a historial y libera horario | Conforme UI/API para caso probado; PF-27 también prueba el límite exacto inclusivo |
| RF-11 | UI-07: aceptación por API ADMIN se recupera como Confirmada en CLIENT | Integración conforme; no se atribuye a botón ADMIN |
| RF-20 | UI-08 y API: asistencia CONFIRMED tras pulsar en Mis citas | Conforme en Mis citas; vía notificación final pendiente |

RF-17 y la campaña final de notificaciones conservan sus pendientes. La matriz completa debe enlazar estos resultados y el tag de la versión de entrega en el PDF; UI-P detalla las variantes no ejecutadas.

Para cerrar una fila: requisito → criterio anterior → caso → resultado original → ruta/huella → versión de entrega. Conservar FAIL/BLOCKED y riesgos residuales; no convertir 27/27 escenarios en cobertura completa de RF o de código.
