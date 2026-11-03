/**
 * TRIAGEM PILOTO (25 artigos PubMed) — BACKEND GOOGLE APPS SCRIPT (API)
 * A página fica no GitHub Pages (PAGES_URL); este script só recebe e devolve dados.
 * Executar setup() uma única vez antes de implantar como aplicativo Web
 * (Executar como: Eu • Quem tem acesso: Qualquer pessoa).
 * Após implantar, executar mostrarLinks() e copiar somente o link de Beatriz.
 * Todas as decisões são persistidas na planilha do proprietário, automaticamente.
 * Válido apenas para o lote BATCH; não modifica o protocolo oficial de Rayyan.
 */
const BATCH = '07258cb162643f64';
const PAGES_URL = 'https://luaspfc.github.io/triagem-revisao-escopo/';
const PMIDS = ["33043077", "36053444", "37299968", "33018786", "34845224", "41905336", "34656009", "2804993", "22080998", "35720090", "32309063", "41827492", "42122390", "33833729", "15191077", "33018110", "38766539", "42141756", "32957142", "30744003", "18818076", "38844449", "27088063", "35022161", "8503824"];
const REVIEWERS = ['Luana', 'Beatriz'];
const REASONS = ['E01','E02','E03','E04','E05','E06','E07','E08'];
const SHEET_DECISIONS = 'Decisoes';
const SHEET_HISTORY = 'Historico';
const SHEET_STATUS = 'Finalizacao';

function setup() {
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    const p=PropertiesService.getScriptProperties();
    if(!p.getProperty('DB_SPREADSHEET_ID')) {
      const ss=SpreadsheetApp.create('Triagem-piloto PubMed | 25 artigos | '+BATCH);
      const decisions=ss.getSheets()[0];decisions.setName(SHEET_DECISIONS);
      decisions.appendRow(['Revisora','PMID','Decisao','Codigo_exclusao','Justificativa','Classe','DataHora_ISO','Versao','Lote']);
      const history=ss.insertSheet(SHEET_HISTORY);
      history.appendRow(['Revisora','PMID','Decisao','Codigo_exclusao','Justificativa','Classe','DataHora_ISO','Versao','Lote']);
      const status=ss.insertSheet(SHEET_STATUS);status.appendRow(['Revisora','Finalizado_em_ISO','Lote']);
      REVIEWERS.forEach(name=>status.appendRow([name,'',BATCH]));
      [decisions,history,status].forEach(sh=>{sh.setFrozenRows(1);sh.getRange(1,1,1,sh.getLastColumn()).setFontWeight('bold').setBackground('#dce9ed');});
      p.setProperty('DB_SPREADSHEET_ID',ss.getId());
    }
    REVIEWERS.forEach(name=>{
      const key='TOKEN_'+name.toUpperCase();
      if(!p.getProperty(key)) p.setProperty(key,Utilities.getUuid()+Utilities.getUuid());
    });
    Logger.log('Planilha de auditoria: https://docs.google.com/spreadsheets/d/'+p.getProperty('DB_SPREADSHEET_ID')+'/edit');
    Logger.log('Configuração pronta. Implante o aplicativo Web, depois execute mostrarLinks().');
    return 'Configuração pronta';
  } finally {lock.releaseLock();}
}

function mostrarLinks(){
  const api=ScriptApp.getService().getUrl();
  if(!api)throw Error('Implante como aplicativo Web antes de solicitar os links.');
  const p=PropertiesService.getScriptProperties();
  Logger.log('URL DA API (colar em config.js no GitHub): '+api);
  REVIEWERS.forEach(name=>{
    const token=p.getProperty('TOKEN_'+name.toUpperCase());
    if(!token)throw Error('Execute setup() primeiro.');
    Logger.log('LINK INDIVIDUAL '+name.toUpperCase()+': '+PAGES_URL+'?revisor='+encodeURIComponent(name)+'&chave='+encodeURIComponent(token));
  });
  Logger.log('Planilha de auditoria (somente proprietário): https://docs.google.com/spreadsheets/d/'+p.getProperty('DB_SPREADSHEET_ID')+'/edit');
}

function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function doGet(){
  // Verificação simples: a interface fica no GitHub Pages.
  return json_({ok:true,servico:'triagem-piloto',lote:BATCH,pagina:PAGES_URL});
}
function doPost(e){
  try{
    const req=JSON.parse(e&&e.postData&&e.postData.contents||'{}');
    const auth={reviewer:String(req.revisor||''),token:String(req.chave||'')};
    const acoes={carregar:carregarMinhaTriagem,salvar:salvarDecisao,finalizar:finalizarMinhaTriagem,relatorio:consultarRelatorio,pdf:gerarPdfRelatorio};
    const fn=acoes[String(req.acao||'')];
    if(!fn)throw Error('Ação desconhecida.');
    return json_({ok:true,data:fn(auth,req.dados)});
  }catch(err){
    return json_({ok:false,erro:String(err&&err.message||err)});
  }
}

