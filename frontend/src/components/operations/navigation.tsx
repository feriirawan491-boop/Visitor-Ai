'use client';
import { Activity, CircleAlert, FileText, History, Monitor, ScanLine, Settings2, Sparkles, UserRoundCheck, Users } from 'lucide-react';
import { permissionForView, type SiteView } from '@/lib/access';
import { releaseConfig } from '@/lib/release-config';
import { isDefinitionView } from '@/lib/site-navigation';
import { cn } from '@/lib/utils';
import { useSession, useSite } from '../access/session';
const navigation=[{id:'monitor',label:'Live Monitoring',icon:Monitor},{id:'visitors',label:'Visitor',icon:Users},{id:'employees',label:'Employee',icon:UserRoundCheck},{id:'ambiguous',label:'Ambiguous Queue',icon:CircleAlert},{id:'history',label:'History',icon:History},{id:'entertaint',label:'Entertaint',icon:Sparkles},{id:'protocol',label:'Protocol',icon:FileText},{id:'settings',label:'Settings / Tuning',icon:Settings2},{id:'gates',label:'Gate Configuration',icon:ScanLine},{id:'health',label:'System Health',icon:Activity}] as const;
export function OperationalNavigation({view,onNavigate,pending,showLive=true}:{view:SiteView;onNavigate:(view:SiteView)=>void;pending?:number;showLive?:boolean}){
  const auth=useSession();const site=useSite();
  return <nav aria-label="Navigasi utama">{navigation.filter(n=>auth.can(permissionForView(n.id),site.id)&&(!isDefinitionView(n.id)||releaseConfig.features.definitions)).map(n=><button key={n.id} aria-current={view===n.id?'page':undefined} onClick={()=>onNavigate(n.id)} className={cn('nav-item',view===n.id&&'active')}><n.icon size={19}/><span>{n.label}</span>{n.id==='monitor'&&showLive&&<span className="nav-live"/>}{n.id==='ambiguous'&&!!pending&&<span className="queue-nav-count">{pending}</span>}</button>)}</nav>;
}
