# Migración de datos y recuperación

> Cierre funcional posterior, 07/11/2026: APK 1.0.1 comprobado nuevamente, 23 casos UI conformes; 27/27 integración reejecutados; 50 backend + 4 notificaciones + 3 seguridad de navegación. API pública identificada por SHA 51a6a28314452045d912d8f0940190a24c344bfb. Las cifras/pendientes del primer corte se conservan como antecedentes y quedan actualizados por [cierre funcional](cierre-funcional.md).


## Procedimiento de migración

El origen propuesto es un registro anterior de citas exportado a CSV o transcrito con autorización. No se presume que exista un archivo real del negocio. El destino es una instancia de pruebas con el esquema de Barbería Cale. Una migración de datos de ese origen no fue ejecutada en esta preparación; sí se ejecutó el ensayo de respaldo/restauración descrito después.

| Etapa | Acción y criterio verificable |
| --- | --- |
| Origen | Inventariar archivo, columnas, codificación, zona horaria y responsable; no asumir consentimiento para publicar datos |
| Respaldo | Copiar origen de forma privada e inmutable; registrar fecha, tamaño y SHA-256. Respaldar destino antes de cargar |
| Extracción | Separar usuarios y citas; producir copia de trabajo; conservar referencia de fila original |
| Transformación | Normalizar celular, espacios/nombres, fecha ISO y hora; mapear estados; separar asistencia de estado operativo; rechazar sin inventar valores |
| Identidad | Resolver duplicados por celular y claves externas; crear tabla privada origen→ID destino. No trasladar contraseñas en texto ni fabricar tokens |
| Reglas | Detectar doble horario activo y referencias a usuarios inexistentes. Revisar citas históricas que no deben pasar por reglas de reserva futura |
| Carga | Ejecutar en staging, orden users→appointments; dispositivos/jobs no se importan de una fuente manual. Usar transacción y abortar por error |
| Validación | Conteos origen válidos = insertados+rechazados; justificar rechazo por fila. Comprobar PK/FK, duplicados, fechas, estados y muestras funcionales |
| Aceptación | Responsable de negocio revisa muestra y diferencias; registrar aprobación real antes de producción |
| Rollback | Antes de COMMIT: ROLLBACK. Después: restaurar respaldo en destino independiente, validar y cambiar conexión de forma coordinada; no borrar origen |

Las cuatro migraciones SQL de estructura se aplican antes de cargar. No son una ETL de citas del negocio. Mantener ID de ejecución, responsable, versión, archivos y resultados. No ejecutar importación en producción solo para conseguir evidencia académica.

## Ensayo ejecutado de respaldo y restauración

Reproductor: scripts/ivs-recovery.cjs. Resultado original: [restauracion.json](../../../docs/evidencias_pruebas/ivs-2026-11-07/restauracion.json). Archivo leído en la restauración: [respaldo-sintetico.json](../../../docs/evidencias_pruebas/ivs-2026-11-07/respaldo-sintetico.json).

El ensayo crea dos esquemas aleatorios restringidos por prefijo, instala schema.sql y las cuatro migraciones en ambos y utiliza exclusivamente fixtures. No lee las tablas operativas. Exporta dos usuarios, una cita, un dispositivo ficticio y un trabajo de notificación ficticio; modifica la cita de origen para simular pérdida del estado respaldado y restaura el archivo en el segundo esquema.

Se comprobó igualdad de todas las columnas mediante JSON canónico y SHA-256, integridad FK (rechazo 23503 para un usuario inexistente), secuencia siguiente sin colisión y limpieza de ambos esquemas. El reporte contiene duración observada de reconstrucción/importación y hashes de scripts y archivo. El diccionario se obtuvo consultando la estructura instalada.

```powershell
node scripts/ivs-recovery.cjs docs/evidencias_pruebas/ivs-2026-11-07/reproduccion-restauracion
```

Requiere DATABASE_URL configurada fuera de Git con permiso para esquemas efímeros. Es un respaldo lógico de datos de aplicación y reconstrucción desde SQL versionado, no un pg_dump completo. No respalda roles globales, Vault, cron, archivos de Storage, secretos ni estado de proveedores. No se declara que se haya restaurado producción ni que ese tiempo sea RTO/RPO comprometido.

PF-26 complementa con rollback transaccional real: una operación válida seguida de FK inválida deja cero escrituras parciales. PF-23 comprueba nueva conexión. Son pruebas diferentes y no deben sustituirse entre sí.

## Recuperación operativa propuesta

Antes de un despliegue, obtener backup privado completo del proveedor o pg_dump adecuado a la plataforma; registrar versión, fecha, alcance y custodia cifrada. Verificar que las herramientas y permisos incluyen las estructuras necesarias. Restaurar primero en una instancia independiente; comprobar conteos, restricciones, secuencias, login, reservas y trabajos. Deshabilitar envíos externos del entorno de ensayo para no duplicar recordatorios. Tras aprobación del responsable, efectuar el cambio de conexión/control de tráfico y observar errores. Conservar la instancia anterior hasta aceptar la recuperación.

Frecuencia de respaldo, retención, RTO/RPO y responsables de operación deben acordarse con la barbería. No se adjudican valores alcanzados a un procedimiento aún no ejecutado en producción.
