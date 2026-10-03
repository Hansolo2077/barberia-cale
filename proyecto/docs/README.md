# Documentación vigente de Barbería Cale

Revisión documental: 3 de octubre de 2026, sobre el código de la revisión `ad017f1`. La documentación describe lo implementado; la verificación de despliegue y la evidencia de ejecución tienen su propio alcance.

| Documento | Contenido |
| --- | --- |
| [Alcance actual](alcance-actual.md) | Roles, funcionalidades, reglas y exclusiones. |
| [Requisitos actuales](requisitos-actuales.md) | RF-01 a RF-22, alineados con pantallas y servicios. |
| [Arquitectura actual](arquitectura-actual/Arquitectura_y_Diseno_Actual_Barberia_Cale.md) | Módulos, contratos, datos, doce diagramas y matriz de trazabilidad en la sección 14. |
| [Evidencias de ejecución](../../docs/README.md) | Capturas Android y evidencias de Supabase, con sus límites. |
| [Instalación y ejecución](../../README.md) | Comandos y configuración básica. |
| [Flujo de Git](../../how-to-git.md) | Ramas, commits, PR y revisión. |

Las versiones v1, la matriz Excel anterior y las exportaciones antiguas de arquitectura están en [documentación archivada](../../docs/documentacion-archivada/README.md). El Markdown de arquitectura es la referencia vigente; los PDF y HTML archivados no contienen esta revisión. No se presenta una exportación antigua como si estuviera sincronizada.

Para actualizar esta línea base, contrastar requisitos con `src/app`, `src/api`, `backend/src` y `supabase`. Mantener identificadores RF estables y actualizar la trazabilidad cuando cambien responsabilidades o contratos.
