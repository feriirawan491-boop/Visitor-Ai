// Shared, browser-local directory. Contains deployment metadata, never biometric records or secrets.
export type Role='admin_site'|'management'|'provider';
export type CameraRole='outside_in'|'inside_out';
export type SiteStatus='active'|'setup'|'suspended';
export type Site={id:string;name:string;location:string;timezone:string;status:SiteStatus;owner:string;instanceId:string;pipeline:'running'|'stopped';cameras:{deviceId:string;role:CameraRole}[];validatedAt:string|null;updatedAt:string;ws:'live'|'polling'|'offline';db:'healthy'|'degraded';telemetry:'healthy'|'failed';};
export type DemoAccount={id:string;name:string;initials:string;title:string;roles:Role[];siteIds:string[];technical:boolean;readOnly?:boolean;suspended?:boolean;accessVersion:number;email:string;login:boolean;status:'active'|'disabled'|'invited'};
export type Device={id:string;name:string;state:'online'|'offline'|'stale';fps:number;fpsMin:number;fpsMax:number;lastHeartbeat:string;secretRef:string};
export type ProviderAudit={id:string;at:string;actor:string;action:string;siteId:string|null;outcome:'success'|'failed';reason:string;before:string;after:string;incidentId:string|null};
export type PlatformConfig={detectionConfidence:number;heartbeatSeconds:number;staleSeconds:number;pollSeconds:number;auditRetentionDays:number;telemetryEnabled:boolean};
export type ConfigVersion={version:number;at:string;actor:string;reason:string;before:PlatformConfig;after:PlatformConfig};
export type ProviderDirectory={schema:1;revision:number;sites:Site[];users:DemoAccount[];devices:Device[];config:{version:number;values:PlatformConfig;history:ConfigVersion[]};audit:ProviderAudit[]};
export const providerStorageKey='visitor-ai.phase6.directory.v1';
export const providerChangeEvent='visitor-ai:provider-directory';
export const providerViews=['overview','sites','users','cameras','health','audit','configuration','release'] as const;
export type ProviderView=typeof providerViews[number];
export const cameraRoleNames:Record<CameraRole,string>={outside_in:'Cam1 · OUTSIDE / IN',inside_out:'Cam2 · INSIDE / OUT'};
export const siteStatusNames:Record<SiteStatus,string>={active:'Active',setup:'Setup incomplete',suspended:'Suspended'};
export const demoSnapshot='2026-10-29T07:00:00Z';
export const platformDefaults:PlatformConfig={detectionConfidence:.55,heartbeatSeconds:3,staleSeconds:15,pollSeconds:5,auditRetentionDays:90,telemetryEnabled:true};
export function makeDirectory():ProviderDirectory{
  const sites:Site[]=[
    {id:'SITE-001',name:'Airport Lounge',location:'Terminal 1 · Jakarta',timezone:'Asia/Jakarta',status:'active',owner:'provider',instanceId:'EDGE-001',pipeline:'running',cameras:[{deviceId:'CAM-001',role:'outside_in'},{deviceId:'CAM-002',role:'inside_out'}],validatedAt:demoSnapshot,updatedAt:demoSnapshot,ws:'live',db:'healthy',telemetry:'healthy'},
    {id:'SITE-002',name:'Terminal 3 Lounge',location:'Terminal 3 · Jakarta',timezone:'Asia/Jakarta',status:'active',owner:'provider',instanceId:'EDGE-002',pipeline:'running',cameras:[{deviceId:'CAM-003',role:'outside_in'},{deviceId:'CAM-004',role:'inside_out'}],validatedAt:demoSnapshot,updatedAt:demoSnapshot,ws:'polling',db:'healthy',telemetry:'failed'},
    {id:'SITE-003',name:'International Lounge',location:'International · Jakarta',timezone:'Asia/Jakarta',status:'setup',owner:'provider',instanceId:'EDGE-003',pipeline:'stopped',cameras:[{deviceId:'CAM-005',role:'outside_in'}],validatedAt:null,updatedAt:demoSnapshot,ws:'offline',db:'healthy',telemetry:'healthy'},
  ];
  const users:DemoAccount[]=[
    {id:'admin',name:'Naya Putri',initials:'NP',title:'Admin Site · Airport Lounge',roles:['admin_site'],siteIds:['SITE-001'],technical:false,accessVersion:1,email:'naya@example.test',login:true,status:'active'},
    {id:'technician',name:'Arif Ramadhan',initials:'AR',title:'Admin Site · izin teknisi · 2 site',roles:['admin_site'],siteIds:['SITE-001','SITE-002'],technical:true,accessVersion:1,email:'arif@example.test',login:true,status:'active'},
    {id:'management',name:'Raka Wijaya',initials:'RW',title:'Management · 2 site',roles:['management'],siteIds:['SITE-001','SITE-002'],technical:false,accessVersion:1,email:'raka@example.test',login:true,status:'active'},
    {id:'provider',name:'Dewi Kartika',initials:'DK',title:'Provider · seluruh site demo',roles:['provider'],siteIds:sites.map(s=>s.id),technical:true,accessVersion:1,email:'dewi@example.test',login:true,status:'active'},
  ];
  return {schema:1,revision:1,sites,users,devices:Array.from({length:10},(_,i)=>({id:`CAM-${String(i+1).padStart(3,'0')}`,name:`Lounge camera ${String(i+1).padStart(2,'0')}`,state:i===3?'offline':'online',fps:i===3?0:8.4,fpsMin:i===3?0:6.8,fpsMax:i===3?8.9:9.2,lastHeartbeat:i===3?'2026-10-29T06:40:00Z':demoSnapshot,secretRef:`vault-ref-demo-${String(i+1).padStart(3,'0')}`})),config:{version:1,values:{...platformDefaults},history:[]},audit:[{id:'AUD-SEED-001',at:'2026-10-29T06:40:00Z',actor:'System demo',action:'CAMERA_OFFLINE',siteId:'SITE-002',outcome:'failed',reason:'Snapshot demo: Cam2 tidak mengirim frame selama 20 menit.',before:'online',after:'offline',incidentId:'INC-DEMO-002'},{id:'AUD-SEED-002',at:'2026-10-29T06:41:00Z',actor:'System demo',action:'TRANSPORT_FALLBACK',siteId:'SITE-002',outcome:'success',reason:'Snapshot demo: beralih ke polling lokal.',before:'WS live',after:'polling',incidentId:null}]};
}
export function configError(v:PlatformConfig){
  if(!Number.isFinite(v.detectionConfidence)||v.detectionConfidence<.1||v.detectionConfidence>.95||Math.abs(v.detectionConfidence/.05-Math.round(v.detectionConfidence/.05))>.00001)return 'Detection confidence harus 0.1–0.95 dengan step 0.05.';
  for(const [key,min,max] of [['heartbeatSeconds',1,30],['staleSeconds',5,300],['pollSeconds',2,60],['auditRetentionDays',7,365]] as const)if(!Number.isInteger(v[key])||v[key]<min||v[key]>max)return `${key} harus bilangan bulat ${min}–${max}.`;
  if(v.staleSeconds<=v.heartbeatSeconds)return 'Stale threshold harus lebih besar dari heartbeat.';
  if(typeof v.telemetryEnabled!=='boolean')return 'Pilihan telemetry tidak valid.';return null;
}
const text=(v:unknown)=>typeof v==='string';
function validate(d:ProviderDirectory){
  if(d?.schema!==1||!Number.isInteger(d.revision)||d.revision<1||!Array.isArray(d.sites)||!Array.isArray(d.users)||!Array.isArray(d.devices)||!Array.isArray(d.audit)||!d.config||!Number.isInteger(d.config.version)||configError(d.config.values)||!Array.isArray(d.config.history))return false;
  if(d.sites.some(s=>!s||![s.id,s.name,s.location,s.timezone,s.instanceId,s.owner,s.updatedAt].every(text)||!['active','setup','suspended'].includes(s.status)||!['running','stopped'].includes(s.pipeline)||!['live','polling','offline'].includes(s.ws)||!['healthy','degraded'].includes(s.db)||!['healthy','failed'].includes(s.telemetry)||!(s.validatedAt===null||text(s.validatedAt))||!Array.isArray(s.cameras)||s.cameras.length>2||s.cameras.some(c=>!text(c.deviceId)||!['outside_in','inside_out'].includes(c.role))))return false;
  if(d.users.some(u=>!u||![u.id,u.name,u.initials,u.title,u.email].every(text)||!Array.isArray(u.roles)||u.roles.length!==1||u.roles.some(r=>!['admin_site','management','provider'].includes(r))||!Array.isArray(u.siteIds)||u.siteIds.some(id=>!d.sites.some(s=>s.id===id))||typeof u.technical!=='boolean'||typeof u.login!=='boolean'||!['active','disabled','invited'].includes(u.status)||!Number.isInteger(u.accessVersion)))return false;
  if(d.devices.some(c=>![c.id,c.name,c.lastHeartbeat,c.secretRef].every(text)||!['online','offline','stale'].includes(c.state)||![c.fps,c.fpsMin,c.fpsMax].every(n=>Number.isFinite(n)&&n>=0)))return false;
  if(d.sites.some(s=>s.cameras.some(c=>!d.devices.some(v=>v.id===c.deviceId))))return false;
  if(d.audit.some(a=>!a||![a.id,a.at,a.actor,a.action,a.reason,a.before,a.after].every(text)||!['success','failed'].includes(a.outcome)||!(a.siteId===null||text(a.siteId))||!(a.incidentId===null||text(a.incidentId))))return false;
  if(d.config.history.some(h=>!h||!Number.isInteger(h.version)||![h.at,h.actor,h.reason].every(text)||configError(h.before)||configError(h.after)))return false;
  if(d.users.filter(u=>u.roles.includes('provider')).length!==1||d.users.filter(u=>u.login).length!==4||!['admin','technician','management','provider'].every(id=>d.users.some(u=>u.id===id&&u.login))||!d.users.some(u=>u.id==='provider'&&u.roles[0]==='provider'&&u.status==='active'))return false;
  if(d.users.some(u=>u.accessVersion<1||new Set(u.siteIds).size!==u.siteIds.length||u.login&&u.status==='invited'||!u.login&&u.status!=='invited'))return false;
  const usedCameras=d.sites.flatMap(s=>s.cameras.map(c=>c.deviceId));if(new Set(usedCameras).size!==usedCameras.length)return false;
  const instances=d.sites.map(s=>s.instanceId).filter(Boolean);if(new Set(instances).size!==instances.length)return false;
  for(const s of d.sites){if(!/^SITE-[A-Z0-9-]+$/.test(s.id)||new Set(s.cameras.map(c=>c.role)).size!==s.cameras.length||s.status==='active'&&(s.cameras.length!==2||!s.instanceId||!s.validatedAt))return false;try{new Intl.DateTimeFormat('id-ID',{timeZone:s.timezone}).format();}catch{return false;}}
  return new Set(d.sites.map(s=>s.id)).size===d.sites.length&&new Set(d.users.map(u=>u.id)).size===d.users.length&&new Set(d.devices.map(c=>c.id)).size===d.devices.length;
}
let cachedRaw:string|null|undefined;let cached:ProviderDirectory|undefined;
export function readDirectory():ProviderDirectory{
  if(typeof window==='undefined')return makeDirectory();
  const raw=localStorage.getItem(providerStorageKey);if(cached&&raw===cachedRaw)return cached;
  let next:ProviderDirectory;try{next=raw?JSON.parse(raw):makeDirectory();if(!validate(next))throw new Error();}catch{throw new Error('Direktori provider lokal tidak valid. Data tersimpan dipertahankan.');}
  cachedRaw=raw;cached=next;return next;
}
export function writeDirectory(next:ProviderDirectory){if(!validate(next))throw new Error('Snapshot direktori tidak valid.');localStorage.setItem(providerStorageKey,JSON.stringify(next));cachedRaw=JSON.stringify(next);cached=next;window.dispatchEvent(new Event(providerChangeEvent));}
export function directorySites(){return readDirectory().sites;}
export function directoryAccounts(){return readDirectory().users.filter(u=>u.login);}
export function mappingError(site:Pick<Site,'cameras'|'instanceId'>,directory:ProviderDirectory,excludeId?:string,complete=false){
  if(complete&&(!site.instanceId.trim()||site.cameras.length!==2))return 'Instance dan dua kamera dengan role berbeda wajib lengkap sebelum validasi setup.';
  if(new Set(site.cameras.map(c=>c.role)).size!==site.cameras.length)return 'Role kamera duplikat. Gunakan satu OUTSIDE / IN dan satu INSIDE / OUT.';
  if(new Set(site.cameras.map(c=>c.deviceId)).size!==site.cameras.length)return 'Satu perangkat tidak boleh dipakai untuk dua role kamera.';
  for(const c of site.cameras){if(!directory.devices.some(d=>d.id===c.deviceId))return 'Perangkat kamera tidak tersedia.';if(directory.sites.some(s=>s.id!==excludeId&&s.cameras.some(v=>v.deviceId===c.deviceId)))return `${c.deviceId} sudah terpasang pada site lain.`;}
  if(site.instanceId.trim()&&directory.sites.some(s=>s.id!==excludeId&&s.instanceId===site.instanceId))return 'Instance sudah terpasang pada site lain.';return null;
}
export function siteHealth(site:Site,directory:ProviderDirectory){
  if(site.status==='suspended')return 'suspended';if(site.status==='setup')return 'setup';if(site.pipeline==='stopped')return 'idle';
  const cameras=site.cameras.map(c=>directory.devices.find(d=>d.id===c.deviceId)!);
  if(cameras.every(c=>c.state==='offline'))return 'offline';if(cameras.some(c=>c.state==='stale'))return 'stale';if(cameras.some(c=>c.state==='offline')||site.db==='degraded'||site.telemetry==='failed'||site.ws!=='live')return 'degraded';return 'healthy';
}
