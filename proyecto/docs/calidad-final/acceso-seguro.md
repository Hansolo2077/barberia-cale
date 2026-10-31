# Procedimiento seguro de acceso para evaluación

El PDF histórico del II expuso dos claves. Fueron cambiadas el 2026-10-31T17:15:36.243Z, verificando en ambos roles clave anterior → HTTP 401 y nueva → HTTP 200. Evidencia pública: [rotacion-accesos.json](../../../docs/evidencias_pruebas/parcial-iii/rotacion-accesos.json). El registro no contiene celulares, claves, hashes ni tokens.

Los accesos nuevos están únicamente en .quality-private/evaluation-access.json, excluido de Git. El estudiante conserva ese archivo y comparte al docente el acceso necesario por un canal privado acordado, separado del expediente y con duración de evaluación definida. No se ha enviado ningún mensaje ni compartido credenciales con terceros. No incluir ese archivo en anexos, capturas, ZIP público o commits.

Antes de facilitar acceso, confirmar que son cuentas de evaluación y no exponen datos personales reales. Si el docente necesita ADMIN, preferir un entorno de evaluación con datos sintéticos. Al finalizar, retirar o volver a rotar el acceso temporal y registrar el resultado sin valores secretos. La guía exige enlaces de evidencias accesibles sin pedir credenciales personales del estudiante; el repositorio y reportes públicos satisfacen esa parte sin publicar contraseñas.

La rotación de contraseña no revoca JWT ya emitidos; la sesión recordada puede tener una vigencia de hasta 30 días según código. Esto sigue abierto en BQ-08. No afirmar revocación ni cierre completo del incidente de sesiones. El PDF histórico se conserva localmente por trazabilidad académica y no debe republicarse con su tabla de claves.
