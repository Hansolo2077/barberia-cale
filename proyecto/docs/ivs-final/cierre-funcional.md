# Cierre funcional y correspondencia de versiones — IVS

Fecha: 7/11/2026, Guatemala. Se ejecutó la ampliación necesaria para cerrar las observaciones de funcionamiento, regresión de la versión final y correspondencia del backend. No se asigna una calificación ni se garantiza la decisión del docente.

## Versión efectivamente comprobada

- APK **1.0.1 / versionCode 2**, SHA-256 `4318b1d55452b1c13bc10147e8570237104e0159d57fc5c3c21c8230ab582e6f`. Es el mismo binario del release de seguridad, instalado en dos emuladores Android 30 Google Play. No se cambió el frontend entre su compilación y esta campaña; se verificó `git diff --exit-code c1ac461 HEAD -- src assets app.json package.json package-lock.json`.
- Backend publicado en Render: **51a6a28314452045d912d8f0940190a24c344bfb**, observado desde `/api/health`, HTTP 200, `provider=render`, `Cache-Control: no-store`. El usuario realizó el despliegue manual y la comprobación se hizo independientemente por HTTP. El SHA corresponde a un commit público del repositorio.
- Árbol Git de `backend`: `a3bd52fab1f12dfcfa6c810fd56730eb741d1700`. Los commits posteriores de documentación/evidencias deben conservar ese mismo árbol para atribuirles el mismo código backend, sin confundir el SHA del servicio con un commit posterior de documentación.
- El endpoint identifica el proceso HTTP; no certifica la salud de PostgreSQL, un SLA o la versión desplegada de Netlify/Edge Functions.

Comprobación reproducible:

```text
node scripts/ivs-verify-deployment.cjs 51a6a28314452045d912d8f0940190a24c344bfb
git rev-parse 51a6a28314452045d912d8f0940190a24c344bfb:backend
git rev-parse HEAD:backend
```

## Recorrido completo del APK actual

CLIENT inició sesión y se comprobó Recordar activado después de force-stop. Creó desde la interfaz la cita **#58, 08/11/2026 11:00**; la API confirmó PENDING. Después del logout CLIENT, ADMIN inició sesión, localizó la cita y la aceptó **desde la interfaz**, mediante el diálogo de confirmación. La API registró ACCEPTED.

ADMIN abrió el borrador de WhatsApp; Android entregó a Chrome un enlace `wa.me/50588888888` con el nombre, fecha, hora y mensaje correctos. No se envió ningún mensaje ni se afirma autenticación en WhatsApp nativo.

CLIENT permaneció conectado en un segundo emulador independiente con el mismo APK. ADMIN puso en cola **un** recordatorio desde la interfaz. El job **#7 / cita #58 / ADMIN_MANUAL** pasó de QUEUED a SENT: solicitado 16:02:53.343 UTC y enviado 16:03:01.723 UTC. La notificación real se capturó en el dispositivo a las 16:03:15 UTC y abrió Mis citas.

CLIENT confirmó asistencia desde Mis citas: se conservó ACCEPTED con asistencia CONFIRMED y timestamp 16:04:52.318 UTC. Volver del diálogo de cancelación mantuvo ambos datos. Al confirmar la cancelación, #58 quedó CANCELLED, próximas pasó a cero, el historial conservó el 08/11 a las 11:00 y la API comprobó libre ese bloque.

## Controles administrativos y recordatorio automático

Se prepararon fixtures SQL explícitos del CLIENT dummy, separados de la reserva normal: #59 PENDING futura, #60 ACCEPTED futura y #61 ACCEPTED pasada. Se ejecutaron **Rechazar #59**, **Cancelar administrativamente #60** y **Completar #61** mediante sus botones y diálogos del APK. Los resultados persistidos fueron REJECTED, CANCELLED y COMPLETED. La futura mostraba la restricción para completar antes de su hora.

Se comprobó búsqueda por ID y detalles, combinación de estados en gestión y agenda de mañana. La búsqueda positiva Mario y el estado Canceladas mostraron dos registros del período. No se contabilizan como pruebas conformes intentos de automatización que no lograron completar una búsqueda negativa UI.

Para RF-19 se creó el fixture **#62 a +40 minutos**, declarado como preparación SQL y no como reserva normal que omita la regla de 24 horas. El worker automático lo procesó sin envío manual: hora programada 10:47:13 local; `reminder_sent_at=16:08:01.085 UTC`, un intento, dentro de la ventana de una hora. El APK recibió “Tu cita es en una hora” para 10:47. No existe un job manual para #62. Se canceló ese fixture mediante API ADMIN como limpieza, sin contar esa acción como prueba UI.

