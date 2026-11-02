'use client';
import { useEffect, useRef, useState } from 'react';
import { readDirectory } from '@/lib/provider-directory';
import { Activity, ArrowDownLeft, ArrowDownToLine, ArrowRight, ArrowUpRight, ArrowUpFromLine, Bell, Check, ChevronRight, CircleHelp, Clock3, Cpu, Expand, Focus, Gauge, Info, Layers3, MapPin, Menu, Monitor, Pause, PencilRuler, Play, RefreshCw, ScanLine, ShieldCheck, SlidersHorizontal, Users, UserRoundCheck, Video, VideoOff, Wifi, X } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './ui/dialog';
import dynamic from 'next/dynamic';
const CameraScene=dynamic(()=>import('./camera-scene').then(m=>m.CameraScene));
const GateEditor=dynamic(()=>import('./gate-editor').then(m=>m.GateEditor),{loading:()=> <p className="editor-loading" role="status">Memuat editor gate…</p>});
import { ThemeToggle } from './theme-toggle';
import { defaultGate, modes, readGate, storageKey, type CameraState, type GateConfig } from '@/lib/demo';
import { cn } from '@/lib/utils';
import { useIdentity } from '@/lib/use-identity';
import { metrics, formatTime } from '@/lib/identity';
import { IdentityBoundary } from './identity/shared';
import { VisitorPage } from './identity/visitors';
import { EmployeePage } from './identity/employees';
import { AmbiguousPage } from './identity/ambiguous';
import { defaultRange, inRange, rangeLabel, validRange, type DateRange } from '@/lib/date-range';
import { useSettings } from '@/lib/use-settings';
import { useDemoRealtime } from '@/lib/use-realtime';
import { buildHistory } from '@/lib/history';
import { GlobalDateFilter } from './operations/date-filter';
import { ConnectionBar, RealtimeControls, AccessState } from './operations/connection';
import { HistoryPage } from './operations/history';
import { SettingsPage } from './operations/settings';
import { accountFor, assertDemoPermission, roleNames, type OperationalView, type SiteView } from '@/lib/access';
import { useSession, useSite } from './access/session';
import { OperationalNavigation } from './operations/navigation';
import { AccountControl, SiteSwitcher } from './access/controls';

