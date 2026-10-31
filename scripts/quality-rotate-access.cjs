const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname,'..');
require('../backend/node_modules/dotenv').config({path:path.join(root,'backend/.env'),quiet:true});
const {Client}=require('../backend/node_modules/pg');
const bcrypt=require('../backend/node_modules/bcryptjs');
const privateDir=path.join(root,'.quality-private');
const privateFile=path.join(privateDir,'evaluation-access.json');
const evidenceFile=path.join(root,'docs/evidencias_pruebas/parcial-iii/rotacion-accesos.json');
const report={startedAt:new Date().toISOString(),source:'Anexo A del PDF del II Parcial',accounts:[],limitations:['Cambiar contrasenas no revoca JWT emitidos anteriormente. No se publican claves ni datos personales en este registro.']};
const python=path.join(process.env.LOCALAPPDATA,'Programs/Python/Python313/python.exe');
const extraction="import fitz,pathlib,json,re; p=next(pathlib.Path('proyecto/entregas/Parcial II').glob('*.pdf')); d=fitz.open(p); text='\\n'.join(x.get_text() for x in d); section=text.split('Cuentas de prueba')[-1].split('Estas cuentas')[0]; matches=re.findall(r'(ADMIN|CLIENT)\\s+(\\d{8})\\s+(\\S+)',section); print(json.dumps([{'role':r,'phone':p,'oldPassword':s} for r,p,s in matches]))";
const accounts=JSON.parse(execFileSync(python,['-c',extraction],{cwd:root,encoding:'utf8',windowsHide:true}));
if(accounts.length!==2||new Set(accounts.map(a=>a.role)).size!==2)throw new Error('Unexpected source account structure');
fs.mkdirSync(privateDir,{recursive:true});
const existing=fs.existsSync(privateFile)?JSON.parse(fs.readFileSync(privateFile,'utf8')):{accounts:[]};
const client=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},connectionTimeoutMillis:15000,statement_timeout:15000});
(async()=>{try{
  await client.connect();
  for(const account of accounts){
    const row=(await client.query('SELECT id,role,password_hash FROM public.users WHERE phone=$1',[account.phone])).rows[0];
    if(!row||row.role!==account.role)throw new Error('Account identity or role does not match the assignment');
    let saved=existing.accounts.find(a=>a.role===account.role&&a.phone===account.phone);
    const oldMatches=await bcrypt.compare(account.oldPassword,row.password_hash);
    let rotated=false;
    if(oldMatches){
      saved={role:account.role,phone:account.phone,password:crypto.randomBytes(24).toString('base64url'),createdAt:new Date().toISOString()};
      existing.accounts=existing.accounts.filter(a=>a.role!==account.role);existing.accounts.push(saved);
      fs.writeFileSync(privateFile,JSON.stringify(existing,null,2)+'\n',{mode:0o600});
      const updated=await client.query('UPDATE public.users SET password_hash=$1 WHERE id=$2 AND password_hash=$3',[await bcrypt.hash(saved.password,10),row.id,row.password_hash]);
      if(updated.rowCount!==1)throw new Error('Concurrent credential change; rotation stopped');
      rotated=true;
    }
    const current=(await client.query('SELECT password_hash FROM public.users WHERE id=$1',[row.id])).rows[0];
    const oldRejected=!(await bcrypt.compare(account.oldPassword,current.password_hash));
    const newVerified=saved?await bcrypt.compare(saved.password,current.password_hash):false;
    const statuses={};
    for(const [label,password] of [['old',account.oldPassword],...(newVerified?[['new',saved.password]]:[])]){
      const response=await fetch('https://barberia-cale.onrender.com/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:account.phone,password}),signal:AbortSignal.timeout(60000)});
      statuses[label]=response.status; await response.arrayBuffer();
    }
    report.accounts.push({role:account.role,rotatedThisRun:rotated,oldHashRejected:oldRejected,newHashVerified:newVerified,httpOld:statuses.old,httpNew:statuses.new,status:oldRejected&&statuses.old===401&&newVerified&&statuses.new===200?'PASS':'REVIEW'});
  }
}catch(error){report.error={code:error.code,name:error.name,message:'No se pudo completar o verificar la rotacion; revisar configuracion y acceso sin publicar secretos.'};process.exitCode=1;}
finally{await client.end();if(report.accounts.length!==2||report.accounts.some(a=>a.status!=='PASS'))process.exitCode=1;report.finishedAt=new Date().toISOString();fs.mkdirSync(path.dirname(evidenceFile),{recursive:true});fs.writeFileSync(evidenceFile,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}})();
