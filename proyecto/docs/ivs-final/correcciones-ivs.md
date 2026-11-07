> **Aclaración de rendimiento posterior al cierre:** RNF-01 exige <500 ms en condiciones normales y contempla latencia inicial por cold start. Se separa la primera solicitud y se conservan 45 muestras del servicio activo: login p95 905,670 ms; disponibilidad 651,064 ms; mis citas 308,141 ms. IVS-D06 sigue abierto por desviaciones observadas, sin deducir incumplimiento general del arranque inicial. Ver [medición y alcance](rendimiento-publicado.md).

# Correcciones de I y II de Implementación y Validación

> Cierre funcional posterior, 07/11/2026: APK 1.0.1 comprobado nuevamente, 23 casos UI conformes; 27/27 integración reejecutados; 50 backend + 4 notificaciones + 3 seguridad de navegación. API pública identificada por SHA 51a6a28314452045d912d8f0940190a24c344bfb. Las cifras/pendientes del primer corte se conservan como antecedentes y quedan actualizados por [cierre funcional](cierre-funcional.md).


Fuentes: Retroalimentacion.docx del Parcial I y New Microsoft Word Document.docx del Parcial II, en Implementacion de software/Examen III. Estos son los hallazgos de IVS; no se sustituyen por la matriz de Calidad. Fecha de seguimiento: 7/11/2026. Responsable de consolidación: Hanssel. Evidencia nueva: docs/evidencias_pruebas/ivs-2026-11-07.

| ID | Observación docente | Acción/evidencia | Estado |
| --- | --- | --- | --- |
| IVS-I01 | Diagrama gráfico de arquitectura | Vistas gráficas 01/02 de arquitectura-actual, editables PlantUML e índice; integrar legibles al PDF | Material disponible; cierre editorial al generar PDF |
| IVS-I02 | Diagrama visual de componentes/capas | 03-componentes-capasy-modulos y módulos del documento técnico | Material disponible; integrar al PDF |
| IVS-I03 | Capturas o prototipo verificable | Banco 03/10 y doce capturas nuevas del APK, relacionadas con interfaz-apk.json | Atendido para flujos representativos; no se afirma cobertura completa |
| IVS-I04 | Evidencia ANTES → problema → mejora → DESPUÉS | usabilidad.md relaciona cinco problemas, corrección de código y capturas posteriores | Parcial: no se localizaron imágenes anteriores auténticas; no se fabrican |
| IVS-I05 | Aceptación más allá de RF-06 | aceptacion-trazabilidad.md define criterios observables para los 22 RF | Atendido documentalmente; verificaciones pendientes declaradas |
| IVS-I06 | Repositorio y aportes de tres integrantes | URL en índice, revisiones-github.json histórico y commits/PR asociados | Histórico disponible; composición final por confirmar |
| IVS-I07 | Duplicación de sección 24 | Documentos fuente nuevos con estructura consistente; el Hito histórico no se altera | Pendiente de comprobación en índice/PDF consolidado |
| IVS-II01 | Pruebas automatizadas API/auth/permisos/reserva | Suites, PF-01 a PF-27 según regresion-final.json; plan-vv.md | Automatización y resultados incorporados; límites UI explícitos |
| IVS-II02 | Concurrencia mismo horario | PF-12 real HTTP/PostgreSQL: 201/409 y exactamente una activa | Conforme en escenario de dos solicitudes |
| IVS-II03 | Aislar cuentas y fortalecer contraseñas | Credenciales excluidas del expediente; lecturas dummy comprobadas; runners con datos/JWT sintéticos | Parcial: cuentas publicadas comparten servicio del piloto; no se demostró aislamiento operativo. Registro acepta mínimo 6 caracteres; no se declara política fuerte |
| IVS-II04 | Rendimiento y disponibilidad | Muestras p95 de integración; despliegue.json con 6 observaciones de health y checks autenticados | Medición puntual ejecutada; no equivale a disponibilidad sostenida/SLA; primer login lento registrado |
| IVS-II05 | Indicadores y retroalimentación del piloto | manual-capacitacion.md incorpora instrumento de uso/incidencias/evaluación | Pendiente de registros reales; no se inventan encuestas ni uso |
| IVS-II06 | Restauración de respaldo y recuperación | REC-01 a REC-04, archivo de respaldo sintético, comparación exacta/FK/secuencias; PF-26 rollback | Ensayo controlado conforme; no es restauración de producción ni backup completo de Supabase |
| IVS-II07 | PR y contribuciones individuales | Evidencia histórica conservada; cambios nuevos atribuidos a Hanssel/Codex | Atendido para historial; sin aprobación humana nueva |

Cada estado se refiere a su evidencia, no a una puntuación anticipada. Integrar esta matriz con sus enlaces y resultados en el PDF; no marcar todas las filas como cerradas por el simple hecho de tener documentos nuevos.
