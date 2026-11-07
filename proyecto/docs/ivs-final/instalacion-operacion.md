> **RNF-01 vigente, revisión 1 (CR-RNF-01-20261107):** objetivo HTTP <1 segundo en condiciones normales, servicio activo; latencia inicial registrada aparte. Autorizado por Hanssel el 07/11/2026. Las 45 muestras activas cumplen el objetivo revisado; se preservan el antecedente de 500 ms y sus desviaciones. Ver [justificación, evaluación y seguimiento](revision-rnf-01.md).

# Instalación y operación desde cero

> Cierre funcional posterior, 07/11/2026: APK 1.0.1 comprobado nuevamente, 23 casos UI conformes; 27/27 integración reejecutados; 50 backend + 4 notificaciones + 3 seguridad de navegación. API pública identificada por SHA 51a6a28314452045d912d8f0940190a24c344bfb. Las cifras/pendientes del primer corte se conservan como antecedentes y quedan actualizados por [cierre funcional](cierre-funcional.md).


> Estado actual 1.0.1: 0 alertas altas y 11 moderadas frontend; backend 0. Las cifras 3 altas y el APK 1.0.0 de las secciones originales son antecedentes del primer corte. Véase [cierre de seguridad](seguridad-frontend.md) y [nuevo release](notas-release-1.0.1.md).

## Entornos y requisitos

Desarrollo: checkout local, API Express y Expo. Pruebas: API local con PostgreSQL en esquemas efímeros y datos sintéticos. Publicado/piloto: Netlify, Render y Supabase. Un esquema separado limita escrituras de pruebas, pero comparte proveedor/recursos; no equivale a una instancia física staging independiente. Para capacitación usar una instancia de pruebas propia cuando sea posible.

Necesitas Git, Node 22.13 o posterior compatible con Expo SDK 57, npm, PostgreSQL 17 o un proyecto Supabase de pruebas y un cliente SQL. Android requiere Android SDK/JDK y emulador o dispositivo, o un APK existente. Para notificaciones remotas usa compilación nativa con Firebase; Expo Go no sustituye esa compilación.

## Checkout y dependencias

```powershell
git clone https://github.com/Hansolo2077/barberia-cale.git
cd barberia-cale
git checkout IDENTIFICADOR_CANDIDATO
npm ci
npm ci --prefix backend
```

Sustituir IDENTIFICADOR_CANDIDATO por el commit/tag registrado en el manifiesto final. No se declara un tag remoto inexistente. npm ci requiere lockfiles de esa misma revisión. Los scripts de Android pueden necesitar JDK/SDK; la descarga de herramientas no certifica que el build haya pasado.

## Base de datos nueva

Crear un proyecto Supabase de pruebas, sin datos de negocio. El conjunto SQL utiliza roles anon/authenticated/service_role y RPC de PostgREST; no basta crear un PostgreSQL genérico sin preparar esos roles. El runner CI crea sus roles mínimos en una base desechable, pero no representa toda la plataforma Supabase.

Ejecutar en orden, conservando transcripción sin cadena de conexión:

1. backend/src/database/schema.sql.
2. backend/src/database/migrations/20260823_attendance_reminders.sql.
3. backend/src/database/migrations/20260823_reminder_api_boundary.sql.
4. backend/src/database/migrations/20260824_reminder_reliability.sql.
5. backend/src/database/migrations/20260825_manual_attendance_reminders.sql.

No ejecutar los scripts de pruebas manualmente sobre public de una instancia operativa. Las migraciones están versionadas por nombre; no existe un gestor automático de historial de migraciones. database/init.js comprueba conexión, no instala todo el esquema. Comprobar PK/FK, índices y funciones contra [diccionario verificado](../../../docs/evidencias_pruebas/ivs-2026-11-07/diccionario.md) y modelo ER.

## Variables y arranque

Crear backend/.env local desde backend/.env.example, sin publicar valores. DATABASE_URL es privada; JWT_SECRET debe ser aleatorio y propio del entorno; CORS_ORIGINS contiene los orígenes web permitidos; PORT es opcional. No reutilizar secretos entre piloto y pruebas.

