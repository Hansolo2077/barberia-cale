const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const accounts=JSON.parse(fs.readFileSync(path.join(root,'.quality-private/evaluation-access.json'),'utf8')).accounts;
const report={startedAt:new Date().toISOString(),environment:{api:'https://barberia-cale.onrender.com/api',web:'https://barberiacale.netlify.app/',node:process.version,client:'Windows Node fetch; serial; internet real',deployedCommit:'No expuesto por /health; no se afirma igualdad con checkout'},checks:[],performance:[]};
const base=report.environment.api;
async function call(route,token,body){const start=performance.now();const res=await fetch(base+route,{method:body?'POST':'GET',headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});const data=await res.json();return {status:res.status,ms:Number((performance.now()-start).toFixed(3)),data};}
(async()=>{try{
 const web=await fetch(report.environment.web,{signal:AbortSignal.timeout(60000)});const html=await web.text();report.checks.push({id:'LIVE-01',title:'Web publicada accesible',http:web.status,html:html.includes('<html'),status:web.ok?'PASS':'FAIL'});
 const health=await call('/health');report.checks.push({id:'LIVE-02',title:'API health',http:health.status,ms:health.ms,status:health.status===200?'PASS':'FAIL'});
 const tokens={};for(const role of ['CLIENT','ADMIN']){const a=accounts.find(a=>a.role===role);const r=await call('/auth/login',null,{phone:a.phone,password:a.password});if(r.status!==200)throw new Error('Live login failed');tokens[role]=r.data.token;report.checks.push({id:`LIVE-LOGIN-${role}`,title:`Acceso ${role}`,http:r.status,role:r.data.user.role,status:r.data.user.role===role?'PASS':'FAIL'});}
 for(const [id,route,token,expected]of [['LIVE-03','/admin/appointments',null,401],['LIVE-04','/admin/appointments','invalid',401],['LIVE-05','/admin/appointments',tokens.CLIENT,403],['LIVE-06','/appointments/my',tokens.ADMIN,403],['LIVE-07','/admin/appointments',tokens.ADMIN,200]]){const r=await call(route,token);report.checks.push({id,route,http:r.status,expected,status:r.status===expected?'PASS':'FAIL'});}
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()+3*86400000));
 const a=accounts.find(a=>a.role==='CLIENT');
 for(const[name,route,token,body,n] of [['login','/auth/login',null,{phone:a.phone,password:a.password},10],['disponibilidad',`/appointments/availability?date=${date}`,tokens.CLIENT,null,30],['mis_citas','/appointments/my',tokens.CLIENT,null,30]]){
  const warm=await call(route,token,body);const samples=[];const statuses=[];for(let i=0;i<n;i++){const r=await call(route,token,body);samples.push(r.ms);statuses.push(r.status);}
  const sorted=[...samples].sort((a,b)=>a-b);report.performance.push({name,n,concurrency:1,warmupMs:warm.ms,samplesMs:samples,statuses,p50Ms:sorted[Math.ceil(.5*n)-1],p95Ms:sorted[Math.ceil(.95*n)-1],thresholdMs:1000,status:statuses.every(s=>s===200)?(sorted[Math.ceil(.95*n)-1]<=1000?'PASS':'FAIL'):'INVALID',metric:'Tiempo HTTP completo hasta JSON; no feedback UI',method:'percentil nearest-rank; ceil(0.95*n)',limitations:name==='login'?'10 muestras para respetar rate limit compartido; no inferir carga ni SLA':'30 muestras seriales; sin prueba de carga'});console.log(`LIVE PERF ${name} p95=${report.performance.at(-1).p95Ms}ms`);
 }
}catch(error){report.error={name:error.name,message:'Fallo de acceso o conectividad; no se registran cuerpos ni secretos.'};process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();if(report.checks.some(c=>c.status!=='PASS')||report.performance.some(p=>p.status!=='PASS'))process.exitCode=1;const file=path.join(root,'docs/evidencias_pruebas/parcial-iii/despliegue.json');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks:report.checks,status:report.error?'ERROR':'DONE'}));}})();
