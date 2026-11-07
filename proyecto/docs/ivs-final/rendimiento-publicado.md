# Aclaración y nueva medición de RNF-01

El requisito original del Hito I, página 7, establece respuesta HTTP inferior a **500 ms en condiciones normales**, considerando que el cold start de la infraestructura gratuita puede añadir latencia inicial. No establece un segundo. El umbral de 1000 ms del runner de apoyo no sustituye este requisito.

La primera solicitud se conserva por separado: **23 677,132 ms**. No se provocó ni acreditó inactividad o cold start; por tanto, no se atribuye automáticamente esa causa ni se presenta esa solicitud como prueba suficiente de incumplimiento en condiciones normales. La observación histórica de 22 553 ms tampoco permite por sí sola esa conclusión.

Después se verificó el backend `51a6a28314452045d912d8f0940190a24c344bfb`, se ejecutaron dos solicitudes de preparación por flujo y quince mediciones seriales por flujo. Se midió hasta recibir y parsear el JSON, incluida la red, desde un único cliente. El p95 es nearest-rank; es un indicador adoptado para esta campaña, no un percentil exigido expresamente en el Hito I.

| Flujo publicado | HTTP 200 | Menos de 500 ms | Mediana ms | p95 ms |
|---|---:|---:|---:|---:|
| login | 15/15 | 0/15 | 702.134 | 905.670 |
| disponibilidad | 15/15 | 14/15 | 393.214 | 651.064 |
| mis_citas | 15/15 | 15/15 | 272.782 | 308.141 |

**Resultado:** las 45 solicitudes respondieron correctamente, pero el objetivo temporal solo se observó en todas las muestras de mis citas. Login superó 500 ms en las quince muestras; disponibilidad lo superó en una. Existe una desviación de rendimiento observada con el servicio ya respondiendo; se mantiene IVS-D06 abierto. No se declara el objetivo cumplido ni un incumplimiento general a partir de una sola solicitud inicial.

No se modificaron contraseñas, citas, código de aplicación ni infraestructura. La evidencia no identifica el componente causal, no mide carga concurrente o SLA y no acredita el rendimiento de todas las plataformas. No se debilitó bcrypt ni se introdujo caché para obtener resultados favorables.

La evidencia completa está en `docs/evidencias_pruebas/ivs-2026-11-07/cierre-funcional/rendimiento-publicado.json`, con timestamps, preparación y muestras individuales sin credenciales o tokens. Este suplemento es posterior al ZIP original del release r2; ese ZIP conserva sus bytes y hashes. El registro enlazado y el suplemento del release identifican la medición nueva.
