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

Se revisó `hasInstallScript` de ambos lockfiles: solo `unrs-resolver@1.12.2` del frontend declara un script de instalación; backend no declara ninguno. Su postinstall prepara bindings de plataforma. El cargador admite los paquetes nativos opcionales bloqueados en el lockfile; no se utiliza `--omit=optional`. Después de una instalación limpia sin scripts, `require('unrs-resolver')` y ESLint funcionan en Windows. El runner Ubuntu de Actions debe confirmar el mismo resultado en Linux; el resultado remoto se registra por separado.

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
| Frontend, altas/críticas | 5 | Pendiente del escaneo autenticado en Actions. |
| Backend, altas/críticas | 0 | Pendiente del escaneo autenticado en Actions. |
| Críticas totales | 0 | Pendiente del escaneo autenticado en Actions. |

No hay `SNYK_TOKEN` disponible localmente; los escaneos autenticados se ejecutan en Actions y no se presentan como aprobados antes de consultar sus logs. npm audit y Snyk son mediciones diferentes.

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
| Binario Linux y escaneos autenticados | Pendientes de Actions; no ejecutables como tales en el entorno Windows sin credenciales Snyk. |

## Verificación remota y decisión de merge

Se completará esta sección con enlaces y resultados de la ejecución del nuevo PR. La ausencia de parches compatibles no equivale a un resultado de seguridad exitoso. Si Snyk conserva las cinco altas, el PR debe permanecer abierto; tampoco procede un merge si fallan el Quality Gate, las reglas objetivo, las revisiones requeridas o cualquier comprobación obligatoria. No se eluden protecciones de rama ni se fuerza un resultado exitoso.