type View=OperationalView;
const viewTitles: Record<View,string> = {monitor:'Live Monitoring',gates:'Gate Configuration',health:'System Health',visitors:'Visitor Directory',employees:'Employee Management',ambiguous:'Ambiguous Queue',history:'History',settings:'Settings / Tuning'};
const viewDescriptions: Record<View,string> = {monitor:'Satu pintu. Dua perspektif. Pantau setiap pergerakan.',gates:'Sesuaikan zona deteksi untuk setiap perspektif kamera.',health:'Visibilitas kondisi kamera dan skenario monitoring.',visitors:'Setiap kunjungan punya cerita. Setiap orang satu identitas.',employees:'Kenali tim lounge, pisahkan dari traffic pengunjung.',ambiguous:'Tinjau identitas yang belum pasti dengan keputusan yang terarah.',history:'Satu timeline untuk setiap pergerakan dan keputusan operasional.',settings:'Konfigurasi yang terarah. Perubahan yang dapat ditelusuri.'};
const initialConfigs = [structuredClone(defaultGate),structuredClone(defaultGate)];
export default function Dashboard({route,onNavigate,onSwitchSite}:{route:{view:View;recordId:string|null};onNavigate:(view:SiteView,id?:string|null)=>void;onSwitchSite:(siteId:string)=>void}) {
  const auth=useSession();const site=useSite();const account=accountFor(auth.session!);
  const view=route.view;const selectedVisitorId=view==='visitors'?route.recordId:null;const employeeFocus=view==='employees'?route.recordId:null;
  const [period,setPeriod]=useState<DateRange>({...defaultRange});
  const [telemetry,setTelemetry]=useState<'healthy'|'failed'>('healthy');
  const [viewOnly,setViewOnly]=useState(false);
  const hasTechnicalAccess=auth.can('tuning:write',site.id);
  const technician=hasTechnicalAccess&&!viewOnly;
  const canOperate=auth.can('identity:write',site.id)&&!viewOnly;
  const identity=useIdentity(site.id);
  const settings=useSettings(site.id,hasTechnicalAccess);
  const realtime=useDemoRealtime(`${site.id}:${auth.session!.role}:${JSON.stringify(period)}`,identity.reload);
  const identityMetrics=identity.data?metrics(identity.data,period):null;
  const operationalEvents=identity.data?buildHistory(identity.data,settings.data?.audit??[],site.id):[];
  const identityView=['visitors','employees','ambiguous'].includes(view);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);if(params.has('from')||params.has('to')){const next={from:params.get('from')??'',to:params.get('to')??''};if(validRange(next))setPeriod(next);}
  },[]);
  const [mobile,setMobile] = useState(false);
  const [running,setRunning] = useState(site.pipeline!=='stopped');
  const [overlay,setOverlay] = useState(true);
  const [boxes,setBoxes] = useState(true);
  const [states,setStates] = useState<CameraState[]>(()=>[0,1].map(i=>{const device=readDirectory().devices.find(d=>d.id===site.cameras[i]?.deviceId);return device?.state==='offline'?'offline':device?.state==='stale'?'stale':'active';}));
  const [configs,setConfigs] = useState<GateConfig[]>(initialConfigs);
  const [editing,setEditing] = useState<number|null>(null);
  useEffect(()=>{
    if(editing===null)return;
    const cancelPending=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!document.querySelector('.editor-dialog')){event.preventDefault();setEditing(null);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(`[data-edit-camera="${editing}"]`)?.focus());}};
    window.addEventListener('keydown',cancelPending);return()=>window.removeEventListener('keydown',cancelPending);
  },[editing]);
  const [focused,setFocused] = useState<number|null>(null);
  const [filter,setFilter] = useState('all');
  const [toast,setToast] = useState('');
  const [lastRefresh,setLastRefresh] = useState('10:42:38');
  const [hydrated,setHydrated] = useState(false);
  const [uptime,setUptime]=useState(0);
  useEffect(()=>{if(!running)return;const timer=setInterval(()=>setUptime(n=>n+1),60000);return()=>clearInterval(timer);},[running]);
  useEffect(()=>{if(realtime.blocked){identity.suspend();setEditing(null);setFocused(null);if(route.recordId)onNavigate(view);}else identity.resume();},[realtime.blocked,identity.suspend,identity.resume]);
  const refreshTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  function notify(message: string) { setToast(message); if(toastTimer.current)clearTimeout(toastTimer.current); toastTimer.current=setTimeout(()=>setToast(''),5000); }
  useEffect(()=>{
    function load() { try { setConfigs([readGate(1,site.id),readGate(2,site.id)]); } catch { setToast('Penyimpanan browser tidak dapat dibaca. Konfigurasi awal digunakan.'); } }
    load();setHydrated(true);
    const sync = (e: StorageEvent)=>{if(e.key&&[storageKey(1,site.id),storageKey(2,site.id)].includes(e.key))load();};
    window.addEventListener('storage',sync);
    return ()=>{ window.removeEventListener('storage',sync);if(refreshTimer.current)clearTimeout(refreshTimer.current);if(toastTimer.current)clearTimeout(toastTimer.current); };
  },[]);
  const active = running?states.filter(s=>s==='active').length:0;
  const healthy = running&&active===2;
  const incomplete=!running||states.some(s=>s!=='active')||!['WS_LIVE','POLLING_FALLBACK'].includes(realtime.state);
  const displayCount=(value:number|undefined)=>value===undefined||incomplete&&value===0?'—':String(value);
  const events=operationalEvents.filter(e=>inRange(e.at,period)&&(filter==='all'||e.direction===filter)).map(e=>({...e,time:formatTime(e.at),track:e.trackId??e.id,note:e.description,visitorId:e.identityId?.startsWith('VIS')?e.identityId:null}));
  function applyPeriod(next:DateRange){if(!validRange(next))return;setPeriod({...next});const url=new URL(window.location.href);url.searchParams.set('from',next.from);url.searchParams.set('to',next.to);window.history.replaceState(null,'',url);}
  function navigate(next:View){setMobile(false);onNavigate(next);}
  function openVisitor(id:string|null){setMobile(false);onNavigate('visitors',id);}
  function openEmployee(id:string){setMobile(false);onNavigate('employees',id);}
  function refresh() {
    realtime.reconnect();void identity.reload();
    if(refreshTimer.current)clearTimeout(refreshTimer.current);
    setStates(['connecting','connecting']);
    refreshTimer.current=setTimeout(()=>{setStates(['active','active']);setLastRefresh(new Date().toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta',hour12:false}).replaceAll('.',':'));notify('Preview kamera diperbarui. Data tetap menggunakan fixture demo.');},800);
  }
  async function saveGate(draft: GateConfig) {
    if(!technician)throw new Error('Mode tampilan tidak memiliki akses editor.');
    assertDemoPermission('tuning:write',site.id);
    const index = (editing??1)-1;
    const expected = draft.version;
    const current = readGate(index+1,site.id);
    if(current.version!==expected)throw new Error('Konfigurasi berubah di tab lain. Tutup editor lalu buka kembali untuk memuat versi terbaru.');
    const saved = {...draft,version:expected+1,savedAt:new Date().toISOString()};
    localStorage.setItem(storageKey(index+1,site.id),JSON.stringify(saved));
    const verified = readGate(index+1,site.id);
    setConfigs(c=>c.map((item,i)=>i===index?verified:item));
    notify(`Konfigurasi Camera 0${index+1} tersimpan di browser · versi ${verified.version}`);
  }
  function renderCameraCard(index:number,compact=false) {
    const id = index+1;const state = states[index];
    const live = running&&state==='active';
    const stateLabel = !running?'Dijeda':({active:'Simulasi aktif',offline:'Offline',stale:'Frame stale',connecting:'Menghubungkan…'}[state]);
    return <article className={cn('camera-card',compact&&'compact-camera')}><div className="camera-card-header"><div className="flex items-center gap-3"><div className="camera-icon"><Video size={18}/></div><div><h3>Camera 0{id}<span className={cn('direction',id===1?'direction-in':'direction-out')}>{id===1?<ArrowDownLeft size={12}/>:<ArrowUpRight size={12}/>} {id===1?'IN':'OUT'}</span></h3><p>{id===1?'Outside · Pintu masuk':'Inside · Pintu keluar'}</p></div></div><div className="flex items-center gap-1"><span className={cn('camera-status',!live&&'warning')}><i/>{stateLabel}</span><Button size="icon" variant="ghost" data-focus-camera={id} aria-label={`Perbesar Camera 0${id}`} onClick={()=>setFocused(id)}><Expand size={16}/></Button></div></div>
      <div className="camera-viewport"><CameraScene id={id} config={configs[index]} overlay={overlay} boxes={boxes}/><div className="camera-topline"><span className="demo-tag"><span/>DEMO FEED</span><span className="camera-clock">29 OCT 2026 &nbsp; {lastRefresh} WIB</span></div>{!live&&<div className="camera-cover">{state==='connecting'&&running?<RefreshCw className="animate-spin" size={28}/>:<VideoOff size={30}/>}<strong>{stateLabel}</strong><span>{!running?'Preview dijeda pada browser ini.':state==='offline'?'Koneksi kamera terputus · skenario demo':state==='stale'?'Frame tidak diperbarui · skenario demo':'Menyiapkan ulang preview ilustrasi'}</span>{running&&state!=='connecting'&&<Button size="sm" variant="outline" onClick={()=>setStates(s=>s.map((v,i)=>i===index?'active':v))}><RefreshCw/>Pulihkan preview</Button>}</div>}<span className="scene-credit">ILUSTRASI · BUKAN CCTV NYATA</span></div>
      <div className="camera-footer"><span><span className={cn('tiny-dot',!live&&'bg-amber-400')}/>{live?'8.4':'—'} FPS<span className="divider"/>1280 × 720<span className="divider"/><span className="hidden xl:inline">{modes[configs[index].mode]}</span><span className="xl:hidden">{configs[index].mode}</span></span>{hasTechnicalAccess&&<Button size="sm" variant="ghost" data-edit-camera={id} disabled={!technician||!hydrated} onClick={()=>setEditing(id)}><PencilRuler/>Atur gate</Button>}</div>
    </article>;
  }
  return <div className="app-shell"><a href="#main" className="skip-link">Lewati ke konten utama</a>{mobile&&<button className="mobile-backdrop" aria-label="Tutup navigasi" onClick={()=>setMobile(false)}/>}
    <aside className={cn('sidebar',mobile&&'sidebar-open')}><a className="brand" href="/" aria-label="Visitor AI Beranda"><span className="brand-icon"><ScanLine size={25}/></span><span>visitor<span className="brand-ai">ai</span><small>LOUNGE INTELLIGENCE</small></span></a><button className="mobile-close" aria-label="Tutup menu" onClick={()=>setMobile(false)}><X size={20}/></button>
      <div className="workspace-label">WORKSPACE</div><div className="workspace-card"><span className="workspace-mark"><Layers3 size={18}/></span><div><strong>{site.name}</strong><small>{roleNames[auth.session!.role]}</small></div><ShieldCheck size={15} className="text-muted"/></div>
      <div className="nav-label">OPERASIONAL</div><OperationalNavigation view={view} onNavigate={next=>{setMobile(false);onNavigate(next);}} pending={realtime.blocked?undefined:identityMetrics?.pending}/>
      <div className="sidebar-bottom"><Dialog><DialogTrigger asChild><button className="help-link"><CircleHelp size={18}/>Panduan Phase 1–8<ArrowUpRight size={15}/></button></DialogTrigger><DialogContent className="max-w-lg"><DialogTitle className="text-lg font-semibold">Panduan Phase 1–8</DialogTitle><DialogDescription className="mt-2 text-sm text-muted">Workspace lokal untuk monitoring, direktori identitas, dan konfirmasi manual.</DialogDescription><ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-muted"><li>Gunakan Live Monitoring untuk melihat dua ilustrasi kamera dan overlay track.</li><li>Pilih Atur gate untuk mengubah mode, posisi garis, polygon atau parameter near.</li><li>Simpan konfigurasi agar tetap tersedia setelah halaman dimuat ulang pada browser ini.</li><li>System Health menyediakan skenario aktif, offline, stale dan connecting untuk mencoba tampilan.</li><li>Gunakan Visitor untuk mencari VIS ID dan melihat sesi kunjungan berulang.</li><li>Employee menyediakan enrollment upload/webcam. Ambiguous Queue menyediakan konfirmasi manual dengan catatan keputusan.</li><li>History menampilkan event unik, snapshot dan referensi identitas. Filter tanggal global berlaku pada Monitoring, Visitor dan History.</li><li>Settings/Tuning menyediakan review perubahan dan audit lokal. Coba skenario koneksi di System Health.</li><li>Management menyediakan analytics agregat. Super Admin mengelola site dan akses melalui Provider Workspace.</li><li>Release Readiness pada akun Super Admin menampilkan bukti QA frontend, flag rollback, dan prasyarat go-live. Entertaint dan Protocol masih menunggu definisi kebutuhan.</li><li>Data dan foto demo tersimpan di browser. Role dan izin berasal dari akun demo yang dipilih. View only hanya menurunkan izin tampilan akun aktif.</li></ol><p className="info-box mt-5">Seluruh data adalah demonstrasi lokal. Konfirmasi memperbarui direktori dan ringkasan demo; pengenalan biometrik otomatis belum aktif.</p></DialogContent></Dialog><div className="profile"><div className="avatar">{account.initials}</div><div><strong>{account.name}</strong><small>{roleNames[auth.session!.role]}</small></div><span className="profile-dot"/></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="flex min-w-0 items-center gap-3"><Button className="mobile-menu" size="icon" variant="ghost" aria-label="Buka navigasi" onClick={()=>setMobile(true)}><Menu/></Button><span className="breadcrumb">Workspace<ChevronRight size={13}/><strong>{site.name}</strong></span></div><div className="flex items-center gap-4"><span className="local-indicator"><span/>Local environment</span><span className="topbar-divider"/><ThemeToggle/><Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Lihat pemberitahuan"><Bell size={18}/><span className="notification-dot"/></Button></DialogTrigger><DialogContent className="max-w-md"><DialogTitle className="text-lg font-semibold">Pemberitahuan</DialogTitle><DialogDescription className="mt-2 text-sm text-muted">Informasi workspace lokal.</DialogDescription><div className="mt-5 rounded-xl border p-4"><strong className="text-sm">Phase 4 siap dieksplorasi</strong><p className="mt-2 text-sm leading-6 text-muted">Login demo, workspace berdasarkan role, site scope, dan lifecycle sesi tersedia. Seluruh akses tetap berupa simulasi frontend lokal.</p></div></DialogContent></Dialog><AccountControl/></div></header>
      <main id="main" tabIndex={-1} className="main-content">{realtime.blocked?<AccessState connection={realtime}/>:<><div className={cn("page-intro", view==='monitor'&&"monitor-hero")}><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>OPERATIONS CENTER</div><h1>{viewTitles[view]}<span className="phase-badge">{'Phase 4'}</span></h1><p>{viewDescriptions[view]}</p></div><div className="heading-actions"><Button variant="outline" onClick={()=>view==='settings'?settings.reload():identityView||view==='history'?void identity.reload():refresh()} disabled={!hydrated||((identityView||view==='history')?identity.loading:states.includes('connecting'))}><RefreshCw className={states.includes('connecting')?'animate-spin':''}/><span>Refresh</span></Button>{technician&&auth.can('pipeline:control',site.id)&&['monitor','gates','health'].includes(view)&&<Button onClick={()=>{assertDemoPermission('pipeline:control',site.id);setRunning(v=>!v);notify(running?'Preview dijeda.':'Preview dilanjutkan.');}}>{running?<Pause/>:<Play/>}{running?'Jeda preview':'Lanjutkan'}</Button>}</div></div>
      <div className="context-bar"><div className="site-context"><span className="site-marker"><MapPin size={18}/></span><div><strong>{site.name} <span className="site-id">{site.id}</span></strong><small>Local preview · {site.timezone}{site.timezone==='Asia/Jakarta'?' (WIB)':''}</small></div></div><div className="context-right"><span className="demo-pill"><span/>Mode demonstrasi</span><SiteSwitcher view={view} onChange={onSwitchSite}/><label className="role-select"><ShieldCheck size={14}/><select aria-label="Mode akses demo" disabled={!hydrated||!auth.can('identity:write',site.id)} value={viewOnly||!auth.can('identity:write',site.id)?'viewer':hasTechnicalAccess?'tech':'ops'} onChange={e=>{setViewOnly(e.target.value==='viewer');setEditing(null);}}>{hasTechnicalAccess?<option value="tech">Teknisi (demo)</option>:auth.can('identity:write',site.id)&&<option value="ops">Operasional</option>}<option value="viewer">View only (demo)</option></select></label></div></div>
      {auth.session!.support&&<div className="support-runtime-banner"><ShieldCheck size={15}/><span><strong>Dukungan provider · {site.name}</strong>{auth.session!.support.reason}</span></div>}
      <ConnectionBar connection={realtime} incomplete={incomplete}/>
      <div className="demo-banner"><Info size={16}/><p><strong>Frontend preview.</strong> Kamera dan identitas menggunakan data demo. Enrollment dan konfirmasi hanya disimpan di browser ini.{site.timezone!=='Asia/Jakarta'&&<span> Metadata timezone site: {site.timezone}. Timestamp fixture operasional tetap memakai Asia/Jakarta.</span>}{!['SITE-001','SITE-002','SITE-003'].includes(site.id)&&<span> Site baru belum memiliki histori kunjungan fixture.</span>}</p></div>
      {['monitor','visitors','history'].includes(view)&&<GlobalDateFilter range={period} onChange={applyPeriod}/>}
      {view==='monitor'&&<section className="stats-grid reference-stats" aria-label="Ringkasan monitoring demo">{[
          {label:'System Status',icon:Activity,value:!running?'Idle':healthy?'Running':states.includes('connecting')?'Connecting':'Degraded',type:!running?'status-idle':healthy?'status-running':'status-degraded',note:'Dual-Camera Pipeline Engine',trend:`${active}/2 kamera simulasi aktif`},
          {label:'Total Visitors',icon:Users,value:displayCount(identityMetrics?.unique),type:'visitors',note:'Visitor unik · periode terpilih',trend:'Data identitas demo'},
          {label:'IN Count',icon:ArrowDownToLine,value:displayCount(identityMetrics?.entries),type:'count-in',note:'Camera IN Entry',trend:'Data demonstrasi'},
          {label:'OUT Count',icon:ArrowUpFromLine,value:displayCount(identityMetrics?.exits),type:'count-out',note:'Camera OUT Exit',trend:'Data demonstrasi'},
          {label:'Occupancy (Inside)',icon:UserRoundCheck,value:identityMetrics?String(identityMetrics.inside):'—',type:'occupancy',note:'Visitor dengan sesi terbuka',trend:'Employee tidak termasuk'},
          {label:'FPS / Uptime',icon:Gauge,value:active?'8.4':'0.0',suffix:'fps',type:'performance',note:`Uptime preview: ${uptime} min`,trend:'Simulasi CPU'},
        ].map(s=><article className={cn('stat-card',`metric-${s.type}`)} key={s.label}><div className="stat-top"><span>{s.label}</span><div className="stat-icon"><s.icon size={18} aria-hidden="true"/></div></div><div className="stat-value">{s.type.startsWith('status-')&&<span className="metric-status-dot"/>}{s.value}<small>{s.suffix}</small></div><div className="stat-bottom"><span>{s.note}</span><small>{s.trend}</small></div></article>)}</section>}
      </div>
      {view==='monitor'&&<>
        <section className="camera-section"><div className="section-heading"><div><h2><Video size={19}/>Camera feeds<span className="count-tag">02</span></h2><p>Pantauan visual pintu masuk dan keluar lounge.</p></div><div className="overlay-controls"><label><Switch checked={overlay} onCheckedChange={setOverlay} aria-label="Tampilkan gate overlay"/>Gate overlay</label><label><Switch checked={boxes} onCheckedChange={setBoxes} aria-label="Tampilkan track ID"/>Track ID</label></div></div><div className="cameras-grid">{renderCameraCard(0)}{renderCameraCard(1)}</div><div className="camera-legend"><span><i className="legend-line bg-sky-400"/>Garis A · Awal zona</span><span><i className="legend-line bg-teal-400"/>Garis B · Validasi crossing</span><span><i className="legend-box"/>Person track</span><span className="legend-info"><Info size={12}/>Track ID bersifat sementara per kamera</span></div></section>
        <div className="bottom-grid"><section className="events-panel"><div className="panel-heading"><div><h2>Crossing activity<span className="demo-small">DEMO</span></h2><p>Event demo unik · periode global · tanpa duplikasi reconnect.</p></div><select aria-label="Filter arah crossing" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Semua arah</option><option value="IN">Masuk (IN)</option><option value="OUT">Keluar (OUT)</option><option value="SKIP">Diabaikan</option></select></div><div className="table-scroll"><table><thead><tr><th>WAKTU (WIB)</th><th>TRACK / EVENT</th><th>KAMERA</th><th>ARAH</th><th>HASIL GATE</th></tr></thead><tbody>{events.slice(0,6).map(e=><tr key={e.id}><td className="font-mono">{e.time}</td><td className="track-cell">{e.track}</td><td><Video size={13}/>{e.camera?`Cam 0${e.camera}`:'Sistem'}</td><td><span className={cn('event-direction',(e.direction??'none').toLowerCase())}>{e.direction==='IN'?<ArrowDownLeft size={12}/>:e.direction==='OUT'?<ArrowUpRight size={12}/>:<ArrowRight size={12}/>} {e.direction??'—'}</span></td><td>{e.note}{e.visitorId&&<button className="identity-event-link" onClick={()=>openVisitor(e.visitorId!)}>Detail ↗</button>}</td></tr>)}{!events.length&&<tr><td colSpan={5} className="activity-empty">Tidak ada event pada periode ini. Periksa filter dan kualitas sumber data.</td></tr>}</tbody></table></div><div className="table-footer"><span>{Math.min(events.length,6)} dari {events.length} event · {rangeLabel(period)}</span><button className="identity-event-link" onClick={()=>navigate('history')}>Lihat History →</button></div></section>
        <section className="system-panel"><div className="panel-heading"><h2>System overview</h2><span className={cn('health-dot',!healthy&&'amber-dot')}/></div><div className="system-health"><span className={cn('system-health-icon',!healthy&&'health-warn')}><Activity size={22}/></span><div><strong>{healthy?'Preview berjalan normal':!running?'Preview sedang dijeda':'Preview perlu perhatian'}</strong><small>{active}/2 kamera simulasi aktif</small></div></div><dl className="system-list"><div><dt><Cpu size={15}/>Environment</dt><dd>Local · CPU demo</dd></div><div><dt><Clock3 size={15}/>Pembaruan preview</dt><dd>{lastRefresh} WIB</dd></div><div><dt><ScanLine size={15}/>Gate configuration</dt><dd>Per camera</dd></div><div><dt><Wifi size={15}/>Transport demo</dt><dd>{realtime.label}</dd></div></dl><button className="system-link" onClick={()=>navigate('health')}>Lihat kondisi sistem<ArrowRight size={15}/></button></section></div>
        <div className="phase2-note"><Layers3 size={16}/><span><strong>Identity workspace tersedia</strong> · Visitor, Employee, dan Ambiguous Queue terhubung ke ringkasan demo.</span><button className="planned-tag identity-workspace-link" onClick={()=>navigate('visitors')}>Buka Visitor →</button></div>
      </>}
      {view==='gates'&&<section className="configuration-section"><div className="section-heading"><div><h2><ScanLine size={19}/>Gate workspace</h2><p>Konfigurasi independen untuk dua kamera pada satu pintu.</p></div><span className="count-tag">4 mode gate</span></div><div className="cameras-grid">{[0,1].map(i=><div key={i}>{renderCameraCard(i)}<div className="config-summary"><span><strong>{modes[configs[i].mode]}</strong><small>Versi {configs[i].version} · {configs[i].savedAt?'Tersimpan lokal':'Konfigurasi awal'}</small></span><ShieldCheck size={18}/></div></div>)}</div><div className="mode-explain-grid">{[{name:'Two-line gate',desc:'Dua garis horizontal untuk menentukan awal dan akhir zona crossing.',icon:Layers3},{name:'Partial line',desc:'Batasi area crossing pada segmen horizontal tertentu.',icon:SlidersHorizontal},{name:'Polygon zone',desc:'Bentuk zona bebas dengan minimal tiga titik koordinat.',icon:PencilRuler},{name:'Near mode',desc:'Atur threshold tinggi bbox, dwell, hysteresis dan guard tepi.',icon:Focus}].map(m=><article className="mode-card" key={m.name}><m.icon size={21}/><h3>{m.name}</h3><p>{m.desc}</p></article>)}</div>{!technician&&<div className="info-box mt-5"><ShieldCheck size={18}/>Mode View only aktif. Pilih Teknisi (demo) untuk mencoba editor.</div>}</section>}
      {view==='health'&&<section><RealtimeControls connection={realtime} telemetry={telemetry} onTelemetry={setTelemetry}/><div className="section-heading"><div><h2><Activity size={19}/>Camera health</h2><p>Uji kondisi tampilan tanpa mengubah data nyata.</p></div><span className="demo-pill">Skenario demo</span></div><div className="health-grid">{[0,1].map(i=><article className="health-card" key={i}><div className="flex items-center gap-3"><div className="camera-icon"><Video size={20}/></div><div><h3>Camera 0{i+1}</h3><p>{i===0?'OUTSIDE → IN':'INSIDE → OUT'}</p></div></div><label className="field-label mt-6" htmlFor={`scenario-${i}`}>Kondisi preview</label><select id={`scenario-${i}`} disabled={!hasTechnicalAccess} value={states[i]} onChange={e=>setStates(s=>s.map((v,n)=>i===n?e.target.value as CameraState:v))}><option value="active">Aktif</option><option value="offline">Offline</option><option value="stale">Frame stale</option><option value="connecting">Connecting</option></select><dl className="system-list mt-3"><div><dt>FPS simulasi</dt><dd>{running&&states[i]==='active'?'8.4 FPS':'—'}</dd></div><div><dt>Resolusi ilustrasi</dt><dd>16:9</dd></div><div><dt>Gate mode</dt><dd>{modes[configs[i].mode]}</dd></div><div><dt>Preview</dt><dd>{running?'Berjalan':'Dijeda'}</dd></div></dl><Button className="mt-4 w-full" variant="outline" onClick={()=>navigate('monitor')}><Monitor/>Lihat di monitoring</Button></article>)}</div><div className="info-box mt-6"><Info size={18}/><p>Target tampilan PoC: ≥6 FPS. Angka pada workspace ini adalah fixture, bukan pengukuran performa AI. Kondisi offline atau stale ditampilkan sebagai gangguan dan tidak dianggap traffic nol.</p></div><div className="unavailable-metrics"><h3>Identity metrics · demo</h3><div><span>Unique visitors<strong>{identityMetrics?.unique??'—'}</strong><small>Demo · 29 Oktober 2026</small></span><span>Occupancy<strong>{identityMetrics?.inside??'—'}</strong><small>Demo · sesi terbuka</small></span><span>Identity match rate<strong>—</strong><small>Tidak diukur pada demo</small></span></div></div></section>}
      {identityView&&<IdentityBoundary controller={identity}>{identity.data&&(view==='visitors'?<VisitorPage data={identity.data} selectedId={selectedVisitorId} onSelect={openVisitor} range={period} onRange={applyPeriod}/>:view==='employees'?<EmployeePage data={identity.data} controller={identity} canEdit={canOperate} notify={notify} focusId={employeeFocus}/>:<AmbiguousPage data={identity.data} controller={identity} canEdit={canOperate} notify={notify} onVisitor={openVisitor}/>)}</IdentityBoundary>}
      {view==='history'&&<IdentityBoundary controller={identity}>{identity.data&&<HistoryPage events={operationalEvents} data={identity.data} range={period} incomplete={incomplete||!!settings.error} onVisitor={id=>openVisitor(id)} onEmployee={openEmployee}/>}</IdentityBoundary>}
      {view==='settings'&&<SettingsPage controller={settings} canEdit={technician} notify={notify} onGate={()=>navigate('gates')}/>}
      </>}
      <footer className="page-footer"><span>Visitor AI <span>Enterprise</span><i/>Phase 04 · Access & Site Context</span><span><ShieldCheck size={13}/>Local workspace</span></footer>
      </main>
    </div>
    {editing!==null&&technician&&!realtime.blocked&&<GateEditor key={editing} camera={editing} config={configs[editing-1]} onClose={()=>setEditing(null)} onSave={saveGate}/>}
    <Dialog open={focused!==null&&!realtime.blocked} onOpenChange={open=>{if(!open)setFocused(null);}}><DialogContent className="max-w-5xl"><DialogTitle className="mb-1 text-lg font-semibold">Camera 0{focused} · {focused===1?'Outside / IN':'Inside / OUT'}</DialogTitle><DialogDescription className="mb-4 text-sm text-muted">Tampilan ilustrasi diperbesar · Mode demonstrasi</DialogDescription>{focused!==null&&renderCameraCard(focused-1,true)}</DialogContent></Dialog>
    {toast&&<div className="toast" role="status"><Check size={17}/><span>{toast}</span><button aria-label="Tutup pemberitahuan" onClick={()=>setToast('')}><X size={15}/></button></div>}
  </div>;
}
