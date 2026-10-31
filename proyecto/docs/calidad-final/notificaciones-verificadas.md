# Evidencia visual de notificaciones y asistencia

Se inspeccionaron las cuatro imágenes originales de proyecto/entregas/Others/Notificaciones el 31/10/2026. El estudiante confirmó expresamente que el recordatorio llegó automáticamente. Esta afirmación se registra como testimonio del ejecutor; la recepción visible sí se comprueba directamente en la captura de la bandeja Android.

| ID | Imagen | Requisito | Observación verificada |
| --- | --- | --- | --- |
| NF-01 | notificaciones.jpg | RF-19 | Notificación de Barbería Cale en la bandeja Android, con solicitud de confirmar la cita del domingo 1 de noviembre a las 13:00. |
| NF-02 | antes de confirmar.jpg | RF-20 | La cita está aceptada y el cliente tiene disponible Confirmar asistencia. |
| NF-03 | asistencia confirmada.jpg | RF-20 | Aviso de operación exitosa y estado Asistencia confirmada para la misma fecha y hora visibles. |
| NF-04 | confirmacion desde cuenta admin.png | RF-21 | ADMIN muestra la cita #55 y el indicador Confirmó asistencia; la fecha y hora coinciden con las capturas del cliente. |


Resultado: recepción de push documentada, confirmación visible del cliente documentada y resultado visible en ADMIN documentado. Estas imágenes complementan la evidencia SENT de Supabase y las pruebas SQL de claim, revalidación, reintento y exclusión. No corresponde mantener una afirmación general de que no existe evidencia de recepción en el dispositivo.

Fuente e integridad: [notificaciones-visuales.json](../../../docs/evidencias_pruebas/parcial-iii/notificaciones-visuales.json) conserva rutas, SHA-256, resultados y límites. Los originales permanecen en la carpeta aportada por el estudiante; sus imágenes aún no se han incorporado al ZIP ni al PDF final. No se declara que el asistente ejecutó esos pasos ni que todos los requisitos se verificaron mediante una sola prueba.

## Alcance y metadatos por completar

Las imágenes no muestran SHA/build ni ID de job/ticket/receipt. La bandeja muestra sábado 31 de octubre, mientras la cita figura para domingo 1 de noviembre a las 13:00. Por eso no se utiliza esta secuencia, sin correlación adicional de reloj y ambiente, como prueba de la ventana automática de una hora definida en RF-19. El origen automático está respaldado por la declaración del estudiante; la recepción está respaldada por la imagen. La secuencia también muestra confirmación desde Mis citas, sin demostrar un clic de confirmación desde la propia notificación. Son límites de trazabilidad, no ausencia de recepción o de confirmación.
