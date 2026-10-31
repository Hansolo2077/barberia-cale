const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const evidence=path.join(root,'docs/evidencias_pruebas/parcial-iii');
const docs=path.join(root,'proyecto/docs/calidad-final');
fs.mkdirSync(docs,{recursive:true});
const read=name=>JSON.parse(fs.readFileSync(path.join(evidence,name),'utf8'));
const checks=read('controles.json'), integration=read('integracion-regresion.json'), baseline=read('integracion.json'), live=read('despliegue.json'), rotation=read('rotacion-accesos.json'), reviews=read('revisiones-github.json');
const front=read('audit-frontend.json').metadata.vulnerabilities, back=read('audit-backend.json').metadata.vulnerabilities;
const frontBefore=read('audit-frontend-antes.json').metadata.vulnerabilities, backBefore=read('audit-backend-antes.json').metadata.vulnerabilities;
const source=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const builds=read('compilaciones.json');
const branch=execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim();
const table=(headers,rows)=>`| ${headers.join(' | ')} |\n| ${headers.map(()=> '---').join(' | ')} |\n${rows.map(r=>'| '+r.map(v=>String(v).replaceAll('|','/').replaceAll('\n',' ')).join(' | ')+' |').join('\n')}\n`;
const write=(name,text)=>fs.writeFileSync(path.join(docs,name),text.trim()+'\n');
const e=name=>`[${name}](../../../docs/evidencias_pruebas/parcial-iii/${name})`;
const passed=integration.summary.passed;
const casesFor=rf=>integration.cases.filter(c=>c.requirements?.includes(rf)).map(c=>c.id).join(', ');
write('README.md',`# Preparación técnica del Parcial III de Barbería Cale

Corte: 31 de octubre de 2026, zona America/Guatemala. Este paquete reúne registros técnicos para preparar el informe final; no es el PDF del entregable. El alcance funcional sigue siendo RF-01 a RF-22.

La campaña real contra HTTP y PostgreSQL aprobó ${passed}/${integration.summary.executed} escenarios y su regresión conserva el resultado ${baseline.summary.passed}/${baseline.summary.executed} → ${passed}/${integration.summary.executed}. Las claves expuestas fueron rotadas y verificadas en la API publicada. Los controles actuales y sus límites se presentan sin convertir evidencia histórica en una ejecución nueva.

Compilación web: ${builds.web.status}, 12 rutas. Compilación Android: ${builds.android.status}. El APK de verificación incluye el bundle JavaScript; su generación no sustituye la campaña UI. El usuario confirma la app corriendo en el emulador, pero la inspección visual propia no pudo completarse porque el acceso Computer Use siguió detenido tras el reintento autorizado.

${table(['Registro','Contenido'],[
['[Línea base y Plan de Calidad](plan-calidad-final.md)','Versión, alcance, responsabilidades, criterios y controles'],
['[Correcciones I y II](correcciones.md)','Las doce observaciones del docente y sus respaldos'],
['[Antecedentes verificados](antecedentes-verificados.md)','Pruebas visuales del II y automatización documentada en Others'],
['[Notificaciones verificadas](notificaciones-verificadas.md)','Recepción Android, confirmación del cliente y resultado administrativo'],
['[DoD y backlog](dod-devops-backlog.md)','Terminado verificable, flujo CI y mejoras pendientes'],
['[Pruebas finales](pruebas-finales.md)','Casos, pasos, resultados, regresión y reproducción'],
['[KPI y PDCA](kpi-pdca.md)','Tablero, fórmulas, comparaciones y decisiones'],
['[Auditoría y defectos](auditoria-defectos.md)','Checklist de cierre y seguimiento central'],
['[Trazabilidad](trazabilidad-final.md)','Los 22 RF, atributos, controles, pruebas y límites'],
['[Acceso seguro](acceso-seguro.md)','Procedimiento de evaluación sin claves en el expediente'],
['[Índice de evidencias](../../../docs/evidencias_pruebas/parcial-iii/README.md)','Artefactos originales y manifiesto SHA-256'],
])}

Decisión técnica: mantener piloto controlado. No declarar liberación general con ${front.high} entradas altas de npm en frontend o validación móvil incompleta. La recepción de push sí está respaldada por las cuatro imágenes nuevas; el origen automático fue confirmado por el estudiante. No se afirma que los parches locales estén desplegados. El informe puede documentar honestamente estas limitaciones, como permite la guía.

Los únicos datos pendientes que requieren participación humana son las respuestas SUS reales y una revisión independiente de estos cambios nuevos si se exige aprobarlos. No se inventan encuestas ni aprobaciones. Las revisiones históricas de Ruddy y Steven sí están conservadas en GitHub.
`);
write('plan-calidad-final.md',`# Línea base y Plan de Calidad final

## Identificación y estado

Sistema Barbería Cale 1.0.0. Autor y responsable del cierre: Hanssel Arnulfo Nuñez Castañeda. Rama de preparación: ${branch}. Commit base: ${source}. Las pruebas de este paquete se ejecutaron con cambios locales; el manifiesto identifica sus archivos exactos mediante SHA-256. No presentar el commit base como si incluyera estos cambios.

API: https://barberia-cale.onrender.com/api. Web: https://barberiacale.netlify.app/. PostgreSQL de pruebas: versión ${integration.environment.postgresql}. Node local: ${checks.node}. Expo 57.0.15 y React Native 0.86.2. El endpoint health no permite identificar el SHA desplegado; la igualdad entre despliegue y checkout no está demostrada. El APK anterior instalado en Pixel 4 no cargó JavaScript; consultar el registro de compilación móvil antes de afirmar ejecución Android final.

Implementado según línea base: RF-01 a RF-22. Los estados de implementación y verificación son distintos. Exclusiones: pagos, inventario, múltiples sucursales, selección de barbero, recuperación automática de clave, iOS validado, web push y WhatsApp empresarial automático. Se conservan las reglas de 24 horas, una cita activa por día, dos por siete días y cancelación hasta 60 minutos antes.

Cambios desde el II Parcial: CI con pruebas y análisis, endurecimiento del pipeline en PR #7/#8, campaña aislada HTTP/PostgreSQL, p95 instrumentado, rotación de accesos, registros centralizados, actualización compatible body-parser 2.3.0 → 2.4.0, @react-navigation/core 7.21.13 → 7.24.0 con routers 7.6.5 y node-forge 1.4.0 → 1.4.2. No se cambió de SDK.

## Objetivos y criterios

${table(['ID','Objetivo','Control y criterio','Resultado / límite'],[
['OC-01','Integridad de reservas','RC-03/04: rechazos de límites y exactamente una reserva concurrente','PF-07/08/12/13 conformes'],
['OC-02','Proteger acceso y credenciales','RC-01/02: 401/403 sin mutación; hash; claves anteriores inválidas','PF-01/04/10/22 y rotación conformes; JWT previos no revocados'],
['OC-03','Desempeño','RC-05 conserva feedback visual ≤1 s; KPI adicional HTTP p95 ≤1000 ms','HTTP medido; feedback visual y cold start no instrumentados'],
['OC-04','Recordatorios fiables','RC-11: claim exclusivo, reintento y ausencia de duplicados','PF-18 a PF-21 conformes en SQL; NF-01 a NF-04 documentan recepción y respuesta visibles'],
['OC-05','Regresión y compatibilidad','RC-08/09: TypeScript, lint, pruebas y empaquetado sin bloqueos','Consultar controles y compilaciones; pruebas UI completas pendientes'],
['OC-06','Seguridad de dependencias','0 vulnerabilidades altas/críticas para liberar generalmente','Backend conforme; frontend no cumple'],
])}

## Responsabilidades y RACI

R ejecuta; A aprueba; C consulta; I recibe información. Esta matriz asigna el trabajo futuro sin atribuir aprobaciones inexistentes.

${table(['Actividad','Hanssel','Ruddy / Steven','Representante de Cale Shop'],[
['Requisitos, desarrollo y documentación','R/A','C cuando participe','I'],
['Pruebas, KPI y registro de defectos','R/A','C cuando participe','I'],
['Revisión independiente de un PR','R en preparar y resolver','R en revisión si la acepta; no se presume aprobación','I'],
['Validación de uso y SUS','R en organizar','I','R en responder; A en aceptación de negocio si participa'],
['Decisión técnica de liberar','R/A','C','C'],
])}

## Procesos y cronograma de control

Antes de cada cambio: identificar RF/RC y criterio de aceptación. En cada PR: revisión de diff, TypeScript, ESLint y pruebas automatizadas. Después de una corrección de riesgo: repetir campaña representativa y conservar antes/después. Antes de liberar: auditoría de dependencias, accesos, evidencias, compilación y matriz de trazabilidad. Durante el piloto: revisión semanal de defectos y observaciones; medir nuevamente tras cambios de infraestructura. El corte del 31/10 conserva fechas UTC por ejecución, con zona de presentación Guatemala.

Registros obligatorios: ID, versión o huella de archivos, fecha, ambiente, pasos/datos, esperado, obtenido, estado y evidencia. Estados permitidos: ejecutado conforme, ejecutado no conforme, parcial y no medido. Un archivo de prueba existente no equivale a prueba ejecutada; un pipeline diseñado no equivale a CI remoto aprobado.

## Riesgos y decisión

Riesgos residuales: dependencias frontend vulnerables; tokens de sesión anteriores a la rotación; ausencia de estudio SUS; correlación de versión/reloj/job de las capturas de notificaciones y compatibilidad móvil aún incompletas; cold start de Render no medido hoy; falta de SHA de despliegue. La recepción de push y la confirmación visible del cliente y ADMIN sí están documentadas. Mitigación: piloto, acceso limitado, claves privadas, backlog con criterio de cierre y nueva verificación antes de liberar.

## Aplicación de estándares

ISO 9000: vocabulario consistente en requisitos, defectos y evidencias. ISO 9001: controles de proceso, registros, tratamiento de no conformidades y PDCA. ISO/IEC/IEEE 12207: requisitos → cambios → construcción → verificación → entrega y mantenimiento. Las evidencias de aplicación son las matrices, Git, pruebas y registros de este paquete; no se declara certificación.

Para conservar comparabilidad, los nombres de atributos de los parciales se mantienen como base académica del modelo ISO/IEC 25010:2011. Se explicita que esa edición fue retirada y reemplazada; no se presenta como edición vigente. La edición 2023 tiene nueve características y requiere una migración explícita del modelo; no se mezclan nombres sin explicar. Referencias oficiales: [ISO 2011](https://www.iso.org/standard/35733.html), [ISO 2023](https://www.iso.org/standard/78176.html). SUS ≥70 es un criterio interno previamente fundamentado, no una obligación de ISO ni un resultado medido.
`);
const correctionRows=[
['I-01','I','Precisar condiciones normales de rendimiento','Se conservan condiciones del II y se añade medición HTTP reproducible con muestra y p95',e('despliegue.json')+'; II pp.12–13','Cerrado para definición; UI pendiente'],
['I-02','I','Referencias formales para SUS ≥70','Se preservan Brooke 1996 y Bangor et al. 2009; meta interna','II p.24; plan-calidad-final.md','Cerrado documental; SUS no medido'],
['I-03','I','Evidencia fechada y versionada','Reportes con timestamps, base y manifiesto de archivos',e('manifest.json'),'Cerrado en este paquete'],
['I-04','I','Resultados reales de métricas','KPI con fuentes crudas, comparaciones e interpretación','kpi-pdca.md; '+e('controles.json'),'Cerrado para indicadores disponibles'],
['II-01','II','Cambiar claves expuestas y acceso seguro','Dos claves rotadas; anteriores 401 y nuevas 200; archivo privado fuera de Git',e('rotacion-accesos.json')+'; acceso-seguro.md','Cerrado en rotación; sesiones previas riesgo residual'],
['II-02','II','Ampliar pruebas críticas: concurrencia, seguridad y recordatorios','Diez pruebas visuales históricas, 23 escenarios HTTP/DB y cuatro capturas nuevas de notificación recibida y asistencia confirmada en CLIENT/ADMIN','II pp.16 y 26–39; notificaciones-verificadas.md; '+e('integracion-regresion.json'),'Ampliación atendida para los escenarios probados; origen automático informado por el estudiante y recepción visible comprobada'],
['II-03','II','Automatizar regresión y pre-release','CI ejecutado en PR #7/#8 con Tests, SonarCloud, DeepSource y Snyk; runner local y propuesta adicional PostgreSQL','Others p.2; antecedentes-verificados.md; .github/workflows/quality-security.yml','Atendida en la automatización adoptada; ampliación adicional del CI aún sin ejecución remota'],
['II-04','II','Mediciones reproducibles incluido p95','Muestras crudas; nearest-rank; medición local y despliegue',e('despliegue.json')+'; '+e('integracion-regresion.json'),'Atendida para rendimiento HTTP; RC-05 visual conserva su alcance propio'],
['II-05','II','Centralizar defectos con corrección y cierre','Registro único con DEF-01/02 y nuevos hallazgos','auditoria-defectos.md','Cerrado documental; controles recurrentes'],
['II-06','II','Ejecutar acciones correctivas pendientes','H-01 centralizado; H-02 estandarizado y automatizado gradualmente en HTTP; regresión ejecutada','auditoria-defectos.md; kpi-pdca.md','H-01 y H-02 atendidos en el alcance de sus acciones originales; instrumentación visual/frío queda como mejora adicional'],
['II-07','II','Registros de revisión de colaboradores','Se recuperaron revisiones auténticas de PR #1–#6, con fechas/autores y límites',e('revisiones-github.json'),'Cerrado histórico; cambios nuevos sin revisión humana'],
['II-08','II','Evidencias por fecha, versión y resultado','Índice, reportes y SHA-256; separación de histórico/local/desplegado',e('manifest.json'),'Cerrado en este paquete'],
];
write('correcciones.md',`# Matriz de correcciones de ambos parciales

Fuente: observaciones originales de los DOCX de retroalimentación de I y II en proyecto/entregas. Se conservan estados parciales cuando falta comprobación. No se publica el PDF histórico del II porque contiene claves expuestas, aunque ya hayan sido rotadas.

${table(['ID','Parcial','Observación','Acción ejecutada','Evidencia','Estado'],correctionRows)}

La documentación histórica de PR #8 afirmaba que no se fusionó. GitHub confirma merge el 17/10/2026 en ab73b3a18839f08825bc441f024e426455b41d4e. Se corrige la lectura vigente, conservando los reportes antiguos como cortes históricos. La fusión no demuestra resolución de Snyk ni una decisión de liberación aprobada.

No se confunde una ampliación futura con una observación anterior sin atender. Las pruebas visuales del II son evidencia ejecutada y el CI de PR #7/#8 también fue ejecutado, aunque la ampliación nueva de esta rama no tenga aún una ejecución remota. Del mismo modo, H-02 solicitaba estandarizar y automatizar gradualmente; la instrumentación HTTP cumple esa acción, sin convertir RC-05 visual en una medición realizada. SUS queda pendiente por coordinación con la barbería y sus clientes, según la decisión del estudiante; las referencias requeridas en I sí están incorporadas.
`);
write('antecedentes-verificados.md',`# Antecedentes verificados para las correcciones

Revisión del 31/10/2026. Se examinó el texto completo del PDF de Others y se inspeccionaron visualmente los anexos pertinentes del II Parcial. Los originales se conservan en proyecto/entregas; no se vuelven a publicar aquí, porque el II contiene una tabla de claves expuestas. Los datos de acceso nuevos no forman parte de este registro.

## Prueba y validación de software en línea

Fuente local: proyecto/entregas/Others/Prueba y validación de software en linea.pdf, dos páginas. La página 2 documenta la ejecución de controles mediante PR #7 y PR #8: Tests, SonarCloud, DeepSource y Snyk; correcciones de dependencias; endurecimiento del pipeline y fusión de ambos PR. Es evidencia documental de trabajo aplicado, complementada por metadatos, reportes y logs ya existentes. No corresponde clasificar toda la automatización como una propuesta sin ejecutar.

La reducción histórica de Snyk 22 → 5 pertenece al PR #7; el PR #8 conservó cinco hallazgos altos del frontend. Estos conteos no se mezclan con npm audit del 31/10. El documento pertenece a Implementación y Validación de Software, con el mismo proyecto y docente; se utiliza como evidencia técnica complementaria, sin presentarlo como una nueva rúbrica de Ingeniería de Calidad.

PR: https://github.com/Hansolo2077/barberia-cale/pull/7 y https://github.com/Hansolo2077/barberia-cale/pull/8. Metadatos y revisiones: ${e('revisiones-github.json')}. Reportes históricos: docs/analisis-calidad-seguridad.md, docs/remediacion-seguridad-pr8.md y docs/evidencias_pruebas/pr8/.

## Evidencia funcional del II Parcial

Fuente local: proyecto/entregas/Parcial II/II_Parcial_Avance_Proyecto_Barberia_Cale_Hanssel_Nunez.pdf, 39 páginas. La tabla de la página 16 registra diez casos del 03/10/2026, todos aprobados, incluidos tres negativos. Los anexos de las páginas 26–35 contienen capturas de la interfaz Android; las páginas 36–39 contienen persistencia e infraestructura de Supabase.

${table(['Caso','Comprobación','Página del PDF','Capturas'],[
['PR-01 / PR-04','Login ADMIN y rechazo de campos vacíos','26','04 / 02'],
['PR-02','Creación y consulta de cita pendiente','27','23 / 25'],
['PR-03','Aceptación administrativa y estado recuperado por CLIENT','28','29 / 35'],
['PR-05','Cancelación por CLIENT e historial','29–30','38 / 40 / 41'],
['PR-06','Rechazo de una segunda cita activa el mismo día','30','42'],
['PR-07','Rechazo administrativo y consulta en agenda','31','44 / 54'],
['PR-08 / PR-09','Celular duplicado y registro con acceso automático','32','48 / 50'],
['PR-10','Cancelación administrativa y estado final de agenda','33–34','52 / 53 / 33'],
['RF-20 adicional','Confirmación de asistencia desde Mis citas','34','37'],
['Complementarias','Disponibilidad y guía administrativa','35','11 / 16'],
['Infraestructura','Esquema, tablas, registros, funciones, triggers y Edge Function','36–39','L1 a L7'],
])}

Estas evidencias se conservan como ejecución histórica, no como pruebas repetidas hoy. Las capturas de asistencia prueban la acción en la app; no demuestran por sí solas recepción de push. El propio PDF aclara en la página 39 que SENT es procesamiento interno, no confirmación visual de entrega al dispositivo. Las pruebas de octubre y los 23 escenarios nuevos se complementan; no se declara que faltan por completo las pruebas funcionales visuales.

## Efecto sobre el seguimiento

La observación de automatización está atendida mediante el CI existente y ejecutado. La ampliación de pruebas se sustenta en los diez casos históricos, los escenarios críticos nuevos y las cuatro capturas de notificaciones descritas en notificaciones-verificadas.md. H-01 se atendió con el registro central; H-02 con estandarización e instrumentación HTTP gradual. Permanecen separados los riesgos y mejoras adicionales: correlación de reloj/versión/job de las capturas, sesiones/calendarios reejecutados en el build final, instrumentación visual/frío, SUS coordinado con usuarios y ejecución remota de la ampliación nueva de CI.
`);
write('notificaciones-verificadas.md',`# Evidencia visual de notificaciones y asistencia

Se inspeccionaron las cuatro imágenes originales de proyecto/entregas/Others/Notificaciones el 31/10/2026. El estudiante confirmó expresamente que el recordatorio llegó automáticamente. Esta afirmación se registra como testimonio del ejecutor; la recepción visible sí se comprueba directamente en la captura de la bandeja Android.

${table(['ID','Imagen','Requisito','Observación verificada'],[
['NF-01','notificaciones.jpg','RF-19','Notificación de Barbería Cale en la bandeja Android, con solicitud de confirmar la cita del domingo 1 de noviembre a las 13:00.'],
['NF-02','antes de confirmar.jpg','RF-20','La cita está aceptada y el cliente tiene disponible Confirmar asistencia.'],
['NF-03','asistencia confirmada.jpg','RF-20','Aviso de operación exitosa y estado Asistencia confirmada para la misma fecha y hora visibles.'],
['NF-04','confirmacion desde cuenta admin.png','RF-21','ADMIN muestra la cita #55 y el indicador Confirmó asistencia; la fecha y hora coinciden con las capturas del cliente.'],
])}

Resultado: recepción de push documentada, confirmación visible del cliente documentada y resultado visible en ADMIN documentado. Estas imágenes complementan la evidencia SENT de Supabase y las pruebas SQL de claim, revalidación, reintento y exclusión. No corresponde mantener una afirmación general de que no existe evidencia de recepción en el dispositivo.

Fuente e integridad: ${e('notificaciones-visuales.json')} conserva rutas, SHA-256, resultados y límites. Los originales permanecen en la carpeta aportada por el estudiante; sus imágenes aún no se han incorporado al ZIP ni al PDF final. No se declara que el asistente ejecutó esos pasos ni que todos los requisitos se verificaron mediante una sola prueba.

## Alcance y metadatos por completar

Las imágenes no muestran SHA/build ni ID de job/ticket/receipt. La bandeja muestra sábado 31 de octubre, mientras la cita figura para domingo 1 de noviembre a las 13:00. Por eso no se utiliza esta secuencia, sin correlación adicional de reloj y ambiente, como prueba de la ventana automática de una hora definida en RF-19. El origen automático está respaldado por la declaración del estudiante; la recepción está respaldada por la imagen. La secuencia también muestra confirmación desde Mis citas, sin demostrar un clic de confirmación desde la propia notificación. Son límites de trazabilidad, no ausencia de recepción o de confirmación.
`);
write('dod-devops-backlog.md',`# Definition of Done y backlog de calidad

## Definition of Done adoptada para el cierre

Una tarea se considera terminada cuando identifica RF/RC afectados y un criterio observable; el cambio está acotado y revisado; TypeScript y ESLint pasan; pasan las pruebas aplicables positivas, negativas y de regresión; no introduce secretos; actualiza requisitos y registro de cambios; conserva fecha, versión/huella, resultado y enlace a evidencia. Si necesita revisión independiente, debe existir aprobación real de otra persona; la autoevaluación no la sustituye. Una tarea puede estar implementada sin cumplir aún la DoD.

Criterios críticos: RF-06/RC-04 exige una sola cita activa bajo competencia simultánea y conflicto para la otra petición; RF-16 exige 401/403 sin modificar datos; RF-20 exige conservar el primer timestamp al repetir; RF-22 exige un solo trabajo activo, claim exclusivo, reintento registrado y anulación al confirmar/cancelar. PF-12, PF-04, PF-09 y PF-18/19/20 verifican estos criterios.

## Flujo real y ampliación local

Cambio con requisito → rama → diff y revisión → TypeScript/lint/pruebas → análisis Sonar con Quality Gate → DeepSource por SHA → Snyk → decisión registrada → integración/liberación si cumple. Las revisiones históricas de PR #1 a #6 son evidencia real. PR #7/#8 no tienen revisión humana registrada en la consulta.

El workflow existente ejecutaba Tests → SonarCloud → DeepSource → Snyk. Esta rama añade PostgreSQL 17 efímero y la campaña de integración al job Tests y espera el Quality Gate de Sonar. La ampliación está implementada; no tiene ejecución remota aprobada en este corte. No se reutilizan credenciales de producción en CI. Los roles y claves de PostgreSQL de CI pertenecen exclusivamente al servicio descartable del runner.

${table(['ID','Mejora o deuda','Prioridad','Responsable','Estado','Criterio de cierre'],[
['BQ-01','Dependencias altas del frontend','Alta','Hanssel','Abierto',`0 altas/críticas en escáneres definidos o evaluación formal de excepción; hoy npm ${front.high} altas`],
['BQ-02','Publicar/verificar parches y CI de esta rama','Alta','Hanssel','Pendiente de integración','PR revisado; checks del SHA final; despliegue identificado y smoke test'],
['BQ-03','Recepción push y respuesta visible','Alta','Hanssel','Recepción documentada','NF-01 a NF-04: bandeja Android, confirmación CLIENT y proyección ADMIN; origen automático confirmado por el estudiante'],
['BQ-04','RC-05: feedback UI y cold start','Media','Hanssel','Parcial','Instrumentar acción a feedback, entorno definido y series separadas frío/caliente'],
['BQ-05','RC-06 SUS con usuarios','Media','Hanssel y participantes','No medido','Respuestas reales anonimizadas, muestra/fecha/build y cálculo SUS'],
['BQ-06','Regresión de sesión y calendarios Android/web','Alta','Hanssel','Parcial','Reinicio con sesión, logout y calendarios con pasos y capturas del build final'],
['BQ-07','Revisión humana de cambios nuevos','Media','Revisor que acepte','Pendiente','Review real con alcance, observaciones y decisión'],
['BQ-08','Revocar JWT previamente emitidos','Alta','Hanssel','Abierto','Política de revocación/expiración y prueba de rechazo; rotación de clave no revoca JWT existentes'],
['BQ-09','Parches recomendados de SDK 57','Media','Hanssel','Abierto','Alinear los 18 paquetes señalados por expo install --check y repetir builds/pruebas; no confundir recomendación con parche ya aplicado'],
['BQ-10','Correlación de notificación con reloj/build/job','Media','Hanssel','Pendiente','Identificar build y job y explicar fechas/reloj de las capturas; no extrapolar a la ventana automática de una hora'],
])}

No se fuerza SDK 58, overrides incompatibles ni supresiones para mejorar conteos. Los reportes de npm cuentan paquetes afectados y su propagación; los conteos históricos de Snyk tienen otra fuente/umbral y no se comparan como una misma serie.
`);
write('pruebas-finales.md',`# Campaña final de pruebas y regresión

Ejecución inicial: ${baseline.startedAt}. Regresión: ${integration.startedAt}. Entorno: HTTP Express local, rutas/controladores/middleware/servicios reales y PostgreSQL ${integration.environment.postgresql} remoto con esquemas efímeros. El código SQL del esquema y las cuatro migraciones se ejecuta reemplazando solo los nombres de esquema; no se modifica public ni reminder_api de la aplicación. Se omite NOTIFY pgrst para no recargar servicios reales. Limpieza: ${integration.cleanup}.

Los usuarios y citas son sintéticos. El JWT de prueba usa un secreto aleatorio distinto del entorno publicado. Algunos estados pasados y ventanas de recordatorio se preparan directamente como fixtures SQL para no esperar horas; esos preparativos no son operaciones válidas del usuario. Los tokens push son sintéticos y no se contacta Expo. La marca SENT probada es persistencia interna, no entrega física.

${table(['ID','RF/RC','Caso','Pasos','Esperado','Obtenido','Estado'],integration.cases.map(c=>[c.id,c.requirements.join(', '),c.title,c.steps.join('; '),c.expected,JSON.stringify(c.observed),c.status]))}

Datos exactos de fecha, precondiciones, resultados y timestamps: ${e('integracion.json')} y ${e('integracion-regresion.json')}. Resultado: ${passed}/${integration.summary.executed}; no es cobertura de código ni porcentaje total de requisitos. Los controles unitarios/componentes se reportan por separado en ${e('controles.json')}.

## Reproducción

Instalar con npm ci --ignore-scripts y npm ci --prefix backend --ignore-scripts. Ejecutar npm run quality:checks (devuelve fallo si hay controles o auditorías no conformes). Para integración, configurar DATABASE_URL fuera de Git y ejecutar npm run quality:integration. La cuenta debe permitir crear y eliminar únicamente los esquemas temporales de la campaña. El script exige el patrón qa_iii antes de limpiar. No editar el script para apuntar a tablas reales.

CI utiliza PostgreSQL descartable local, roles anon/authenticated/service_role sin login y sslmode=disable exclusivamente en 127.0.0.1. No introducir claves personales en workflow. La ejecución local real ya existe; la nueva ejecución de CI se debe verificar después de publicar el cambio.

## Límites

La evidencia visual del II ya incluye los diez casos detallados en antecedentes-verificados.md y la confirmación de asistencia. Las cuatro imágenes nuevas de notificaciones-verificadas.md documentan recepción y confirmación CLIENT/ADMIN, con origen automático informado por el estudiante. En la campaña nueva no se reejecutaron integralmente sesión persistente tras reinicio, logout de UI, interacción completa de calendarios en ambos clientes, redeploy sin pérdida, carga sostenida o estudio SUS. La persistencia tras nueva conexión PF-23 no se presenta como redeploy. El endpoint health no identifica la versión desplegada. El registro de compilación determina qué binarios se pudieron generar, no qué pruebas de UI se aprobaron. SUS queda pendiente por coordinación con la barbería y sus clientes.
`);
const metricRows=[
['KPI-01','Aprobadas / ejecutadas ×100','II: 10/10; campaña distinta',`${passed}/${integration.summary.executed} = ${100*passed/integration.summary.executed}%`,'100%','Cumplido','Mantener regresión; correlacionar capturas de notificación sin sumarlas como ejecuciones propias',e('integracion-regresion.json')],
['KPI-02','Controles automáticos de código/pruebas conformes / 4 ×100','II: sin CI consolidado',`${checks.checks.filter(c=>['typescript','eslint','frontend-tests','backend-tests'].includes(c.id)&&c.status==='PASS').length}/4 = 100%`,'100%','Cumplido','Conservar como gate y comprobar CI remoto',e('controles.json')],
['KPI-03','Paquetes altos/críticos npm backend','Antes hoy: '+(backBefore.high+backBefore.critical),'Actual: '+(back.high+back.critical),'0','Cumplido','Conservar parche y prueba de cuerpo comprimido',e('audit-backend.json')],
['KPI-04','Paquetes altos/críticos npm frontend','Antes hoy: '+(frontBefore.high+frontBefore.critical),'Actual: '+(front.high+front.critical),'0','No cumplido','No liberar generalmente; seguir BQ-01',e('audit-frontend.json')],
['KPI-05','Accesos expuestos con clave anterior 401 y nueva 200 / 2 ×100','II: 2 claves publicadas',`${rotation.accounts.filter(a=>a.status==='PASS').length}/2 = 100%`,'100%','Cumplido','Acceso privado y revocación de sesiones pendiente',e('rotacion-accesos.json')],
...live.performance.map(p=>['KPI-HTTP-'+p.name,'p95 nearest-rank HTTP en ms','II: cronómetro visual; no comparable directamente',`${p.p95Ms} ms; n=${p.n}`,'≤1000 ms',p.status==='PASS'?'Cumplido':'No cumplido','Mantener serie instrumentada y separar UI/frío',e('despliegue.json')]),
['KPI-SUS','Puntuación SUS media','Sin estudio ejecutado','No medido','≥70','No medido','Organizar usuarios reales y conservar respuestas','Plan de Calidad; BQ-05'],
];
write('kpi-pdca.md',`# KPI finales y mejora del proceso

Tablero del 31/10/2026. Responsable: Hanssel. Frecuencia: antes de cada liberación y tras cambios relevantes. Las líneas base de campañas diferentes se distinguen; los resultados de pruebas no constituyen cobertura de código ni de requisitos.

${table(['ID','Fórmula / medida','Línea base','Valor actual','Meta','Estado','Decisión','Fuente'],metricRows)}

## Interpretación de rendimiento

Las muestras crudas están en despliegue.json. HTTP incluye solicitud hasta cuerpo JSON completamente recibido. Login tiene 10 muestras para respetar el rate limit compartido; disponibilidad y citas tienen 30 cada una. Concurrencia 1, una petición de calentamiento por flujo, Windows/Node fetch hacia Render. Se mide p95 por ordenación y posición ceil(0.95 × n); no se aproxima con media. No se midió el feedback visible del RC-05 ni un arranque en frío deliberado. El cronómetro del II se conserva como observación histórica y no se inventa una mejora porcentual entre métricas distintas.

## Ciclo PDCA verificable de seguridad de dependencias

PLAN: auditoría inicial del 31/10 detectó ${backBefore.high} alta en backend y ${frontBefore.high} altas en frontend. Objetivo: resolver parches compatibles sin saltar de Expo SDK ni debilitar verificaciones. Responsable: Hanssel. Criterio global: cero altas/críticas antes de liberar; criterio del cambio: eliminar body-parser vulnerable y el aviso compatible de navegación sin romper regresión.

DO: body-parser 2.3.0 → 2.4.0; @react-navigation/core 7.21.13 → 7.24.0 y routers 7.6.5; node-forge 1.4.0 → 1.4.2, cuyo parche compatible fue confirmado en el registro el 31/10. Se añadió una regresión HTTP de JSON comprimido con bytes finales y comprobación posterior de servidor vivo. Se registró la fuente del aviso [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828).

CHECK: backend ${backBefore.high} → ${back.high} altas; frontend ${frontBefore.high} → ${front.high} altas. Reportes antes/después de la misma herramienta y corte. Campaña real inicial ${baseline.summary.passed}/${baseline.summary.executed}, regresión ${passed}/${integration.summary.executed}. TypeScript/lint y suites: consultar controles.json actualizado. No se extrapola npm a Snyk.

ACT: aceptar los parches compatibles como mejora local; conservar la regresión y el control npm, y mantener abiertas las vulnerabilidades restantes. No autorizar liberación general. Repetir el ciclo al existir parches compatibles y verificar el SHA desplegado. La revisión/ejecución remota de la ampliación de CI sigue pendiente; no se presenta como aprobada.

El ciclo histórico del calendario se mantiene como antecedente en DEF-01/02; no se reutiliza como resultado nuevo. La mejora nueva de esta campaña es la medición reproducible y la regresión de seguridad con registro central.
`);
const defects=[
['DEF-01','Calendario mezclaba selección/cancelación','Media','PR #2 / 057ffe6','Cerrado histórico','Separación de eventos','Review Ruddy PR #2; no se reejecutó UI final','Conservar caso UI BQ-06'],
['DEF-02','Cancelar alteraba rango de agenda','Media','PR #3 / d7c025d','Cerrado histórico','Conservar rango al cancelar','Review Ruddy PR #3; no se reejecutó UI final','Conservar caso UI BQ-06'],
['H-01','Registro de defectos disperso','Media','II p.15; este registro','Cerrado documental','Registro único con ID, causa y cierre','Este archivo, trazabilidad y evidencias','Actualizarlo en cada cambio'],
['H-02','Métricas manuales','Media','II p.15; despliegue.json','Atendido en la automatización gradual original','Instrumentación HTTP y p95','Muestras y runner reproducible','Continuar ampliación UI y frío: BQ-04'],
['DEF-03','Dos claves publicadas en PDF','Alta','Retroalimentación II; rotacion-accesos.json','Corregido; riesgo JWT abierto','Cambiar claves y comprobar 401/200','Dos roles PASS; nuevos valores solo locales','No publicar secretos; seguir BQ-08'],
['DEF-04','body-parser vulnerable a cuerpo comprimido','Alta','audit-backend-antes.json; GHSA-27r3-jxmh-p828','Corregido local; despliegue pendiente','Actualizar a 2.4.0','Audit backend cero; json-parser.integration.test.js','Regresión automática; BQ-02'],
['DEF-05','Dependencia de navegación vulnerable','Alta','audit-frontend-antes.json','Corregido local; despliegue pendiente','core 7.24.0 y routers 7.6.5','Una entrada alta menos; pruebas/bundle','Mantener lockfiles y revisar avisos'],
['H-03','Vulnerabilidades frontend remanentes','Alta','audit-frontend.json','Abierto',`${front.high} altas, ${front.moderate} moderadas y ${front.low} bajas visibles`,'No hay cierre ni excepción aprobada','BQ-01: resolver compatibles y repetir análisis'],
['H-04','Documento PR #8 decía sin merge','Media','GitHub PR #8 merged; revisiones-github.json','Cerrado en lectura vigente','Añadir estado actual sin reescribir medición histórica','Commit merge ab73b3a, 17/10','No confundir merge con seguridad aprobada'],
['H-05','Entorno inicial Android sin script utilizable','Media','Inspección inicial: Unable to load script','Usuario confirma app corriendo; campaña UI propia pendiente','Compilación release de verificación','Consultar compilaciones.json; inspección visual detenida con Escape','No extrapolar observación inicial al estado actual ni declarar campaña UI aprobada'],
['DEF-06','node-forge 1.4.0 vulnerable','Alta','audit-frontend-antes.json','Corregido local; despliegue pendiente','Actualizar dentro de ^1.3.3 a 1.4.2','audit-frontend.json y controles.json','Revisar parches publicados en cada corte'],
['H-06','18 paquetes tienen parches SDK 57 recomendados','Media','expo-compatibility.txt','Abierto','Mantenimiento pendiente sin cambio de SDK','Comprobación devuelve 1; no se oculta','BQ-09; repetir compilaciones al alinear'],
];
write('auditoria-defectos.md',`# Auditoría de cierre y registro central de defectos

Revisión técnica interna del 31/10/2026. Responsable de ejecución: Hanssel con asistencia de herramientas. No constituye aprobación de Ruddy o Steven para estos cambios nuevos. Las revisiones anteriores se atribuyen exclusivamente a sus autores y alcance registrados.

${table(['Control','Criterio','Estado','Evidencia / observación'],[
['AUD-01','Línea base RF-01 a RF-22 identificada','Conforme','Requisitos vigentes y plan-calidad-final.md'],
['AUD-02','Correcciones I y II trazables','Parcial','correcciones.md; pendientes reconocidos'],
['AUD-03','Credenciales expuestas rotadas','Conforme',e('rotacion-accesos.json')],
['AUD-04','Autorización real por rol','Conforme','PF-04/10/22 y LIVE-03 a LIVE-07'],
['AUD-05','Concurrencia sin doble reserva','Conforme','PF-12; exactamente una activa'],
['AUD-06','Recordatorios exclusivos y reintentables; recepción','Conforme para escenarios probados','PF-18 a PF-21; NF-01 recepción visible y NF-02 a NF-04 asistencia; correlación reloj/build/job pendiente'],
['AUD-07','TypeScript, lint y pruebas automáticas','Conforme',e('controles.json')],
['AUD-08','Seguridad alta/crítica de dependencias','No conforme',`Backend cero; frontend ${front.high} altas`],
['AUD-09','Cuatro KPI con resultados y decisiones','Conforme','kpi-pdca.md'],
['AUD-10','DoD, backlog y flujo de cambios','Conforme documental','dod-devops-backlog.md; CI nuevo sin ejecución remota'],
['AUD-11','Defectos con ID y evidencia de cierre','Conforme documental','Registro siguiente; estados históricos/locales explícitos'],
['AUD-12','Revisión técnica independiente existente','Conforme histórico','revisiones-github.json; PR #1–#6; Steven PR #4 posterior al merge'],
['AUD-13','Compatibilidad integral Android/web','Parcial','Bundle web y registro móvil; UI final sin campaña completa'],
['AUD-14','Rendimiento y usabilidad','Parcial','HTTP p95 medido; SUS y feedback visual no medidos'],
['AUD-15','Evidencia identificada y sin secretos','Revisión mediante manifiesto','manifest.json; nuevos accesos solo .quality-private'],
['AUD-16','Dependencias alineadas con recomendación Expo','No conforme','expo-compatibility.txt; 18 parches recomendados, BQ-09'],
])}

## Registro de seguimiento

Responsable de todas las acciones de implementación/documentación: Hanssel. Un revisor externo solo se asigna cuando acepta participar.

${table(['ID','Defecto / hallazgo','Severidad','Reproducción / evidencia','Estado','Corrección puntual','Verificación / regresión','Acción contra la causa'],defects)}

Los reportes npm crudos mantienen el detalle de dependencias, rango afectado y fixAvailable. La existencia de una propuesta npm que cambia SDK no demuestra compatibilidad. No se ejecutó audit fix --force ni se ocultaron resultados fallidos.
`);
const attributes={ '01':'Seguridad / adecuación funcional','02':'Seguridad','03':'Seguridad / fiabilidad','04':'Seguridad','05':'Adecuación funcional / desempeño','06':'Fiabilidad / adecuación funcional','07':'Adecuación funcional','08':'Adecuación funcional','09':'Fiabilidad','10':'Adecuación funcional','11':'Adecuación funcional','12':'Adecuación funcional','13':'Adecuación funcional','14':'Fiabilidad','15':'Adecuación funcional','16':'Seguridad','17':'Compatibilidad','18':'Seguridad / fiabilidad','19':'Fiabilidad','20':'Fiabilidad','21':'Adecuación funcional','22':'Fiabilidad / seguridad' };
const noCases={'RF-03':'Sesión tras reinicio no reejecutada','RF-04':'Logout UI no reejecutado','RF-17':'Mensaje preparado histórico; envío manual no realizado','RF-07':'Consulta HTTP comprobada en PF-06; filtro de próximas sin caso independiente'};
write('trazabilidad-final.md',`# Matriz final de trazabilidad

Necesidad: centralizar citas de Barbería Cale con acceso por rol, reglas consistentes y recordatorios trazables. Los RF mantienen las definiciones de [requisitos actuales](../requisitos-actuales.md). La arquitectura ya relaciona interfaz, módulo, endpoint y datos; esta matriz añade control, medición, resultado y acción del corte final. Los atributos conservan el modelo académico histórico descrito en el Plan de Calidad.

${table(['Necesidad','RF','Atributo','Proceso / control','KPI o criterio','Prueba','Resultado / evidencia','Hallazgo / acción y estado'],Array.from({length:22},(_,i)=>{
const num=String(i+1).padStart(2,'0'),rf='RF-'+num,cases=casesFor(rf);const reminder=i>=17;const security=['01','02','03','04','16','18'].includes(num);return [i<4?'Acceso seguro':i<9?'Reserva y consulta':i<17?'Gestión de citas':'Recordatorios y asistencia',rf,attributes[num],security?'Autenticación, rol y propietario':reminder?'Elegibilidad, claim y persistencia':'Reglas de negocio y estados',num==='06'?'RC-03/04; una activa concurrente':security?'RC-01/02; 401/403 o hash':reminder?'RC-11; idempotencia y exclusión':'KPI-01; resultado esperado',cases||'Sin caso integral final',cases?`PASS en integracion-regresion.json; ${cases}`:(noCases[rf]||'Sin prueba integral final; consultar evidencia histórica'),cases?(reminder?'NF-01 a NF-04: recepción/respuesta documentadas; BQ-10 por correlacionar':'Mantener regresión; UI BQ-06'):'BQ-06; pendiente'];}))}

Los 23 casos no prueban cada escenario de los 22 requisitos. RF-19 combina pruebas SQL con NF-01, que muestra recepción en Android; el estudiante confirmó origen automático. RF-20 añade NF-02/03 y RF-21 añade NF-04 como evidencia visual cliente/administrador. La correlación de reloj/build/job se mantiene separada. Los vínculos HTTP/DB no sustituyen evidencia UI. Tampoco se confunde el porcentaje de aprobación con cobertura de código.

${table(['RC','Criterio','Evidencia final','Estado'],[
['RC-01','Autorización','PF-04/10/22; despliegue.json','Conforme para escenarios ejecutados'],
['RC-02','Hash y protección','PF-01/22; rotacion-accesos.json','Conforme para escenarios ejecutados'],
['RC-03','Reglas y límites','PF-07/08/13','Conforme para selección ejecutada'],
['RC-04','Concurrencia sin duplicados','PF-12','Conforme: dos solicitudes reales'],
['RC-05','Feedback visible ≤1 s','HTTP p95 adicional; no UI','Parcial / feedback no medido'],
['RC-06','SUS ≥70','Sin respuestas','No medido; BQ-05'],
['RC-07','Controles móviles accesibles','Capturas históricas; UI final no verificada por herramientas','Parcial'],
['RC-08','Controles técnicos','controles.json; prueba body-parser','Conforme en local'],
['RC-09','Android y web','Compilaciones; no campaña UI integral','Parcial'],
['RC-10','Persistencia tras redeploy','PF-23 prueba nueva conexión','Parcial; redeploy no ejecutado'],
['RC-11','Recordatorios fiables','PF-18/19/20/21 y NF-01 a NF-04','Conforme para escenarios SQL y recepción/respuesta visibles; correlación temporal pendiente'],
])}
`);
write('acceso-seguro.md',`# Procedimiento seguro de acceso para evaluación

El PDF histórico del II expuso dos claves. Fueron cambiadas el ${rotation.finishedAt}, verificando en ambos roles clave anterior → HTTP 401 y nueva → HTTP 200. Evidencia pública: ${e('rotacion-accesos.json')}. El registro no contiene celulares, claves, hashes ni tokens.

Los accesos nuevos están únicamente en .quality-private/evaluation-access.json, excluido de Git. El estudiante conserva ese archivo y comparte al docente el acceso necesario por un canal privado acordado, separado del expediente y con duración de evaluación definida. No se ha enviado ningún mensaje ni compartido credenciales con terceros. No incluir ese archivo en anexos, capturas, ZIP público o commits.

Antes de facilitar acceso, confirmar que son cuentas de evaluación y no exponen datos personales reales. Si el docente necesita ADMIN, preferir un entorno de evaluación con datos sintéticos. Al finalizar, retirar o volver a rotar el acceso temporal y registrar el resultado sin valores secretos. La guía exige enlaces de evidencias accesibles sin pedir credenciales personales del estudiante; el repositorio y reportes públicos satisfacen esa parte sin publicar contraseñas.

La rotación de contraseña no revoca JWT ya emitidos; la sesión recordada puede tener una vigencia de hasta 30 días según código. Esto sigue abierto en BQ-08. No afirmar revocación ni cierre completo del incidente de sesiones. El PDF histórico se conserva localmente por trazabilidad académica y no debe republicarse con su tabla de claves.
`);
const index=`# Evidencias técnicas del cierre del Parcial III

Corte 31/10/2026. Índice de apoyo: [preparación técnica](../../../proyecto/docs/calidad-final/README.md). No contiene el PDF final.

Los identificadores EV-01 a EV-12 coinciden con el Anexo F (página 43) del informe final. Las rutas se conservan al extraer el ZIP; la carpeta anexos/ pertenece al paquete de entrega.

${table(['ID','Artefacto','Alcance'],[
["EV-01","[Capturas del II Parcial](../../arquitectura-actual/Capturas_App_Segundo_Parcial.md)","Banco histórico de pruebas visuales; figuras A1 a A8 del informe"],
["EV-02","[Análisis de calidad](../../analisis-calidad-seguridad.md) / [remediación PR #8](../../remediacion-seguridad-pr8.md) / [reportes PR #7/#8](../pr8/)","CI y remediación históricos; reportes Sonar/Snyk/DeepSource"],
["EV-03","[controles.json](controles.json)","Controles del 31/10: TypeScript, ESLint, 48 pruebas backend, 4 de notificaciones, auditoría y compatibilidad; TXT/JSON asociados"],
["EV-04","[integracion.json](integracion.json)","Campaña inicial: 23 escenarios reales HTTP/PostgreSQL"],
["EV-05","[integracion-regresion.json](integracion-regresion.json)","Regresión: reejecución de 23 escenarios, resultados y limpieza"],
["EV-06","[despliegue.json](despliegue.json)","Despliegue y p95: checks HTTP/roles y muestras crudas"],
["EV-07","[Backend antes](audit-backend-antes.json) / [después](audit-backend.json); [frontend antes](audit-frontend-antes.json) / [después](audit-frontend.json)","Auditorías npm comparables antes/después del mismo corte; no equivale a Snyk"],
["EV-08","[revisiones-github.json](revisiones-github.json)","Revisiones auténticas: autor, fecha, alcance, SHA y estado de PR"],
["EV-09","[cambio-accesos-evaluacion.json](cambio-accesos-evaluacion.json)","Accesos posteriores: hash, rechazo de clave histórica y login 200 por rol; rotacion-accesos.json es anterior"],
["EV-10","[compilaciones.json](compilaciones.json) / [web-build.txt](web-build.txt) / [android-build.txt](android-build.txt)","Web de 12 rutas; APK y huella; extractos de finalización y límites de UI"],
["EV-11","[notificaciones-visuales.json](notificaciones-visuales.json)","Rutas y huellas de originales; figuras B1 a B4 anonimizadas en anexos/figuras/ del ZIP"],
["EV-12","[manifest.json](manifest.json)","Integridad y organización: huellas de fuentes y evidencias; anexos/manifest-entrega.json en el ZIP"],
])}

Los TXT de suites incluyen resultados TAP. Los JSON de integración conservan pasos, precondiciones, datos sintéticos, esperado/obtenido, estado y fechas. Los informes anteriores de Sonar/Snyk se conservan en ../pr8 y ../dependencias con sus fechas originales; no se presentan como escaneos del 31/10.
`;
fs.writeFileSync(path.join(evidence,'README.md'),index.trim()+'\n');
const dirs=['scripts','backend/src','src','assets','supabase','tests','proyecto/docs','docs/evidencias_pruebas/parcial-iii'];
let files=['package.json','package-lock.json','backend/package.json','backend/package-lock.json','.github/workflows/quality-security.yml','.gitignore','README.md','docs/README.md','docs/remediacion-seguridad-pr8.md','proyecto/docs/README.md','app.json','tsconfig.json','eslint.config.js','google-services.json','eas.json','LICENSE'];
for(const dir of dirs){const base=path.join(root,dir);for(const item of fs.readdirSync(base,{recursive:true})){const file=path.join(base,item);if(fs.statSync(file).isFile()&&!file.endsWith('manifest.json'))files.push(path.relative(root,file));}}
files=[...new Set(files.map(file=>file.replaceAll('\\','/')))].sort();
const manifest={generatedAt:new Date().toISOString(),baseCommit:source,branch,workingTreeChanges:true,description:'Las huellas identifican el contenido probado; el commit base no incluye cambios locales. No incluye .env ni accesos privados.',files:files.map(file=>({path:file.replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}))};
fs.writeFileSync(path.join(evidence,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({documents:fs.readdirSync(docs).length,evidenceFiles:fs.readdirSync(evidence).length,hashedFiles:manifest.files.length,source,branch}));
