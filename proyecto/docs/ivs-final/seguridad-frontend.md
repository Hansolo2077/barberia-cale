# Cierre de las tres alertas altas del frontend

Fecha: 7 de noviembre de 2026. Responsable: Hanssel, con ejecución técnica asistida autorizada. Versión corregida: 1.0.1; etiqueta `v1.0.1-ivs.20261107`. Se conserva el release 1.0.0 como antecedente, sin reemplazar sus binarios ni atribuirle este parche.

## Causa y corrección

Las tres entradas altas de npm audit no eran tres fallos independientes: correspondían a `expo-router → query-string@7.1.3 → decode-uri-component@0.2.2`. La última dependencia presentaba denegación de servicio por decodificación costosa de entradas malformadas. Avisos oficiales: [GHSA-qr28-fpjm-wq7f](https://github.com/advisories/GHSA-qr28-fpjm-wq7f) y [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr).

Se fija el decoder oficial 0.5.1 mediante un override limitado a query-string 7.1.3. El paquete corregido usa exportación ESM default; query-string 7 espera CommonJS. `scripts/patch-query-string.cjs` adapta únicamente esa importación a `.default`, conserva intacto el algoritmo oficial y falla si cambia la versión o la línea esperada. Es idempotente, se ejecuta en postinstall y queda aplicado también en CI después de `npm ci --ignore-scripts`. No se ocultaron alertas ni se usó `audit --force`; Expo se mantiene en SDK 57.

El parche exige conservar el script, override y lockfile juntos. Si cambia query-string se debe reevaluar y retirar la adaptación cuando el upstream compatible la haga innecesaria. Node mínimo para el proyecto: 22.13, conforme a Expo 57.

## Reproducción

```text
npm ci
npm run test:routing-security
npm run test:notifications
npm run lint
npx tsc --noEmit
npx expo install --check
npm audit --json
```

Si se usa `npm ci --ignore-scripts`, ejecutar explícitamente `node scripts/patch-query-string.cjs` antes de ejecutar o compilar la app. Las tres pruebas nuevas cubren Unicode/espacios/arreglos y round trip, entradas malformadas y un payload de 32.000 secuencias distintas en un proceso aislado con timeout de cinco segundos. Este último finalizó normalmente; no constituye un benchmark ni garantiza ausencia de otras vulnerabilidades.

## Resultado y límites

Antes del parche: 3 altas, 11 moderadas, 0 críticas. Después: **0 altas, 11 moderadas, 0 críticas**; backend 0. TypeScript, ESLint, compatibilidad Expo, 48 pruebas backend, 4 de notificaciones y 3 nuevas de seguridad de navegación: conformes. La instalación limpia aplicó correctamente el postinstall. Los reportes fechados se conservan en [seguridad-frontend](../../../docs/evidencias_pruebas/ivs-2026-11-07/seguridad-frontend/).

IVS-D03 queda cerrado respecto de las alertas altas; las once moderadas continúan abiertas y requieren una actualización compatible separada. npm audit sigue devolviendo exit 1 por esas moderadas. No se declara seguridad integral ni que el backend/web publicados se hayan redesplegado. Las pruebas de negocio y capturas del release 1.0.0 conservan su versión y fecha; la comprobación del APK 1.0.1 se registra por separado.
