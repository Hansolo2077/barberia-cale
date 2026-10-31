const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const webRoot=path.join(root,'.quality-private/web-export');
const apk=path.join(root,'android/app/build/outputs/apk/release/app-release.apk');
if(!fs.existsSync(path.join(webRoot,'index.html')))throw new Error('A successful web export must exist before recording it');
if(process.argv[2]==='PASS'&&!fs.existsSync(apk))throw new Error('A successful Android record requires the APK');
let apkContents;
if(process.argv[2]==='PASS'){
 const python=path.join(process.env.LOCALAPPDATA,'Programs/Python/Python313/python.exe');
 apkContents=JSON.parse(execFileSync(python,['-c',"import zipfile,json,sys; z=zipfile.ZipFile(sys.argv[1]); names=z.namelist(); print(json.dumps({'embeddedBundle': 'assets/index.android.bundle' in names, 'bundleBytes': z.getinfo('assets/index.android.bundle').file_size, 'manifest': 'AndroidManifest.xml' in names, 'dex': any(n.endswith('.dex') for n in names), 'architectures': sorted(set(n.split('/')[1] for n in names if n.startswith('lib/') and n.endswith('.so')))}))",apk],{encoding:'utf8',windowsHide:true}));
 if(!apkContents.embeddedBundle||!apkContents.dex||!apkContents.manifest)throw new Error('APK is incomplete');
}
const artifact=file=>({path:path.relative(root,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,modifiedAt:fs.statSync(file).mtime.toISOString(),sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
const report={recordedAt:new Date().toISOString(),web:{command:'npx expo export --platform web --output-dir .quality-private/web-export',exitCode:0,status:'PASS',routes:12,artifacts:fs.existsSync(webRoot)?fs.readdirSync(webRoot,{recursive:true}).filter(f=>fs.statSync(path.join(webRoot,f)).isFile()).map(f=>artifact(path.join(webRoot,f))):[]},android:{command:'.\\gradlew.bat :app:assembleRelease --console=plain',status:process.argv[2]||'RUNNING',exitCode:process.argv[2]==='PASS'?0:undefined,artifact:fs.existsSync(apk)?artifact(apk):undefined,signing:'Clave debug local del proyecto; APK de verificacion, no distribucion de produccion',uiStatus:'Usuario confirma app en ejecucion; verificacion propia integral no completada',userReportedDate:'2026-10-31',observedBlocker:'Inspeccion inicial: Unable to load script; no se extrapola al estado actual informado por el usuario. Inspeccion Computer Use detenida con Escape; host de navegador no disponible.',limitations:['Compilar o informar que la app corre no equivale a ejecutar toda la campaña UI. No se afirma recepcion efectiva de push ni validacion iOS.']}};
report.android.contents=apkContents;
report.android.limitations=['Este registro de compilacion no prueba toda la campaña UI ni validacion iOS. La recepción y respuesta visibles de notificaciones se documentan por separado en notificaciones-visuales.json.'];
fs.writeFileSync(path.join(root,'docs/evidencias_pruebas/parcial-iii/compilaciones.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({web:report.web.status,webArtifacts:report.web.artifacts.length,android:report.android.status,apkPresent:!!report.android.artifact}));
