# Preparación técnica del Parcial III de Barbería Cale

Corte: 31 de octubre de 2026, zona America/Guatemala. Este paquete reúne registros técnicos para preparar el informe final; no es el PDF del entregable. El alcance funcional sigue siendo RF-01 a RF-22.

La campaña real contra HTTP y PostgreSQL aprobó 23/23 escenarios y su regresión conserva el resultado 23/23 → 23/23. Las claves expuestas fueron rotadas y verificadas en la API publicada. Los controles actuales y sus límites se presentan sin convertir evidencia histórica en una ejecución nueva.

Compilación web: PASS, 12 rutas. Compilación Android: PASS. El APK de verificación incluye el bundle JavaScript; su generación no sustituye la campaña UI. El usuario confirma la app corriendo en el emulador, pero la inspección visual propia no pudo completarse porque el acceso Computer Use siguió detenido tras el reintento autorizado.

| Registro | Contenido |
| --- | --- |
| [Línea base y Plan de Calidad](plan-calidad-final.md) | Versión, alcance, responsabilidades, criterios y controles |
| [Correcciones I y II](correcciones.md) | Las doce observaciones del docente y sus respaldos |
| [Antecedentes verificados](antecedentes-verificados.md) | Pruebas visuales del II y automatización documentada en Others |
| [Notificaciones verificadas](notificaciones-verificadas.md) | Recepción Android, confirmación del cliente y resultado administrativo |
| [DoD y backlog](dod-devops-backlog.md) | Terminado verificable, flujo CI y mejoras pendientes |
| [Pruebas finales](pruebas-finales.md) | Casos, pasos, resultados, regresión y reproducción |
| [KPI y PDCA](kpi-pdca.md) | Tablero, fórmulas, comparaciones y decisiones |
| [Auditoría y defectos](auditoria-defectos.md) | Checklist de cierre y seguimiento central |
| [Trazabilidad](trazabilidad-final.md) | Los 22 RF, atributos, controles, pruebas y límites |
| [Acceso seguro](acceso-seguro.md) | Procedimiento de evaluación sin claves en el expediente |
| [Índice de evidencias](../../../docs/evidencias_pruebas/parcial-iii/README.md) | Artefactos originales y manifiesto SHA-256 |


Decisión técnica: mantener piloto controlado. No declarar liberación general con 6 entradas altas de npm en frontend o validación móvil incompleta. La recepción de push sí está respaldada por las cuatro imágenes nuevas; el origen automático fue confirmado por el estudiante. No se afirma que los parches locales estén desplegados. El informe puede documentar honestamente estas limitaciones, como permite la guía.

Los únicos datos pendientes que requieren participación humana son las respuestas SUS reales y una revisión independiente de estos cambios nuevos si se exige aprobarlos. No se inventan encuestas ni aprobaciones. Las revisiones históricas de Ruddy y Steven sí están conservadas en GitHub.