Se verificaron logout ADMIN/reinicio y la variante CLIENT sin Recordar: después de force-stop, sin logout previo en esa variante, la app volvió al acceso público. El logout CLIENT también fue ejecutado en el recorrido inicial. Ambos tokens de prueba quedaron inactivos, los cinco registros #58–62 quedaron terminales y el emulador temporal fue cerrado. No se borró el historial ni se modificaron registros ajenos.

## Resultados y trazabilidad

| Grupo actual | Resultado | Evidencia |
| --- | --- | --- |
| Integración HTTP/PostgreSQL | 27/27 PASS; limpieza de esquemas confirmada | regresion.json |
| Suites backend | 50 PASS | controles.json / backend-tests.txt |
| Notificaciones frontend | 4 PASS | frontend-tests.txt |
| Seguridad de navegación | 3 PASS | routing-tests.txt |
| Protocolo UI final | 23/23 PASS, 0 fallidas, 0 bloqueadas en la selección | interfaz-final.json; 42 capturas seleccionadas |
| Identidad del despliegue | PASS; SHA exacto observado | despliegue-verificado.json |
| Agenda en backend publicado | 6/6 PASS: 93/94 días, rango, estado, búsqueda y orden | limites-agenda.json |
| Auditoría | Frontend 0 altas/11 moderadas; backend 0 | audit-frontend.json / audit-backend.json |

Los grupos no se suman como cobertura total. Los percentiles de esta nueva campaña local calentada fueron login 194.343 ms, disponibilidad 390.466 ms y mis citas 201.189 ms (15 muestras por flujo); no son una nueva medición del despliegue público ni sustituyen la latencia publicada conservada del primer corte.

La matriz siguiente enlaza todos los RF con pruebas actuales seleccionadas. PF corresponde a la reejecución HTTP/PostgreSQL; UIF al protocolo del mismo APK 1.0.1. La ausencia de UIF no equivale a ausencia de implementación ni a prueba visual realizada.

| Requisito | Casos actuales conformes |
| --- | --- |
| RF-01 | PF-01, PF-02 |
| RF-02 | PF-03, PF-24, UIF-01, UIF-05 |
| RF-03 | UIF-02, UIF-22 |
| RF-04 | UIF-04, UIF-23 |
| RF-05 | PF-05, PF-11, UIF-03 |
| RF-06 | PF-06, PF-07, PF-08, PF-12, PF-13, PF-26, UIF-03 |
| RF-07 | UIF-20 |
| RF-08 | PF-11, UIF-20 |
| RF-09 | PF-10, PF-11, PF-25, PF-27, UIF-19, UIF-20 |
| RF-10 | PF-16, UIF-06, UIF-09 |
| RF-11 | PF-09, UIF-07 |
| RF-12 | PF-14, UIF-10 |
| RF-13 | PF-16, UIF-17, UIF-18 |
| RF-14 | PF-15, UIF-11 |
| RF-15 | PF-15, UIF-12 |
| RF-16 | PF-04, PF-10, PF-24, UIF-01, UIF-05 |
| RF-17 | UIF-08 |
| RF-18 | PF-17, UIF-14 |
| RF-19 | PF-21, UIF-21 |
| RF-20 | PF-09, PF-20, UIF-15, UIF-16 |
| RF-21 | PF-09, UIF-09, UIF-16 |
| RF-22 | PF-18, PF-19, PF-20, UIF-13, UIF-14 |

## Límites que permanecen

La selección no es una certificación integral de seguridad ni una prueba de todas las combinaciones de filtros, dispositivos y plataformas. No se ejecutó iOS ni el recorrido web completo. No se declara envío de WhatsApp ni el botón directo de confirmación en la notificación: se comprobó su recepción/apertura y el botón de Mis citas. Al abrir una notificación con Historial ya visible puede conservarse esa pestaña; no se presenta como selección automática de la cita. Las once alertas moderadas y la falta de capturas UX históricas auténticas siguen registradas. Capacitación impartida, aceptación de negocio y estudio de piloto no se inventan ni se incorporan como exigencias nuevas de la guía.

Fuentes actuales: [carpeta de evidencias](../../../docs/evidencias_pruebas/ivs-2026-11-07/cierre-funcional/), [protocolo UI](../../../docs/evidencias_pruebas/ivs-2026-11-07/cierre-funcional/interfaz-final.json), [correlación API/BD](../../../docs/evidencias_pruebas/ivs-2026-11-07/cierre-funcional/correlacion-api-bd.json).
