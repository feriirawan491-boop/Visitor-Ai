import { accountFor, hasPermission, readDemoSession } from './access';
import { configError, mappingError, readDirectory, writeDirectory, providerStorageKey, type DemoAccount, type PlatformConfig, type ProviderDirectory, type Site, type CameraRole } from './provider-directory';
export type SiteDraft={id?:string;name:string;location:string;timezone:string;instanceId:string;cameras:{deviceId:string;role:CameraRole}[]};
export type UserDraft={id?:string;name:string;email:string;role:'admin_site'|'management';siteIds:string[];technical:boolean;status:'active'|'disabled'|'invited'};
export type ProviderCommand={kind:'site.save';value:SiteDraft}|{kind:'site.status';id:string;status:'suspended'|'setup'}|{kind:'site.validate';id:string}|{kind:'user.save';value:UserDraft}|{kind:'pipeline';id:string;action:'start'|'stop'|'restart'}|{kind:'config.save';value:PlatformConfig;rollback?:boolean}|{kind:'health';id:string;state:'healthy'|'offline'|'stale'}|{kind:'audit.export';scope:string};
export type ProviderScenario='normal'|'unavailable'|'save-failed'|'pipeline-failed'|'empty'|'export-denied';
export class ProviderIncident extends Error{constructor(message:string,public incidentId:string){super(message);}}
export function providerActor(){const session=readDemoSession();if(!hasPermission(session,'provider:read'))throw new Error('Akses provider tidak diizinkan atau sesi telah berakhir.');return {id:session!.id,name:accountFor(session!).name,accountId:session!.accountId};}
function requiredReason(reason:string){if(!reason.trim()||reason.length>300)throw new Error('Alasan wajib diisi, maksimal 300 karakter.');}
export function validateSite(value:SiteDraft,directory:ProviderDirectory){
  if(value.name.trim().length<3||value.name.trim().length>80)return 'Nama site wajib 3–80 karakter.';
  if(!value.location.trim()||value.location.length>120)return 'Lokasi wajib diisi, maksimal 120 karakter.';
  try{new Intl.DateTimeFormat('id-ID',{timeZone:value.timezone}).format();}catch{return 'Zona waktu tidak valid.';}
  if(value.instanceId&&!/^[A-Z0-9-]{3,40}$/.test(value.instanceId))return 'Instance ID hanya huruf kapital, angka, atau strip (3–40 karakter).';
  if(directory.sites.some(s=>s.id!==value.id&&s.name.toLocaleLowerCase()===value.name.trim().toLocaleLowerCase()))return 'Nama site sudah digunakan.';
  return mappingError(value,directory,value.id);
}
export function validateUser(value:UserDraft,directory:ProviderDirectory){
  if(value.name.trim().length<3||value.name.length>80)return 'Nama user wajib 3–80 karakter.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)||value.email.length>120)return 'Alamat email tidak valid.';
  if(directory.users.some(u=>u.id!==value.id&&u.email.toLowerCase()===value.email.trim().toLowerCase()))return 'Email sudah terdaftar dalam direktori demo.';
  if(!['admin_site','management'].includes(value.role))return 'Role undangan harus Admin Site atau Management.';
  if(!value.siteIds.length||value.siteIds.some(id=>!directory.sites.some(s=>s.id===id)))return 'Pilih minimal satu site yang tersedia.';
  if(new Set(value.siteIds).size!==value.siteIds.length)return 'Assignment site duplikat.';
  if(value.role==='management'&&value.technical)return 'Management hanya menerima akses agregat, tanpa izin teknis.';return null;
}
function wait(signal:AbortSignal,ms:number){return new Promise<void>((resolve,reject)=>{const stop=()=>{clearTimeout(timer);reject(new DOMException('Dibatalkan','AbortError'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',stop);resolve();},ms);if(signal.aborted)stop();else signal.addEventListener('abort',stop,{once:true});});}
function newId(prefix:string,ids:string[]){let n=1;while(ids.includes(`${prefix}-${String(n).padStart(3,'0')}`))n++;return `${prefix}-${String(n).padStart(3,'0')}`;}
export async function commitProvider(command:ProviderCommand,revision:number,reason:string,signal:AbortSignal,scenario:ProviderScenario='normal'){
  const initial=providerActor();requiredReason(reason);await wait(signal,command.kind==='pipeline'?900:250);
  const run=()=>{
    if(signal.aborted)throw new DOMException('Dibatalkan','AbortError');const actor=providerActor();if(actor.id!==initial.id)throw new Error('Sesi workspace berubah. Tindakan dibatalkan.');
    const current=readDirectory();if(current.revision!==revision)throw new Error('Konflik versi: direktori berubah di tab lain. Muat versi terbaru; draft Anda dipertahankan.');
    if(scenario==='unavailable'||scenario==='save-failed')throw new Error('Penyimpanan provider demo gagal. Draft dipertahankan, tidak ada perubahan tersimpan.');
    if(command.kind==='audit.export'&&scenario==='export-denied')throw new Error('Ekspor audit tidak diizinkan pada skenario ini.');
    const next=structuredClone(current);const now=new Date().toISOString();let before:unknown=null,after:unknown,siteId:string|null=null,action:string,incidentId:string|null=null;let outcome:'success'|'failed'='success';
    const findSite=(id:string)=>{const s=next.sites.find(s=>s.id===id);if(!s)throw new Error('Site tidak ditemukan.');return s;};
    if(command.kind==='site.save'){
      const v=command.value;const error=validateSite(v,next);if(error)throw new Error(error);const existing=v.id?findSite(v.id):null;before=existing?structuredClone(existing):null;
      const site:Site={...(existing??{id:newId('SITE',next.sites.map(s=>s.id)),status:'setup' as const,owner:actor.accountId,pipeline:'stopped' as const,validatedAt:null,ws:'offline' as const,db:'healthy' as const,telemetry:'healthy' as const}),name:v.name.trim(),location:v.location.trim(),timezone:v.timezone,instanceId:v.instanceId.trim(),cameras:structuredClone(v.cameras).sort((a,b)=>a.role==='outside_in'?-1:b.role==='outside_in'?1:0),updatedAt:now};
      // Mapping changes require another explicit demo health validation.
      if(!existing||JSON.stringify(existing.cameras)!==JSON.stringify(v.cameras)||existing.instanceId!==v.instanceId){site.status='setup';site.pipeline='stopped';site.validatedAt=null;}
      if(existing)next.sites[next.sites.findIndex(s=>s.id===v.id)]=site;else{next.sites.push(site);next.users.filter(u=>u.roles.includes('provider')).forEach(u=>u.siteIds.push(site.id));}
      siteId=site.id;after=site;action=existing?'SITE_UPDATED':'SITE_CREATED_SETUP';
    }else if(command.kind==='site.status'){
      const site=findSite(command.id);siteId=site.id;before=structuredClone(site);site.status=command.status;if(command.status==='setup')site.validatedAt=null;site.pipeline='stopped';site.updatedAt=now;after=site;action=command.status==='suspended'?'SITE_SUSPENDED':'SITE_SETUP_REOPENED';
    }else if(command.kind==='site.validate'){
      const site=findSite(command.id);siteId=site.id;const error=mappingError(site,next,site.id,true);if(error)throw new Error(error);
      if(site.status==='suspended')throw new Error('Buka kembali setup site sebelum validasi.');
      if(site.cameras.some(c=>next.devices.find(d=>d.id===c.deviceId)?.state!=='online'))throw new Error('Validasi demo belum lolos: kedua kamera harus online.');
      before=structuredClone(site);site.status='active';site.pipeline='running';site.ws='live';site.validatedAt=now;site.updatedAt=now;after=site;action='SITE_DEMO_VALIDATED';
    }else if(command.kind==='user.save'){
      const v=command.value;const error=validateUser(v,next);if(error)throw new Error(error);const existing=v.id?next.users.find(u=>u.id===v.id):null;if(v.id&&!existing)throw new Error('User tidak ditemukan.');
      if(existing?.roles.includes('provider'))throw new Error('Akun Super Admin pengelola tidak dapat diubah atau dinonaktifkan dari workspace ini.');
      before=existing?structuredClone(existing):null;const user:DemoAccount={id:existing?.id??newId('INVITE',next.users.map(u=>u.id)),name:v.name.trim(),email:v.email.trim().toLowerCase(),initials:v.name.trim().split(/\s+/).map(n=>n[0]).slice(0,2).join('').toUpperCase(),title:existing?.login?`${v.role==='management'?'Management':v.technical?'Admin Site · izin teknisi':'Admin Site'} · ${v.siteIds.length} site`:'Undangan lokal · belum dikirim',roles:[v.role],siteIds:[...v.siteIds].sort(),technical:v.role==='admin_site'&&v.technical,accessVersion:(existing?.accessVersion??0)+1,login:existing?.login??false,status:existing?.login?v.status==='disabled'?'disabled':'active':'invited',suspended:existing?.login&&v.status==='disabled'};
      if(existing)next.users[next.users.findIndex(u=>u.id===v.id)]=user;else next.users.push(user);after=user;action=existing?'USER_ACCESS_UPDATED':'INVITATION_DRAFT_CREATED';
    }else if(command.kind==='pipeline'){
      const site=findSite(command.id);siteId=site.id;if(site.status!=='active')throw new Error('Pipeline hanya tersedia pada site Active yang telah divalidasi.');
      before=site.pipeline;action=`PIPELINE_${command.action.toUpperCase()}`;
      if(scenario==='pipeline-failed'){incidentId=`INC-${crypto.randomUUID().slice(0,8).toUpperCase()}`;outcome='failed';after=site.pipeline;}
      else{site.pipeline=command.action==='stop'?'stopped':'running';site.updatedAt=now;after=site.pipeline;}
    }else if(command.kind==='health'){
      const site=findSite(command.id);siteId=site.id;before=structuredClone(site.cameras.map(c=>next.devices.find(d=>d.id===c.deviceId)));
      site.cameras.forEach((c,i)=>{const d=next.devices.find(d=>d.id===c.deviceId)!;d.state=command.state==='healthy'||i===0?'online':command.state;d.fps=d.state==='online'?8.4:0;d.lastHeartbeat=now;});
      site.ws=command.state==='healthy'?'live':'polling';site.telemetry=command.state==='healthy'?'healthy':'failed';site.updatedAt=now;after=site.cameras.map(c=>next.devices.find(d=>d.id===c.deviceId));action='HEALTH_SCENARIO_UPDATED';
    }else if(command.kind==='config.save'){
      const error=configError(command.value);if(error)throw new Error(error);if(JSON.stringify(command.value)===JSON.stringify(next.config.values))throw new Error('Tidak ada perubahan konfigurasi.');
      before=next.config.values;after=command.value;next.config.history.push({version:next.config.version+1,at:now,actor:actor.name,reason:reason.trim(),before:structuredClone(next.config.values),after:structuredClone(command.value)});next.config.version++;next.config.values=structuredClone(command.value);action=command.rollback?'CONFIG_ROLLBACK':'CONFIG_UPDATED';
    }else{action='AUDIT_EXPORTED';after=command.scope;}
    next.revision++;next.audit.push({id:`AUD-${crypto.randomUUID()}`,at:now,actor:actor.name,action,siteId,outcome,reason:reason.trim(),before:before===null?'—':JSON.stringify(before),after:after===null?'—':JSON.stringify(after),incidentId});next.audit=next.audit.slice(-500);writeDirectory(next);
    if(incidentId)throw new ProviderIncident('Perintah pipeline demo gagal. Status sebelumnya dipertahankan.',incidentId);return next;
  };
  return navigator.locks?navigator.locks.request(providerStorageKey,run):run();
}
