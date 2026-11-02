'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { providerChangeEvent, providerStorageKey, readDirectory } from '@/lib/provider-directory';
import { accountFor, createDemoSession, getDemoAccounts, hasPermission, readDemoSession, sessionStatus, sessionStorageKey, writeAccessAudit, type DemoSession, type Permission, type Role, type Site } from '@/lib/access';

type SessionContextValue={directoryVersion:number;session:DemoSession|null;status:ReturnType<typeof sessionStatus>|'loading';error:string|null;login:(accountId:string,role:Role,scenario:'normal'|'timeout'|'unavailable')=>Promise<DemoSession>;logout:()=>void;switchRole:(role:Role)=>DemoSession;selectSite:(siteId:string)=>DemoSession;startSupport:(siteId:string,reason:string)=>DemoSession;endSupport:()=>DemoSession;simulate:(state:'expired'|'revoked'|'suspended'|'unavailable')=>void;can:(permission:Permission,siteId?:string)=>boolean};
const SessionContext=createContext<SessionContextValue|null>(null);
export function SessionProvider({children}:{children:React.ReactNode}){
  const [directoryVersion,setDirectoryVersion]=useState(1);
  const [session,setSession]=useState<DemoSession|null>(null);const [status,setStatus]=useState<SessionContextValue['status']>('loading');const [error,setError]=useState<string|null>(null);
  const load=useCallback(()=>{try{const next=readDemoSession();setDirectoryVersion(readDirectory().revision);setSession(sessionStatus(next)==='active'?next:null);setStatus(sessionStatus(next));setError(null);}catch(e){setSession(null);setStatus('unavailable');setError(e instanceof Error?e.message:'Penyimpanan sesi demo tidak tersedia pada browser ini.');}},[]);
  useEffect(()=>{load();const sync=(e:StorageEvent)=>{if(e.key===sessionStorageKey||e.key===providerStorageKey||e.key===null)load();};window.addEventListener('storage',sync);window.addEventListener(providerChangeEvent,load);window.addEventListener('focus',load);const visible=()=>{if(document.visibilityState==='visible')load();};document.addEventListener('visibilitychange',visible);return()=>{window.removeEventListener('storage',sync);window.removeEventListener(providerChangeEvent,load);window.removeEventListener('focus',load);document.removeEventListener('visibilitychange',visible);};},[load]);
  useEffect(()=>{if(!session)return;const timer=setTimeout(load,Math.max(1,session.expiresAt-Date.now()+20));return()=>clearTimeout(timer);},[session,load]);
  function persist(next:DemoSession){localStorage.setItem(sessionStorageKey,JSON.stringify(next));load();return next;}
  function current(){const s=readDemoSession();if(!s||sessionStatus(s)!=='active')throw new Error('Sesi demo tidak aktif. Masuk kembali.');return s;}
  async function login(accountId:string,role:Role,scenario:'normal'|'timeout'|'unavailable'){
    await new Promise(resolve=>setTimeout(resolve,250));
    if(scenario!=='normal')throw new Error(scenario==='timeout'?'Koneksi login demo mengalami timeout. Pilih kondisi Normal lalu coba lagi.':'Layanan login demo tidak tersedia. Coba lagi setelah mengganti kondisi.');
    const account=getDemoAccounts().find(a=>a.id===accountId);if(!account)throw new Error('Pilih akun demo yang tersedia.');const next=createDemoSession(account,role);writeAccessAudit(next,'LOGIN_DEMO');return persist(next);
  }
  function logout(){
    try{const s=readDemoSession();if(s){try{writeAccessAudit(s,'LOGOUT_DEMO');}catch{/* Optional audit must not block cleanup. */}}}catch{/* Directory may be unavailable; still clear the local session. */}
    try{localStorage.removeItem(sessionStorageKey);}catch{setSession(null);setStatus('unavailable');setError('Sesi demo belum dapat dibersihkan dari penyimpanan browser.');return;}
    setSession(null);load();
  }
  function switchRole(role:Role){const s=current();if(!accountFor(s).roles.includes(role))throw new Error('Workspace tidak diizinkan.');const next={...s,id:crypto.randomUUID(),role,support:null};writeAccessAudit(next,'SWITCH_WORKSPACE');return persist(next);}
  function selectSite(siteId:string){const s=current();if(!accountFor(s).siteIds.includes(siteId))throw new Error('Site tidak termasuk cakupan akun ini.');const next={...s,id:crypto.randomUUID(),siteId,support:null};writeAccessAudit(next,'SWITCH_SITE');return persist(next);}
  function startSupport(siteId:string,reason:string){const s=current();if(s.role!=='provider'||!hasPermission(s,'provider:read',siteId)||readDirectory().sites.find(site=>site.id===siteId)?.status!=='active'||!reason.trim()||reason.length>300)throw new Error('Pilih site yang diizinkan dan isi tujuan dukungan (maks. 300 karakter).');const next={...s,id:crypto.randomUUID(),siteId,support:{siteId,reason:reason.trim(),at:new Date().toISOString()}};writeAccessAudit(next,'START_SUPPORT',reason.trim());return persist(next);}
  function endSupport(){const s=current();const next={...s,id:crypto.randomUUID(),support:null};writeAccessAudit(next,'END_SUPPORT');return persist(next);}
  function simulate(state:'expired'|'revoked'|'suspended'|'unavailable'){const s=current();const next={...s,id:crypto.randomUUID(),...(state==='expired'?{expiresAt:Date.now()-1}:{state})};localStorage.setItem(sessionStorageKey,JSON.stringify(next));load();}
  return <SessionContext.Provider value={{directoryVersion,session,status,error,login,logout,switchRole,selectSite,startSupport,endSupport,simulate,can:(permission,siteId)=>hasPermission(session,permission,siteId)}}>{children}</SessionContext.Provider>;
}
export function useSession(){const value=useContext(SessionContext);if(!value)throw new Error('SessionProvider tidak tersedia.');return value;}
const SiteContext=createContext<Site|null>(null);
export function SiteContextProvider({site,children}:{site:Site;children:React.ReactNode}){return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;}
export function useSite(){const site=useContext(SiteContext);if(!site)throw new Error('Site context tidak tersedia.');return site;}
export function PermissionGuard({permission,children,fallback=null}:{permission:Permission;children:React.ReactNode;fallback?:React.ReactNode}){const auth=useSession();const site=useContext(SiteContext);return auth.can(permission,site?.id)?children:fallback;}
