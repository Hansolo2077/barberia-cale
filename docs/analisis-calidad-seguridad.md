# Análisis de calidad y seguridad — Barbería Cale

Fecha: 17 de octubre de 2026. Repositorio: `Hansolo2077/barberia-cale`, rama `dev`, PR #7.
Base: commit `36ca8e8`. Entorno: Windows, Node.js `24.16.0`, npm `11.13.0`.

## Resultados finales comprobados en GitHub Actions

Consulta del 17 de octubre de 2026. Se comparan la [ejecución inicial #6, intento 2](https://github.com/Hansolo2077/barberia-cale/actions/runs/39041407379/attempts/2), sobre `36ca8e8`, y la [ejecución final #8, intento 2](https://github.com/Hansolo2077/barberia-cale/actions/runs/39043072399/attempts/2), sobre `1392a691e8f6703cb70316be51441d03085286bc`, del PR #7. La ejecución final terminó el 17 de octubre a las 15:17 UTC (09:17 en Guatemala). Son resultados de ese commit; el posterior commit documental no se presenta como una nueva ejecución ya aprobada.

### Snyk: Antes / Después

Ambos escaneos usan `snyk test --file=package.json --severity-threshold=high`, cada uno desde su proyecto. Por tanto, el conteo corresponde a hallazgos altos y críticos reportados con ese umbral, no a una certificación de ausencia de vulnerabilidades de cualquier severidad.

| Proyecto / métrica | Antes | Después | Reducción |
| --- | ---: | ---: | ---: |
| Frontend | 20 | 5 | 75.0% |
| Backend | 2 | 0 | 100% |
| Total | 22 | 5 | **77.3%** |
| Críticas, ambos proyectos | 2 | 0 | 100% |

Reducción total: `(22 - 5) / 22 × 100 = 77.2727…%`, redondeada a 77.3%. Inicialmente había una crítica en frontend (`shell-quote`) y una en backend (`proxy-addr`); el análisis final reporta cinco altas y ninguna crítica.

Evidencias verificables:

- [Snyk inicial: frontend, paso 8](https://github.com/Hansolo2077/barberia-cale/actions/runs/39041407379/job/117422531188#step:8:1): 578 dependencias, 20 issues y 51 rutas vulnerables.
- [Snyk inicial: backend, paso 9](https://github.com/Hansolo2077/barberia-cale/actions/runs/39041407379/job/117422531188#step:9:1): 98 dependencias, 2 issues y 3 rutas vulnerables.
- [Snyk final: frontend, paso 8](https://github.com/Hansolo2077/barberia-cale/actions/runs/39043072399/job/117429947103#step:8:1): 578 dependencias, 5 issues y 14 rutas vulnerables; exit code 1.
- [Snyk final: backend, paso 9](https://github.com/Hansolo2077/barberia-cale/actions/runs/39043072399/job/117429947103#step:9:1): 98 dependencias, ninguna ruta vulnerable; paso aprobado.

El job Snyk general permanece **failure** por los cinco hallazgos altos del frontend. El backend sí se ejecuta después del fallo del frontend; no se ocultan hallazgos ni se usa `continue-on-error`.

### Pipeline y resultados de los servicios

Orden obligatorio conservado: **Tests → SonarCloud → DeepSource → Snyk**.

| Job de Actions | Resultado final comprobado | Evidencia |
| --- | --- | --- |
| Tests | `success`: instalaciones frontend/backend, TypeScript, ESLint y pruebas aprobados. | [Job Tests](https://github.com/Hansolo2077/barberia-cale/actions/runs/39043072399/job/117429576903) |
| SonarCloud | `success`: scanner ejecutado y reporte enviado. Esto no significa que el Quality Gate haya pasado. | [Job SonarCloud](https://github.com/Hansolo2077/barberia-cale/actions/runs/39043072399/job/117429721063) |
| DeepSource | `success`: la API confirmó `SUCCESS` para el SHA `1392a69…`, con finalización `2026-10-17T15:01:38.800772+00:00`. | [Job DeepSource](https://github.com/Hansolo2077/barberia-cale/actions/runs/39043072399/job/117429924656) |
| Snyk | `failure`: frontend con cinco altas; backend aprobado. | [Job Snyk](https://github.com/Hansolo2077/barberia-cale/actions/runs/39043072399/job/117429947103) |

**SonarCloud:** el check independiente [SonarCloud Code Analysis](https://github.com/Hansolo2077/barberia-cale/runs/117429934735) del mismo SHA está en `failure`, con título **Quality Gate failed**. La condición fallida es **Security Rating on New Code: C**, frente al mínimo requerido **A**. El [dashboard del PR #7](https://sonarcloud.io/dashboard?id=Hansolo2077_barberia-cale&pullRequest=7) enlaza el reporte. El workflow no espera el resultado del Quality Gate, por lo que su job de scanner puede pasar mientras el check del servicio falla. Se comprobó el resumen publicado por la integración en GitHub; no se obtuvieron métricas adicionales de cobertura, bugs, code smells o número total de issues desde el dashboard/API. No se afirma que SonarCloud esté libre de issues. La corrección de este Quality Gate queda pendiente, fuera de esta actualización documental.

**DeepSource:** además del job, los estados oficiales [JavaScript](https://app.deepsource.com/gh/Hansolo2077/barberia-cale/run/4b6fff27-f12d-49ad-b310-11e8811a7e61/javascript/), [SQL](https://app.deepsource.com/gh/Hansolo2077/barberia-cale/run/4b6fff27-f12d-49ad-b310-11e8811a7e61/sql/) y [Secrets](https://app.deepsource.com/gh/Hansolo2077/barberia-cale/run/4b6fff27-f12d-49ad-b310-11e8811a7e61/secrets/) figuran como `success` en el SHA analizado. No se obtuvo un desglose numérico global de issues; estos estados no prueban que todo el repositorio esté libre de hallazgos históricos o excluidos por las reglas del servicio.

### Cinco hallazgos altos de Snyk pendientes

Estos son los cinco issues reales del log final; no deben confundirse con las cinco dependencias raíz del reporte separado de npm audit.

| Dependencia | Hallazgo / reporte oficial | Decisión de compatibilidad |
| --- | --- | --- |
| `braces@3.0.3` | [Uncontrolled Recursion — 19963945](https://security.snyk.io/vuln/SNYK-JS-BRACES-19963945) | Snyk indica que no hay upgrade o parche disponible. Llega por micromatch y Metro. |
| `image-size@1.2.1` | [Infinite loop — 17295814](https://security.snyk.io/vuln/SNYK-JS-IMAGESIZE-17295814) | Corregido en 2.0.3, fuera del rango 1.x de Metro y con cambio de API. |
| `image-size@1.2.1` | [Infinite loop — 17295816](https://security.snyk.io/vuln/SNYK-JS-IMAGESIZE-17295816) | Segundo issue independiente del mismo paquete; requiere la misma actualización compatible del consumidor. |
| `node-forge@1.4.0` | [Improper Verification of Cryptographic Signature — 19635204](https://security.snyk.io/vuln/SNYK-JS-NODEFORGE-19635204) | Snyk indica que no hay upgrade o parche disponible; llega por las herramientas de Expo. |
| `zod@3.25.76` | [Allocation of Resources Without Limits or Throttling — 20510278](https://security.snyk.io/vuln/SNYK-JS-ZOD-20510278) | Corregido en 4.6.6; @expo/cli instalado exige `^3.25.76`. No se fuerza una migración mayor de Zod sin adaptar/verificar el consumidor. |

### Trazabilidad de correcciones y commits

- [02ca9b6 — CSS y TypeScript](https://github.com/Hansolo2077/barberia-cale/commit/02ca9b6f8c2af311d19564293973eb5c281c13ad): añade `src/types/expo.d.ts` para cargar tipos oficiales de Expo en el checkout de CI, conservando el import CSS y las validaciones.
- [36ca8e8 — comprobación real de DeepSource](https://github.com/Hansolo2077/barberia-cale/commit/36ca8e8e199b8dd229e2a5e2e3aa1c855504dfc6): añade la consulta oficial por SHA, encadena Snyk con `needs: deepsource` y permite escanear backend después de un fallo frontend sin convertirlo en éxito.
- [5e69cae — dependencias transitivas](https://github.com/Hansolo2077/barberia-cale/commit/5e69caeb60b28b791801c6da5f02afb4a3bddc7c): contiene **todas** las actualizaciones de las tablas Backend y Frontend de este documento. Su diff muestra las versiones anteriores y nuevas, sin cambiar los manifiestos ni las APIs directas. En Snyk desaparecen User Impersonation de `proxy-addr`, Uncaught Exception de `qs`, Command Injection de `shell-quote`, dos avisos de `brace-expansion`, uno de `compression`, uno de `js-yaml` y diez de `@xmldom/xmldom`: 17 issues corregidos en total. La actualización de `source-map-js` y de instancias de desarrollo también corrige avisos de npm, pero no se cuenta como una reducción Snyk adicional porque no figuraba entre los 22 issues iniciales.
- [1392a69 — acciones Node.js 24 y auditorías](https://github.com/Hansolo2077/barberia-cale/commit/1392a691e8f6703cb70316be51441d03085286bc): actualiza checkout, setup-node, Sonar y github-script a las versiones documentadas, y conserva los reportes npm Antes/Después. No elimina validaciones ni cambia el umbral `high` de Snyk.

## Alcance y compatibilidad

Se actualizaron dependencias transitivas en los dos `package-lock.json` y las versiones de las acciones del workflow. Los dos `package.json`, Express `5.2.1`, Expo `57.0.15`, React Native `0.86.2` y las funcionalidades permanecen sin cambios.

Se investigaron `npm overrides`, pero no fueron necesarios para las correcciones aplicadas: las versiones nuevas satisfacen los rangos de sus dependencias padre. Se prefirió la resolución normal de npm y su lockfile reproducible. No se ejecutó `npm audit fix --force`.

## Mediciones reales de npm audit

Resultados de `npm audit --json`, incluyendo dependencias de desarrollo. Son paquetes afectados según npm, incluidos paquetes que heredan avisos de sus dependencias; no son conteos de CVE únicos ni conteos de Snyk.

| Proyecto | Momento | Moderadas | Altas | Críticas | Total |
| --- | --- | ---: | ---: | ---: | ---: |
| Frontend | Antes | 12 | 26 | 1 | 39 |
| Frontend | Después | 12 | 21 | 0 | 33 |
| Backend | Antes | 1 | 0 | 1 | 2 |
| Backend | Después | 0 | 0 | 0 | 0 |

La severidad corresponde a npm. npm clasifica `qs` como moderada, aunque el reporte Snyk comunicado para esta tarea la clasifica como alta.

Reportes completos, obtenidos antes de editar los lockfiles y después de reinstalar con `npm ci`:

- [Frontend antes](evidencias_pruebas/dependencias/frontend-antes.json) y [después](evidencias_pruebas/dependencias/frontend-despues.json).
- [Backend antes](evidencias_pruebas/dependencias/backend-antes.json) y [después](evidencias_pruebas/dependencias/backend-despues.json).

La auditoría final devuelve `1` en frontend porque conserva vulnerabilidades y `0` en backend. Un código `1` no se interpreta como éxito de seguridad.

## Backend: correcciones aplicadas

| Dependencia | Antes | Después | Justificación |
| --- | --- | --- | --- |
| `proxy-addr` | 2.0.7 | 2.0.8 | Corrige suplantación de IP; Express admite `^2.0.7`. |
| `qs` | 6.15.3 | 6.16.1 | Corrige avisos de análisis de consultas; Express admite `^6.14.0`; la versión también satisface body-parser. |

Comando dentro de `backend`: `npm update proxy-addr qs --package-lock-only --ignore-scripts`. Después se ejecutó `npm ci` con scripts habilitados normalmente. Express conserva su versión y API. `npm ls proxy-addr qs --prefix backend` confirma las versiones corregidas, incluida la copia de `qs` compartida con body-parser.

## Frontend: correcciones aplicadas

| Dependencia | Antes | Después | Padre/rango relevante |
| --- | --- | --- | --- |
| `shell-quote` | 1.10.0 | 1.12.0 | react-devtools-core: `^1.6.1`; supera la corrección 1.11.0 de Command Injection. |
| `@xmldom/xmldom` | 0.8.14 / 0.9.11 | 0.8.15 / 0.9.12 | @expo/plist: `^0.8.8`; plist: `^0.9.10`; corrige inyección XML y denegación de servicio. |
| `brace-expansion` | 1.1.18 / 5.0.9 | 1.1.21 / 5.0.12 | Instancias separadas para minimatch: `^1.1.7` / `^5.0.8`; corrige denegación de servicio. |
| `compression` | 1.8.1 | 1.8.2 | @expo/cli: `^1.7.4`; corrige fuga de memoria y denegación de servicio. |
| `js-yaml` | 4.3.1 | 4.3.2 | Rangos `^4.3.0` / `^4.1.0`; corrige consumo excesivo de CPU. |
| `source-map-js` | 1.2.1 | 1.2.2 | postcss: `^1.2.1`; corrige denegación de servicio. |

Comando: `npm update shell-quote @xmldom/xmldom brace-expansion braces compression image-size js-yaml node-forge source-map-js --package-lock-only --ignore-scripts`. Los paquetes sin una resolución compatible más reciente no cambiaron. Se verificaron los rangos de los padres de cada instancia actualizada y el árbol instalado mediante `npm ls`.

### Pendientes y evaluación de overrides

Las 33 entradas pendientes de npm se originan en estas cinco dependencias y su propagación por Expo, Metro y herramientas relacionadas:

| Dependencia instalada | Investigación y decisión |
| --- | --- |
| `braces@3.0.3` | npm publica 3.0.3 como última versión y la auditoría aún la afecta. Esperar parche del mantenedor o sustitución compatible en sus consumidores. |
| `node-forge@1.4.0` | npm publica 1.4.0 como última versión; persiste el aviso de verificación de firmas RSA. Esperar parche oficial; no sustituir la implementación criptográfica por una no verificada. |
| `image-size@1.2.1` | La corrección está en 2.x, fuera de `^1.0.2` de Metro. La API 2.x usa exportación nombrada `imageSize` y separa lectura de archivos; Metro instalado invoca la exportación por defecto. Forzar 2.x rompe ese contrato. Requiere actualizar el consumidor de forma compatible con Expo. |
| `decode-uri-component@0.2.2` | Corrección en 0.5.0, fuera de `^0.2.2` de query-string. La versión corregida es ESM; el consumidor usa `require` y espera una función. No se fuerza un cambio incompatible del formato de módulos. |
| `uuid@7.0.3` | Corrección en 11.1.1 o posterior, fuera de `^7.0.3` de xcode. xcode utiliza `v4`, mientras el aviso afecta otros generadores con buffer. Un salto de cuatro versiones mayores requiere validar las herramientas de generación y build de iOS; las pruebas locales no demuestran esa compatibilidad. El aviso permanece visible. |

No se aceptaron las sugerencias de npm de retroceder a Expo 44 o React Native 0.72 ni de pasar Router a SDK 58. No se añadieron supresiones ni cambios de umbral de Snyk para reducir el conteo.

## GitHub Actions: Node.js 24

Se consultaron los releases estables oficiales y `runs.using` de sus `action.yml`; los cuatro destinos declaran `node24`:

| Acción | Antes | Después |
| --- | --- | --- |
| `actions/checkout` | v4 | v7.0.1 |
| `actions/setup-node` | v4 | v7.1.0 |
| `SonarSource/sonarqube-scan-action` | v6 | v8.3.0 |
| `actions/github-script` | v7 | v9.0.0 |

Se conserva `ubuntu-latest` con runners hospedados actualizados. El Node.js para ejecutar las pruebas sigue siendo `22`, independiente del runtime interno Node.js 24 de las acciones. Sonar v8 verifica las firmas del scanner por defecto; no se desactiva esa comprobación.

Se mantiene **Tests → SonarCloud → DeepSource → Snyk** mediante `needs`. DeepSource conserva su comprobación real por SHA con la API oficial. Snyk ejecuta backend después de un fallo de frontend y mantiene el job fallido; conserva su umbral existente `high`.

## Validación

| Comprobación | Resultado |
| --- | --- |
| `npm ci` en frontend | Exit 0; informa 33 vulnerabilidades. |
| `npm ci` en backend | Exit 0; 0 vulnerabilidades. |
| `npx tsc --noEmit` | Exit 0. |
| `npm run lint` | Exit 0, sin advertencias de ESLint. |
| `npm run test:notifications` | Exit 0; 4 pruebas aprobadas. |
| `npm test --prefix backend` | Exit 0; 47 pruebas aprobadas. |
| `npm audit --json` en ambos proyectos | Reportes reales enlazados arriba; frontend conserva hallazgos. |
| YAML y dependencias entre jobs | Claves únicas válidas; cadena y comportamiento de pasos preservados, excepto versiones de acciones. |
| Dependencias directas y rangos transitivos | Manifiestos/versiones directas preservados; actualizaciones dentro de los rangos de sus padres. |
| `npx expo install --check` | Exit 1: recomienda parches más recientes de SDK 57 y React Native 0.86.3. Las 18 versiones señaladas ya estaban en el lockfile base; no cambiaron con esta corrección. |

La instalación también avisa que `uuid@7` y `eslint@9` están fuera de soporte. Quedan como mantenimiento pendiente; no se fuerza una migración mayor de las herramientas de Expo.

Snyk no se ejecutó localmente durante la corrección de dependencias por falta de CLI y autenticación. Posteriormente se consultaron los logs autenticados de GitHub Actions: la comparación Snyk real y sus cinco hallazgos altos pendientes están registrados al inicio de este documento. Los conteos npm y Snyk se mantienen separados por sus diferentes bases de avisos, alcances y umbrales.

Los pasos de verificación de `SONAR_TOKEN`, `DEEPSOURCE_PAT` y `SNYK_TOKEN` pasan en la ejecución final consultada. Quedan pendientes las cinco altas de Snyk y el Quality Gate de SonarCloud, además del mantenimiento señalado por npm/Expo. No se ejecutaron builds nativos Android/iOS ni se certifica la compatibilidad de los overrides descartados. Esta actualización cambia documentación; no modifica el workflow ni el código, no modifica `main` y mantiene abierto el PR #7 sin merge.

## Fuentes oficiales

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).
- [npm update](https://docs.npmjs.com/cli/v11/commands/npm-update/) y [npm overrides](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides).
- [Checkout v7.0.1: action.yml](https://github.com/actions/checkout/blob/v7.0.1/action.yml).
- [Setup Node v7.1.0: action.yml](https://github.com/actions/setup-node/blob/v7.1.0/action.yml).
- [Sonar v8.3.0: action.yml](https://github.com/SonarSource/sonarqube-scan-action/blob/v8.3.0/action.yml) y [cambio de firmas en v8](https://github.com/SonarSource/sonarqube-scan-action/releases/tag/v8.0.0).
- [GitHub Script v9.0.0: action.yml](https://github.com/actions/github-script/blob/v9.0.0/action.yml).
- [API DeepSource](https://docs.deepsource.com/docs/developers/api/analysis-run).
- [API image-size 2.x](https://github.com/image-size/image-size/blob/v2.0.0/Readme.md).
- [decode-uri-component 0.5.0](https://github.com/SamVerschueren/decode-uri-component/blob/v0.5.0/package.json).
- Metadatos oficiales consultados con `npm view`; avisos GHSA y rangos conservados en los reportes JSON.
