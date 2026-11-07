> **RNF-01 vigente, revisión 1 (CR-RNF-01-20261107):** objetivo HTTP <1 segundo en condiciones normales, servicio activo; latencia inicial registrada aparte. Autorizado por Hanssel el 07/11/2026. Las 45 muestras activas cumplen el objetivo revisado; se preservan el antecedente de 500 ms y sus desviaciones. Ver [justificación, evaluación y seguimiento](revision-rnf-01.md).

# Barbería Cale 1.0.1 — cierre funcional IVS, revisión 2

Mismo APK 1.0.1 / versionCode 2 del cierre de seguridad, ahora comprobado con un recorrido funcional completo y controles administrativos adicionales. SHA-256 del binario: 4318b1d55452b1c13bc10147e8570237104e0159d57fc5c3c21c8230ab582e6f.

23 casos UI conformes: reserva #58, aceptación ADMIN por interfaz, WhatsApp con destinatario/borrador sin envío, rechazo, cancelación administrativa, completar una cita pasada, agenda/búsqueda, push manual job #7 y automático #62 recibidos en el mismo APK, asistencia, cancelación/historial/horario liberado y sesiones. Se utilizaron únicamente cuentas y fixtures dummy; se cerró el dispositivo temporal y se desactivó su token.

27/27 integración HTTP/PostgreSQL reejecutadas; 50 backend + 4 notificaciones + 3 seguridad de navegación conformes. Frontend 0 altas y 11 moderadas; backend 0. No se afirma cobertura total ni seguridad integral.

Backend Render identificado en /api/health como 51a6a28314452045d912d8f0940190a24c344bfb. El árbol backend a3bd52fab1f12dfcfa6c810fd56730eb741d1700 permite contrastarlo con esta revisión documental del repositorio. Los cambios de esta revisión después de dicho despliegue son documentación, evidencias y un verificador HTTP, sin modificar el código backend ni frontend comprobados.

Descargar el APK, comparar SHA256SUMS.txt e instalar como actualización con adb install -r. Firma Android Debug local para evaluación; no firma Play Store. El ZIP adjunto conserva la evidencia fechada, matrices y fuentes. Las cuentas dummy se incluyen en el PDF autorizado para el docente; no se incorporan contraseñas al ZIP.

Ver proyecto/docs/ivs-final/cierre-funcional.md para pasos, fixtures, correlación y límites. iOS, recorrido web integral, envío de WhatsApp y acción directa del botón de notificación no se presentan como ejecutados. El video se prepara aparte.
