# Definition of Done y backlog de calidad

## Definition of Done adoptada para el cierre

Una tarea se considera terminada cuando identifica RF/RC afectados y un criterio observable; el cambio está acotado y revisado; TypeScript y ESLint pasan; pasan las pruebas aplicables positivas, negativas y de regresión; no introduce secretos; actualiza requisitos y registro de cambios; conserva fecha, versión/huella, resultado y enlace a evidencia. Si necesita revisión independiente, debe existir aprobación real de otra persona; la autoevaluación no la sustituye. Una tarea puede estar implementada sin cumplir aún la DoD.

Criterios críticos: RF-06/RC-04 exige una sola cita activa bajo competencia simultánea y conflicto para la otra petición; RF-16 exige 401/403 sin modificar datos; RF-20 exige conservar el primer timestamp al repetir; RF-22 exige un solo trabajo activo, claim exclusivo, reintento registrado y anulación al confirmar/cancelar. PF-12, PF-04, PF-09 y PF-18/19/20 verifican estos criterios.

## Flujo real y ampliación local

Cambio con requisito → rama → diff y revisión → TypeScript/lint/pruebas → análisis Sonar con Quality Gate → DeepSource por SHA → Snyk → decisión registrada → integración/liberación si cumple. Las revisiones históricas de PR #1 a #6 son evidencia real. PR #7/#8 no tienen revisión humana registrada en la consulta.

El workflow existente ejecutaba Tests → SonarCloud → DeepSource → Snyk. Esta rama añade PostgreSQL 17 efímero y la campaña de integración al job Tests y espera el Quality Gate de Sonar. La ampliación está implementada; no tiene ejecución remota aprobada en este corte. No se reutilizan credenciales de producción en CI. Los roles y claves de PostgreSQL de CI pertenecen exclusivamente al servicio descartable del runner.

| ID | Mejora o deuda | Prioridad | Responsable | Estado | Criterio de cierre |
| --- | --- | --- | --- | --- | --- |
| BQ-01 | Dependencias altas del frontend | Alta | Hanssel | Abierto | 0 altas/críticas en escáneres definidos o evaluación formal de excepción; hoy npm 6 altas |
| BQ-02 | Publicar/verificar parches y CI de esta rama | Alta | Hanssel | Pendiente de integración | PR revisado; checks del SHA final; despliegue identificado y smoke test |
| BQ-03 | Recepción push y respuesta visible | Alta | Hanssel | Recepción documentada | NF-01 a NF-04: bandeja Android, confirmación CLIENT y proyección ADMIN; origen automático confirmado por el estudiante |
| BQ-04 | RC-05: feedback UI y cold start | Media | Hanssel | Parcial | Instrumentar acción a feedback, entorno definido y series separadas frío/caliente |
| BQ-05 | RC-06 SUS con usuarios | Media | Hanssel y participantes | No medido | Respuestas reales anonimizadas, muestra/fecha/build y cálculo SUS |
| BQ-06 | Regresión de sesión y calendarios Android/web | Alta | Hanssel | Parcial | Reinicio con sesión, logout y calendarios con pasos y capturas del build final |
| BQ-07 | Revisión humana de cambios nuevos | Media | Revisor que acepte | Pendiente | Review real con alcance, observaciones y decisión |
| BQ-08 | Revocar JWT previamente emitidos | Alta | Hanssel | Abierto | Política de revocación/expiración y prueba de rechazo; rotación de clave no revoca JWT existentes |
| BQ-09 | Parches recomendados de SDK 57 | Media | Hanssel | Abierto | Alinear los 18 paquetes señalados por expo install --check y repetir builds/pruebas; no confundir recomendación con parche ya aplicado |
| BQ-10 | Correlación de notificación con reloj/build/job | Media | Hanssel | Pendiente | Identificar build y job y explicar fechas/reloj de las capturas; no extrapolar a la ventana automática de una hora |


No se fuerza SDK 58, overrides incompatibles ni supresiones para mejorar conteos. Los reportes de npm cuentan paquetes afectados y su propagación; los conteos históricos de Snyk tienen otra fuente/umbral y no se comparan como una misma serie.
