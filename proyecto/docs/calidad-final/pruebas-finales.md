# Campaña final de pruebas y regresión

Ejecución inicial: 2026-10-31T17:13:34.908Z. Regresión: 2026-10-31T17:19:24.230Z. Entorno: HTTP Express local, rutas/controladores/middleware/servicios reales y PostgreSQL 17.6 remoto con esquemas efímeros. El código SQL del esquema y las cuatro migraciones se ejecuta reemplazando solo los nombres de esquema; no se modifica public ni reminder_api de la aplicación. Se omite NOTIFY pgrst para no recargar servicios reales. Limpieza: true.

Los usuarios y citas son sintéticos. El JWT de prueba usa un secreto aleatorio distinto del entorno publicado. Algunos estados pasados y ventanas de recordatorio se preparan directamente como fixtures SQL para no esperar horas; esos preparativos no son operaciones válidas del usuario. Los tokens push son sintéticos y no se contacta Expo. La marca SENT probada es persistencia interna, no entrega física.

| ID | RF/RC | Caso | Pasos | Esperado | Obtenido | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| PF-01 | RF-01, RC-02 | Registro y hash sin exponer credenciales | POST /auth/register con datos sinteticos; Comprobar hash bcrypt y respuesta publica | 201, rol CLIENT, hash distinto de la clave y ausencia de password_hash en respuesta | {"http":201,"role":"CLIENT","bcryptVerified":true,"secretReturned":false} | PASS |
| PF-02 | RF-01 | Rechazo de registro duplicado | Repetir celular sintetico PF-01 | 409 y una sola cuenta | {"http":409} | PASS |
| PF-03 | RF-02 | Login invalido y campos vacios | Enviar cuerpo vacio; Enviar clave incorrecta | 400 y 401 respectivamente | {"empty":400,"invalid":401} | PASS |
| PF-04 | RF-16, RC-01 | Autorizacion HTTP por rol y token | GET /admin/appointments sin token, token invalido, CLIENT y ADMIN; GET /appointments/my con ADMIN | 401,401,403,200 y 403; sin mutaciones | {"statuses":[401,401,403,200,403]} | PASS |
| PF-05 | RF-05 | Disponibilidad y fecha invalida | Consultar fecha futura valida; Consultar 2026-02-30 | 200 con bloques y 400 para fecha imposible | {"valid":200,"slots":10,"invalid":400} | PASS |
| PF-06 | RF-06, RC-03 | Reserva valida y consulta persistida | Crear cita futura 08:00; GET /appointments/my y SELECT por ID | 201 PENDING, mismo ID recuperado | {"http":201,"state":"PENDING","recovered":true} | PASS |
| PF-07 | RF-06, RC-03 | Limite de una cita activa diaria | Reservar otra hora el mismo dia para PF-06 | 409 y una cita activa | {"http":409,"active":1} | PASS |
| PF-08 | RF-06, RC-03 | Anticipacion y servicio invalido | Reservar fecha pasada; Enviar servicio fuera del catalogo | 400 en ambos casos | {"statuses":[400,400]} | PASS |
| PF-09 | RF-11, RF-20, RF-21 | Aceptacion y asistencia idempotente | ADMIN acepta PF-06; CLIENT confirma dos veces; Comparar timestamps | ACCEPTED y primera confirmacion conservada | {"state":"ACCEPTED","attendance":"CONFIRMED","idempotent":true} | PASS |
| PF-10 | RF-09, RF-16 | Otro cliente no puede cancelar cita ajena | Otro CLIENT intenta cancelar PF-06; Comprobar estado almacenado | 404 y cita ACCEPTED intacta | {"http":404,"unchanged":true} | PASS |
| PF-11 | RF-09, RF-05, RF-08 | Cancelacion libera horario y conserva historial | CLIENT cancela PF-06; Consultar disponibilidad e historial | CANCELLED y 08:00 libre | {"http":200,"state":"CANCELLED","slotReleased":true} | PASS |
| PF-12 | RF-06, RC-04 | Concurrencia real por el mismo horario | Lanzar dos POST simultaneos de clientes distintos para 10:00; Contar citas activas en PostgreSQL | Un 201, un 409 y exactamente una cita activa | {"statuses":[201,409],"active":1,"requests":2} | PASS |
| PF-13 | RF-06, RC-03 | Concurrencia del mismo cliente y limite semanal | Crear dos fechas distintas dentro de siete dias; Intentar tercera reserva en la ventana | Dos creaciones y tercer intento 409 | {"created":2,"thirdRejected":true} | PASS |
| PF-14 | RF-12 | Rechazo administrativo libera solicitud | Insertar fixture PENDING; PATCH reject y comprobar DB | REJECTED | {"http":200,"state":"REJECTED"} | PASS |
| PF-15 | RF-14, RF-15 | Cancelacion administrativa y cierre COMPLETED | Intentar completar cita futura ACCEPTED; Cancelar cita futura; Completar fixture pasado ACCEPTED | 409 o 400 para futura; CANCELLED y COMPLETED en elegibles | {"futureBlocked":400,"cancelled":true,"completed":true} | PASS |
| PF-16 | RF-10, RF-13 | Agenda filtrada y rango invalido | GET agenda con rango y estado; Enviar rango invertido | 200 y 400 | {"valid":200,"invalid":400} | PASS |
| PF-17 | RF-18 | Dispositivo idempotente y desactivacion por propietario | Registrar token sintetico dos veces; Desactivar como otro usuario; Desactivar como propietario | Una fila; otro usuario no desactiva; propietario si | {"rows":1,"ownershipProtected":true,"deactivated":true} | PASS |
| PF-18 | RF-22, RC-11 | Cola manual concurrente sin duplicados | Activar dispositivo sintetico sin contactar Expo; Dos solicitudes simultaneas de recordatorio para fixture ACCEPTED | Un trabajo activo y otra solicitud rechazada | {"requests":2,"activeJobs":1} | PASS |
| PF-19 | RF-22, RC-11 | Claim, revalidacion y reintento manual reales | Reclamar con UUID; Revalidar UUID correcto e incorrecto; Liberar por fallo sintetico | CLAIMED, solo UUID propietario valido, retorno QUEUED con backoff | {"claimed":1,"wrongClaimRejected":true,"state":"QUEUED","attempts":1,"backoff":true} | PASS |
| PF-20 | RF-20, RF-22, RC-11 | Confirmar asistencia invalida trabajos pendientes | Confirmar asistencia en cita del trabajo reintentable PF-19; Consultar trabajo | SKIPPED con ATTENDANCE_ALREADY_CONFIRMED | {"state":"SKIPPED","reason":"ATTENDANCE_ALREADY_CONFIRMED"} | PASS |
| PF-21 | RF-19, RC-11 | Recordatorio automatico elegible y claim exclusivo | Insertar fixture a +40 minutos; Dos workers SQL reclaman simultaneamente; Marcar con UUID correcto | Solo un worker reclama la cita; marca interna una vez | {"workers":2,"claims":1,"wrongClaimRejected":true,"internalMarkedSent":true,"externalDeliveryTested":false} | PASS |
| PF-22 | RC-02, RC-01 | Tablas sensibles no accesibles a anon | Consultar privilegios efectivos de anon y authenticated | Sin SELECT users ni ejecucion de RPC privilegiada | {"anon_users":false,"authenticated_users":false,"anon_claim":false} | PASS |
| PF-23 | RC-10 | Persistencia tras nueva conexion PostgreSQL | Guardar conteo e IDs sinteticos; Abrir conexion independiente; Releer registros | Mismos registros visibles en nueva conexion; no equivale a redeploy | {"count":9,"newConnection":true,"redeployTested":false} | PASS |


