# Barbería Cale 1.0.1 — Revisión final de IVS

- RNF-01 revisión 1 documentada: <1 s en operación normal activa, con autorización, justificación costo-beneficio y antecedente original de 500 ms preservado.
- 45 muestras del backend publicado: todas HTTP 200 y <1 s. Solicitud inicial separada; no se atribuye una mejora de código.
- Seis regresiones de calendarios APK aprobadas: Cancelar/Atrás conservan fecha CLIENT y ambos extremos ADMIN (DEF-01/02).
- Diez casos del recorrido web principal, cita dummy #63: reserva, aceptación ADMIN, agenda, asistencia, cancelación e historial; disponibilidad recuperada.
- Reproducción principal unificada en esta etiqueta. Se conservan 23 casos APK previos, 27/27 integración, 50 backend, 4 notificaciones y 3 seguridad con sus fechas.

Mismo APK 1.0.1/código 2, SHA256 4318b1d55452b1c13bc10147e8570237104e0159d57fc5c3c21c8230ab582e6f. Backend Render observado: 51a6a28314452045d912d8f0940190a24c344bfb; árbol backend a3bd52fab1f12dfcfa6c810fd56730eb741d1700 idéntico. Se añaden documentos y evidencia; no se recompila un binario sin cambios.

El ZIP incluye reportes, capturas y manifiesto sin contraseñas o tokens; se publica SHA256SUMS.txt. Permanecen once alertas moderadas frontend, cero altas; backend cero. No certifica seguridad integral, SLA o carga masiva. Web probada en Edge de escritorio, publicación existente; sin afirmar redespliegue o SHA frontend desconocido. Video se entrega aparte.
