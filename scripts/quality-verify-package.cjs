const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/evidencias_pruebas/parcial-iii/manifest.json'),'utf8'));
const issues=[];
if(new Set(manifest.files.map(entry=>entry.path)).size!==manifest.files.length)issues.push({type:'DUPLICATE_PATH'});
for(const entry of manifest.files){const filename=path.join(root,entry.path);if(!fs.existsSync(filename)||crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex')!==entry.sha256)issues.push({type:'HASH',file:entry.path});}
const markdown=manifest.files.filter(f=>f.path.startsWith('proyecto/docs/calidad-final/')&&f.path.endsWith('.md')).map(f=>f.path).concat('docs/evidencias_pruebas/parcial-iii/README.md');
for(const file of markdown){const text=fs.readFileSync(path.join(root,file),'utf8');for(const match of text.matchAll(/\]\(([^)]+)\)/g)){const ref=match[1].split('#')[0];if(!ref||/^[a-z]+:/i.test(ref))continue;const resolved=path.resolve(path.dirname(path.join(root,file)),decodeURIComponent(ref));if(!fs.existsSync(resolved))issues.push({type:'LINK',file,target:ref});}if(text.includes('undefined'))issues.push({type:'UNDEFINED',file});}
const privateFile=path.join(root,'.quality-private/evaluation-access.json');
const environmentFile=path.join(root,'backend/.env');
if(fs.existsSync(environmentFile)){
 const values=Object.values(require('../backend/node_modules/dotenv').parse(fs.readFileSync(environmentFile))).filter(value=>value.length>=16);
 for(const entry of manifest.files){const data=fs.readFileSync(path.join(root,entry.path),'utf8');if(values.some(value=>data.includes(value)))issues.push({type:'ENV_SECRET',file:entry.path});}
}
if(fs.existsSync(privateFile)){
 const accounts=JSON.parse(fs.readFileSync(privateFile,'utf8')).accounts;
 for(const entry of manifest.files){const data=fs.readFileSync(path.join(root,entry.path),'utf8');const isNewEvidence=entry.path.startsWith('proyecto/docs/calidad-final/')||entry.path.startsWith('docs/evidencias_pruebas/parcial-iii/');if(accounts.some(a=>data.includes(a.password)||(isNewEvidence&&data.includes(a.phone))))issues.push({type:'PRIVATE_ACCESS',file:entry.path});}
}
try{execFileSync('git',['check-ignore','.quality-private/evaluation-access.json'],{cwd:root,stdio:'pipe'});}catch{issues.push({type:'GITIGNORE'});}
const workflow=fs.readFileSync(path.join(root,'.github/workflows/quality-security.yml'),'utf8');
let yaml;try{yaml=require('yaml');}catch{try{yaml=require('../node_modules/@expo/cli/node_modules/yaml');}catch{}}
if(yaml){try{yaml.parse(workflow,{uniqueKeys:true});}catch{issues.push({type:'YAML'});}}else issues.push({type:'YAML_PARSER_UNAVAILABLE'});
console.log(JSON.stringify({hashedFiles:manifest.files.length,markdownFiles:markdown.length,privateAccessNotPublished:!issues.some(i=>i.type==='PRIVATE_ACCESS'||i.type==='ENV_SECRET'),issues},null,2));
if(issues.length)process.exitCode=1;
