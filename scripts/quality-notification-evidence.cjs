const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const source = 'proyecto/entregas/Others/Notificaciones';
const definitions = [
  ['NF-01', 'notificaciones.jpg', ['RF-19'], 'Notificación de Barbería Cale visible en la bandeja Android; solicita confirmar una cita para el domingo 1 de noviembre a las 13:00.', 'Recepción visible comprobada; origen automático informado expresamente por el estudiante.'],
  ['NF-02', 'antes de confirmar.jpg', ['RF-20'], 'Cita aceptada; la interfaz del cliente muestra Confirmar asistencia.', 'Estado anterior a la confirmación documentado.'],
  ['NF-03', 'asistencia confirmada.jpg', ['RF-20'], 'Aviso Asistencia confirmada y estado de asistencia actualizado para la misma fecha y hora visibles.', 'Confirmación visible del cliente documentada.'],
  ['NF-04', 'confirmacion desde cuenta admin.png', ['RF-21'], 'ADMIN muestra la cita #55 con Confirmó asistencia, domingo 1 de noviembre a las 13:00.', 'Resultado visible del lado administrativo documentado.'],
];
const report = {
  reviewedAt: new Date().toISOString(),
  evidenceType: 'Capturas aportadas por el estudiante e inspeccionadas visualmente',
  studentStatement: { deliveryOrigin: 'AUTOMATIC', statement: 'Llegó automáticamente', date: '2026-10-31' },
  sourceCommit: 'No identificado en las imágenes',
  observedDate: 'La bandeja Android muestra Sat, Oct 31; la cita muestra domingo 1 de noviembre a las 13:00.',
  cases: definitions.map(([id, filename, requirements, observation, result]) => {
    const file = path.join(root, source, filename);
    return { id, requirements, source: source + '/' + filename, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), bytes: fs.statSync(file).size, observation, result, status: 'VISUALLY_CONFIRMED' };
  }),
  limitations: [
    'Las imágenes no muestran SHA/build, ID del job, ticket o receipt del proveedor.',
    'El origen automático se atribuye al testimonio del estudiante; no se deduce solamente de la imagen.',
    'La bandeja indica 31 de octubre y la cita 1 de noviembre. Sin correlación de reloj/ambiente/job no se usa esta secuencia para demostrar la ventana automática de una hora.',
    'La secuencia documenta confirmación en Mis citas; no acredita por sí sola una acción de confirmación ejecutada desde la propia notificación.',
  ],
};
fs.writeFileSync(path.join(root, 'docs/evidencias_pruebas/parcial-iii/notificaciones-visuales.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ reviewed: report.cases.length, automaticOriginReportedByStudent: true, receiptVisuallyConfirmed: true }));
