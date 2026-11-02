'use client';
import { CameraOff, ChevronLeft, ChevronRight, CircleAlert, FileQuestion, RefreshCw, Search, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import type { IdentityController } from '@/lib/use-identity';

export function Portrait({ color='blue', media='available', photo, large=false, label='Snapshot ilustrasi' }: {color?:string;media?:'available'|'missing'|'expired';photo?:string|null;large?:boolean;label?:string}) {
  return <div className={cn('identity-portrait',`portrait-${color}`,large&&'portrait-large')}>
    {media!=='available'?<><CameraOff size={large?30:18}/>{large&&<span>{media==='expired'?'Snapshot kedaluwarsa':'Snapshot tidak tersedia'}</span>}</>:photo?<img src={photo} alt={label}/>:<svg viewBox="0 0 100 110" role="img" aria-label={label}><circle cx="50" cy="36" r="18" fill="currentColor" opacity=".58"/><path d="M16 110V92a34 34 0 0 1 68 0v18Z" fill="currentColor" opacity=".45"/><path d="M31 33c-1-28 39-28 38 0-10-2-24-9-29-9l-9 9" fill="currentColor" opacity=".28"/><path d="M39 59 50 75 61 59" stroke="white" strokeOpacity=".4" strokeWidth="4" fill="none"/></svg>}
    {large&&media==='available'&&!photo&&<span className="portrait-caption">ILUSTRASI DEMO</span>}
  </div>;
}
export function IdentityBadge({children,tone='blue'}:{children:React.ReactNode;tone?:'blue'|'green'|'amber'|'gray'|'violet'}) {return <span className={`identity-badge badge-${tone}`}><i/>{children}</span>;}
export function SearchInput({value,onChange,label,placeholder}:{value:string;onChange:(value:string)=>void;label:string;placeholder:string}) {return <label className="identity-search"><Search size={16}/><input aria-label={label} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} autoComplete="off"/>{value&&<button aria-label={`Hapus ${label.toLowerCase()}`} onClick={()=>onChange('')}>×</button>}</label>;}
export function EmptyState({title,description,action}:{title:string;description:string;action?:React.ReactNode}) {return <div className="identity-empty"><span><FileQuestion size={25}/></span><h3>{title}</h3><p>{description}</p>{action}</div>;}
export function IdentityBoundary({controller,children}:{controller:IdentityController;children:React.ReactNode}) {
  if(controller.loading&&!controller.data)return <div className="identity-loading" role="status" aria-label="Memuat data identitas"><div className="identity-skeleton-bar"/><div className="identity-skeleton-cards">{[1,2,3].map(i=><div key={i}/>)}</div><p>Memuat workspace identitas…</p></div>;
  if(controller.error||!controller.data)return <div className="identity-error" role="alert"><CircleAlert size={28}/><h3>Data identitas belum dapat dimuat</h3><p>{controller.error??'Coba muat ulang workspace.'}</p><Button onClick={()=>void controller.reload()} variant="outline"><RefreshCw/>Coba lagi</Button></div>;
  return <>{children}</>;
}
export function ReadOnlyNote(){return <div className="identity-readonly"><ShieldCheck size={15}/><span>Mode View only · Anda dapat meninjau data. Enrollment dan konfirmasi identitas dinonaktifkan.</span></div>;}
export function Pagination({page,pages,total,size,onPage}:{page:number;pages:number;total:number;size:number;onPage:(page:number)=>void}) {return <div className="identity-pagination"><span>{total?`${(page-1)*size+1}–${Math.min(page*size,total)}`:'0'} dari {total} data</span><div><Button variant="outline" size="icon" aria-label="Halaman sebelumnya" disabled={page<=1} onClick={()=>onPage(page-1)}><ChevronLeft/></Button><span>Halaman {page} / {pages}</span><Button variant="outline" size="icon" aria-label="Halaman berikutnya" disabled={page>=pages} onClick={()=>onPage(page+1)}><ChevronRight/></Button></div></div>;}
export function SummaryCards({items}:{items:{label:string;value:string|number;note:string;icon:typeof UserRound;type?:string}[]}) {return <div className="identity-summary">{items.map(i=><article key={i.label}><div><span>{i.label}</span><span className={`identity-summary-icon ${i.type??'blue'}`}><i.icon size={19}/></span></div><strong>{i.value}</strong><p>{i.note}</p></article>)}</div>;}
