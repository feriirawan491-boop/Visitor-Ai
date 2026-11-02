'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createIdentityRepository, identityKeyForSite, type EnrollmentInput, type IdentityState, type ResolutionInput } from './identity';

import { accountFor, assertDemoPermission, readDemoSession } from './access';

export function useIdentity(siteId='SITE-001') {
  const repository=useMemo(()=>createIdentityRepository(siteId,write=>assertDemoPermission(write?'identity:write':'operations:read',siteId),()=>accountFor(readDemoSession()!).name),[siteId]);
  const [data,setData]=useState<IdentityState|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const inFlight=useRef(false);
  const alive=useRef(true);
  const suspended=useRef(false);
  const reload=useCallback(async(options?:{silent?:boolean;signal?:AbortSignal})=>{
    if(suspended.current||options?.signal?.aborted)return false;
    if(!options?.silent)setLoading(true);
    try{const next=await repository.load();if(alive.current&&!suspended.current&&!options?.signal?.aborted){setData(previous=>previous?.revision===next.revision?previous:next);setError(null);return true;}return false;}
    catch(e){if(alive.current&&!options?.signal?.aborted){setData(null);setError(e instanceof Error?e.message:'Data demo tidak dapat dimuat.');}return false;}
    finally{if(alive.current&&!options?.silent)setLoading(false);}
  },[repository]);
  useEffect(()=>{
    alive.current=true;void reload();
    const sync=(e: StorageEvent)=>{if(e.key===identityKeyForSite(siteId)||e.key===null)void reload();};
    window.addEventListener('storage',sync);
    return()=>{alive.current=false;window.removeEventListener('storage',sync);};
  },[reload,siteId]);
  async function command(task: ()=>Promise<IdentityState>){
    if(suspended.current)throw new Error('Akses workspace demo sedang dihentikan.');
    if(inFlight.current)throw new Error('Perubahan lain sedang disimpan.');
    inFlight.current=true;setBusy(true);
    try{const result=await task();if(alive.current){setData(result);setError(null);}return result;}
    catch(e){await reload();throw e;}
    finally{inFlight.current=false;if(alive.current)setBusy(false);}
  }
  const suspend=useCallback(()=>{suspended.current=true;setData(null);setError(null);setLoading(false);},[]);
  const resume=useCallback(()=>{suspended.current=false;void reload();},[reload]);
  return {data,error,loading,busy,reload,suspend,resume,enroll:(input:EnrollmentInput)=>command(()=>repository.enroll(input)),resolve:(input:ResolutionInput)=>command(()=>repository.resolve(input))};
}
export type IdentityController = ReturnType<typeof useIdentity>;
