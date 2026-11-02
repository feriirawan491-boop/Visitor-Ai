'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FeatureGate } from '../release/feature-gate';
import { DefinitionPage } from '../operations/definition-page';
import { isDefinitionView } from '@/lib/site-navigation';
import { accountFor, hasPermission, homeHash, parseRoute, permissionForView, getSites, type AppRoute, type DemoSession, type SiteView } from '@/lib/access';
import { SessionProvider, SiteContextProvider, useSession } from './session';
import { LoginPage } from './login';
import { AccessScreen, AuthorizedRoute, SessionLoading } from './workspace';

// Defer operational fixtures and media UI until an authorized operational route mounts.
const ManagementDashboard=dynamic(()=>import('../management/dashboard').then(m=>m.ManagementDashboard),{loading:()=> <SessionLoading/>});
const ProviderDashboard=dynamic(()=>import('../provider/dashboard').then(m=>m.ProviderDashboard),{loading:()=> <SessionLoading/>});
const Dashboard=dynamic(()=>import('../dashboard'),{loading:()=> <SessionLoading/>});

export default function AccessApp(){return <FeatureGate feature="access"><SessionProvider><AppRouter/></SessionProvider></FeatureGate>;}
function AppRouter(){
  const auth=useSession();const [route,setRoute]=useState<AppRoute>({kind:'home'});const [ready,setReady]=useState(false);
  const [appliedSessionId,setAppliedSessionId]=useState<string|null>(null);const previous=useRef<DemoSession|null>(null);
  useEffect(()=>{
    const next=auth.session;if(!next){previous.current=null;setAppliedSessionId(null);return;}
    const before=previous.current;
    if(before&&before.id!==next.id){
      if(before.accountId!==next.accountId||before.role!==next.role||before.siteId!==next.siteId||JSON.stringify(before.support)!==JSON.stringify(next.support)){
        const requested=parseRoute(window.location.hash);const supportView=next.support&&requested.kind==='operations'&&requested.siteId===next.support.siteId&&hasPermission(next,permissionForView(requested.view),requested.siteId)?requested.view:'monitor';
        const hash=next.support?`#/admin-site/${next.support.siteId}/${supportView}`:homeHash(next);window.location.hash=hash;setRoute(parseRoute(hash));
      }else if(route.kind==='operations'&&route.recordId){const hash=`#/admin-site/${route.siteId??next.siteId}/${route.view}`;window.location.hash=hash;setRoute(parseRoute(hash));}
    }
    previous.current=next;setAppliedSessionId(next.id);
  },[auth.session?.id]);
  useEffect(()=>{const sync=()=>{if(window.location.hash==='#main')return;setRoute(parseRoute(window.location.hash));setReady(true);};sync();window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
  function go(hash:string){window.location.hash=hash;setRoute(parseRoute(hash));}
  function home(){if(auth.session)go(homeHash(auth.session));else go('#/login');}
  function loggedIn(session:DemoSession){
    if(route.kind==='provider'&&hasPermission(session,'provider:read'))return go(`#/provider/${route.view}${route.siteId?`/${route.siteId}`:''}`);
    if(route.kind==='management'&&hasPermission(session,'aggregates:read'))return go(`#/management/${route.view}${route.query?`?${route.query}`:''}`);
    if(route.kind==='operations'){
      const target=route.siteId??session.siteId;const account=accountFor(session);
      if(target&&account.siteIds.includes(target)&&session.role==='admin_site'&&permissionForView(route.view)!=='tuning:write')return go(`#/admin-site/${target}/${route.view}${route.recordId?`/${route.recordId}`:''}`);
      if(target&&hasPermission(session,permissionForView(route.view),target))return go(`#/admin-site/${target}/${route.view}${route.recordId?`/${route.recordId}`:''}`);
    }
    go(homeHash(session));
  }
  if(!ready||auth.status==='loading'||auth.session&&appliedSessionId!==auth.session.id)return <SessionLoading/>;
  if(['expired','revoked','suspended','unavailable'].includes(auth.status))return <AccessScreen kind={auth.status as 'expired'|'revoked'|'suspended'|'unavailable'}/>;
  if(!auth.session||route.kind==='login')return <LoginPage onSuccess={loggedIn}/>;
  const session=auth.session;const account=accountFor(session);
  if(!account.siteIds.length)return <AccessScreen kind="no-site"/>;
  const activeRoute=route.kind==='home'?parseRoute(homeHash(session)):route;
  if(activeRoute.kind==='not-found')return <AccessScreen kind="not-found" onHome={home}/>;
  if(activeRoute.kind==='management')return <AuthorizedRoute permission="aggregates:read" onDenied={home}><FeatureGate feature="analytics"><ManagementDashboard key={`${session.id}:management:${auth.directoryVersion}`} view={activeRoute.view} query={activeRoute.query} onNavigate={go}/></FeatureGate></AuthorizedRoute>;
  if(activeRoute.kind==='provider')return <AuthorizedRoute permission="provider:read" onDenied={home}><FeatureGate feature="provider"><ProviderDashboard key={`${session.id}:provider`} view={activeRoute.view} siteId={activeRoute.siteId} onNavigate={go}/></FeatureGate></AuthorizedRoute>;
  if(activeRoute.kind==='operations'){
    if(session.role==='provider')return <FeatureGate feature="provider"><OperationalRoute route={activeRoute} onHome={home} go={go}/></FeatureGate>;
    return <OperationalRoute route={activeRoute} onHome={home} go={go}/>;
  }
  return <AccessScreen kind="not-found" onHome={home}/>;
}

function OperationalRoute({route,onHome,go}:{route:Extract<AppRoute,{kind:'operations'}>;onHome:()=>void;go:(hash:string)=>void}){
  const auth=useSession();const session=auth.session!;const account=accountFor(session);
    const siteId=route.siteId??session.siteId;const site=getSites().find(s=>s.id===siteId);
    if(!site)return <AccessScreen kind="not-found" onHome={onHome}/>;
    if(isDefinitionView(route.view)&&session.role!=='admin_site')return <AccessScreen kind="forbidden" onHome={onHome}/>;
    if(site.status!=='active'&&account.siteIds.includes(site.id))return <AccessScreen kind="site-unavailable" onHome={session.role==='provider'||getSites().some(s=>account.siteIds.includes(s.id)&&s.status==='active')?onHome:undefined}/>;
    function navigate(view:SiteView,recordId?:string|null){go(`#/admin-site/${site!.id}/${view}${recordId?`/${recordId}`:''}`);}
    function switchSite(nextId:string){go(`#/admin-site/${nextId}/monitor`);}
    return <AuthorizedRoute permission={permissionForView(route.view)} siteId={site.id} onDenied={onHome}><SiteContextProvider site={site}>{isDefinitionView(route.view)?<FeatureGate feature="definitions"><DefinitionPage key={`${session.id}:${site.id}:${auth.directoryVersion}`} view={route.view} onNavigate={navigate} onSwitchSite={switchSite}/></FeatureGate>:<Dashboard key={`${session.id}:${site.id}:${auth.directoryVersion}`} route={{view:route.view,recordId:route.recordId}} onNavigate={navigate} onSwitchSite={switchSite}/>}</SiteContextProvider></AuthorizedRoute>;
}
