# Plan de verificación y validación final

> Cierre funcional posterior, 07/11/2026: APK 1.0.1 comprobado nuevamente, 23 casos UI conformes; 27/27 integración reejecutados; 50 backend + 4 notificaciones + 3 seguridad de navegación. API pública identificada por SHA 51a6a28314452045d912d8f0940190a24c344bfb. Las cifras/pendientes del primer corte se conservan como antecedentes y quedan actualizados por [cierre funcional](cierre-funcional.md).


> Estado actual 1.0.1: 0 alertas altas y 11 moderadas frontend; backend 0. Las cifras 3 altas y el APK 1.0.0 de las secciones originales son antecedentes del primer corte. Véase [cierre de seguridad](seguridad-frontend.md) y [nuevo release](notas-release-1.0.1.md).

Objetivo: demostrar correspondencia entre RF-01 a RF-22, implementación, datos y resultados, manteniendo las limitaciones del producto candidato. Alcance: CLIENT/ADMIN, reservas y restricciones, persistencia, seguridad por rol, recordatorios, recuperación y documentación. No se pretende certificar seguridad, SLA, carga masiva, iOS o accesibilidad integral.

Responsable de organización: Hanssel. Ejecución técnica automatizada de esta preparación: Codex con autorización de Hanssel. Revisores humanos nuevos y usuarios de validación: no confirmados; no se atribuyen aprobaciones. Referencias históricas a Ruddy/Steven solo cubren sus PR.

## Riesgos y técnicas

| Riesgo | Técnica | Evidencia |
| --- | --- | --- |
| Doble reserva y límites inconsistentes | Integración HTTP/BD, peticiones simultáneas, valores límite | PF-06 a PF-13, PF-25/27 |
| Acceso de rol/propietario incorrecto | Token ausente, inválido, expirado y rol cruzado | PF-04/10/22/24; IVS-ROLE |
| Escrituras parciales y pérdida de datos | Rollback transaccional y restauración de archivo en otro esquema | PF-26; REC-01 a REC-04 |
| Duplicados y elegibilidad de recordatorios | Claims simultáneos, UUID, backoff e invalidación | PF-17 a PF-21; capturas NF separadas |
| Regresión UI y sesión local | Recorrido manual Android/web, reinicio y logout | UI-P01 a UI-P06, pendientes por acceso |
| Dependencias incompatibles | Expo install --check, TypeScript, lint, tests, builds y npm audit | controles.json y reportes asociados |

## Entrada y salida

Entrada: código identificado por commit y huellas de archivos modificados; dependencias instaladas por lockfile; PostgreSQL accesible; datos sintéticos; destinos/credenciales separados; no activar proveedores externos en integración o recuperación.

Salida de campaña: resultados por caso con fecha, ambiente, esperado/obtenido y evidencia; cero fallos críticos no explicados; limpieza de esquemas; bitácora actualizada; regresión de correcciones. Salida de liberación general: además revisión visual final, aceptación de negocio y evaluación de riesgos de dependencias. No equiparar salida de campaña automatizada con autorización de liberación.

Cada JSON contiene precondiciones, pasos, entradas/fixtures, esperado, observado, estado y timestamps. El responsable de ejecución indicado aquí aplica a esta campaña. sourceCommit es la base, no un commit que mágicamente incluya cambios sin guardar; el manifiesto conserva hashes exactos. No sumar campaña inicial y regresión como casos distintos.

## Reproducción

```powershell
node scripts/quality-checks.cjs docs/evidencias_pruebas/ivs-2026-11-07/reproduccion-controles
node scripts/quality-integration.cjs docs/evidencias_pruebas/ivs-2026-11-07/reproduccion-integracion.json
node scripts/ivs-recovery.cjs docs/evidencias_pruebas/ivs-2026-11-07/reproduccion-recuperacion
```

