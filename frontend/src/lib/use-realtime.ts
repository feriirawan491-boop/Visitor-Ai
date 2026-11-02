'use client';
import { useEffect, useRef, useState } from 'react';
export const connectionScenarios={healthy:'Normal · WS live',ws_down:'WS terputus · polling tersedia',stale:'Data stale · heartbeat berhenti',offline:'Offline · WS dan polling gagal',expired:'Sesi berakhir · simulasi 401',revoked:'Izin dicabut · simulasi 403',unavailable:'Site tidak tersedia'};
export type ConnectionScenario=keyof typeof connectionScenarios;
export type ConnectionState='CONNECTING'|'WS_LIVE'|'RECONNECTING'|'POLLING_FALLBACK'|'STALE'|'OFFLINE'|'SESSION_EXPIRED'|'PERMISSION_REVOKED'|'SITE_UNAVAILABLE';
export const connectionLabels:Record<ConnectionState,string>={CONNECTING:'Connecting',WS_LIVE:'WS Live',RECONNECTING:'Reconnecting',POLLING_FALLBACK:'Polling Fallback',STALE:'Stale',OFFLINE:'Offline',SESSION_EXPIRED:'Session Expired',PERMISSION_REVOKED:'Permission Revoked',SITE_UNAVAILABLE:'Site Unavailable'};

// Local simulator: heartbeat notifications and polling read the same demo snapshot.
// Its envelope is internal to this UI, and does not claim to implement a production WS schema.
export function useDemoRealtime(scope:string,onRefresh:(options:{silent:boolean;signal?:AbortSignal})=>Promise<boolean|void>){
  const [scenario,setScenario]=useState<ConnectionScenario>('healthy');
  const [state,setState]=useState<ConnectionState>('CONNECTING');
  const [attempts,setAttempts]=useState(0);const [lastSuccess,setLastSuccess]=useState<string|null>(null);
  const [sequence,setSequence]=useState(0);const [polling,setPolling]=useState(false);const [connectedScope,setConnectedScope]=useState(scope);
  const [retryKey,setRetryKey]=useState(0);const refresh=useRef(onRefresh);refresh.current=onRefresh;
  const generation=useRef(0);
  const blocked=['expired','revoked','unavailable'].includes(scenario);
  useEffect(()=>{
    const current=++generation.current;const controller=new AbortController();const timers:ReturnType<typeof setTimeout>[]=[];let interval:ReturnType<typeof setInterval>|null=null;let inFlight=false;
    const active=()=>!controller.signal.aborted&&generation.current===current;
    setAttempts(0);setPolling(false);setConnectedScope(scope);
    const load=async(mode:'WS_LIVE'|'POLLING_FALLBACK')=>{
      if(!active()||inFlight)return;inFlight=true;
      try{
        const ok=await refresh.current({silent:true,signal:controller.signal});
        if(active()){if(ok===false){setState('STALE');return;}setState(mode);setLastSuccess(new Date().toISOString());setSequence(n=>n+1);setConnectedScope(scope);}
      }catch{if(active())setState('STALE');}finally{inFlight=false;}
    };
    if(scenario==='expired')setState('SESSION_EXPIRED');
    else if(scenario==='revoked')setState('PERMISSION_REVOKED');
    else if(scenario==='unavailable')setState('SITE_UNAVAILABLE');
    else if(scenario==='offline')setState('OFFLINE');
    else if(scenario==='stale')setState('STALE');
    else if(scenario==='ws_down'){
      setState('RECONNECTING');
      timers.push(setTimeout(()=>{if(active())setAttempts(1);},450));
      timers.push(setTimeout(()=>{if(!active())return;setAttempts(2);setPolling(true);void load('POLLING_FALLBACK');interval=setInterval(()=>void load('POLLING_FALLBACK'),5000);},900));
    }else{
      setState('CONNECTING');
      timers.push(setTimeout(()=>{if(!active())return;void load('WS_LIVE');interval=setInterval(()=>void load('WS_LIVE'),3000);},200));
    }
    return()=>{controller.abort();timers.forEach(clearTimeout);if(interval)clearInterval(interval);};
  },[scenario,scope,retryKey]);
  const effectiveState:ConnectionState=blocked?(scenario==='expired'?'SESSION_EXPIRED':scenario==='revoked'?'PERMISSION_REVOKED':'SITE_UNAVAILABLE'):state;
  return {scenario,setScenario,state:effectiveState,label:connectionLabels[effectiveState],attempts,lastSuccess,sequence,polling,scope:connectedScope,blocked,reconnect:()=>setRetryKey(n=>n+1),restore:()=>setScenario('healthy')};
}
export type RealtimeController=ReturnType<typeof useDemoRealtime>;
