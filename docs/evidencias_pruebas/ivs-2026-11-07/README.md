# Evidencias de preparación IVS del 7 de noviembre de 2026

Este corte es independiente de las evidencias de Calidad del 31/10. Ejecución asistida por herramientas automatizadas, bajo autorización de Hanssel. Los reportes usan UTC; contexto académico Guatemala. No contiene el PDF final ni credenciales utilizables.

| Archivo | Contenido y límites |
| --- | --- |
| antes-parches/ | Controles y auditoría previos, 6 altas frontend y compatibilidad no conforme |
| controles.json y TXT/JSON asociados | TypeScript, lint, suites y auditorías posteriores; exit global no cero si quedan hallazgos |
| integracion-inicial.json | Primera campaña del 7/11, 23 escenarios históricos reejecutados |
| integracion-final.json | Campaña ampliada de 26 escenarios |
| regresion-final.json | Última campaña con PF-27, límite exacto inclusivo con reloj transaccional real |
| restauracion.json | REC-01–04: archivo sintético restaurado en esquema independiente, igualdad/FK/secuencia y limpieza |
| respaldo-sintetico.json | Datos ficticios de cuatro tablas; hashes deliberadamente inutilizables y token de dispositivo ficticio |
| diccionario.md / diccionario.json | Columnas, restricciones e índices desde estructura reconstruida en PostgreSQL |
| despliegue.json | Diez checks de lectura/login con roles y seis observaciones de health; sin cuerpos de citas ni secretos |
| compilacion.json | APK release, bundle integrado, cuatro arquitecturas, firma local de evaluación y SHA-256; build web de doce rutas |
| interfaz-apk.json / capturas/ | Once comprobaciones manuales por ADB y doce capturas seleccionadas, con paquete/hash del APK |
| recorrido-cita.json | Cita dummy #57: PENDING→ACCEPTED→asistencia CONFIRMED→CANCELLED, horario liberado; aceptación por API y resto desde UI |
| manifiesto.json | Huellas de fuentes/evidencias para identificar el candidato |

Los distintos conjuntos no deben sumarse como casos únicos ni interpretarse como cobertura de código. La API local prueba rutas y PostgreSQL reales con fixtures; no envía push. La observación publicada no identifica SHA desplegado. La restauración no ensaya caída de Supabase ni recupera secretos/cron/Storage. ADB permitió superar el bloqueo inicial: hay once comprobaciones conformes del APK; WhatsApp, cron/push final, iOS y recorrido web no se ejecutaron.

Documentos de preparación: [IVS final](../../../proyecto/docs/ivs-final/README.md). Registros originales de Calidad y capturas de octubre conservan sus propias fechas, sin presentarse como ejecuciones nuevas.
