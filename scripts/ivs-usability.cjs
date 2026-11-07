const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const palette = fs.readFileSync(path.join(root, 'src/constants/app-theme.ts'), 'utf8');
const colors = Object.fromEntries([...palette.matchAll(/(\w+):\s*"(#[0-9A-Fa-f]{6})"/g)].map(m => [m[1], m[2]]));
function luminance(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map(h => parseInt(h, 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = ['textSecondary', 'textMuted'].flatMap(fg => ['surface', 'background'].map(bg => {
  const values = [luminance(colors[fg]), luminance(colors[bg])].sort((a, b) => b - a);
  const ratio = (values[0] + 0.05) / (values[1] + 0.05);
  return { foreground: fg, background: bg, colors: [colors[fg], colors[bg]], ratio: Number(ratio.toFixed(3)), thresholdForNormalText: 4.5, meetsSelectedThreshold: ratio >= 4.5, scope: 'Colores opacos declarados; no render, opacidad heredada ni certificacion integral' };
}));
const inspections = [
  ['UX-01', 'src/app/client/appointment.tsx', 'b37cce8', ['stepBadge', 'stepHeader']],
  ['UX-02', 'src/app/client/my-appointments.tsx', '8c5b0a1', ['Alert.alert', 'window.confirm', 'handleCancel']],
  ['UX-03', 'src/app/client/appointment.tsx', 'b37cce8', ['unavailableTime', 'accessibilityState', 'selectable']],
  ['UX-04', 'src/app/auth/login.tsx', '622a497', ['textMuted', 'textSecondary', 'accessibilityLabel']],
  ['UX-05', 'src/app/admin/appointments.tsx', '0e7f3f5', ['expandedAppointmentId', 'expandedDetails']],
].map(([id, file, historicalCommit, terms]) => {
  const current = fs.readFileSync(path.join(root, file), 'utf8');
  const before = execFileSync('git', ['show', `${historicalCommit}^:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  const changed = execFileSync('git', ['show', `${historicalCommit}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  const counts = text => Object.fromEntries(terms.map(term => [term, text.split(term).length - 1]));
  return { id, file, historicalCommit, evidence: 'Contenido Git autentico y checkout actual; conteos lexicos orientan inspeccion, no son prueba funcional.', before: { ref: `${historicalCommit}^`, occurrences: counts(before) }, afterHistorical: { ref: historicalCommit, occurrences: counts(changed) }, current: { sha256: crypto.createHash('sha256').update(current).digest('hex'), occurrences: counts(current) }, visualFinalStatus: 'Consultar interfaz-apk.json; esta inspeccion es solo estatica' };
});
const report = { generatedAt: new Date().toISOString(), method: 'Inspeccion estatica de codigo versionado y contraste de pares de colores', contrast, inspections, limitations: 'No genera imagenes historicas, no demuestra comportamiento UI ni una evaluacion SUS o WCAG integral.' };
const out = path.join(root, 'docs/evidencias_pruebas/ivs-2026-11-07/usabilidad-codigo.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ selectedColorPairs: contrast, inspectedFiles: inspections.length }));
