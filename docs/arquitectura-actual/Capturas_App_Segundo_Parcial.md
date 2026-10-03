# Capturas de la app — Segundo Parcial

Capturas reales obtenidas del emulador Android el 3 de octubre de 2026. Este documento es un banco de evidencias para incorporar al documento final del Segundo Parcial; cada PNG conserva su resolución original de 1080 × 2280.

Los códigos RF corresponden a `docs/documentacion-archivada/proyecto/docs/requisitos-v1.md`. Algunas imágenes incluyen el botón de herramientas de Expo y un aviso de desarrollo de DateTimePicker; se conservan tal como fueron capturadas. No son prototipos ni imágenes recreadas.

## Pruebas listas para incorporar

| ID | Requisito | Acción realizada | Resultado esperado | Resultado obtenido | Estado | Capturas |
| --- | --- | --- | --- | --- | --- | --- |
| PR-01 | RF-02 | Entrar como ADMIN con credenciales válidas | Acceso al panel administrativo | Acceso permitido | Aprobada | 04 |
| PR-02 | RF-06 | Reservar para Mario el 04/10/2026 a las 10:00 | Crear cita pendiente | Cita #52 creada y consultada | Aprobada | 23, 25, 26 |
| PR-03 | RF-11 | Aceptar la cita #52 | Cambiar a confirmada | ADMIN y cliente recuperan el nuevo estado | Aprobada | 27, 29, 30, 35 |
| PR-04 | RF-02 | Intentar acceder sin celular ni contraseña | Mostrar errores y no iniciar sesión | Errores en ambos campos | Aprobada (negativa) | 02 |
| PR-05 | RF-09 | Cancelar #52 como cliente | Cerrar la cita y liberar horario | Sin próximas; cancelada en historial; horario disponible | Aprobada | 38–41 |
| PR-06 | RF-06 | Intentar otra reserva el día de #53 | Rechazar una segunda cita activa ese día | Mensaje de cita activa; sin nueva inserción | Aprobada (negativa) | 42 |
| PR-07 | RF-12 | Rechazar #53 como ADMIN | Cerrar solicitud | Rechazada y consultable en agenda | Aprobada | 43, 44, 54 |
| PR-08 | RF-01 | Registrar con celular existente | Impedir cuenta duplicada | Mensaje de celular registrado | Aprobada (negativa) | 48 |
| PR-09 | RF-01 | Registrar Evidencia Parcial | Crear cuenta y entrar como CLIENT | Panel Hola, Evidencia | Aprobada | 49, 50 |
| PR-10 | RF-14 | Cancelar #54 como ADMIN | Cancelar y liberar horario | Confirmación administrativa; cero activas de prueba | Aprobada | 51–53, 33, 34 |

## Banco de capturas

### 00. Bienvenida

Pantalla pública con acceso a crear cuenta e iniciar sesión.

Requisito: RF-01, RF-02.

![Bienvenida](capturas/00-estado-inicial.png)

### 01. Formulario de acceso

Ingreso por celular y contraseña, opción de mantener sesión y ayuda de acceso.

Requisito: RF-02, RF-03.

![Formulario de acceso](capturas/01-inicio-sesion.png)

### 02. Acceso: campos obligatorios

Al intentar entrar sin datos, la app solicita celular y contraseña. Prueba negativa aprobada.

Requisito: RF-02.

![Acceso: campos obligatorios](capturas/02-login-validacion-vacios.png)

### 04. Panel administrativo

Inicio del rol ADMIN con resumen de pendientes y próximas citas recuperado del sistema.

Requisito: RF-02, RF-10, RF-16.

![Panel administrativo](capturas/04-admin-panel.png)

### 05. Acciones administrativas

Accesos a gestionar citas, consultar la agenda y ver la guía de trabajo.

Requisito: RF-10, RF-13.

![Acciones administrativas](capturas/05-admin-acciones.png)

### 06. Panel del cliente

Inicio de Mario con acceso a reserva, próxima visita y servicio.

Requisito: RF-02, RF-07, RF-16.

![Panel del cliente](capturas/06-cliente-inicio.png)

### 07. Servicio y consulta de citas

Catálogo del corte de cabello, duración de 50 minutos y acceso a revisar citas.

Requisito: RF-05, RF-07.

