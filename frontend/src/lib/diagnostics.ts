// Intentionally accepts no Error, URL, message, stack, user, site, media, or credential payload.
export type DiagnosticKind='render'|'uncaught'|'promise';
export type DiagnosticArea='application'|'release-preview'|'framework';
export type SafeDiagnostic={reference:string;at:string;kind:DiagnosticKind;area:DiagnosticArea;code:'FE_RENDER'|'FE_UNCAUGHT'|'FE_PROMISE'};
let events:readonly SafeDiagnostic[]=[];
const listeners=new Set<()=>void>();
export function recordDiagnostic(kind:DiagnosticKind,area:DiagnosticArea):SafeDiagnostic{
  if(!['render','uncaught','promise'].includes(kind))kind='uncaught';if(!['application','release-preview','framework'].includes(area))area='application';
  const event:SafeDiagnostic={reference:`FE-${crypto.randomUUID().slice(0,8).toUpperCase()}`,at:new Date().toISOString(),kind,area,code:kind==='render'?'FE_RENDER':kind==='promise'?'FE_PROMISE':'FE_UNCAUGHT'};
  events=[event,...events].slice(0,50);listeners.forEach(fn=>fn());return event;
}
export const diagnosticSnapshot=()=>events;
const empty:readonly SafeDiagnostic[]=[];
export const diagnosticServerSnapshot=()=>empty;
export function subscribeDiagnostics(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