Desde backend, iniciar:

```powershell
node --env-file=.env src/server.js
```

La API utiliza por defecto puerto 4000. /api/health confirma proceso HTTP, no integridad completa de BD. Comprobar además login, /auth/me, consulta autenticada e inserción/recuperación en el entorno de pruebas.

En la raíz, definir EXPO_PUBLIC_API_URL con la URL completa terminada en /api y ejecutar:

```powershell
npx expo start
```

Web: pulsar w o usar npm run web. En Android, 127.0.0.1 refiere al propio emulador; el emulador Android estándar accede al host mediante 10.0.2.2. Debe existir conectividad hacia la API y CORS para web. La aplicación usa una API publicada por defecto si no se configura la variable: comprobarla antes de cualquier ejercicio con escrituras.

## Datos semilla y rol ADMIN

La campaña automatizada crea tres cuentas sintéticas con contraseña aleatoria en memoria y citas relativas al reloj del servidor. Se elimina al terminar. Se reproduce con:

```powershell
node scripts/quality-integration.cjs docs/evidencias_pruebas/ivs-2026-11-07/integracion-reproduccion.json
```

Para pruebas interactivas, registrar cuentas ficticias en la instancia sandbox desde la app. La promoción de una cuenta existente debe ejecutarla el responsable de esa instancia:

```powershell
cd backend
node --env-file=.env src/database/make-admin.js CELULAR_DE_PRUEBA
```

El comando ahora exige celular explícito y válido; no contiene un destinatario fijo. No ejecutarlo contra una base equivocada. Las cuentas facilitadas para evaluar el despliegue se guardan solo en .quality-private y no forman parte del PDF o ZIP público. Rotar una contraseña no demuestra que una cuenta esté aislada ni revoca por sí sola JWT emitidos.

## Worker y cron

Solo si se van a comprobar notificaciones: configurar en el proyecto sandbox Firebase/EAS, los secretos de la Edge Function y el secreto de cron de Vault. Consultar los nombres exactos en supabase/functions/bright-endpoint/index.ts, sin publicar valores. Desplegar bright-endpoint en ese proyecto. Habilitar pg_net, pg_cron y Vault si no existen; crear el secreto appointment_reminder_cron_secret. Adaptar la URL del proyecto en una copia local de supabase/cron/schedule-appointment-reminders.sql antes de ejecutarlo: el archivo versionado apunta al proyecto publicado y no debe copiarse sin revisar el destino.

Validar elegibilidad, logs de ejecución, estado de trabajo y recepción en dispositivo. El runner HTTP/BD omite el envío a Expo y no valida Firebase ni cron desplegado. No activar cron en el ensayo de recuperación sintético.

## Distribución y soporte

Web: npm ci y npx expo export --platform web; publicar dist con EXPO_PUBLIC_API_URL correcta. API: dependencias backend y node src/server.js con variables del proveedor. No aplicar migraciones automáticamente durante arranque sin control de versión/respaldo. Android: usar el procedimiento EAS existente o Gradle del proyecto nativo; registrar huella, firma y versión del APK. No equiparar el APK local anterior con el candidato actualizado.

Para un fallo: registrar versión/huella, plataforma, hora, RF/caso, pasos y error sin datos privados. Si un cambio degrada operación, detener nuevas escrituras y seguir el [procedimiento de recuperación](migracion-recuperacion.md). Cualquier despliegue/rollback operativo requiere validar compatibilidad de esquema y coordinar al responsable de la barbería.


## Actualización de seguridad 1.0.1

El cierre posterior del 07/11/2026 elimina las tres alertas altas de la cadena Expo Router/query-string/decoder: auditoría frontend actual 0 altas, 11 moderadas y 0 críticas; backend 0. Se mantienen los resultados del release 1.0.0 como antecedentes fechados, no como pruebas del nuevo binario. Véase [corrección, reproducción y límites](seguridad-frontend.md) y los [controles posteriores](../../../docs/evidencias_pruebas/ivs-2026-11-07/seguridad-frontend/controles.json). El nueva versión de entrega se identifica como v1.0.1-ivs.20261107; no se sustituye el release previo.