quality-checks devuelve fallo ante hallazgos de auditoría o incompatibilidad; revisar el ID y estado y no tratar todo exit 1 como fallo funcional. Los dos ensayos de BD reemplazan nombres de esquema únicamente y limpian los espacios efímeros. No ensayan caídas de la plataforma externa. ivs-live requiere el archivo privado de accesos, solo hace login/lecturas y genera observaciones de disponibilidad limitadas.

## Casos manuales preparados

| ID | RF | Precondición/acción | Esperado | Estado |
| --- | --- | --- | --- | --- |
| UI-P01 | RF-03 | CLIENT con recordar; cerrar/reabrir app | Recupera identidad tras revalidación; sin recordar no conserva sesión | PASS para recordar=true y reinicio; recordar=false no ensayado separadamente |
| UI-P02 | RF-04/16 | Salir de CLIENT y ADMIN y volver al área privada | Regresa a login; no permite área privada sin identidad | PASS en logout de ambos; CLIENT sin identidad tras reinicio |
| UI-P03 | RF-05/07/08 | Datos futuros y cerrados de prueba; consultar filtros | Próximas e historial segregan/ordenan correctamente | PASS para bloque deshabilitado y cita #57; múltiples registros/orden no exhaustivos |
| UI-P04 | RF-17 | ADMIN acepta/rechaza fixture | Abre mensaje preparado; no enviar mensaje real | NO EJECUTADO; no se enviaron mensajes |
| UI-P05 | RF-06/09/11/15 | Fixture propio autorizado, recorrer creación→gestión→consulta | UI/API/BD consistentes, confirmar o volver funciona; COMPLETED solo elegible | PASS creación/asistencia/cancelación UI y aceptación API ADMIN de #57; COMPLETED UI no ejecutado |
| UI-P06 | RF-18/19/20/21/22 | Build nativo identificado y dispositivo autorizado | Recepción, respuesta y estado ADMIN correlacionados por cita/build/hora | NO EJECUTADO en APK final; NF históricas disponibles |

La ejecución manual final fue por ADB en el APK identificado por SHA-256, después de recuperar acceso al emulador. Resultado: 11/11 comprobaciones del protocolo reducido, no once casos automáticos adicionales. Se creó únicamente la cita dummy #57 (8/11/2026 10:00), aceptada por API ADMIN; se confirmó asistencia y se canceló desde UI. Quedó CANCELLED y el horario disponible. Ver interfaz-apk.json y recorrido-cita.json; no sumar esos resultados como cobertura completa.

## Inspección y defectos

Inspección documental: cotejar guía IVS con matriz de correcciones, cinco hallazgos, criterios de aceptación, diccionario, manuales, instalación, migración y resultados. Inspección de código: separación src/app→src/api→rutas/middleware→servicios→SQL, validaciones cliente/servidor, JWT y autorización, errores y credenciales. La evidencia de octubre se conserva en auditoria-defectos.md; la nueva bitácora aparece en estado-preparacion.md.

Por defecto guardar ID, RF, severidad, reproducción, responsable, fecha, commit/huella de corrección, prueba de regresión y estado. No cerrar por existir un diff o una compilación si falta comprobar el comportamiento. Las pruebas negativas aprobadas no son defectos. Nuevos hallazgos no reproducibles conservan estado de investigación.


## Actualización de seguridad 1.0.1

El cierre posterior del 07/11/2026 elimina las tres alertas altas de la cadena Expo Router/query-string/decoder: auditoría frontend actual 0 altas, 11 moderadas y 0 críticas; backend 0. Se mantienen los resultados del release 1.0.0 como antecedentes fechados, no como pruebas del nuevo binario. Véase [corrección, reproducción y límites](seguridad-frontend.md) y los [controles posteriores](../../../docs/evidencias_pruebas/ivs-2026-11-07/seguridad-frontend/controles.json). El nuevo candidato se identifica como v1.0.1-ivs.20261107; no se sustituye el release previo.
