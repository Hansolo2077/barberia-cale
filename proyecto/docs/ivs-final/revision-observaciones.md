# Revisión final de observaciones de IVS

Referencia principal de reproducción: **v1.0.1-ivs.20261107-r3**. El APK 1.0.1 y backend 51a6a283 conservan sus identidades; esta revisión añade evidencias y documentación. Las etiquetas 1.0.0, 1.0.1 inicial y r2 son antecedentes, no las instrucciones principales actuales.

| Observación | Resolución y evidencia |
|---|---|
| Rendimiento publicado | RNF-01 revisión 1, autorizada por Hanssel: <1 s en operación normal activa. 45/45 muestras cumplen; se preservan 500 ms como antecedente, las desviaciones y la solicitud inicial lenta. Ver revision-rnf-01.md y rendimiento-publicado.md. |
| DEF-01: calendario de reserva | CAL-01/02: fecha provisional 12/11 o 13/11; Cancelar y Atrás conservan 08/11 en el APK 1.0.1. |
| DEF-02: selectores de agenda | CAL-03–06: inicio provisional 09/11 y fin provisional 20/11; Cancelar y Atrás conservan ambos extremos 07/11–13/11. Consulta posterior mantiene el rango. |
| Recorrido web | Web publicada en Netlify, Edge de escritorio, cuentas dummy. Cita #63: reserva CLIENT 12/11 15:00, aceptación ADMIN, agenda por rango/estado/búsqueda, recuperación CLIENT, asistencia, descarte de cancelación, cancelación e historial; horario liberado por API. |
| Instrucciones antiguas | §7, §8 y §14.4 del PDF utilizan el mismo tag actual; apartados históricos se identifican como antecedentes. El ZIP r3 integra evidencias nuevas y conserva los cortes anteriores con su alcance. |

## Reproducción principal

```sh
git clone https://github.com/Hansolo2077/barberia-cale.git
cd barberia-cale
git checkout v1.0.1-ivs.20261107-r3
npm ci
npm ci --prefix backend
npm run test:routing-security
node scripts/ivs-verify-deployment.cjs 51a6a28314452045d912d8f0940190a24c344bfb
```

Para instalar Android, descargar el APK del release r3 y verificar SHA256SUMS.txt. Para SQL/variables, usar instalacion-operacion.md; los accesos dummy autorizados se entregan en el PDF. El tag incluye documentación posterior al despliegue; su árbol backend es igual al desplegado y no se atribuye un SHA posterior al proceso de Render.

Los reportes E20–E22 son rendimiento-publicado.json, revision-rnf-01.json, revision-final/regresion-calendarios.json y revision-final/recorrido-web.json bajo docs/evidencias_pruebas/ivs-2026-11-07. Conservan casos, fechas, resultado y hashes. Los grupos de pruebas no se suman como cobertura total.

La web fue probada en la publicación existente; no se afirma un nuevo despliegue ni un SHA frontend no expuesto. No se declaran pruebas equivalentes de todos los navegadores o de iOS, mensajes de WhatsApp enviados, acción directa de notificación o nueva aceptación del negocio. La nota final corresponde al docente; la revisión no garantiza un puntaje.
