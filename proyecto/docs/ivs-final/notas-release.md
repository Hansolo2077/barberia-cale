# Barbería Cale 1.0.0 para evaluación IVS

APK de variante Android release y expediente técnico previo al PDF. Corte: 7 de noviembre de 2026. Esta publicación está identificada como prerelease para evaluación y piloto controlado.

## Cambios

- Parches compatibles dentro de Expo SDK 57: Expo 57.0.32, Router 57.0.30 y React Native 0.86.3. Lockfile actualizado.
- Criterios de aceptación para RF-01 a RF-22, correcciones específicas de IVS, plan V&V, manuales, capacitación e instalación/operación.
- Diccionario obtenido del esquema reconstruido, recuperación de archivo sintético y pruebas adicionales de sesión API, límites y rollback.
- Comando de promoción ADMIN con celular explícito, sin un destinatario fijo.

## Validación

- TypeScript, ESLint, 48 pruebas backend y 4 de notificaciones: PASS.
- Campaña final HTTP/PostgreSQL: 27/27, incluidos concurrencia real, autorización, límite exacto de cancelación y rollback.
- Restauración sintética: cuatro pasos conformes, igualdad de datos, claves foráneas, secuencias y limpieza de esquemas.
- Compatibilidad Expo: PASS. Exportación web: PASS, doce rutas.
- API publicada: diez checks conformes y seis observaciones de health. El primer login tardó 22,553 s; no se atribuye una causa sin instrumentación.
- APK instalado en emulador: 11 comprobaciones conformes de acceso por roles, sesión persistente/reinicio, reserva, asistencia, cancelación e historial. La cita dummy #57 quedó cancelada y el horario libre. Aceptación ADMIN realizada por API, sin enviar WhatsApp.
- Auditoría npm: backend cero; frontend 3 altas y 11 moderadas remanentes. Se conservan reportes antes/después.

## Instalación del APK

Descargar BarberiaCale-1.0.0-IVS-release.apk y contrastar su SHA-256 con SHA256SUMS.txt. Instalar en Android compatible. Incluye el bundle JavaScript, sin depender de Metro. La variante release usa la firma debug local configurada por el proyecto para evaluación; no es una firma de distribución Play Store. Si una instalación previa tiene otra firma, Android no permitirá actualizarla directamente: conservar sus datos y coordinar el procedimiento antes de reemplazarla.

El APK utiliza la API publicada del piloto. No realizar reservas operativas solo para probar la instalación. Los accesos dummy se facilitan por canal privado y no se incluyen en estos archivos.

## Alcance y pendientes

Las pruebas HTTP/BD se ejecutaron localmente con PostgreSQL real y datos efímeros; no prueban toda la interfaz del APK. El bloqueo inicial de Computer Use se resolvió con ADB autorizado y un recorrido reducido del APK, con capturas fechadas. No se declara que el backend publicado corresponda al SHA del candidato ni que los parches locales estén desplegados allí.

Siguen pendientes la validación visual integral, registros reales del piloto, capacitación impartida, aceptación de negocio, aislamiento operativo de cuentas y cierre de los hallazgos frontend. La restauración ensayada es de datos sintéticos y cuatro tablas, no un backup completo de Supabase ni un ensayo de producción. El PDF final y el video no forman parte de esta publicación.

Evidencias y guías: carpeta proyecto/docs/ivs-final y docs/evidencias_pruebas/ivs-2026-11-07 del código de esta etiqueta. El ZIP adjunto reúne los materiales técnicos seleccionados y sus huellas, sin credenciales.
