# Manual de operación y capacitación

> Cierre funcional posterior, 07/11/2026: APK 1.0.1 comprobado nuevamente, 23 casos UI conformes; 27/27 integración reejecutados; 50 backend + 4 notificaciones + 3 seguridad de navegación. API pública identificada por SHA 51a6a28314452045d912d8f0940190a24c344bfb. Las cifras/pendientes del primer corte se conservan como antecedentes y quedan actualizados por [cierre funcional](cierre-funcional.md).


Este material corresponde a CLIENT y ADMIN de Barbería Cale. Las pantallas de referencia están en [capturas de la app](../../../docs/arquitectura-actual/Capturas_App_Segundo_Parcial.md). Son capturas históricas identificadas; la preparación de este manual no implica que se haya impartido una capacitación o aprobado una evaluación de usuarios.

## Cliente

1. Abre la aplicación o web. Crea una cuenta con nombre, apellido, celular de ocho dígitos iniciado en 8, 7 o 5 y contraseña confirmada, o inicia sesión con una cuenta existente. Marca recordar sesión solo en un dispositivo personal.
2. En Agendar cita elige fecha, consulta horarios y selecciona un bloque habilitado. Revisa fecha, hora y servicio antes de guardar. Debe haber 24 horas reales de anticipación; máximo una cita activa diaria y dos dentro de siete días.
3. Una solicitud creada aparece PENDING. Espera la aceptación de la barbería; no confundas solicitud enviada con cita aceptada.
4. Consulta Próximas citas para ver activas futuras y Historial para consultar cerradas o vencidas. Actualiza si el administrador acaba de cambiar el estado.
5. Para cancelar, abre la cita y revisa el plazo. Puedes cancelar hasta 60 minutos antes. El diálogo permite volver sin cancelar; confirma únicamente si deseas liberar el horario.
6. Si la cita está aceptada y aún no empieza, confirma asistencia desde Mis citas. Esa confirmación avisa que asistirás; no marca el servicio como completado.
7. Las notificaciones requieren Android y autorización. Una notificación no recibida no anula la cita: consulta Mis citas. No hay web push validado.
8. Cierra sesión desde el menú al terminar en un equipo compartido. Si aparece error de conexión, conserva el mensaje y reintenta; antes de volver a reservar comprueba si la primera solicitud ya figura para evitar repetirla.

Referencias: acceso/validación 01–02 y 45–50; reserva 07–14 y 23–25; consulta 08–10 y 35–36; cancelación 38–41; asistencia 37 y NF-02/03; logout 55.

## Administración

1. Inicia sesión con una cuenta ADMIN asignada por el responsable del entorno. No uses credenciales operativas en materiales de capacitación.
2. En solicitudes consulta estados, busca una cita/cliente y abre detalles. Comprueba servicio, fecha y hora antes de actuar.
3. Acepta una solicitud PENDING futura o recházala si no procede. El rechazo libera el horario. La aplicación puede preparar WhatsApp: revisa destinatario y texto; el envío es manual y no se presupone realizado.
4. Usa Agenda para rango y estados; confirma el rango activo tras una operación. Las fechas deben estar ordenadas y el rango admite hasta 93 días.
5. Cancela administrativamente solo una ACCEPTED futura cuando proceda. Para COMPLETED, el inicio debe haber llegado o pasado. No uses completar como confirmación de asistencia.
6. Revisa por separado el indicador de asistencia. Para un recordatorio manual comprueba elegibilidad y dispositivo activo. No pulses repetidamente: los trabajos se persisten y pueden estar en cola.
7. Ante una incidencia registra hora, pantalla, acción, identificador de prueba y mensaje, sin contraseña ni token. No borres datos para ocultar un fallo.

Referencias: panel/gestión 04–05 y 18–19/26; aceptar 27–31; ayuda 16/32; agenda 20–21/34; restricción y cancelación 51–54; NF-04 para asistencia.

## Plan de capacitación

Responsable de preparar y facilitar: Hanssel. Participantes y fecha real: por coordinar con la barbería. Duración propuesta: 25 minutos por rol, ajustable según resultado. Entorno: sandbox con datos sintéticos; no generar reservas operativas ni enviar mensajes reales durante ejercicios.

| Módulo | Objetivo observable | Material | Ejercicio y comprobación |
| --- | --- | --- | --- |
| M1 Acceso y sesión, 5 min | Iniciar sesión en el rol correcto y salir | Manual; capturas 01/02/55 | Ingresar, identificar rol, salir y comprobar retorno al acceso |
| M2 Reserva y validación, 5 min | Crear una solicitud válida y explicar por qué un bloque no se habilita | Capturas 11–14/23–25 | Elegir fecha/horario y comprobar PENDING; rechazar un dato inválido sin duplicar |
| M3 Consulta y cancelación, 5 min | Encontrar cita y volver del diálogo sin cancelarla | Capturas 35–41 | Consultar próxima; volver de confirmación; cancelar solo fixture autorizado y comprobar historial/liberación |
| M4 Gestión administrativa, 5 min | Aceptar/rechazar y distinguir asistencia de COMPLETED | Capturas 27–32/51–54; NF-04 | ADMIN acepta fixture; CLIENT confirma asistencia; ADMIN identifica ambos estados |
| M5 Incidencias y seguridad, 5 min | Registrar un fallo útil sin datos secretos | Plantilla siguiente | Describir error simulado, entorno, pasos y resultado; no incluir contraseña |

La capacitación se considera aprobada cuando el participante completa sin ayuda las tareas críticas de su rol, distingue solicitud/aceptación/asistencia/servicio completado y registra correctamente una incidencia. Si falla, repetir módulo y registrar reevaluación. No existe resultado real de esta capacitación todavía.

## Registro de aprendizaje y retroalimentación

| Fecha | Participante o código consentido | Rol | Módulo | Tarea | Resultado observado | Ayuda requerida | Comentario | Reevaluación |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

La tabla vacía es un instrumento preparado. No representa asistencia ni satisfacción medida. Para piloto: registrar por período usuarios activos de prueba/negocio de forma agregada, citas creadas/gestionadas, incidencias con ID y comentarios consentidos; separar datos sintéticos de operación real.
