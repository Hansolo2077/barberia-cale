# Remediación de seguridad posterior al PR 7

Fecha: 17 de octubre de 2026. Repositorio: `Hansolo2077/barberia-cale`. Rama de trabajo: `dev`; destino del nuevo PR: `main`.

## Relación entre las entregas

El [PR #7](https://github.com/Hansolo2077/barberia-cale/pull/7) quedó fusionado en `c83933eb130d4ec7e6f40e4e90df46d1b900ede4`. Su implementación y evidencias históricas se conservan en [el análisis inicial](https://github.com/Hansolo2077/barberia-cale/blob/5b68e6bf4f069c502ede408ab0a744727863a6a1/docs/analisis-calidad-seguridad.md).

Antes de modificar archivos se ejecutó `git fetch origin` y se avanzó `dev` mediante `git merge --ff-only origin/main`. El árbol inicial era idéntico al de `main`; no se reescribió historia ni se arrastraron diferencias de PR #7. Se preservaron dos capturas locales no versionadas, que no forman parte de esta entrega. No se modifica ni se reabre PR #7.

## Hallazgos SonarCloud y correcciones

La [API pública de issues de la rama dev](https://sonarcloud.io/api/issues/search?componentKeys=Hansolo2077_barberia-cale&branch=dev&rules=githubactions%3AS6505%2Cgithubactions%3AS8543&resolved=false&ps=100) confirmó ocho hallazgos abiertos del workflow antes de los cambios: **6 de `githubactions:S6505` y 2 de `githubactions:S8543`**. La evidencia resumida, con claves individuales, está en [sonar-antes.json](evidencias_pruebas/pr8/sonar-antes.json). No se cierran ni se suprimen issues manualmente.

| Causa | Corrección |
| --- | --- |
| Cuatro instalaciones de frontend/backend permitían scripts de dependencias. | Las cuatro usan `npm ci --ignore-scripts`, conservando los lockfiles existentes. |
| `npx tsc` podía instalar y ejecutar una versión no bloqueada si faltaba TypeScript. | `node ./node_modules/typescript/bin/tsc --noEmit` usa exclusivamente el compilador instalado desde el lockfile; falla si no existe. |
| `npm install -g snyk` elegía versiones dinámicas y ejecutaba lifecycle scripts. | Se descarga el binario oficial Linux de Snyk **1.1308.1**, se exige su SHA-256 y se comprueba `--version` antes de añadirlo al PATH del job. No se ejecuta un instalador npm para Snyk. |

SHA-256 oficial del binario Linux: `a8b2e420af6d8e61bf1d367c064475ccf699d767fc8763efb0072b9cac250f9a`, obtenido del [manifiesto versionado oficial](https://downloads.snyk.io/cli/v1.1308.1/release.json). La verificación compara con el hash literal versionado en el workflow, no con un checksum descargado dinámicamente durante la ejecución. Una descarga, hash o versión incorrectos detienen el job. Se siguió el método oficial de [instalación de binarios](https://docs.snyk.io/developer-tools/snyk-cli/install-the-snyk-cli) y [verificación de checksums](https://docs.snyk.io/developer-tools/snyk-cli/install-the-snyk-cli/verifying-cli-standalone-binaries).

El primer análisis del nuevo PR identificó además `githubactions:S6506` en la descarga: permitir redirecciones sin restringir el protocolo podría degradar HTTPS. Se añadieron `--proto '=https' --proto-redir '=https' --tlsv1.2`, además del hash fijo. La descarga y cada redirección quedan restringidas a HTTPS; no se ignora la regla.

## Seguridad de los scripts de instalación

Se revisó `hasInstallScript` de ambos lockfiles: solo `unrs-resolver@1.12.2` del frontend declara un script de instalación; backend no declara ninguno. Su postinstall prepara bindings de plataforma. El cargador admite los paquetes nativos opcionales bloqueados en el lockfile; no se utiliza `--omit=optional`. Después de una instalación limpia sin scripts, `require('unrs-resolver')` y ESLint funcionan en Windows. El [job Tests de Ubuntu](https://github.com/Hansolo2077/barberia-cale/actions/runs/39047932623/job/117440324329) también aprobó instalaciones, TypeScript, ESLint y pruebas sin ejecutar postinstall.

Los scripts explícitos de pruebas y lint permanecen habilitados. `--ignore-scripts` se aplica a la instalación y no elimina pruebas, lint ni TypeScript. No se añadieron excepciones de seguridad ni se autorizó la ejecución general de postinstall. No se certifican builds nativos Android/iOS con esta validación de CI.

## Investigación de Snyk y compatibilidad

La [última ejecución de Snyk de PR #7](https://github.com/Hansolo2077/barberia-cale/actions/runs/39045719499/job/117434489946) confirma **5 altas en frontend, 0 en backend y 0 críticas**. Los 22 hallazgos históricos y su reducción a 5 pertenecen a PR #7; no se atribuyen otra vez a esta entrega.

| Dependencia y ruta | Hallazgo | Corrección disponible y limitación |
| --- | --- | --- |
| Metro → metro-file-map → micromatch → `braces@3.0.3` | [Uncontrolled Recursion](https://security.snyk.io/vuln/SNYK-JS-BRACES-19963945) | npm sigue publicando 3.0.3 como última versión; Snyk no ofrece parche. |
| React Native → community-cli-plugin → Metro → `image-size@1.2.1` | [Infinite loop 17295814](https://security.snyk.io/vuln/SNYK-JS-IMAGESIZE-17295814) | Corregido en 2.0.3; Metro requiere `^1.0.2` y llama a la exportación por defecto, mientras 2.x usa `imageSize` como exportación nombrada. |
| Misma ruta de `image-size` | [Infinite loop 17295816](https://security.snyk.io/vuln/SNYK-JS-IMAGESIZE-17295816) | Segundo hallazgo distinto; mismo bloqueo de compatibilidad. No se fuerza 2.x. |
| Expo → @expo/cli → `node-forge@1.4.0` (también code-signing-certificates) | [Verificación de firma criptográfica](https://security.snyk.io/vuln/SNYK-JS-NODEFORGE-19635204) | npm sigue publicando 1.4.0 como última versión; sin parche disponible. No se sustituye una implementación criptográfica sin verificación. |
| Expo → @expo/cli → `zod@3.25.76` | [Consumo de recursos](https://security.snyk.io/vuln/SNYK-JS-ZOD-20510278) | Corregido en 4.6.6. Se consultaron todas las revisiones publicadas de @expo/cli 57.0.0–57.0.31: exigen `^3.25.76`. La última Zod 3 estable es 3.25.76. Un override de Zod 4 requiere adaptar/verificar Expo CLI; no se fuerza. |

No se cambiaron versiones de dependencias de aplicación, sus manifiestos o lockfiles: la investigación no acreditó una corrección compatible de estos cinco hallazgos. No se afirma que estén resueltos. Los overrides evaluados se descartaron por falta de parche o por cambios incompatibles de API. La documentación oficial de [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) se consultó antes de modificar el workflow.

| Medición Snyk | Antes de PR #8 | Después de PR #8 |
| --- | ---: | --- |
| Frontend, altas/críticas | 5 | 5 altas, 0 críticas. |
| Backend, altas/críticas | 0 | 0. |
| Críticas totales | 0 | 0. |

No hay `SNYK_TOKEN` disponible localmente. Se consultaron los [logs autenticados finales de Actions](https://github.com/Hansolo2077/barberia-cale/actions/runs/39047932623/job/117440629711): frontend analiza 578 dependencias y conserva cinco issues/14 rutas vulnerables (exit 1); backend analiza 98 dependencias sin rutas vulnerables y pasa. La CLI oficial 1.1308.1 se descargó, pasó el checksum y la comprobación de versión antes de ambos escaneos. npm audit y Snyk son mediciones diferentes. No se atribuye ninguna reducción de vulnerabilidades Snyk a este PR; sus correcciones verificadas corresponden a la seguridad del pipeline.

## Pipeline y reproducción

**Tests → SonarCloud → DeepSource → Snyk** se conserva mediante `needs`.

- Tests instala desde los lockfiles sin lifecycle scripts y ejecuta TypeScript, ESLint y todas las pruebas existentes.
- SonarCloud ejecuta el scanner y publica resultados. El job exitoso no implica un Quality Gate aprobado; se revisa también el check independiente y los issues por regla.
- DeepSource consulta su API GraphQL oficial para el SHA real del PR y exige `SUCCESS` con finalización. No usa el SHA sintético de merge como sustituto del commit analizado.
- Snyk comprueba ambos proyectos con `--severity-threshold=high`. El backend se ejecuta aunque falle frontend; una vulnerabilidad alta o crítica mantiene el job fallido. No hay `continue-on-error` ni supresiones.

Secrets requeridos: `SONAR_TOKEN`, `DEEPSOURCE_PAT` y `SNYK_TOKEN`. Sus valores no se documentan ni se modifican. Se conservan `contents: read`, los triggers y las siete referencias `uses:` con SHA completos verificados en PR #7. No se añadieron acciones con etiquetas mutables.

Reproducción local en Windows (en Linux, quitar el sufijo `.cmd`):

```powershell
npm.cmd ci --ignore-scripts
node ./node_modules/typescript/bin/tsc --noEmit
npm.cmd run lint
npm.cmd run test:notifications
npm.cmd ci --prefix backend --ignore-scripts
npm.cmd test --prefix backend
```

Para escanear, instalar la versión exacta oficial de Snyk para la plataforma, verificar su checksum y ejecutar `snyk test --file=package.json --severity-threshold=high` primero en la raíz y después dentro de `backend`, con autenticación legítima. No reutilizar el binario Linux en Windows.

## Validación local de esta entrega

| Comprobación | Resultado |
| --- | --- |
| `npm ci --ignore-scripts`, frontend | Exit 0; 849 paquetes instalados; npm informa 33 paquetes afectados (12 moderados, 21 altos). |
| `npm ci --prefix backend --ignore-scripts` | Exit 0; npm informa 0 vulnerabilidades. |
| TypeScript instalado desde lockfile | Exit 0, mediante `npx --no-install --ignore-scripts tsc --noEmit`; el workflow invoca directamente el mismo archivo local. |
| `npm run lint` | Exit 0. |
| `npm run test:notifications` | Exit 0; 4/4. |
| `npm test --prefix backend` | Exit 0; 47/47. |
| Binding `unrs-resolver` sin postinstall | Carga correcta en la instalación limpia. |
| YAML y sintaxis Bash | Válidos; orden, SHAs, permisos, gate DeepSource y umbral Snyk preservados. |
| Binario Linux y escaneos autenticados | Verificados en Actions, no localmente: hash/versión correctos, frontend falla por cinco altas y backend pasa. |

## Verificación remota y decisión de merge

El [PR #8](https://github.com/Hansolo2077/barberia-cale/pull/8) permanece **abierto, sin merge**. La revisión de implementación comprobada es `154f3a158388ca7b673568d6f7d2a95e3db3734f`; la [ejecución de PR #8](https://github.com/Hansolo2077/barberia-cale/actions/runs/39047932623) terminó con fallo únicamente en el job Snyk. El commit documental posterior registra esta revisión y no se presenta como una nueva ejecución ya aprobada.

| Etapa | Resultado comprobado |
| --- | --- |
| [Tests](https://github.com/Hansolo2077/barberia-cale/actions/runs/39047932623/job/117440324329) | `success`: ambas instalaciones limpias, TypeScript, ESLint y pruebas. |
| [SonarCloud, scanner](https://github.com/Hansolo2077/barberia-cale/actions/runs/39047932623/job/117440424039) | `success`. |
| [SonarCloud Code Analysis](https://github.com/Hansolo2077/barberia-cale/runs/117440608321) | **Quality Gate passed**. API: Security Rating en código nuevo A; check: 0 issues nuevos, 0 aceptados y 0 hotspots nuevos. La cobertura informada en código nuevo es 0.0%; no se presenta como cobertura global ni como prueba de la aplicación. |
| [DeepSource](https://github.com/Hansolo2077/barberia-cale/actions/runs/39047932623/job/117440612541) | `success`: API confirma `SUCCESS` para el SHA completo, finalizado `2026-10-17T16:07:14.780141+00:00`. No se obtuvo conteo global de issues. |
| [Snyk](https://github.com/Hansolo2077/barberia-cale/actions/runs/39047932623/job/117440629711) | `failure`: cinco altas frontend; backend ejecutado y aprobado. El fallo permanece visible. |

La API de la rama `dev` confirmó **0 abiertos y 9 FIXED** en las tres reglas tratadas: seis `S6505`, dos `S8543` y el `S6506` identificado y corregido durante este PR. Se contrastaron las claves con la evidencia inicial; no se suprimió ni aceptó ningún hallazgo para mejorar el resultado. El Quality Gate aprobado corresponde al PR y al código nuevo, no certifica que no haya issues históricos en todo el proyecto.

Evidencias versionadas:

- [SonarCloud antes](evidencias_pruebas/pr8/sonar-antes.json): ocho issues originales.
- [SonarCloud después](evidencias_pruebas/pr8/sonar-despues.json): nueve claves FIXED, cero abiertas en las reglas tratadas y condiciones reales del Quality Gate.
- [Validación remota](evidencias_pruebas/pr8/validacion-remota.json): commit, jobs/pasos, resumen SonarCloud, cinco IDs Snyk y confirmación DeepSource.

Commits de implementación:

- [b4dc571](https://github.com/Hansolo2077/barberia-cale/commit/b4dc571884ef72b11f4532734f551802c5c55393): instalaciones sin lifecycle scripts, compilador local y Snyk exacto con checksum; documentación y línea base SonarCloud.
- [154f3a1](https://github.com/Hansolo2077/barberia-cale/commit/154f3a158388ca7b673568d6f7d2a95e3db3734f): restricción HTTPS/TLS de descarga y redirecciones para `S6506`.

**Decisión: no fusionar.** Persisten cinco vulnerabilidades altas sin corrección compatible acreditada en este conjunto Expo/Metro. No se cumple la condición de seguridad necesaria para el merge, aunque Tests, SonarCloud y DeepSource pasen. No se eluden protecciones de rama ni se cambia `main`; tampoco se afirma que todas las comprobaciones o toda la remediación estén completas. Cuando existan parches compatibles, deberán actualizarse los lockfiles, repetirse las pruebas y confirmar los escaneos sobre el commit exacto antes de considerar el merge.
