// Local demonstration adapter. All identity results are fixtures or explicit operator input.
import { defaultRange, inRange, type DateRange } from './date-range';
export type Session = { id: string; entry: string | null; exit: string | null; cameraIn: number | null; cameraOut: number | null };
export type Visitor = { id: string; firstSeen: string; lastSeen: string; color: string; media: 'available' | 'missing' | 'expired'; sessions: Session[] };
export type Employee = { id: string; name: string; department: string; role: string; createdAt: string; lastSeen: string | null; photo: string | null; source: 'fixture' | 'upload' | 'camera' };
export type ResolutionKind = 'new' | 'existing' | 'employee';
export type Resolution = { kind: ResolutionKind; targetId: string; actor: string; at: string; note: string };
export type Ambiguous = { id: string; trackId: string; camera: number; direction: 'IN' | 'OUT'; occurredAt: string; reason: string; confidence: number; candidateId: string | null; color: string; resolution: Resolution | null };
export type IdentityState = { schema: 1; revision: number; updatedAt: string; visitors: Visitor[]; employees: Employee[]; queue: Ambiguous[] };
export type EnrollmentInput = Pick<Employee, 'name' | 'department' | 'role' | 'photo'> & { source: 'upload' | 'camera' };
export type ResolutionInput = { queueId: string; kind: ResolutionKind; targetId: string; note: string };
export type IdentityMetrics = { unique: number; inside: number; entries: number; exits: number; pending: number; employees: number };
export const identityStorageKey = 'visitor-ai.phase2.identity.v1';
export const identityKeyForSite=(siteId='SITE-001')=>siteId==='SITE-001'?identityStorageKey:`${identityStorageKey}.${siteId}`;
export const demoDate = '2026-10-29';
const at = (time: string, day = demoDate) => `${day}T${time}:00+07:00`;
const palette = ['blue','teal','violet','amber','rose','slate','blue','teal'];
export function makeIdentitySeed(siteId='SITE-001'): IdentityState {
  if(!['SITE-001','SITE-002','SITE-003'].includes(siteId))return {schema:1,revision:1,updatedAt:at('10:42'),visitors:[],employees:[],queue:[]};
  const visitors: Visitor[] = Array.from({length:8},(_,i)=>{
    const id = `VIS${String(i+1).padStart(6,'0')}`;
    const entry = at(`${String(8+Math.floor(i/3)).padStart(2,'0')}:${String(5+i*5).padStart(2,'0')}`);
    const exit = i<5?at(`10:${String(5+i*5).padStart(2,'0')}`):null;
    const sessions: Session[] = [{id:`SES-${i+1}`,entry,exit,cameraIn:1,cameraOut:exit?2:null}];
    if(i===0)sessions.unshift({id:'SES-return-1',entry:at('08:10','2026-10-28'),exit:at('09:20','2026-10-28'),cameraIn:1,cameraOut:2});
    if(i===1)sessions.unshift({id:'SES-return-2',entry:at('06:15'),exit:at('07:05'),cameraIn:1,cameraOut:2});
    return {id,firstSeen:sessions[0].entry!,lastSeen:exit??entry,color:palette[i],media:i===3?'missing':i===6?'expired':'available',sessions};
  });
  const state:IdentityState={schema:1,revision:1,updatedAt:at('10:42'),visitors,employees:[
    {id:'EMP00001',name:'Alya Pratama',department:'Guest Relations',role:'Lounge Host',createdAt:at('08:00','2026-10-20'),lastSeen:at('10:30'),photo:null,source:'fixture'},
    {id:'EMP00002',name:'Bima Saputra',department:'Security',role:'Security Officer',createdAt:at('08:00','2026-10-20'),lastSeen:at('10:25'),photo:null,source:'fixture'},
    {id:'EMP00003',name:'Citra Lestari',department:'Operations',role:'Duty Manager',createdAt:at('08:00','2026-10-21'),lastSeen:at('09:50'),photo:null,source:'fixture'},
    {id:'EMP00004',name:'Dimas Putra',department:'Housekeeping',role:'Lounge Attendant',createdAt:at('08:00','2026-10-22'),lastSeen:null,photo:null,source:'fixture'},
  ],queue:[
    {id:'AMB-0001',trackId:'TRK-0249',camera:1,direction:'IN',occurredAt:at('10:38'),reason:'Face confidence rendah',confidence:42,candidateId:'VIS000001',color:'blue',resolution:null},
    {id:'AMB-0002',trackId:'TRK-0177',camera:2,direction:'OUT',occurredAt:at('10:39'),reason:'Cam2 unmatched · exit tanpa identitas',confidence:31,candidateId:'VIS000006',color:'amber',resolution:null},
    {id:'AMB-0003',trackId:'TRK-0250',camera:1,direction:'IN',occurredAt:at('10:41'),reason:'Body / face matching tidak konsisten',confidence:56,candidateId:null,color:'violet',resolution:null},
  ]};
  if(siteId!=='SITE-001'){
    state.visitors=state.visitors.slice(0,siteId==='SITE-002'?4:2);
    const last=state.visitors.at(-1)!;last.sessions.at(-1)!.exit=null;last.sessions.at(-1)!.cameraOut=null;last.lastSeen=last.sessions.at(-1)!.entry!;
    state.employees=state.employees.slice(0,siteId==='SITE-002'?2:1).map((e,i)=>({...e,name:siteId==='SITE-002'?(i===0?'Sari Utami':'Fajar Hadi'):'Laras Dewi'}));
    state.queue=siteId==='SITE-002'?[{...state.queue[0],id:'AMB-2001',trackId:'TRK-1201'}]:[];
  }
  return state;
}

