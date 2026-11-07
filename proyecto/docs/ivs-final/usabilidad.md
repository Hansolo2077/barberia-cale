# Revisión de usabilidad y evolución

> Cierre funcional posterior, 07/11/2026: APK 1.0.1 comprobado nuevamente, 23 casos UI conformes; 27/27 integración reejecutados; 50 backend + 4 notificaciones + 3 seguridad de navegación. API pública identificada por SHA 51a6a28314452045d912d8f0940190a24c344bfb. Las cifras/pendientes del primer corte se conservan como antecedentes y quedan actualizados por [cierre funcional](cierre-funcional.md).


Base: cinco hallazgos de la sección 17.3 del Hito 1 de IVS y observaciones docentes. Revisión actual de código: 7/11/2026. La escala histórica es baja/media/alta. Esta revisión no es una encuesta SUS ni una nueva sesión de usuarios. Computer Use falló inicialmente; después se verificó un recorrido reducido del APK mediante ADB autorizado, con resultados en interfaz-apk.json.

| ID | Pantalla y hallazgo anterior | Heurística de Nielsen | Severidad | Corrección identificada | Evidencia y estado |
| --- | --- | --- | --- | --- | --- |
| UX-01 | Reserva sin indicador de progreso | Visibilidad del estado del sistema | Media | Secciones numeradas 1 fecha y 2 hora, resumen y estados de carga; no se exige un componente llamado Stepper si el objetivo se satisface | appointment.tsx stepHeader/stepBadge; incorporación b37cce8; capturas 12–14. Implementación comprobada por código; revisión visual final pendiente |
| UX-02 | Cancelación inmediata | Prevención de errores; control y libertad | Alta | Alert con Volver y Sí, cancelar; en web window.confirm; solo confirmar llama al servicio | my-appointments.tsx request/handleCancel; capturas 38/39; PF-11/25/27 prueban backend. No equivale a probar el botón Volver final |
| UX-03 | Horarios libres y ocupados similares | Visibilidad del estado; reconocimiento | Media | Botones no elegibles deshabilitados, estilo diferenciado, etiqueta accesible disponible/ocupado/no elegible | appointment.tsx selectable, unavailableTime y accessibilityState; capturas 11/41. UI final pendiente |
| UX-04 | Bajo contraste de textos secundarios en login | Consistencia y estándares; reconocimiento legible | Baja | Paleta central textSecondary/textMuted y estilos del login con etiquetas y errores por campo | app-theme.ts y login.tsx; capturas 01/02. Medición de pares de color preparada en evidencia; no certifica WCAG integral ni todos los estados |
| UX-05 | Saturación de información en panel móvil | Diseño estético y minimalista; flexibilidad y eficiencia | Media | Tarjetas con detalle expandible, filtros y acciones contextuales | admin/appointments.tsx expandedAppointmentId/card/expandedDetails; capturas 18/19/26/31. Implementación visible históricamente; revisión final con tamaño real pendiente |

## Evidencia antes y después

ANTES: el Hito 1 conserva los cinco problemas y dos mejoras descritas. El historial Git permite contrastar código auténtico anterior y posterior. DESPUÉS: capturas históricas muestran confirmación de cancelación, horarios y tarjetas; el código actual conserva las correcciones. Las capturas históricas no se etiquetan como pruebas del binario actualizado de noviembre.

Las imágenes previas a cada corrección no se localizaron en las fuentes revisadas. No se recrean como si fueran capturas históricas. Para el PDF, mostrar el hallazgo original y diff real → explicación de modificación → captura posterior disponible, y declarar esta limitación. La ausencia de una imagen ANTES no se oculta con una captura de PENDING seguida de ACCEPTED: ese cambio muestra negocio, no una corrección de usabilidad.

[usabilidad-codigo.json](../../../docs/evidencias_pruebas/ivs-2026-11-07/usabilidad-codigo.json) conserva referencias Git auténticas antes/después, huellas de fuentes actuales y contraste calculado para textSecondary/textMuted sobre surface/background. Los conteos léxicos sirven para localizar código; no son resultados de pruebas de interfaz.

## Protocolo de comprobación visual final

Usar datos dummy y registrar versión/build, plataforma, resolución y fecha. Comprobar: orientación de pasos; imposibilidad de seleccionar ocupado; legibilidad del login; abrir cancelación y volver sin mutar, luego cancelar solo una cita de prueba autorizada; expandir/contraer tarjetas sin desbordamiento. Registrar cada hallazgo como cerrado, parcial o abierto según evidencia, no según intención.

La inspección inicial de la tabla no cerraba una prueba visual. Actualización final: UX-02 quedó reejecutado en el APK con diálogo Volver/Sí cancelar, preservación del estado al volver y cancelación real de #57; UX-03 tiene captura de bloque no disponible sin selección y bloque disponible con resumen. UX-01 muestra la etapa de horarios/resumen y conserva la inspección de pasos en código. UX-04 tiene pares de contraste medidos y pantalla de login; no constituye evaluación visual integral. UX-05 conserva inspección estática y evidencia histórica, sin prueba nueva de tarjetas expandibles ADMIN. SUS ≥70 permanece no medido.
