import { definitionViews, isDefinitionView, type DefinitionView } from './site-navigation';
import { directoryAccounts, directorySites, providerViews, type ProviderView, type Role, type DemoAccount } from './provider-directory';
export type { Role, Site, DemoAccount } from './provider-directory';
export const getSites=directorySites;
export const getDemoAccounts=directoryAccounts;
import { managementViews, type ManagementView } from './analytics-routes';
// Frontend-only account and permission fixtures. This is not an authentication boundary.
export type Permission='operations:read'|'identity:write'|'history:read'|'tuning:write'|'pipeline:control'|'aggregates:read'|'provider:read'|'definition:read';
export type OperationalView='monitor'|'visitors'|'employees'|'ambiguous'|'history'|'settings'|'gates'|'health';
export type SiteView=OperationalView|DefinitionView;
export const operationalViews:OperationalView[]=['monitor','visitors','employees','ambiguous','history','settings','gates','health'];
export const roleNames:Record<Role,string>={admin_site:'Admin Site Lounge',management:'Management',provider:'Super Admin Provider'};
export type DemoSession={schema:1;id:string;accountId:string;role:Role;siteId:string|null;issuedAt:number;expiresAt:number;state:'active'|'revoked'|'suspended'|'unavailable';support:null|{siteId:string;reason:string;at:string};accessVersion?:number};
export const sessionStorageKey='visitor-ai.phase4.demo-session.v1';
export const accessAuditKey='visitor-ai.phase4.access-audit.v1';
export type AccessAudit={id:string;at:string;actor:string;role:Role;siteId:string|null;action:string;reason:string};
export function accountFor(session:DemoSession){return getDemoAccounts().find(a=>a.id===session.accountId)!;}
export function parseSession(raw:string|null):DemoSession|null{
  if(!raw)return null;let value:unknown;try{value=JSON.parse(raw);}catch{return null;}
  if(!value||typeof value!=='object')return null;const s=value as DemoSession;const account=getDemoAccounts().find(a=>a.id===s.accountId);
  if(!account||s.schema!==1||typeof s.id!=='string'||!['admin_site','management','provider'].includes(s.role)||!Number.isFinite(s.issuedAt)||!Number.isFinite(s.expiresAt)||s.expiresAt<=s.issuedAt||!['active','revoked','suspended','unavailable'].includes(s.state))return null;
  if(s.accessVersion!==undefined&&(!Number.isInteger(s.accessVersion)||s.accessVersion<1||s.accessVersion>account.accessVersion))return null;
  if(account.status==='disabled'||account.accessVersion>(s.accessVersion??1))return {...s,state:'revoked'};
  if(!account.roles.includes(s.role))return null;
  if(s.siteId!==null&&!account.siteIds.includes(s.siteId))return null;
  if(s.support!==null&&(!s.support||s.role!=='provider'||!account.siteIds.includes(s.support.siteId)||typeof s.support.reason!=='string'||!s.support.reason.trim()||s.support.reason.length>300||!Number.isFinite(Date.parse(s.support.at))))return null;
  return s;
}
export function readDemoSession(){return parseSession(localStorage.getItem(sessionStorageKey));}
export function sessionStatus(s:DemoSession|null):'unauthenticated'|'active'|'expired'|'revoked'|'suspended'|'unavailable'{
  if(!s)return 'unauthenticated';if(s.expiresAt<=Date.now())return 'expired';return s.state;
}
export function hasPermission(s:DemoSession|null,permission:Permission,siteId?:string):boolean{
  if(!s||sessionStatus(s)!=='active')return false;const account=accountFor(s);
  if(!account||account.status!=='active'||!account.roles.includes(s.role)||account.accessVersion>(s.accessVersion??1))return false;
  if(siteId&&!account.siteIds.includes(siteId))return false;
  if(siteId&&permission!=='aggregates:read'&&getSites().find(site=>site.id===siteId)?.status!=='active')return false;
  if(permission==='definition:read')return s.role==='admin_site';
  if(s.role==='management')return permission==='aggregates:read';
  if(s.role==='provider'){
    if(permission==='provider:read')return true;
    return !!s.support&&(!siteId||siteId===s.support.siteId)&&['operations:read','identity:write','history:read','tuning:write','pipeline:control'].includes(permission);
  }
  if(['operations:read','history:read'].includes(permission))return true;
  if(permission==='identity:write')return !account.readOnly;
  return account.technical&&['tuning:write','pipeline:control'].includes(permission);
}
export function permissionForView(view:SiteView):Permission{return isDefinitionView(view)?'definition:read': view==='settings'||view==='gates'?'tuning:write':view==='history'?'history:read':'operations:read';}
export function assertDemoPermission(permission:Permission,siteId:string){
  const session=readDemoSession();if(!hasPermission(session,permission,siteId))throw new Error('Aksi tidak diizinkan pada role atau site demo saat ini.');
}
export function writeAccessAudit(s:DemoSession,action:string,reason=''){
  let current:AccessAudit[]=[];const raw=localStorage.getItem(accessAuditKey);
  if(raw){try{const parsed:unknown=JSON.parse(raw);if(!Array.isArray(parsed))throw new Error();current=parsed.filter(a=>a&&typeof a.action==='string'&&typeof a.at==='string'&&typeof a.actor==='string');}catch{throw new Error('Audit akses demo tidak dapat dibaca.');}}
  const event:AccessAudit={id:crypto.randomUUID(),at:new Date().toISOString(),actor:accountFor(s).name,role:s.role,siteId:s.support?.siteId??s.siteId,action,reason};
  localStorage.setItem(accessAuditKey,JSON.stringify([...current,event].slice(-200)));
}
export function createDemoSession(account:DemoAccount,role:Role):DemoSession{
  if(account.suspended||account.status!=='active')throw new Error('Akun demo ditangguhkan. Pilih akun aktif lainnya.');
  if(!account.roles.includes(role))throw new Error('Workspace tidak tersedia untuk akun ini.');
  const now=Date.now();return {schema:1,id:crypto.randomUUID(),accountId:account.id,role,siteId:account.siteIds[0]??null,issuedAt:now,expiresAt:now+45*60*1000,state:'active',support:null,accessVersion:account.accessVersion};
}
export type AppRoute={kind:'home'}|{kind:'login'}|{kind:'operations';siteId:string|null;view:SiteView;recordId:string|null;legacy:boolean}|{kind:'management';view:ManagementView;query:string}|{kind:'provider';view:ProviderView;siteId:string|null}|{kind:'not-found'};
export function parseRoute(hash:string):AppRoute{
  const clean=hash.replace(/^#\/?/,'');if(!clean||clean==='main')return {kind:'home'};
  const [path,query='']=clean.split('?');const parts=path.split('/');const siteViews:readonly string[]=[...operationalViews,...definitionViews];if(parts[0]==='login')return {kind:'login'};
  if(parts[0]==='admin-site'&&parts.length<=4&&siteViews.includes(parts[2])&&(!isDefinitionView(parts[2])||parts.length===3))return {kind:'operations',siteId:parts[1],view:parts[2] as SiteView,recordId:parts[3]??null,legacy:false};
  if(siteViews.includes(parts[0])&&parts.length<=2&&(!isDefinitionView(parts[0])||parts.length===1))return {kind:'operations',siteId:null,view:parts[0] as SiteView,recordId:parts[1]??null,legacy:true};
  if(parts[0]==='management'&&(parts.length===1||parts.length===2&&managementViews.includes(parts[1] as ManagementView)))return {kind:'management',view:(parts[1]??'overview') as ManagementView,query};
  if(parts[0]==='provider'&&(parts.length===1||parts.length===2&&providerViews.includes(parts[1] as ProviderView)||parts.length===3&&parts[1]==='sites'&&/^SITE-[A-Z0-9-]+$/.test(parts[2])))return {kind:'provider',view:(parts[1]??'overview') as ProviderView,siteId:parts[2]??null};
  return {kind:'not-found'};
}
export function homeHash(s:DemoSession){
  if(s.role==='management')return '#/management/overview';if(s.role==='provider')return '#/provider/overview';
  const assigned=accountFor(s).siteIds;const active=getSites().filter(site=>assigned.includes(site.id)&&site.status==='active');const target=active.find(site=>site.id===s.siteId)??active[0];
  return target?`#/admin-site/${target.id}/monitor`:s.siteId?`#/admin-site/${s.siteId}/monitor`:'#/';
}