const dateString = (v: unknown): v is string => typeof v==='string' && Number.isFinite(Date.parse(v));
const optionalDate = (v: unknown) => v===null || dateString(v);
const validId = (value: unknown, pattern: RegExp): value is string => typeof value==='string'&&pattern.test(value);
function isSession(v: Session) { return !!v&&typeof v.id==='string'&&optionalDate(v.entry)&&optionalDate(v.exit)&&(v.entry!==null||v.exit!==null)&&[null,1,2].includes(v.cameraIn)&&[null,1,2].includes(v.cameraOut)&&(!v.entry||!v.exit||Date.parse(v.exit)>=Date.parse(v.entry)); }
function isState(value: unknown): value is IdentityState {
  if(!value||typeof value!=='object')return false;
  const v=value as IdentityState;
  return v.schema===1&&Number.isInteger(v.revision)&&v.revision>0&&dateString(v.updatedAt)&&
    Array.isArray(v.visitors)&&v.visitors.every(p=>p&&validId(p.id,/^VIS\d{6,}$/)&&dateString(p.firstSeen)&&dateString(p.lastSeen)&&palette.includes(p.color)&&['available','missing','expired'].includes(p.media)&&Array.isArray(p.sessions)&&p.sessions.every(isSession))&&
    Array.isArray(v.employees)&&v.employees.every(p=>p&&validId(p.id,/^EMP\d{5,}$/)&&[p.name,p.department,p.role].every(s=>typeof s==='string'&&s.length>0&&s.length<=100)&&dateString(p.createdAt)&&optionalDate(p.lastSeen)&&['fixture','upload','camera'].includes(p.source)&&(p.photo===null||typeof p.photo==='string'&&/^data:image\/(jpeg|png|webp);base64,/.test(p.photo)&&p.photo.length<800_000))&&
    Array.isArray(v.queue)&&v.queue.every(q=>q&&typeof q.id==='string'&&typeof q.trackId==='string'&&[1,2].includes(q.camera)&&['IN','OUT'].includes(q.direction)&&dateString(q.occurredAt)&&typeof q.reason==='string'&&Number.isFinite(q.confidence)&&q.confidence>=0&&q.confidence<=100&&palette.includes(q.color)&&(q.candidateId===null||typeof q.candidateId==='string')&&(q.resolution===null||q.resolution&&['new','existing','employee'].includes(q.resolution.kind)&&typeof q.resolution.targetId==='string'&&typeof q.resolution.actor==='string'&&dateString(q.resolution.at)&&typeof q.resolution.note==='string'))&&
    new Set(v.visitors.map(p=>p.id)).size===v.visitors.length&&new Set(v.employees.map(p=>p.id)).size===v.employees.length&&new Set(v.queue.map(q=>q.id)).size===v.queue.length;
}

function read(siteId='SITE-001'): IdentityState {
  const raw=localStorage.getItem(identityKeyForSite(siteId));
  if(!raw)return makeIdentitySeed(siteId);
  let value: unknown;
  try{value=JSON.parse(raw);}catch{throw new Error('Data demo lokal tidak dapat dibaca. Data tersimpan tidak diubah.');}
  if(!isState(value))throw new Error('Format data demo lokal tidak valid. Data tidak ditimpa.');
  return value;
}

// Serialize demo commands across tabs. Reject conflicting operator decisions instead of overwriting them.
async function transaction(siteId:string,command: (state: IdentityState)=>void): Promise<IdentityState> {
  const run=()=>{
    const before=read(siteId);const next=structuredClone(before);
    command(next);next.revision+=1;next.updatedAt=new Date().toISOString();
    if(!isState(next))throw new Error('Data hasil perubahan tidak valid. Tidak ada perubahan disimpan.');
    if(read(siteId).revision!==before.revision)throw new Error('Data berubah di tab lain. Muat ulang lalu coba kembali.');
    localStorage.setItem(identityKeyForSite(siteId),JSON.stringify(next));
    return next;
  };
  return navigator.locks?navigator.locks.request(identityKeyForSite(siteId),run):run();
}

