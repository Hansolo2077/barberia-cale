# Requisitos funcionales — Versión 1

| Código | Requisito | Descripción |
| --- | --- | --- |
| RF-01 | Registrar cliente | El sistema permitirá crear una cuenta CLIENT con nombre, apellido, celular y contraseña. El formulario solicitará confirmación de contraseña y, tras un registro exitoso, iniciará la sesión del cliente automáticamente. |
| RF-02 | Iniciar sesión | El sistema autenticará al usuario mediante celular y contraseña y lo dirigirá al área correspondiente según su rol. |
| RF-03 | Mantener sesión | El sistema permitirá conservar de forma opcional el token y los datos públicos necesarios para restaurar la sesión. |
| RF-04 | Cerrar sesión | El sistema permitirá finalizar la sesión, eliminar los datos locales de autenticación y regresar al acceso público. |
| RF-05 | Consultar disponibilidad | El cliente podrá consultar horarios disponibles para una fecha válida. Solo se ofrecerán horarios que cumplan la anticipación mínima real de 24 horas y que no estén bloqueados por una cita activa. |
| RF-06 | Crear cita | El cliente podrá reservar un horario disponible con estado inicial PENDING. El backend impedirá doble reserva, más de una cita activa del cliente en el mismo día y más de dos citas activas dentro de la ventana móvil de siete días. |
| RF-07 | Ver próximas citas | El cliente podrá consultar sus citas activas PENDING y ACCEPTED. |
| RF-08 | Ver historial | El cliente podrá consultar sus citas COMPLETED, REJECTED y CANCELLED. |
| RF-09 | Cancelar cita como cliente | El cliente podrá cancelar una cita propia activa dentro de la ventana temporal definida. Una cita cancelada dejará de bloquear el horario. |
| RF-10 | Consultar y filtrar solicitudes | El administrador podrá consultar las solicitudes/citas y filtrarlas por estado para su gestión. |
| RF-11 | Aceptar cita | El administrador podrá cambiar una solicitud PENDING a ACCEPTED. |
| RF-12 | Rechazar cita | El administrador podrá cambiar una solicitud PENDING a REJECTED; el horario dejará de bloquearse y podrá volver a mostrarse como disponible. |
| RF-13 | Consultar agenda administrativa | El administrador podrá consultar citas por rango de fechas y filtrar la agenda por estado. |
| RF-14 | Cancelar cita administrativamente | El administrador podrá cancelar una cita ACCEPTED futura cuando la regla temporal lo permita; el horario será liberado. |
| RF-15 | Completar cita | El administrador podrá cambiar una cita ACCEPTED a COMPLETED cuando su fecha y hora hayan llegado o pasado. |
| RF-16 | Controlar acceso por rol | El sistema protegerá pantallas y endpoints y permitirá acceso a funciones de CLIENT o ADMIN únicamente al rol autorizado. |
| RF-17 | Preparar comunicación por WhatsApp | Después de aceptar o rechazar una cita, el administrador podrá abrir el chat del cliente con un mensaje contextual preparado para revisión y envío manual. |