![Servicio y consulta de citas](capturas/07-cliente-servicio.png)

### 08. Próximas citas: estado vacío

Consulta inicial sin próximas citas y acceso para agendar.

Requisito: RF-07.

![Próximas citas: estado vacío](capturas/08-cliente-proximas-vacias.png)

### 09. Historial recuperado

Consulta de 21 registros anteriores de Mario. La versión actual también muestra citas vencidas pendientes de cierre.

Requisito: RF-08.

![Historial recuperado](capturas/09-cliente-historial.png)

### 10. Historial: cita vencida

Detalle de una cita pasada con asistencia confirmada y aviso de cierre pendiente por la barbería.

Requisito: RF-08.

![Historial: cita vencida](capturas/10-cliente-historial-detalle.png)

### 11. Disponibilidad de horarios

Consulta del 4 de octubre: horarios habilitados y otros marcados como ocupados/no disponibles.

Requisito: RF-05.

![Disponibilidad de horarios](capturas/11-disponibilidad-horarios.png)

### 12. Reglas y fecha de reserva

Reglas visibles: 24 horas de anticipación, una cita activa por día, dos en siete días y cancelación hasta una hora antes.

Requisito: RF-05, RF-06, RF-09.

![Reglas y fecha de reserva](capturas/12-reserva-fecha.png)

### 13. Selector de fecha

Calendario nativo utilizado para seleccionar la fecha de la reserva.

Requisito: RF-05.

![Selector de fecha](capturas/13-selector-calendario.png)

### 14. Resumen antes de guardar

Servicio, fecha y hora seleccionados: 4 de octubre de 2026 a las 10:00; la solicitud requiere aceptación administrativa.

Requisito: RF-06.

![Resumen antes de guardar](capturas/14-reserva-resumen.png)

### 15. Menú del cliente

Identificación del rol Cliente y acción para cerrar sesión.

Requisito: RF-04, RF-16.

![Menú del cliente](capturas/15-menu-cliente.png)

### 16. Guía del flujo de trabajo

Ayuda integrada sobre solicitudes pendientes, aceptación, liberación del horario y cierre de citas. Material útil para capacitación.

Requisito: RF-10 a RF-15.

![Guía del flujo de trabajo](capturas/16-admin-guia.png)

### 17. Gestión de solicitudes

Resumen administrativo con solicitudes por revisar y advertencia de solicitudes vencidas.

Requisito: RF-10.

![Gestión de solicitudes](capturas/17-admin-gestion.png)

### 18. Búsqueda y filtros

Consulta administrativa por nombre, celular, fecha, hora o ID, con filtros de pendientes y confirmadas.

Requisito: RF-10.

![Búsqueda y filtros](capturas/18-admin-filtros.png)

### 19. Solicitud vencida

La app advierte que una solicitud pasada no puede aceptarse y ofrece rechazarla para cerrar el registro. No se modificó esta cita.

Requisito: RF-10, RF-11, RF-12.

![Solicitud vencida](capturas/19-admin-solicitud-detalle.png)

### 20. Agenda: períodos rápidos

Selección de hoy, mañana, siete días y rango personalizado.

Requisito: RF-13.

![Agenda: períodos rápidos](capturas/20-agenda-periodos.png)

### 21. Agenda: rango personalizado

Campos de fecha inicial y final, límite indicado de 93 días y botón de consulta.

Requisito: RF-13.

![Agenda: rango personalizado](capturas/21-agenda-rango.png)

### 22. Menú del administrador

Identificación del rol Administrador y acción de cierre de sesión.

Requisito: RF-04, RF-16.

![Menú del administrador](capturas/22-menu-administrador.png)

### 23. Reserva guardada correctamente

Mensaje Cita solicitada para Mario el 4 de octubre a las 10:00. Inicio de la prueba de inserción; cita #52.

Requisito: RF-06.

![Reserva guardada correctamente](capturas/23-cita-creada.png)

### 25. Consulta de la reserva pendiente

La cita recién creada aparece pendiente, con fecha, hora, plazo de cancelación y espera de aceptación.

Requisito: RF-06, RF-07, RF-09.

![Consulta de la reserva pendiente](capturas/25-reserva-pendiente-detalle.png)

### 26. Solicitud recibida por ADMIN

La misma cita #52 de Mario aparece pendiente en la gestión administrativa con acciones Aceptar y Rechazar.

