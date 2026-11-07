# Barbería Cale 1.0.1 — corrección de seguridad frontend

> Cierre funcional posterior, 07/11/2026: APK 1.0.1 comprobado nuevamente, 23 casos UI conformes; 27/27 integración reejecutados; 50 backend + 4 notificaciones + 3 seguridad de navegación. API pública identificada por SHA 51a6a28314452045d912d8f0940190a24c344bfb. Las cifras/pendientes del primer corte se conservan como antecedentes y quedan actualizados por [cierre funcional](cierre-funcional.md).


Cierra las tres alertas altas transitivas de Expo Router/query-string/decoder. Se mantiene Expo SDK 57 y se utiliza decode-uri-component oficial 0.5.1 con adaptación explícita de la importación ESM; no se modifica su algoritmo. El nuevo APK es versión 1.0.1, versionCode 2, con bundle integrado y firma local de evaluación compatible con la versión anterior.

Auditoría actual: frontend **0 altas, 11 moderadas, 0 críticas**; backend 0. TypeScript, lint y compatibilidad Expo conformes. Pasan 48 pruebas backend, 4 de notificaciones y 3 nuevas de seguridad de navegación, incluida la entrada de denegación de servicio en un proceso aislado. Instalación limpia verificada. Consultar controles, compilación y protocolo de humo del binario en `docs/evidencias_pruebas/ivs-2026-11-07/seguridad-frontend`.

Descargar el APK actualizado y contrastar SHA-256 con SHA256SUMS.txt. Instalar con `adb install -r BarberiaCale-1.0.1-IVS-release.apk` o instalador Android. No desinstalar ni borrar datos automáticamente. No es una firma Play Store. La app usa la API publicada; los accesos de evaluación se comunican por canal privado.

Para ejecutar desde cero: checkout de esta etiqueta, Node ≥22.13, `npm ci` y pasos de `proyecto/docs/ivs-final/instalacion-operacion.md`. Postinstall aplica la adaptación; si se instala con `--ignore-scripts`, ejecutar `node scripts/patch-query-string.cjs` antes de compilar o ejecutar. Las pruebas se ejecutan con `npm run test:routing-security`.

Las once moderadas siguen pendientes; este cierre no certifica seguridad integral. No se afirma redespliegue de web/API. Se conserva el release 1.0.0 como antecedente del recorrido completo de reserva y de las capturas históricas, sin atribuir esa campaña a la 1.0.1. No se modifican ni sustituyen sus archivos.
