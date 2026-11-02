'use client';
import { useCallback, useEffect, useState } from 'react';
import { readSettings, saveSettings, settingsKeyForSite, type SettingsDocument, type TuningValues } from './settings';
import { accountFor, assertDemoPermission, readDemoSession } from './access';
export function useSettings(siteId='SITE-001',enabled=true){
  const [data,setData]=useState<SettingsDocument|null>(null);const [error,setError]=useState<string|null>(null);
  const reload=useCallback(()=>{if(!enabled){setData(null);setError(null);return;}try{assertDemoPermission('tuning:write',siteId);setData(readSettings(siteId));setError(null);}catch(e){setData(null);setError(e instanceof Error?e.message:'Konfigurasi tidak dapat dibaca.');}},[siteId,enabled]);
  useEffect(()=>{reload();const sync=(e:StorageEvent)=>{if(e.key===settingsKeyForSite(siteId)||e.key===null)reload();};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[reload,siteId]);
  async function save(values:TuningValues,version:number,reason:string,action:'update'|'rollback'){
    const next=await saveSettings(values,version,reason,action,siteId,()=>assertDemoPermission('tuning:write',siteId),accountFor(readDemoSession()!).name);setData(next);setError(null);return next;
  }
  return {data,error,reload,save};
}
export type SettingsController=ReturnType<typeof useSettings>;
