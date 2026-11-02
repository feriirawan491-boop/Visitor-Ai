// Parameter definitions for the local UX simulator, not a production AI configuration contract.
export const tuningGroups = ['Detection','Tracking','Identity','Face','Gate'] as const;
export type TuningGroup = typeof tuningGroups[number];
export const parameterDefinitions = [
  {key:'detectionConfidence',label:'Detection confidence',group:'Detection',min:.1,max:.95,step:.05,default:.55,description:'Ambang confidence deteksi orang pada preview konfigurasi.'},
  {key:'detectionIou',label:'Detection IoU',group:'Detection',min:.1,max:.9,step:.05,default:.45,description:'Ambang overlap untuk konfigurasi deteksi.'},
  {key:'trackingIou',label:'Tracking IoU',group:'Tracking',min:.1,max:.9,step:.05,default:.3,description:'Ambang overlap yang ditampilkan untuk pelacakan track.'},
  {key:'maxLostFrames',label:'Max lost frames',group:'Tracking',min:5,max:120,step:5,default:30,description:'Jumlah frame hilang sebelum track dianggap selesai.'},
  {key:'bodyThreshold',label:'Body match threshold',group:'Identity',min:.1,max:.95,step:.05,default:.7,description:'Ambang matching body pada konfigurasi demo.'},
  {key:'anchorLimit',label:'Gallery anchor limit',group:'Identity',min:1,max:10,step:1,default:5,description:'Batas anchor per identitas pada contoh konfigurasi.'},
  {key:'faceVeto',label:'Face veto threshold',group:'Face',min:.1,max:.9,step:.05,default:.35,description:'Ambang veto wajah pada contoh parameter.'},
  {key:'faceConfidence',label:'Face confidence',group:'Face',min:.1,max:.95,step:.05,default:.6,description:'Ambang confidence wajah pada contoh konfigurasi.'},
  {key:'gateDwell',label:'Gate dwell',group:'Gate',min:0,max:3000,step:100,default:500,unit:'ms',description:'Minimum dwell pada konfigurasi tuning demo.'},
  {key:'gateHysteresis',label:'Gate hysteresis',group:'Gate',min:1,max:30,step:1,default:8,unit:'%',description:'Margin anti-flicker. Geometri kamera tetap melalui editor gate.'},
] as const;
export type ParameterKey = typeof parameterDefinitions[number]['key'];
export type TuningValues = Record<ParameterKey,number>;
export type SettingsAudit = {id:string;at:string;actor:string;reason:string;before:TuningValues;after:TuningValues;version:number;action:'update'|'rollback'};
export type SettingsDocument = {schema:1;version:number;savedAt:string|null;values:TuningValues;audit:SettingsAudit[]};
export const settingsStorageKey='visitor-ai.phase3.settings.v1';
export const settingsKeyForSite=(siteId='SITE-001')=>siteId==='SITE-001'?settingsStorageKey:`${settingsStorageKey}.${siteId}`;
export const defaultValues=Object.fromEntries(parameterDefinitions.map(d=>[d.key,d.default])) as TuningValues;
export function parameterError(values:TuningValues):string|null{
  for(const d of parameterDefinitions){const n=values?.[d.key];if(!Number.isFinite(n)||n<d.min||n>d.max)return `${d.label} harus berada pada rentang ${d.min}–${d.max}.`;if(Math.abs((n-d.min)/d.step-Math.round((n-d.min)/d.step))>.00001)return `${d.label} harus mengikuti step ${d.step}.`;}
  return null;
}
function validValues(value:unknown):value is TuningValues{return !!value&&typeof value==='object'&&parameterError(value as TuningValues)===null;}
function validDocument(value:unknown):value is SettingsDocument{
  if(!value||typeof value!=='object')return false;const d=value as SettingsDocument;
  return d.schema===1&&Number.isInteger(d.version)&&d.version>0&&(d.savedAt===null||typeof d.savedAt==='string'&&Number.isFinite(Date.parse(d.savedAt)))&&validValues(d.values)&&Array.isArray(d.audit)&&d.audit.every(a=>a&&typeof a.id==='string'&&Number.isFinite(Date.parse(a.at))&&typeof a.actor==='string'&&typeof a.reason==='string'&&['update','rollback'].includes(a.action)&&Number.isInteger(a.version)&&validValues(a.before)&&validValues(a.after));
}
export function readSettings(siteId='SITE-001'):SettingsDocument{
  const raw=localStorage.getItem(settingsKeyForSite(siteId));if(!raw)return {schema:1,version:1,savedAt:null,values:{...defaultValues},audit:[]};
  let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw new Error('Konfigurasi demo tidak dapat dibaca. Data tersimpan tidak diubah.');}
  if(!validDocument(parsed))throw new Error('Format konfigurasi tuning tidak valid. Data tersimpan tidak diubah.');return parsed;
}
export async function saveSettings(values:TuningValues,version:number,reason:string,action:'update'|'rollback',siteId='SITE-001',authorize?:()=>void,actor='Teknisi (demo)'):Promise<SettingsDocument>{
  const run=()=>{
    authorize?.();
    const current=readSettings(siteId);if(current.version!==version)throw new Error('Konfigurasi berubah di tab lain. Muat ulang versi terbaru sebelum menyimpan.');
    const error=parameterError(values);if(error)throw new Error(error);
    if(!reason.trim()||reason.trim().length>300)throw new Error('Alasan perubahan wajib diisi, maksimal 300 karakter.');
    if(parameterDefinitions.every(d=>values[d.key]===current.values[d.key]))throw new Error('Tidak ada parameter yang berubah.');
    const at=new Date().toISOString();const next:SettingsDocument={schema:1,version:current.version+1,savedAt:at,values:{...values},audit:[...current.audit,{id:`CONFIG-${current.version+1}`,at,actor,reason:reason.trim(),before:{...current.values},after:{...values},version:current.version+1,action}]};
    localStorage.setItem(settingsKeyForSite(siteId),JSON.stringify(next));return next;
  };
  return navigator.locks?navigator.locks.request(settingsKeyForSite(siteId),run):run();
}
