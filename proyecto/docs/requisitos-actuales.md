# Requisitos funcionales actuales

Revisión: 3 de octubre de 2026. Línea base RF-01 a RF-22 contrastada con el código de la revisión ad017f1. Sustituye a requisitos-v1.md, conservado en la documentación archivada.

| Código | Comportamiento implementado |
| --- | --- |
| RF-01 | El sistema permitirá crear una cuenta `CLIENT` con nombre, apellido, celular y contraseña, solicitará confirmación de contraseña, validará el celular y, tras un registro exitoso, iniciará la sesión automáticamente. |
| RF-02 | El sistema autenticará mediante celular y contraseña y dirigirá al usuario al área correspondiente según su rol. |
| RF-03 | El sistema permitirá conservar opcionalmente el token y los datos públicos necesarios para restaurar y validar una sesión. |
| RF-04 | El sistema permitirá finalizar la sesión, limpiar los datos locales de autenticación, intentar desactivar el dispositivo de notificaciones y regresar al acceso público. |
| RF-05 | El cliente podrá consultar horarios disponibles para una fecha válida; se muestran bloques disponibles y bloqueados, pero solo se habilitan los que cumplen al menos 24 horas reales de anticipación y no tienen una cita activa que los bloquee. |
| RF-06 | El cliente podrá reservar un horario disponible con estado inicial `PENDING`; el backend impedirá la doble reserva, más de una cita activa del cliente en el mismo día y más de dos citas activas en una ventana móvil de siete días. |
| RF-07 | El cliente podrá consultar sus citas futuras `PENDING` y `ACCEPTED`, ordenadas por fecha y hora ascendente. |
| RF-08 | El cliente podrá consultar el historial de citas `COMPLETED`, `REJECTED` y `CANCELLED`, además de citas vencidas `PENDING` o `ACCEPTED` pendientes de cierre administrativo. |
| RF-09 | El cliente podrá cancelar una cita propia activa hasta exactamente 60 minutos antes de su inicio; la cita cancelada dejará de bloquear el horario. |
| RF-10 | El administrador podrá consultar, buscar, paginar y filtrar solicitudes/citas para su gestión. |
| RF-11 | El administrador podrá cambiar una solicitud `PENDING` futura a `ACCEPTED`; una solicitud cuya hora ya pasó no puede aceptarse. |
| RF-12 | El administrador podrá cambiar una solicitud `PENDING` a `REJECTED`, liberando el horario. |
| RF-13 | El administrador podrá consultar una agenda por rango de fechas y filtrar por estados aplicables. |
| RF-14 | El administrador podrá cancelar administrativamente una cita `ACCEPTED` futura cuando la regla temporal lo permita, liberando el horario. |
| RF-15 | El administrador podrá cambiar una cita `ACCEPTED` a `COMPLETED` cuando su fecha y hora hayan llegado o pasado. |
| RF-16 | El sistema protegerá pantallas y endpoints y permitirá funciones de `CLIENT` o `ADMIN` únicamente al rol autorizado. |
| RF-17 | Después de aceptar o rechazar una cita, el administrador podrá abrir el chat del cliente con un mensaje contextual preparado para revisión y envío manual. |
| RF-18 | Un cliente autenticado podrá autorizar notificaciones y registrar o desactivar de forma idempotente el token push de su dispositivo. |
| RF-19 | El sistema preparará y enviará un recordatorio automático a las citas `ACCEPTED`, futuras, sin confirmación de asistencia y dentro de la ventana de una hora, siempre que exista un dispositivo activo. |
| RF-20 | El cliente podrá confirmar su asistencia desde la notificación o desde “Mis citas” mientras la cita siga `ACCEPTED` y no haya iniciado; repetir la operación conserva la primera confirmación sin duplicar efectos. |
| RF-21 | El administrador podrá distinguir de forma legible si el cliente confirmó, está pendiente o no respondió, sin confundir ese dato con el estado operativo de la cita. |
| RF-22 | El administrador podrá solicitar recordatorios para una cita elegible o en lote para todas las elegibles; cada solicitud manual será persistente, auditable, limitada, protegida contra duplicados y reintentable. |

## Trazabilidad y validación

La [matriz de trazabilidad](arquitectura-actual/Arquitectura_y_Diseno_Actual_Barberia_Cale.md#14-matriz-de-trazabilidad-completa) relaciona cada requisito con interfaz, módulos, endpoint y datos. Las reglas se implementan principalmente en backend/src/services/appointment.service.js; los filtros de próximas e historial están en src/app/client/my-appointments.tsx.

El [banco de evidencias](../../docs/arquitectura-actual/Capturas_App_Segundo_Parcial.md) documenta qué flujos fueron ejecutados. Un requisito descrito como implementado no implica que tenga una prueba integral aprobada: permanecen pendientes en ese banco el cierre exitoso a COMPLETED, la restauración de sesión tras reinicio, rechazos de endpoints por rol y la entrega efectiva de push.

[Alcance actual](alcance-actual.md) · [Índice documental](README.md) · [Versiones anteriores](../../docs/documentacion-archivada/README.md)
