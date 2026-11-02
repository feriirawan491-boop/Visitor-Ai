'use client';

import { ArrowRight, Building2, Clock3, ScanLine, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/button';

import { ThemeToggle } from '../theme-toggle';
import { type Permission } from '@/lib/access';
import { AccountControl } from './controls';
import { useSession } from './session';

export function SessionLoading(){return <main className="session-loading" role="status" aria-label="Memeriksa sesi"><span><ScanLine size={28}/></span><h1>Menyiapkan workspace</h1><p>Memeriksa sesi, role, dan penugasan site demo…</p></main>;}
export function AccessScreen({kind,onHome}:{kind:'forbidden'|'not-found'|'no-site'|'site-unavailable'|'expired'|'revoked'|'suspended'|'unavailable';onHome?:()=>void}){
  const auth=useSession();const content={'site-unavailable':{code:'SITE UNAVAILABLE',title:'Operasional site belum tersedia',description:'Site sedang Setup atau Suspended. Akses operasional dan dukungan dihentikan; data historis tetap tersimpan.'},forbidden:{code:'403',title:'Akses tidak diizinkan',description:'Halaman atau site ini berada di luar izin workspace aktif Anda.'},'not-found':{code:'404',title:'Halaman tidak ditemukan',description:'Alamat halaman atau site tidak tersedia pada workspace demo ini.'},'no-site':{code:'NO SITE ASSIGNED',title:'Belum ada penugasan site',description:'Akun Anda aktif, tetapi belum memiliki site untuk ditampilkan.'},expired:{code:'SESSION EXPIRED',title:'Sesi demo telah berakhir',description:'Media, identitas, dan subscription sebelumnya sudah dibersihkan. Masuk kembali untuk melanjutkan.'},revoked:{code:'ACCESS REVOKED',title:'Akses demo telah dicabut',description:'Workspace dan data identitas ditutup untuk sesi ini. Pilih akun demo aktif untuk melanjutkan.'},suspended:{code:'ACCOUNT SUSPENDED',title:'Sesi demo ditangguhkan',description:'Data dan kontrol operasional tidak tersedia selama sesi ini ditangguhkan.'},unavailable:{code:'SESSION UNAVAILABLE',title:'Sesi belum dapat diperiksa',description:auth.error??'Skenario layanan sesi demo tidak tersedia. Masuk kembali untuk mencoba ulang.'}}[kind];
  function login(){auth.logout();window.location.hash='#/login';}
  return <main className="session-state-page"><div className="session-state-utility"><a className="brand" href="#/"><span className="brand-icon"><ScanLine size={23}/></span><span>visitor<span className="brand-ai">ai</span></span></a><div><ThemeToggle/>{auth.session&&<AccountControl/>}</div></div><section className="session-state-card"><span className="session-state-icon">{kind==='no-site'?<Building2 size={31}/>:kind==='expired'?<Clock3 size={31}/>:<ShieldAlert size={31}/>}</span><span className="eyebrow">{content.code}</span><h1>{content.title}</h1><p>{content.description}</p><div>{onHome&&kind!=='no-site'&&<Button onClick={onHome}><ArrowRight/>Kembali ke workspace</Button>}<Button variant={onHome?'outline':'default'} onClick={login}>{auth.session?'Ganti akun demo':'Masuk kembali'}</Button></div><small>Phase 4 · Simulasi sesi dan izin frontend lokal</small></section></main>;
}
export function AuthorizedRoute({permission,siteId,children,onDenied}:{permission:Permission;siteId?:string;children:React.ReactNode;onDenied:()=>void}){
  const auth=useSession();if(!auth.can(permission,siteId))return <AccessScreen kind="forbidden" onHome={onDenied}/>;return children;
}