Requisito: RF-10.

![Solicitud recibida por ADMIN](capturas/26-admin-nueva-solicitud.png)

### 27. Confirmación antes de aceptar

Diálogo que identifica cliente, servicio y horario antes de cambiar la cita a confirmada.

Requisito: RF-11.

![Confirmación antes de aceptar](capturas/27-confirmacion-aceptar.png)

### 28. Comunicación preparada

Texto contextual generado tras aceptar la cita, con opciones de abrir WhatsApp o copiar/compartir. No se envió ningún mensaje.

Requisito: RF-17.

![Comunicación preparada](capturas/28-mensaje-whatsapp-preparado.png)

### 29. Aceptación realizada

Resultado Cita confirmada; para la búsqueda aplicada quedan cero pendientes y una confirmada.

Requisito: RF-11.

![Aceptación realizada](capturas/29-aceptacion-exitosa.png)

### 30. Estado confirmado consultado

La cita #52 aparece en confirmadas con el mismo cliente, fecha y hora. Evidencia de actualización y consulta posterior.

Requisito: RF-10, RF-11.

![Estado confirmado consultado](capturas/30-admin-cita-confirmada.png)

### 31. Detalles de la cita

Datos de contacto y gestión de asistencia; para este cliente los recordatorios no están activados.

Requisito: RF-10.

![Detalles de la cita](capturas/31-admin-detalles-confirmada.png)

### 32. Reglas de gestión administrativa

Mensaje que impide completar una cita futura y acción para cancelarla antes de la visita.

Requisito: RF-14, RF-15.

![Reglas de gestión administrativa](capturas/32-admin-reglas-gestion.png)

### 33. Agenda: estado final de las pruebas

Consulta del 4 de octubre con tres registros y cero citas activas, una vez terminadas las pruebas.

Requisito: RF-13.

![Agenda: estado final de las pruebas](capturas/33-agenda-resumen-con-datos.png)

### 34. Agenda: cancelaciones almacenadas

Filtro Canceladas con dos resultados: Mario #52 y Evidencia Parcial #54.

Requisito: RF-09, RF-13, RF-14.

![Agenda: cancelaciones almacenadas](capturas/34-agenda-cancelaciones.png)

### 35. Actualización visible para el cliente

Después de entrar de nuevo como Mario, la próxima visita aparece confirmada: el cambio de ADMIN fue recuperado por el cliente.

Requisito: RF-02, RF-07, RF-11.

![Actualización visible para el cliente](capturas/35-cliente-confirmacion-recuperada.png)

### 36. Detalle y confirmación de asistencia

Cita aceptada con fecha, hora, plazo para cancelar y botón Confirmar asistencia.

Requisito: RF-07, RF-09; asistencia adicional.

![Detalle y confirmación de asistencia](capturas/36-cliente-confirmada-detalle.png)

### 37. Asistencia registrada

La app muestra Asistencia confirmada después de pulsar el botón correspondiente.

Requisito: Asistencia adicional a los RF de la versión 1.

![Asistencia registrada](capturas/37-asistencia-confirmada.png)

### 38. Confirmación de cancelación del cliente

Diálogo con fecha, hora, plazo de cancelación y aviso de liberación del horario.

Requisito: RF-09.

![Confirmación de cancelación del cliente](capturas/38-cancelacion-confirmacion.png)

### 39. Reserva retirada de próximas

Después de cancelar #52, Mario queda sin próximas citas y su historial pasa a 22 registros.

Requisito: RF-07, RF-08, RF-09.

![Reserva retirada de próximas](capturas/39-cancelacion-resultado.png)

### 40. Cancelación consultada en historial

La reserva del 4 de octubre a las 10:00 aparece con estado Cancelada en el historial.

Requisito: RF-08, RF-09.

![Cancelación consultada en historial](capturas/40-historial-cancelada.png)

### 41. Disponibilidad después de cancelar

El horario de las 10:00 vuelve a estar disponible tras cancelar #52.

Requisito: RF-05, RF-09.

![Disponibilidad después de cancelar](capturas/41-horario-liberado.png)

### 42. Rechazo de reserva repetida

Con la nueva cita #53 activa, otro intento de reserva para el mismo día es rechazado: Ya tienes una cita activa para este día.

Requisito: RF-06.