Datos exactos de fecha, precondiciones, resultados y timestamps: [integracion.json](../../../docs/evidencias_pruebas/parcial-iii/integracion.json) y [integracion-regresion.json](../../../docs/evidencias_pruebas/parcial-iii/integracion-regresion.json). Resultado: 23/23; no es cobertura de código ni porcentaje total de requisitos. Los controles unitarios/componentes se reportan por separado en [controles.json](../../../docs/evidencias_pruebas/parcial-iii/controles.json).

## Reproducción

Instalar con npm ci --ignore-scripts y npm ci --prefix backend --ignore-scripts. Ejecutar npm run quality:checks (devuelve fallo si hay controles o auditorías no conformes). Para integración, configurar DATABASE_URL fuera de Git y ejecutar npm run quality:integration. La cuenta debe permitir crear y eliminar únicamente los esquemas temporales de la campaña. El script exige el patrón qa_iii antes de limpiar. No editar el script para apuntar a tablas reales.

CI utiliza PostgreSQL descartable local, roles anon/authenticated/service_role sin login y sslmode=disable exclusivamente en 127.0.0.1. No introducir claves personales en workflow. La ejecución local real ya existe; la nueva ejecución de CI se debe verificar después de publicar el cambio.

## Límites

La evidencia visual del II ya incluye los diez casos detallados en antecedentes-verificados.md y la confirmación de asistencia. Las cuatro imágenes nuevas de notificaciones-verificadas.md documentan recepción y confirmación CLIENT/ADMIN, con origen automático informado por el estudiante. En la campaña nueva no se reejecutaron integralmente sesión persistente tras reinicio, logout de UI, interacción completa de calendarios en ambos clientes, redeploy sin pérdida, carga sostenida o estudio SUS. La persistencia tras nueva conexión PF-23 no se presenta como redeploy. El endpoint health no identifica la versión desplegada. El registro de compilación determina qué binarios se pudieron generar, no qué pruebas de UI se aprobaron. SUS queda pendiente por coordinación con la barbería y sus clientes.
