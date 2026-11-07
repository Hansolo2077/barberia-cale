# CR-RNF-01-20261107: revisión del objetivo de rendimiento

Fecha: 07/11/2026. Responsable y autorización de la revisión: Hanssel Núñez. Estado: adoptado para esta versión del proyecto. Se conserva íntegro el requisito del Hito I como antecedente; no se atribuye esta decisión al docente o a una aceptación de usuarios no realizada.

## Requisito vigente: RNF-01, revisión 1

**El backend tendrá como objetivo una respuesta HTTP inferior a 1 segundo en condiciones normales de operación interactiva, con el servicio activo. La latencia inicial asociada a la activación de infraestructura gratuita se registrará por separado.**

La medición incluye red y recepción completa del JSON desde el cliente de prueba. El tiempo de renderizado de la interfaz y la disponibilidad son aspectos distintos. Para cada campaña se registrarán muestras individuales, errores HTTP, mediana, p95, máximo, preparación, fecha y versión. El p95 es un indicador de seguimiento; no convierte las solicitudes lentas en solicitudes conformes ni garantiza el comportamiento bajo cualquier carga.

## Motivo y costo-beneficio

El objetivo de 500 ms se formuló en el diseño del Hito I, antes de esta campaña instrumentada del servicio publicado. Se conserva como aspiración técnica y referencia de comparación. Las mediciones posteriores permiten revisar ese presupuesto temporal en lugar de tratar una estimación de diseño como una restricción inmutable.

El producto coordina reservas, consultas y gestión de una barbería pequeña; sus flujos son interactivos y no de control en tiempo real. Un presupuesto de un segundo para la respuesta HTTP resulta una decisión de producto razonable para esta etapa, al equilibrar la espera del usuario con la operación sobre infraestructura de bajo costo. Esa valoración es una decisión explícita del proyecto; no se presenta como resultado de una encuesta de satisfacción o un estudio de abandono que no se ejecutó.

Exigir 500 ms en cada condición podría justificar instrumentación adicional, optimizaciones y, según la causa demostrada, una instancia siempre activa o mejor ubicación/capacidad de infraestructura. Esas alternativas tienen costo recurrente o de ingeniería. No se ha cuantificado su retorno ni demostrado que una de ellas resuelva el problema, por lo que no se compromete ese gasto únicamente para reducir el umbral de esta entrega. Tampoco se afirma que el sistema no pueda escalar: se decide no ampliar capacidad sin evidencia de necesidad.

Se conserva bcrypt y la integridad transaccional; no se intercambia seguridad o consistencia por unos milisegundos. La carga esperada limitada se deriva del alcance de una sola barbería, pero no equivale a capacidad concurrente comprobada. La revisión es apropiada para la evaluación y operación inicial controlada; requiere seguimiento si cambia el uso.

## Evidencia y aceptación de esta campaña

Se evaluaron las mismas 45 muestras del backend publicado, sin descartar resultados ni modificar sus tiempos. Los tres flujos obtuvieron HTTP 200 y todas sus muestras activas quedaron por debajo de 1000 ms.

| Flujo | Conformes <1 s | p95 ms | Máximo ms |
|---|---:|---:|---:|
| login | 15/15 | 905.670 | 905.670 |
| disponibilidad | 15/15 | 651.064 | 651.064 |
| mis_citas | 15/15 | 308.141 | 308.141 |

La comparación con 500 ms se conserva en el informe de medición: login lo superó en 15/15 y disponibilidad en 1/15. IVS-D06 se reclasifica como desviación respecto del objetivo anterior, tratada mediante cambio de requisito y seguimiento; no como defecto corregido por optimización. La revisión vigente cumple en esta campaña, con alcance de muestra.

La primera solicitud de 23 677,132 ms se conserva fuera de la muestra activa. El requisito anterior ya contemplaba latencia inicial; no se instrumentó su causa y no se etiqueta automáticamente como cold start. Esa espera sigue siendo una limitación de experiencia de uso que debe observarse, no un dato que se borra al revisar el umbral.

## Seguimiento y reversibilidad

Repetir la campaña ante cambios de infraestructura, rutas críticas o aumento de uso. Si aparecen solicitudes activas de un segundo o más, errores, colas o esperas iniciales que afecten reservas, registrar incidencia e instrumentar aplicación, consultas, red y activación del proveedor antes de decidir optimización o gasto. Añadir pruebas concurrentes antes de ampliar el alcance de operación. El objetivo de 500 ms puede recuperarse cuando exista una necesidad y un presupuesto respaldados por datos.

Este cambio no modifica el APK, el backend desplegado ni los documentos originales de parciales anteriores. `revision-rnf-01.json` conserva el cambio y su evaluación; `rendimiento-publicado.json` conserva las muestras originales. El suplemento se identifica por separado del ZIP original r2.
