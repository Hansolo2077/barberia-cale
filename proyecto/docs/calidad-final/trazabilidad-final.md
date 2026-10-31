# Matriz final de trazabilidad

Necesidad: centralizar citas de Barbería Cale con acceso por rol, reglas consistentes y recordatorios trazables. Los RF mantienen las definiciones de [requisitos actuales](../requisitos-actuales.md). La arquitectura ya relaciona interfaz, módulo, endpoint y datos; esta matriz añade control, medición, resultado y acción del corte final. Los atributos conservan el modelo académico histórico descrito en el Plan de Calidad.

| Necesidad | RF | Atributo | Proceso / control | KPI o criterio | Prueba | Resultado / evidencia | Hallazgo / acción y estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Acceso seguro | RF-01 | Seguridad / adecuación funcional | Autenticación, rol y propietario | RC-01/02; 401/403 o hash | PF-01, PF-02 | PASS en integracion-regresion.json; PF-01, PF-02 | Mantener regresión; UI BQ-06 |
| Acceso seguro | RF-02 | Seguridad | Autenticación, rol y propietario | RC-01/02; 401/403 o hash | PF-03 | PASS en integracion-regresion.json; PF-03 | Mantener regresión; UI BQ-06 |
| Acceso seguro | RF-03 | Seguridad / fiabilidad | Autenticación, rol y propietario | RC-01/02; 401/403 o hash | Sin caso integral final | Sesión tras reinicio no reejecutada | BQ-06; pendiente |
| Acceso seguro | RF-04 | Seguridad | Autenticación, rol y propietario | RC-01/02; 401/403 o hash | Sin caso integral final | Logout UI no reejecutado | BQ-06; pendiente |
| Reserva y consulta | RF-05 | Adecuación funcional / desempeño | Reglas de negocio y estados | KPI-01; resultado esperado | PF-05, PF-11 | PASS en integracion-regresion.json; PF-05, PF-11 | Mantener regresión; UI BQ-06 |
| Reserva y consulta | RF-06 | Fiabilidad / adecuación funcional | Reglas de negocio y estados | RC-03/04; una activa concurrente | PF-06, PF-07, PF-08, PF-12, PF-13 | PASS en integracion-regresion.json; PF-06, PF-07, PF-08, PF-12, PF-13 | Mantener regresión; UI BQ-06 |
| Reserva y consulta | RF-07 | Adecuación funcional | Reglas de negocio y estados | KPI-01; resultado esperado | Sin caso integral final | Consulta HTTP comprobada en PF-06; filtro de próximas sin caso independiente | BQ-06; pendiente |
| Reserva y consulta | RF-08 | Adecuación funcional | Reglas de negocio y estados | KPI-01; resultado esperado | PF-11 | PASS en integracion-regresion.json; PF-11 | Mantener regresión; UI BQ-06 |
| Reserva y consulta | RF-09 | Fiabilidad | Reglas de negocio y estados | KPI-01; resultado esperado | PF-10, PF-11 | PASS en integracion-regresion.json; PF-10, PF-11 | Mantener regresión; UI BQ-06 |
| Gestión de citas | RF-10 | Adecuación funcional | Reglas de negocio y estados | KPI-01; resultado esperado | PF-16 | PASS en integracion-regresion.json; PF-16 | Mantener regresión; UI BQ-06 |
| Gestión de citas | RF-11 | Adecuación funcional | Reglas de negocio y estados | KPI-01; resultado esperado | PF-09 | PASS en integracion-regresion.json; PF-09 | Mantener regresión; UI BQ-06 |
| Gestión de citas | RF-12 | Adecuación funcional | Reglas de negocio y estados | KPI-01; resultado esperado | PF-14 | PASS en integracion-regresion.json; PF-14 | Mantener regresión; UI BQ-06 |
| Gestión de citas | RF-13 | Adecuación funcional | Reglas de negocio y estados | KPI-01; resultado esperado | PF-16 | PASS en integracion-regresion.json; PF-16 | Mantener regresión; UI BQ-06 |
| Gestión de citas | RF-14 | Fiabilidad | Reglas de negocio y estados | KPI-01; resultado esperado | PF-15 | PASS en integracion-regresion.json; PF-15 | Mantener regresión; UI BQ-06 |
| Gestión de citas | RF-15 | Adecuación funcional | Reglas de negocio y estados | KPI-01; resultado esperado | PF-15 | PASS en integracion-regresion.json; PF-15 | Mantener regresión; UI BQ-06 |
| Gestión de citas | RF-16 | Seguridad | Autenticación, rol y propietario | RC-01/02; 401/403 o hash | PF-04, PF-10 | PASS en integracion-regresion.json; PF-04, PF-10 | Mantener regresión; UI BQ-06 |
| Gestión de citas | RF-17 | Compatibilidad | Reglas de negocio y estados | KPI-01; resultado esperado | Sin caso integral final | Mensaje preparado histórico; envío manual no realizado | BQ-06; pendiente |
| Recordatorios y asistencia | RF-18 | Seguridad / fiabilidad | Autenticación, rol y propietario | RC-01/02; 401/403 o hash | PF-17 | PASS en integracion-regresion.json; PF-17 | NF-01 a NF-04: recepción/respuesta documentadas; BQ-10 por correlacionar |
| Recordatorios y asistencia | RF-19 | Fiabilidad | Elegibilidad, claim y persistencia | RC-11; idempotencia y exclusión | PF-21 | PASS en integracion-regresion.json; PF-21 | NF-01 a NF-04: recepción/respuesta documentadas; BQ-10 por correlacionar |
| Recordatorios y asistencia | RF-20 | Fiabilidad | Elegibilidad, claim y persistencia | RC-11; idempotencia y exclusión | PF-09, PF-20 | PASS en integracion-regresion.json; PF-09, PF-20 | NF-01 a NF-04: recepción/respuesta documentadas; BQ-10 por correlacionar |
| Recordatorios y asistencia | RF-21 | Adecuación funcional | Elegibilidad, claim y persistencia | RC-11; idempotencia y exclusión | PF-09 | PASS en integracion-regresion.json; PF-09 | NF-01 a NF-04: recepción/respuesta documentadas; BQ-10 por correlacionar |
| Recordatorios y asistencia | RF-22 | Fiabilidad / seguridad | Elegibilidad, claim y persistencia | RC-11; idempotencia y exclusión | PF-18, PF-19, PF-20 | PASS en integracion-regresion.json; PF-18, PF-19, PF-20 | NF-01 a NF-04: recepción/respuesta documentadas; BQ-10 por correlacionar |


