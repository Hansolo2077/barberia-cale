# Antecedentes verificados para las correcciones

Revisión del 31/10/2026. Se examinó el texto completo del PDF de Others y se inspeccionaron visualmente los anexos pertinentes del II Parcial. Los originales se conservan en proyecto/entregas; no se vuelven a publicar aquí, porque el II contiene una tabla de claves expuestas. Los datos de acceso nuevos no forman parte de este registro.

## Prueba y validación de software en línea

Fuente local: proyecto/entregas/Others/Prueba y validación de software en linea.pdf, dos páginas. La página 2 documenta la ejecución de controles mediante PR #7 y PR #8: Tests, SonarCloud, DeepSource y Snyk; correcciones de dependencias; endurecimiento del pipeline y fusión de ambos PR. Es evidencia documental de trabajo aplicado, complementada por metadatos, reportes y logs ya existentes. No corresponde clasificar toda la automatización como una propuesta sin ejecutar.

La reducción histórica de Snyk 22 → 5 pertenece al PR #7; el PR #8 conservó cinco hallazgos altos del frontend. Estos conteos no se mezclan con npm audit del 31/10. El documento pertenece a Implementación y Validación de Software, con el mismo proyecto y docente; se utiliza como evidencia técnica complementaria, sin presentarlo como una nueva rúbrica de Ingeniería de Calidad.

PR: https://github.com/Hansolo2077/barberia-cale/pull/7 y https://github.com/Hansolo2077/barberia-cale/pull/8. Metadatos y revisiones: [revisiones-github.json](../../../docs/evidencias_pruebas/parcial-iii/revisiones-github.json). Reportes históricos: docs/analisis-calidad-seguridad.md, docs/remediacion-seguridad-pr8.md y docs/evidencias_pruebas/pr8/.

## Evidencia funcional del II Parcial

Fuente local: proyecto/entregas/Parcial II/II_Parcial_Avance_Proyecto_Barberia_Cale_Hanssel_Nunez.pdf, 39 páginas. La tabla de la página 16 registra diez casos del 03/10/2026, todos aprobados, incluidos tres negativos. Los anexos de las páginas 26–35 contienen capturas de la interfaz Android; las páginas 36–39 contienen persistencia e infraestructura de Supabase.

| Caso | Comprobación | Página del PDF | Capturas |
| --- | --- | --- | --- |
| PR-01 / PR-04 | Login ADMIN y rechazo de campos vacíos | 26 | 04 / 02 |
| PR-02 | Creación y consulta de cita pendiente | 27 | 23 / 25 |
| PR-03 | Aceptación administrativa y estado recuperado por CLIENT | 28 | 29 / 35 |
| PR-05 | Cancelación por CLIENT e historial | 29–30 | 38 / 40 / 41 |
| PR-06 | Rechazo de una segunda cita activa el mismo día | 30 | 42 |
| PR-07 | Rechazo administrativo y consulta en agenda | 31 | 44 / 54 |
| PR-08 / PR-09 | Celular duplicado y registro con acceso automático | 32 | 48 / 50 |
| PR-10 | Cancelación administrativa y estado final de agenda | 33–34 | 52 / 53 / 33 |
| RF-20 adicional | Confirmación de asistencia desde Mis citas | 34 | 37 |
| Complementarias | Disponibilidad y guía administrativa | 35 | 11 / 16 |
| Infraestructura | Esquema, tablas, registros, funciones, triggers y Edge Function | 36–39 | L1 a L7 |


Estas evidencias se conservan como ejecución histórica, no como pruebas repetidas hoy. Las capturas de asistencia prueban la acción en la app; no demuestran por sí solas recepción de push. El propio PDF aclara en la página 39 que SENT es procesamiento interno, no confirmación visual de entrega al dispositivo. Las pruebas de octubre y los 23 escenarios nuevos se complementan; no se declara que faltan por completo las pruebas funcionales visuales.

## Efecto sobre el seguimiento

La observación de automatización está atendida mediante el CI existente y ejecutado. La ampliación de pruebas se sustenta en los diez casos históricos, los escenarios críticos nuevos y las cuatro capturas de notificaciones descritas en notificaciones-verificadas.md. H-01 se atendió con el registro central; H-02 con estandarización e instrumentación HTTP gradual. Permanecen separados los riesgos y mejoras adicionales: correlación de reloj/versión/job de las capturas, sesiones/calendarios reejecutados en el build final, instrumentación visual/frío, SUS coordinado con usuarios y ejecución remota de la ampliación nueva de CI.
