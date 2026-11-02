'use client';
import { useCallback, useEffect, useState } from 'react';
import { providerChangeEvent, providerStorageKey, readDirectory, type ProviderDirectory } from './provider-directory';
import { providerActor } from './provider';
export function useProviderDirectory(){
  const [data,setData]=useState<ProviderDirectory|null>(null);const [error,setError]=useState('');
  const reload=useCallback(()=>{try{providerActor();setData(readDirectory());setError('');}catch(e){setData(null);setError((e as Error).message);}},[]);
  useEffect(()=>{reload();const sync=(e:StorageEvent)=>{if(e.key===providerStorageKey||e.key===null)reload();};window.addEventListener('storage',sync);window.addEventListener(providerChangeEvent,reload);return()=>{window.removeEventListener('storage',sync);window.removeEventListener(providerChangeEvent,reload);};},[reload]);
  return {data,error,reload};
}