function nextId(ids: string[], prefix: string, length: number) { const max=ids.reduce((n,id)=>Math.max(n,Number(id.slice(prefix.length))||0),0);return `${prefix}${String(max+1).padStart(length,'0')}`; }
export const inside = (v: Visitor) => v.sessions.some(s=>s.entry&&!s.exit);
export const visitCount = (v: Visitor) => v.sessions.filter(s=>s.entry).length;
export function metrics(state: IdentityState,range:DateRange=defaultRange): IdentityMetrics {
  const sessions=state.visitors.flatMap(v=>v.sessions);
  return {unique:state.visitors.filter(v=>v.sessions.some(s=>inRange(s.entry,range))).length,inside:state.visitors.filter(inside).length,entries:sessions.filter(s=>inRange(s.entry,range)).length,exits:sessions.filter(s=>inRange(s.exit,range)).length,pending:state.queue.filter(q=>!q.resolution).length,employees:state.employees.length};
}
export interface IdentityRepository {
  load(): Promise<IdentityState>;
  enroll(input: EnrollmentInput): Promise<IdentityState>;
  resolve(input: ResolutionInput): Promise<IdentityState>;
}
export function createIdentityRepository(siteId='SITE-001',authorize?:(write:boolean)=>void,actor?:()=>string):IdentityRepository {return {
  async load(){authorize?.(false);return read(siteId);},
  async enroll(input){return transaction(siteId,state=>{
    authorize?.(true);
    if([input.name,input.department,input.role].some(s=>!s.trim()||s.trim().length>100))throw new Error('Nama, departemen dan jabatan wajib diisi (maks. 100 karakter).');
    if(!input.photo||!/^data:image\/(jpeg|png|webp);base64,/.test(input.photo)||input.photo.length>=800_000)throw new Error('Foto enrollment tidak valid. Pilih ulang foto.');
    if(state.employees.some(e=>e.name.trim().toLocaleLowerCase()===input.name.trim().toLocaleLowerCase()&&e.department.trim().toLocaleLowerCase()===input.department.trim().toLocaleLowerCase()))throw new Error('Karyawan dengan nama dan departemen yang sama sudah terdaftar.');
    state.employees.push({...input,name:input.name.trim(),department:input.department.trim(),role:input.role.trim(),id:nextId(state.employees.map(e=>e.id),'EMP',5),createdAt:new Date().toISOString(),lastSeen:null});
  });},
  async resolve(input){return transaction(siteId,state=>{
    authorize?.(true);
    const q=state.queue.find(q=>q.id===input.queueId);
    if(!q)throw new Error('Item ambiguous tidak ditemukan.');
    if(q.resolution)throw new Error('Item sudah dikonfirmasi oleh operator di tab lain. Muat ulang antrean.');
    if(!input.note.trim()||input.note.length>300)throw new Error('Catatan konfirmasi wajib diisi (maks. 300 karakter).');
    let targetId=input.targetId;
    if(input.kind==='employee'){
      const employee=state.employees.find(e=>e.id===targetId);
      if(!employee)throw new Error('Pilih employee yang terdaftar.');
      employee.lastSeen=q.occurredAt;
    }else{
      let visitor=state.visitors.find(v=>v.id===targetId);
      if(input.kind==='new'){
        targetId=nextId(state.visitors.map(v=>v.id),'VIS',6);
        visitor={id:targetId,firstSeen:q.occurredAt,lastSeen:q.occurredAt,color:q.color,media:'available',sessions:[]};
        state.visitors.push(visitor);
      }
      if(!visitor)throw new Error('Pilih visitor yang terdaftar.');
      const open=visitor.sessions.find(s=>s.entry&&!s.exit);
      if(q.direction==='IN'&&!open)visitor.sessions.push({id:`SES-${q.id}`,entry:q.occurredAt,exit:null,cameraIn:q.camera,cameraOut:null});
      if(q.direction==='OUT'){
        if(open&&Date.parse(q.occurredAt)>=Date.parse(open.entry!)){open.exit=q.occurredAt;open.cameraOut=q.camera;}
        else visitor.sessions.push({id:`SES-${q.id}`,entry:null,exit:q.occurredAt,cameraIn:null,cameraOut:q.camera});
      }
      visitor.firstSeen=new Date(visitor.firstSeen)<new Date(q.occurredAt)?visitor.firstSeen:q.occurredAt;
      visitor.lastSeen=new Date(visitor.lastSeen)>new Date(q.occurredAt)?visitor.lastSeen:q.occurredAt;
    }
    q.resolution={kind:input.kind,targetId,actor:actor?.()??'Admin Site (demo)',at:new Date().toISOString(),note:input.note.trim()};
  });},
};}
export const demoIdentityRepository=createIdentityRepository();

export function formatTime(value: string | null) { return value?new Date(value).toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit'}).replaceAll('.',':'):'—'; }
export function formatDate(value: string) { return new Date(value).toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',year:'numeric'}); }
export function duration(s: Session) { if(!s.entry||!s.exit)return null;return Math.round((Date.parse(s.exit)-Date.parse(s.entry))/60000); }
