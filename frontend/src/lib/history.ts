import { demoEvents } from './demo';
import { makeIdentitySeed, type IdentityState } from './identity';
import type { SettingsAudit } from './settings';
export const eventKinds={VISITOR_ENTER:'Visitor masuk',VISITOR_EXIT:'Visitor keluar',EMPLOYEE_IDENTIFIED:'Employee dikenali',AMBIGUOUS_DETECTED:'Identitas belum pasti',IDENTITY_CONFIRMED:'Identitas dikonfirmasi',CROSSING_DETECTED:'Gate crossing',CROSSING_SKIPPED:'Crossing diabaikan',CONFIG_UPDATED:'Konfigurasi diperbarui',EMPLOYEE_ENROLLED:'Employee ditambahkan'};
export type EventKind=keyof typeof eventKinds;
export type HistoryEvent={id:string;at:string;kind:EventKind;direction:'IN'|'OUT'|'SKIP'|null;camera:number|null;identityId:string|null;trackId:string|null;description:string;media:'visitor'|'employee'|'ambiguous'|null;sourceId:string|null;late:boolean};
export function buildHistory(data:IdentityState,audit:SettingsAudit[],siteId='SITE-001'):HistoryEvent[]{
  const events:HistoryEvent[]=[];
  for(const v of data.visitors)for(const s of v.sessions){
    if(s.entry)events.push({id:`${v.id}-${s.id}-IN`,at:s.entry,kind:'VISITOR_ENTER',direction:'IN',camera:s.cameraIn,identityId:v.id,trackId:null,description:`Entry visitor · ${s.id}`,media:'visitor',sourceId:v.id,late:false});
    if(s.exit)events.push({id:`${v.id}-${s.id}-OUT`,at:s.exit,kind:'VISITOR_EXIT',direction:'OUT',camera:s.cameraOut,identityId:v.id,trackId:null,description:s.entry?`Exit visitor · ${s.id}`:'Exit tanpa entry · sesi tidak lengkap',media:'visitor',sourceId:v.id,late:false});
  }
  const initialEmployees=makeIdentitySeed(siteId).employees;
  for(const e of data.employees){
    const original=initialEmployees.find(initial=>initial.id===e.id);
    if(e.source==='fixture'&&original?.lastSeen&&original.lastSeen!==e.lastSeen)events.push({id:`${e.id}-SEEN-${original.lastSeen}`,at:original.lastSeen,kind:'EMPLOYEE_IDENTIFIED',direction:null,camera:null,identityId:e.id,trackId:null,description:'Employee · observasi awal fixture',media:'employee',sourceId:e.id,late:false});
    if(e.lastSeen)events.push({id:`${e.id}-SEEN-${e.lastSeen}`,at:e.lastSeen,kind:'EMPLOYEE_IDENTIFIED',direction:null,camera:null,identityId:e.id,trackId:null,description:'Employee · tidak menambah visitor count',media:'employee',sourceId:e.id,late:false});
    if(e.source!=='fixture')events.push({id:`${e.id}-ENROLL`,at:e.createdAt,kind:'EMPLOYEE_ENROLLED',direction:null,camera:null,identityId:e.id,trackId:null,description:`Enrollment ${e.source==='camera'?'webcam':'upload'} · demo`,media:'employee',sourceId:e.id,late:false});
  }
  for(const q of data.queue){
    events.push({id:`${q.id}-DETECTED`,at:q.occurredAt,kind:'AMBIGUOUS_DETECTED',direction:q.direction,camera:q.camera,identityId:null,trackId:q.trackId,description:q.reason,media:'ambiguous',sourceId:q.id,late:false});
    if(q.resolution)events.push({id:`${q.id}-RESOLVED`,at:q.resolution.at,kind:'IDENTITY_CONFIRMED',direction:q.direction,camera:q.camera,identityId:q.resolution.targetId,trackId:q.trackId,description:`${q.resolution.targetId} · ${q.resolution.kind==='employee'?'Employee':'Visitor'} dikonfirmasi · ${q.resolution.actor} · ${q.resolution.note}`,media:q.resolution.kind==='employee'?'employee':'visitor',sourceId:q.resolution.targetId,late:Date.parse(q.resolution.at)-Date.parse(q.occurredAt)>60000});
  }
  for(const e of ['SITE-001','SITE-002','SITE-003'].includes(siteId)?demoEvents:[])events.push({id:`GATE-${e.track}`,at:`2026-10-29T${e.time}+07:00`,kind:e.direction==='SKIP'?'CROSSING_SKIPPED':'CROSSING_DETECTED',direction:e.direction as HistoryEvent['direction'],camera:e.camera,identityId:null,trackId:e.track,description:e.note,media:null,sourceId:null,late:false});
  for(const a of audit)events.push({id:a.id,at:a.at,kind:'CONFIG_UPDATED',direction:null,camera:null,identityId:null,trackId:null,description:`${a.action==='rollback'?'Rollback':'Update'} v${a.version} · ${a.reason}`,media:null,sourceId:null,late:false});
  return [...new Map(events.map(e=>[e.id,e])).values()].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||a.id.localeCompare(b.id));
}
