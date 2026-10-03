# Alcance actual de Barbería Cale

Revisión: 3 de octubre de 2026. Sustituye como referencia vigente al alcance v1 conservado en el archivo documental.

## Objetivo y actores

Gestionar el ciclo de citas de una barbería desde Android y web: registro, reserva, gestión administrativa, seguimiento de asistencia y cierre. CLIENT administra sus propias citas; ADMIN procesa solicitudes, consulta la agenda y solicita recordatorios. Un planificador técnico procesa recordatorios mediante una Edge Function.

## Funcionalidades implementadas

- Registro de clientes, acceso por celular y contraseña, sesión persistente opcional, cierre de sesión y autorización JWT por rol.
- Disponibilidad entre 08:00 y 17:00 en bloques horarios. Se muestran también bloques bloqueados, que no pueden seleccionarse.
- Reserva con al menos 24 horas reales de anticipación, máximo una cita activa por cliente y día, máximo dos dentro de cualquier ventana móvil de siete días y prevención de colisiones.
- Próximas citas PENDING/ACCEPTED futuras. Historial con estados finales y citas vencidas pendientes de cierre administrativo.
- Cancelación del cliente hasta exactamente 60 minutos antes. Aceptación de solicitudes futuras, rechazo, cancelación administrativa de ACCEPTED futuras y cierre COMPLETED al llegar la hora de inicio.
- Búsqueda, filtros, paginación y agenda administrativa con rango máximo de 93 días.
- Confirmación de asistencia del propietario, independiente del estado operativo de la cita, y proyección administrativa de esa respuesta.
- Registro/desactivación de dispositivos push, recordatorios automáticos y cola persistente para recordatorios manuales individuales o masivos.
- Preparación de mensajes por WhatsApp para revisión y envío humano.

## Arquitectura y límites

Expo/React Native comparte el cliente Android y web. Express centraliza reglas y acceso a PostgreSQL/Supabase; la app no accede directamente a las tablas. El procesamiento asíncrono utiliza cron, Edge Function y RPC restringidas. Las configuraciones del proyecto apuntan a Render, Netlify y EAS; su existencia no demuestra por sí sola la disponibilidad de cada entorno.

La zona de negocio es `America/Managua`. La interfaz ofrece corte de cabello de 50 minutos y comienza turnos en horas enteras. No incluye pagos, facturación, múltiples barberos, catálogo dinámico, reprogramación directa, recuperación automática de contraseña, envío automático de WhatsApp ni web push. Los tickets aceptados por Expo no certifican entrega o lectura en el dispositivo.

## Cobertura de evidencia

El [banco del segundo parcial](../../docs/arquitectura-actual/Capturas_App_Segundo_Parcial.md) registra diez pruebas y sus capturas. Incluye creación, consulta, aceptación, rechazo, cancelación y validaciones. No demuestra cierre exitoso a COMPLETED, restauración tras reinicio ni entrega push efectiva. Implementación presente y ejecución validada son condiciones diferentes.

Consultar los [22 requisitos actuales](requisitos-actuales.md) y la [arquitectura con trazabilidad](arquitectura-actual/Arquitectura_y_Diseno_Actual_Barberia_Cale.md).