function assertAuth_(auth){
  if(!auth||!REVIEWERS.includes(auth.reviewer))throw Error('Revisora inválida.');
  const stored=PropertiesService.getScriptProperties().getProperty('TOKEN_'+auth.reviewer.toUpperCase());
  if(!stored||typeof auth.token!=='string'||auth.token!==stored)throw Error('Link individual inválido.');
  return auth.reviewer;
}
function ss_(){
  const id=PropertiesService.getScriptProperties().getProperty('DB_SPREADSHEET_ID');
  if(!id)throw Error('Execute setup() no editor do Apps Script.');
  return SpreadsheetApp.openById(id);
}
function rows_(sh){let v=sh.getDataRange().getValues();return v.length<=1?[]:v.slice(1);}
function iso_(value){return value instanceof Date?value.toISOString():String(value||'');}
function getStatus_(ss){
  const all=rows_(ss.getSheetByName(SHEET_STATUS)),ret={Luana:null,Beatriz:null};
  all.forEach(row=>{if(REVIEWERS.includes(row[0]))ret[row[0]]=iso_(row[1])||null;});
  return ret;
}
function getRecords_(ss, reviewer){
  const result={};
  rows_(ss.getSheetByName(SHEET_DECISIONS)).forEach(row=>{
    if(row[0]!==reviewer||!PMIDS.includes(String(row[1])))return;
    result[String(row[1])]={decision:String(row[2]||''),reason:String(row[3]||''),note:String(row[4]||''),classType:String(row[5]||''),timestamp:iso_(row[6]),version:Number(row[7]||1)};
  });
  return result;
}
function count_(records){
  const c={total:0,binary:0,maybe:0,include:0,exclude:0};
  PMIDS.forEach(pmid=>{const d=records[pmid];if(!d)return;c.total++;if(d.decision==='Incluir'){c.binary++;c.include++}if(d.decision==='Excluir'){c.binary++;c.exclude++}if(d.decision==='Talvez')c.maybe++;});
  return c;
}
function carregarMinhaTriagem(auth){
  const reviewer=assertAuth_(auth),ss=ss_(),records=getRecords_(ss,reviewer),status=getStatus_(ss);
  return {batch:BATCH,reviewer:reviewer,decisions:records,counts:count_(records),finalizedAt:status[reviewer],myFinalized:Boolean(status[reviewer]),peerFinalized:Boolean(status[reviewer==='Luana'?'Beatriz':'Luana'])};
}
function salvarDecisao(auth,form){
  const reviewer=assertAuth_(auth),lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    const ss=ss_(),status=getStatus_(ss);
    if(status[reviewer])throw Error('Esta triagem já foi finalizada. As decisões estão lacradas.');
    const pmid=String(form&&form.pmid||''),decision=String(form&&form.decision||'');
    const reason=decision==='Excluir'?String(form&&form.reason||''):'',note=String(form&&form.note||'').trim().slice(0,3000),classType=String(form&&form.classType||'');
    if(!PMIDS.includes(pmid))throw Error('PMID não pertence à amostra fixa.');
    if(!['Incluir','Excluir','Talvez'].includes(decision))throw Error('Selecione uma decisão.');
    if(decision==='Excluir'&&!REASONS.includes(reason))throw Error('Informe o código E01–E08.');
    if(['Excluir','Talvez'].includes(decision)&&!note)throw Error('Escreva uma justificativa ou dúvida.');
    if(!['','A','B'].includes(classType))throw Error('Classe analítica inválida.');
    const sh=ss.getSheetByName(SHEET_DECISIONS),rows=rows_(sh);
    const idx=rows.findIndex(row=>row[0]===reviewer&&String(row[1])===pmid);
    const version=idx>=0?Number(rows[idx][7]||0)+1:1;
    const timestamp=new Date().toISOString();
    const row=[reviewer,pmid,decision,reason,note,classType,timestamp,version,BATCH];
    if(idx>=0)sh.getRange(idx+2,1,1,row.length).setValues([row]);else sh.appendRow(row);
    ss.getSheetByName(SHEET_HISTORY).appendRow(row);
    SpreadsheetApp.flush();
    const records=getRecords_(ss,reviewer);
    return {ok:true,record:{decision:decision,reason:reason,note:note,classType:classType,timestamp:timestamp,version:version},counts:count_(records)};
  } finally{lock.releaseLock();}
}
function finalizarMinhaTriagem(auth){
  const reviewer=assertAuth_(auth),lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const ss=ss_(),st=getStatus_(ss);
    if(st[reviewer])return {finalizedAt:st[reviewer],already:true};
    const c=count_(getRecords_(ss,reviewer));
    if(c.total!==25||c.binary!==25)throw Error('Finalize todas as 25 decisões como Incluir ou Excluir. Reavalie as marcações Talvez.');
    const sh=ss.getSheetByName(SHEET_STATUS),rows=rows_(sh),idx=rows.findIndex(row=>row[0]===reviewer);
    if(idx<0)throw Error('Revisora não encontrada no registro de finalização.');
    const at=new Date().toISOString();
    sh.getRange(idx+2,2).setValue(at);
    SpreadsheetApp.flush();
    return {finalizedAt:at,already:false};
  }finally{lock.releaseLock();}
}
function buildReport_(ss){
  const st=getStatus_(ss);
  if(!st.Luana||!st.Beatriz)return {ready:false,finalized:{Luana:!!st.Luana,Beatriz:!!st.Beatriz}};
  const l=getRecords_(ss,'Luana'),b=getRecords_(ss,'Beatriz');
  if(count_(l).binary!==25||count_(b).binary!==25)throw Error('Dados incompletos: a auditoria requer 25 decisões binárias por revisora.');
  let agreements=0,II=0,IE=0,EI=0,EE=0;
  const items=PMIDS.map((pmid,i)=>{
    const L=l[pmid],B=b[pmid],agree=L.decision===B.decision;
    if(agree)agreements++;
    const tag=(L.decision==='Incluir'?'I':'E')+(B.decision==='Incluir'?'I':'E');
    if(tag==='II')II++;if(tag==='IE')IE++;if(tag==='EI')EI++;if(tag==='EE')EE++;
    return {index:i+1,pmid:pmid,Luana:L,Beatriz:B,agree:agree};
  });
  const po=agreements/25, pe=((II+IE)*(II+EI)+(EI+EE)*(IE+EE))/625;
  const kappa=pe>=1?null:(po-pe)/(1-pe);
  return {ready:true,batch:BATCH,generatedAt:new Date().toISOString(),finalizedAt:st,counts:{Luana:count_(l),Beatriz:count_(b)},summary:{agreements:agreements,total:25,percent:po*100,goalReached:agreements>=22,minimumReached:agreements>=19,kappa:kappa,table:{II:II,IE:IE,EI:EI,EE:EE}},items:items};
}
function consultarRelatorio(auth){assertAuth_(auth);return buildReport_(ss_());}