Los 23 casos no prueban cada escenario de los 22 requisitos. RF-19 combina pruebas SQL con NF-01, que muestra recepción en Android; el estudiante confirmó origen automático. RF-20 añade NF-02/03 y RF-21 añade NF-04 como evidencia visual cliente/administrador. La correlación de reloj/build/job se mantiene separada. Los vínculos HTTP/DB no sustituyen evidencia UI. Tampoco se confunde el porcentaje de aprobación con cobertura de código.

| RC | Criterio | Evidencia final | Estado |
| --- | --- | --- | --- |
| RC-01 | Autorización | PF-04/10/22; despliegue.json | Conforme para escenarios ejecutados |
| RC-02 | Hash y protección | PF-01/22; rotacion-accesos.json | Conforme para escenarios ejecutados |
| RC-03 | Reglas y límites | PF-07/08/13 | Conforme para selección ejecutada |
| RC-04 | Concurrencia sin duplicados | PF-12 | Conforme: dos solicitudes reales |
| RC-05 | Feedback visible ≤1 s | HTTP p95 adicional; no UI | Parcial / feedback no medido |
| RC-06 | SUS ≥70 | Sin respuestas | No medido; BQ-05 |
| RC-07 | Controles móviles accesibles | Capturas históricas; UI final no verificada por herramientas | Parcial |
| RC-08 | Controles técnicos | controles.json; prueba body-parser | Conforme en local |
| RC-09 | Android y web | Compilaciones; no campaña UI integral | Parcial |
| RC-10 | Persistencia tras redeploy | PF-23 prueba nueva conexión | Parcial; redeploy no ejecutado |
| RC-11 | Recordatorios fiables | PF-18/19/20/21 y NF-01 a NF-04 | Conforme para escenarios SQL y recepción/respuesta visibles; correlación temporal pendiente |
