const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const out = path.join(root, 'docs/evidencias_pruebas/parcial-iii');
fs.mkdirSync(out, { recursive: true });
const npm = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const checks = [
  ['typescript', ['node_modules/typescript/bin/tsc', '--noEmit']],
  ['eslint', [npm, 'run', 'lint']],
  ['frontend-tests', ['--test', '--test-reporter=tap', 'tests/notification-registration.test.js']],
  ['backend-tests', ['--test', '--test-reporter=tap', ...fs.readdirSync(path.join(root,'backend/src'),{recursive:true}).filter(f=>f.endsWith('.test.js')).map(f=>'backend/src/'+f.replaceAll('\\','/'))]],
  ['audit-frontend', [npm, 'audit', '--json']],
  ['audit-backend', [npm, 'audit', '--prefix', 'backend', '--json']],
  ['expo-compatibility', ['node_modules/expo/bin/cli', 'install', '--check']],
];
const report = { startedAt: new Date().toISOString(), sourceCommit: execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(), workingTreeChanges: true, node: process.version, checks: [] };
for(const [id,args] of checks){
  const startedAt=new Date().toISOString();
  const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:180000,windowsHide:true,maxBuffer:16*1024*1024});
  const stdout=result.stdout||''; const stderr=result.stderr||'';
  fs.writeFileSync(path.join(out,id+(id.startsWith('audit')?'.json':'.txt')),stdout);
  if(stderr.trim())fs.writeFileSync(path.join(out,id+'-stderr.txt'),stderr);
  let audit;try{if(id.startsWith('audit'))audit=JSON.parse(stdout).metadata?.vulnerabilities;}catch{}
  const tests = id.endsWith('tests') ? { passed:Number(stdout.match(/# pass (\d+)/)?.[1]||0),failed:Number(stdout.match(/# fail (\d+)/)?.[1]||0),skipped:Number(stdout.match(/# skipped (\d+)/)?.[1]||0) } : undefined;
  const item={id,command:args.map(a=>a===npm?'npm':a).join(' '),startedAt,finishedAt:new Date().toISOString(),exitCode:result.status,status:result.status===0?'PASS':audit?'FINDINGS':'FAIL',audit,tests,error:result.error?.code};
  report.checks.push(item);console.log(JSON.stringify(item));
}
report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'controles.json'),JSON.stringify(report,null,2)+'\n');
if(report.checks.some(c=>c.status!=='PASS'))process.exitCode=1;