function gerarPdfRelatorio(auth){
  assertAuth_(auth);const report=buildReport_(ss_());
  if(!report.ready)throw Error('O relatório só pode ser gerado após a finalização independente de Luana e Beatriz.');
  const doc=DocumentApp.create('TEMP — Relatório de triagem '+BATCH+' '+new Date().toISOString());
  const body=doc.getBody();
  body.appendParagraph('RELATÓRIO DE CONSISTÊNCIA — TRIAGEM POR PARES').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Revisão de escopo: sensores inerciais corporais em doenças neurodegenerativas progressivas');
  body.appendParagraph('Lote: '+BATCH+'  •  Amostra: 25 PMIDs únicos  •  Universo original: 3.481 registros PubMed');
  body.appendParagraph('Data de emissão (UTC): '+report.generatedAt+'  •  Fuso das interfaces: America/Sao_Paulo');
  body.appendParagraph('Finalização Luana: '+report.finalizedAt.Luana+' | Beatriz: '+report.finalizedAt.Beatriz);
  body.appendParagraph('Indicadores').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  const s=report.summary;
  body.appendTable([
    ['Concordância observada',s.agreements+' / 25 ('+s.percent.toFixed(1).replace('.',',')+'%)'],
    ['Meta pretendida ≥85%',s.goalReached?'ATINGIDA (≥22 coincidências)':'NÃO ATINGIDA (<22 coincidências)'],
    ['Mínimo de protocolo ≥75%',s.minimumReached?'ATINGIDO (≥19 coincidências)':'NÃO ATINGIDO (<19 coincidências)'],
    ['Kappa de Cohen',s.kappa===null?'Indefinido: não há variação suficiente':s.kappa.toFixed(3)],
    ['Matriz Luana × Beatriz','Incluir/Incluir: '+s.table.II+'; Incluir/Excluir: '+s.table.IE+'; Excluir/Incluir: '+s.table.EI+'; Excluir/Excluir: '+s.table.EE],
    ['Contagem individual','Luana: '+report.counts.Luana.include+' incluídos / '+report.counts.Luana.exclude+' excluídos; Beatriz: '+report.counts.Beatriz.include+' incluídos / '+report.counts.Beatriz.exclude+' excluídos']
  ]);
  body.appendParagraph('Decisões originais por publicação').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  report.items.forEach((item,i)=>{
    const title = {"33043077": "Prodromal Markers of Upper Limb Deficits in FMR1 Premutation Carriers and Quantitative Outcome Measures for Future Clinical Trials in Fragile X-associated Tremor/Ataxia Syndrome.", "36053444": "The prevention of falls in patients with Parkinson's disease with in-home monitoring using a wearable system: a pilot study protocol.", "37299968": "A First Methodological Development and Validation of ReTap: An Open-Source UPDRS Finger Tapping Assessment Tool Based on Accelerometer-Data.", "33018786": "Rebound effect in deep brain stimulation for essential tremor and symptom severity estimation from neural data.", "34845224": "A real-world study of wearable sensors in Parkinson's disease.", "41905336": "Preliminary evidence for cognitive associations of postural control in older and younger adults, and people with Parkinson's disease.", "34656009": "Staying UpRight in Parkinson's disease: A pilot study of a novel wearable postural intervention.", "2804993": "Tremors in early Parkinson's disease.", "22080998": "Gait variability in Parkinson's disease: influence of walking speed and dopaminergic treatment.", "35720090": "A New Paradigm in Parkinson's Disease Evaluation With Wearable Medical Devices: A Review of STAT-ON(TM).", "32309063": "A Composite Fabric-Based Soft Rehabilitation Glove With Soft Joint for Dementia in Parkinson's Disease.", "41827492": "Use of AR/VR for Treatment of Freezing of Gait (FoG) in Parkinson's Disease (PD).", "42122390": "Self-Explaining Neural Networks for Transparent Parkinson's Disease Screening.", "33833729": "Kinematic and Clinical Outcomes to Evaluate the Efficacy of a Multidisciplinary Intervention on Functional Mobility in Parkinson's Disease.", "15191077": "Microprocessor-controlled optical stimulating device to improve the gait of patients with Parkinson's disease.", "33018110": "A Sensor-Based Comprehensive Objective Assessment of Motor Symptoms in Cerebellar Ataxia.", "38766539": "On-Demand Gait-Synchronous Electrical Cueing in Parkinson's Disease Using Machine Learning and Edge Computing: A Pilot Study.", "42141756": "Wearable Movement-Tracking for Prodromal Parkinson's Disease Detection: A Cross-Country Validation Study.", "32957142": "[The history of Freezing-of-gait in Parkinson's disease - from phenomena to symptom].", "30744003": "Quantified Activity Measurement for Medical Use in Movement Disorders through IR-UWB Radar Sensor.", "18818076": "Towards harmonisation of outcome measures for DMD and SMA within TREAT-NMD; report of three expert workshops: TREAT-NMD/ENMC workshop on outcome measures, 12th--13th May 2007, Naarden, The Netherlands; TREAT-NMD workshop on outcome measures in experimental trials for DMD, 30th June--1st July 2007, Naarden, The Netherlands; conjoint Institute of Myology TREAT-NMD meeting on physical activity monitoring in neuromuscular disorders, 11th July 2007, Paris, France.", "38844449": "A machine learning contest enhances automated freezing of gait detection and reveals time-of-day effects.", "27088063": "Extraction of stride events from gait accelerometry during treadmill walking.", "35022161": "Gait instability and estimated core temperature predict exertional heat stroke.", "8503824": "S-adenosyl-L-methionine decreases motor activity in the rat: similarity to Parkinson's disease-like symptoms."}[item.pmid] || '(título indisponível)';
    body.appendParagraph((i+1)+'. '+title).setHeading(DocumentApp.ParagraphHeading.HEADING3);
    body.appendParagraph('PMID: '+item.pmid+'  |  Concordância: '+(item.agree?'SIM':'NÃO — DIVERGÊNCIA'));
    ['Luana','Beatriz'].forEach(w=>{
      const d=item[w];
      body.appendParagraph(w+': '+d.decision+(d.reason?' ['+d.reason+']':'')+(d.classType?' • Classe '+d.classType:'')+' • '+d.timestamp+' • versão '+d.version);
      if(d.note)body.appendParagraph('Nota: '+d.note);
    });
  });
  body.appendParagraph('Nota metodológica').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('Concordância significa coincidência das duas classificações (Incluir ou Excluir), não exatidão contra um gabarito. O mínimo de 75% resulta em 19/25 (76%); para superar 85%, são necessárias 22/25 (88%). O terceiro revisor julga conflitos persistentes, após discussão. A planilha vinculada conserva o histórico de alterações e as marcas de tempo originais.');
  doc.saveAndClose();
  const tmp=DriveApp.getFileById(doc.getId());
  try{
    const pdf=tmp.getAs(MimeType.PDF);
    const bytes=pdf.getBytes();
    return {name:'relatorio_concordancia_'+BATCH+'.pdf',base64:Utilities.base64Encode(bytes),size:bytes.length};
  }finally{tmp.setTrashed(true);}
}