![Rechazo de reserva repetida](capturas/42-validacion-cita-duplicada.png)

### 43. Confirmación de rechazo administrativo

Diálogo para rechazar la cita de prueba #53 de Mario y liberar el horario.

Requisito: RF-12.

![Confirmación de rechazo administrativo](capturas/43-rechazo-confirmacion.png)

### 44. Rechazo realizado

Mensaje Cita rechazada y cierre de la solicitud; el horario vuelve a estar disponible.

Requisito: RF-12.

![Rechazo realizado](capturas/44-rechazo-resultado.png)

### 45. Registro de cliente

Formulario con nombre, apellido, celular y contraseña.

Requisito: RF-01.

![Registro de cliente](capturas/45-registro-encabezado.png)

### 46. Registro: seguridad y sesión

Confirmación de contraseña, indicación de longitud mínima, opción de conservar sesión y aviso sobre el uso del celular.

Requisito: RF-01, RF-03.

![Registro: seguridad y sesión](capturas/46-registro-contrasenas.png)

### 47. Registro: campos vacíos

La app solicita nombre, apellido y celular antes de permitir el registro.

Requisito: RF-01.

![Registro: campos vacíos](capturas/47-registro-validacion.png)

### 48. Registro: celular duplicado

El sistema rechaza crear otra cuenta con el celular existente de Mario. Evidencia de validación de unicidad desde la app.

Requisito: RF-01.

![Registro: celular duplicado](capturas/48-registro-celular-duplicado.png)

### 49. Cuenta de prueba preparada

Datos de Evidencia Parcial con celular 55501003 y contraseña enmascarada, antes de crear la cuenta.

Requisito: RF-01.

![Cuenta de prueba preparada](capturas/49-registro-datos-prueba.png)

### 50. Registro y acceso automático

Tras crear la cuenta, la app muestra Hola, Evidencia en el panel del cliente.

Requisito: RF-01, RF-16.

![Registro y acceso automático](capturas/50-registro-exitoso.png)

### 51. Restricción para completar una cita futura

La cita #54 solo podrá completarse después de la hora programada; la cancelación administrativa sí está disponible.

Requisito: RF-14, RF-15.

![Restricción para completar una cita futura](capturas/51-admin-restriccion-completar.png)

### 52. Confirmación de cancelación administrativa

ADMIN confirma la cancelación de Evidencia Parcial #54 para liberar el horario.

Requisito: RF-14.

![Confirmación de cancelación administrativa](capturas/52-admin-cancelacion-confirmacion.png)

### 53. Cancelación administrativa realizada

Mensaje que confirma la cancelación administrativa y liberación del horario; la búsqueda no tiene citas activas.

Requisito: RF-14.

![Cancelación administrativa realizada](capturas/53-admin-cancelacion-resultado.png)

### 54. Rechazo consultado en agenda

Consulta del registro rechazado de Mario #53 mediante el filtro Rechazadas.

Requisito: RF-12, RF-13.

![Rechazo consultado en agenda](capturas/54-agenda-rechazada.png)

### 55. Cierre de sesión

La aplicación vuelve al formulario de acceso después de cerrar la sesión administrativa.

Requisito: RF-04.

![Cierre de sesión](capturas/55-sesion-cerrada.png)

## Notas de cobertura

Estado final: #52 (Mario) cancelada por el cliente; #53 (Mario) rechazada por ADMIN; #54 (Evidencia Parcial) cancelada por ADMIN. Las tres estaban programadas para el 04/10/2026 a las 10:00 y se crearon sucesivamente al liberarse el horario. Queda la cuenta de prueba Evidencia Parcial, celular 55501003, sin citas activas. No se enviaron mensajes de WhatsApp.

Cobertura pendiente fuera de estas capturas: el cambio exitoso a COMPLETED no se ejecutó, porque las citas de prueba eran futuras; se capturó su restricción temporal (51). La persistencia de sesión entre reinicios y los rechazos de acceso a endpoints por rol no se probaron aquí. El assignment también requiere evidencias externas a la app: correcciones previas, arquitectura/modelo de datos, SQL y restricciones, repositorio/ramas/PR, migración y entornos. Las capturas de inserción, consulta y actualización muestran el resultado en la aplicación, pero no sustituyen la evidencia directa de la base de datos.
