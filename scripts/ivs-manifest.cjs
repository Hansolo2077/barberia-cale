const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const evidence = 'docs/evidencias_pruebas/ivs-2026-11-07';
const roots = ['src', 'assets', 'backend/src', 'supabase', 'tests', 'scripts', 'proyecto/docs/ivs-final', 'proyecto/docs/arquitectura-actual', evidence];
const files = ['.gitignore', '.github/workflows/quality-security.yml', 'LICENSE', 'google-services.json', 'README.md', 'package.json', 'package-lock.json', 'app.json', 'eas.json', 'tsconfig.json', 'eslint.config.js', 'backend/package.json', 'backend/package-lock.json', 'backend/.env.example', 'proyecto/docs/requisitos-actuales.md', 'proyecto/docs/alcance-actual.md'];
function walk(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(relative);
    else if (!/\/(manifiesto\.json|publicacion\.json)$/.test(relative)) files.push(relative);
  }
}
for (const dir of roots) walk(dir);
const privateAccess = JSON.parse(fs.readFileSync(path.join(root, '.quality-private/ivs-evaluation-access.json'), 'utf8'));
const secrets = privateAccess.accounts.map(a => a.password).filter(Boolean);
const rows = [];
for (const relative of [...new Set(files)].sort()) {
  if (relative.includes('.quality-private') || /(^|\/)\.env$|\.keystore$|\.jks$/.test(relative)) throw new Error('Private file in manifest selection');
  const bytes = fs.readFileSync(path.join(root, relative));
  if (/\.(md|json|txt|js|cjs|ts|tsx|sql|yml|toml|example)$/.test(relative) && secrets.some(secret => bytes.toString('utf8').includes(secret))) throw new Error(`Credential found in public candidate: ${relative}`);
  rows.push({ path: relative, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
}
const report = { generatedAt: new Date().toISOString(), sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), branch: execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim(), description: 'Exact file fingerprints for IVS candidate. sourceCommit is the base; uncommitted content is identified by hashes. Release commit is recorded separately.', credentialScan: 'PASS against supplied evaluation passwords; excludes private files; not a complete secret scanner', files: rows };
fs.writeFileSync(path.join(root, evidence, 'manifiesto.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ files: rows.length, credentialScan: 'PASS' }));
