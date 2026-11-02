'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Check, ImagePlus, Plus, RotateCcw, ShieldCheck, Upload, UserRoundCheck, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { formatDate, formatTime, type EnrollmentInput, type IdentityState } from '@/lib/identity';
import type { IdentityController } from '@/lib/use-identity';
import { EmptyState, IdentityBadge, Pagination, Portrait, ReadOnlyNote, SearchInput, SummaryCards } from './shared';

export function EmployeePage({data,controller,canEdit,notify,focusId}:{data:IdentityState;controller:IdentityController;canEdit:boolean;notify:(message:string)=>void;focusId?:string|null}) {
  const [query,setQuery]=useState('');const [department,setDepartment]=useState('all');const [page,setPage]=useState(1);const [enrolling,setEnrolling]=useState(false);
  useEffect(()=>{if(focusId)setQuery(focusId);},[focusId]);
  useEffect(()=>{setPage(1);},[query,department]);
  useEffect(()=>{if(!canEdit)setEnrolling(false);},[canEdit]);
  const departments=Array.from(new Set(data.employees.map(e=>e.department))).sort();
  const list=data.employees.filter(e=>`${e.id} ${e.name} ${e.department}`.toLowerCase().includes(query.trim().toLowerCase())&&(department==='all'||e.department===department));
  const size=6,pages=Math.max(1,Math.ceil(list.length/size)),current=Math.min(page,pages);
  return <div className="identity-page">{!canEdit&&<ReadOnlyNote/>}<SummaryCards items={[
    {label:'Employee terdaftar',value:data.employees.length,note:'EMP ID terpisah dari visitor',icon:Users},
    {label:'Departemen',value:departments.length,note:'Tim operasional lounge',icon:UserRoundCheck,type:'violet'},
    {label:'Visitor count impact',value:'0',note:'Employee dikecualikan dari visitor',icon:ShieldCheck,type:'teal'},
  ]}/><section className="identity-panel"><div className="identity-panel-title"><div><h2>Employee directory <span className="count-tag">{data.employees.length}</span></h2><p>Kelola identitas tim, pisahkan dari traffic pengunjung.</p></div><Button data-enroll-employee disabled={!canEdit||controller.busy} onClick={()=>setEnrolling(true)}><Plus/>Enroll employee</Button></div><div className="identity-toolbar"><SearchInput label="Cari employee" placeholder="Cari nama atau EMP ID…" value={query} onChange={setQuery}/><select aria-label="Departemen employee" value={department} onChange={e=>setDepartment(e.target.value)}><option value="all">Semua departemen</option>{departments.map(d=><option key={d}>{d}</option>)}</select><Button size="sm" variant="ghost" onClick={()=>{setQuery('');setDepartment('all');}}><RotateCcw/>Reset</Button></div>{list.length?<><div className="identity-table-scroll"><table className="identity-table"><thead><tr><th>EMPLOYEE</th><th>DEPARTEMEN</th><th>JABATAN</th><th>TERAKHIR TERLIHAT</th><th>ENROLLMENT</th></tr></thead><tbody>{list.slice((current-1)*size,current*size).map((e,i)=><tr key={e.id}><td><div className="identity-person"><Portrait color={['violet','blue','teal','amber'][i%4]} photo={e.photo} label={`Foto ${e.name}`}/><span><strong>{e.name}</strong><small>{e.id}</small></span></div></td><td>{e.department}</td><td>{e.role}</td><td><strong>{formatTime(e.lastSeen)}</strong><small>{e.lastSeen?formatDate(e.lastSeen):'Belum teramati'}</small></td><td><IdentityBadge tone="violet">Terdaftar · demo</IdentityBadge><small className="enrollment-source">{e.source==='fixture'?'Data contoh':e.source==='camera'?'Capture kamera':'Upload foto'}</small></td></tr>)}</tbody></table></div><Pagination page={current} pages={pages} total={list.length} size={size} onPage={setPage}/></>:<EmptyState title="Employee tidak ditemukan" description="Coba kata pencarian atau departemen lain."/>}</section><div className="identity-footnote"><ShieldCheck size={14}/>Enrollment ini menyimpan data demo di browser. Pengenalan employee otomatis dan ekstraksi body/face anchor belum aktif.</div>
    {enrolling&&canEdit&&<EnrollmentDialog busy={controller.busy} onClose={()=>setEnrolling(false)} onSubmit={async input=>{if(!canEdit)throw new Error('Mode View only tidak dapat enroll employee.');await controller.enroll(input);setEnrolling(false);notify('Employee berhasil ditambahkan ke direktori demo. Visitor count tidak berubah.');}}/>}
  </div>;
}

async function readPhoto(file:File):Promise<string> {
  if(file.size>5*1024*1024)throw new Error('Ukuran foto maksimal 5 MB.');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Gunakan foto JPEG, PNG, atau WebP.');
  const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
  const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const png=[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
  const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  if(!(file.type==='image/jpeg'&&jpeg||file.type==='image/png'&&png||file.type==='image/webp'&&webp))throw new Error('Isi file tidak sesuai format gambar. Pilih foto yang valid.');
  let image:ImageBitmap;
  try{image=await createImageBitmap(file);}catch{throw new Error('Foto tidak dapat dibaca. Pilih file gambar lain.');}
  try{
    const scale=Math.min(1,480/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
    const context=canvas.getContext('2d');if(!context)throw new Error('Preview gambar tidak tersedia pada browser ini.');
    context.drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.82);
  }finally{image.close();}
}

function EnrollmentDialog({onClose,onSubmit,busy}:{onClose:()=>void;onSubmit:(input:EnrollmentInput)=>Promise<void>;busy:boolean}) {
  const [source,setSource]=useState<'upload'|'camera'>('upload');const [photo,setPhoto]=useState<string|null>(null);const [name,setName]=useState('');const [department,setDepartment]=useState('');const [role,setRole]=useState('');const [error,setError]=useState<string|null>(null);const [reading,setReading]=useState(false);const [review,setReview]=useState(false);const [cameraState,setCameraState]=useState<'off'|'connecting'|'active'|'failed'>('off');
  const video=useRef<HTMLVideoElement>(null);const stream=useRef<MediaStream|null>(null);const mounted=useRef(true);const generation=useRef(0);const file=useRef<HTMLInputElement>(null);
  function stopCamera(){generation.current+=1;stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;if(video.current)video.current.srcObject=null;}
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;stopCamera();};},[]);
  async function startCamera(){
    stopCamera();setError(null);setPhoto(null);setCameraState('connecting');const request=generation.current;
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Webcam tidak tersedia pada browser ini. Gunakan upload foto.');
      const media=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},facingMode:'user'},audio:false});
      if(!mounted.current||request!==generation.current){media.getTracks().forEach(t=>t.stop());return;}
      stream.current=media;if(video.current){video.current.srcObject=media;await video.current.play();}if(mounted.current&&request===generation.current)setCameraState('active');
    }catch(e){if(mounted.current&&request===generation.current){stopCamera();setCameraState('failed');setError(e instanceof DOMException&&e.name==='NotAllowedError'?'Akses kamera ditolak. Izinkan kamera di browser atau gunakan upload foto.':e instanceof Error?e.message:'Webcam tidak dapat diakses.');}}
  }
  function capture(){
    if(!video.current?.videoWidth){setError('Frame kamera belum siap. Coba beberapa saat lagi.');return;}
    const canvas=document.createElement('canvas');canvas.width=480;canvas.height=Math.round(480*video.current.videoHeight/video.current.videoWidth);const ctx=canvas.getContext('2d');if(!ctx){setError('Capture tidak tersedia.');return;}ctx.drawImage(video.current,0,0,canvas.width,canvas.height);setPhoto(canvas.toDataURL('image/jpeg',.82));stopCamera();setCameraState('off');
  }
  function changeSource(next:'upload'|'camera'){stopCamera();setSource(next);setPhoto(null);setCameraState('off');setError(null);generation.current+=1;}
  async function upload(selected:File|undefined){if(!selected)return;const request=++generation.current;setError(null);setReading(true);setPhoto(null);try{const image=await readPhoto(selected);if(mounted.current&&request===generation.current)setPhoto(image);}catch(e){if(mounted.current&&request===generation.current)setError(e instanceof Error?e.message:'Foto gagal dibaca.');}finally{if(mounted.current)setReading(false);}}
  async function submit(e:React.FormEvent){
    e.preventDefault();if(busy||reading)return;
    if(!name.trim()||!department.trim()||!role.trim()){setError('Nama, departemen, dan jabatan wajib diisi.');return;}
    if(!photo){setError('Upload atau capture foto sebelum melanjutkan.');return;}
    setError(null);if(!review){stopCamera();setReview(true);return;}
    try{await onSubmit({name,department,role,photo,source});}catch(e){setError(e instanceof Error?e.message:'Enrollment belum dapat disimpan.');}
  }
  return <Dialog open onOpenChange={open=>{if(!open&&!busy)onClose();}}><DialogContent className="enrollment-dialog" onPointerDownOutside={e=>e.preventDefault()} onEscapeKeyDown={e=>{if(busy)e.preventDefault();}} onCloseAutoFocus={e=>{e.preventDefault();document.querySelector<HTMLButtonElement>('[data-enroll-employee]')?.focus();}}><DialogTitle className="text-xl font-semibold">{review?'Tinjau enrollment':'Enroll employee'}</DialogTitle><DialogDescription className="mt-1 text-sm text-muted">{review?'Pastikan foto dan data employee sudah sesuai.':'Tambahkan anggota tim dengan foto upload atau capture webcam.'}</DialogDescription><form noValidate onSubmit={submit}><div className="enrollment-layout"><section><div className="enrollment-preview">{photo?<img src={photo} alt="Preview foto enrollment"/>:<><video ref={video} className={cameraState==='active'?'webcam-visible':'webcam-hidden'} autoPlay muted playsInline aria-label="Preview webcam"/>{cameraState!=='active'&&<div className="photo-placeholder">{source==='upload'?<ImagePlus size={32}/>:<CameraOff size={32}/>}<strong>{reading?'Membaca foto…':cameraState==='connecting'?'Menghubungkan kamera…':'Foto employee'}</strong><span>Preview foto sebelum disimpan</span></div>}</>}</div>{!review&&<><div className="enrollment-source-tabs"><button type="button" className={source==='upload'?'selected':''} disabled={reading} onClick={()=>changeSource('upload')}><Upload size={15}/>Upload foto</button><button type="button" className={source==='camera'?'selected':''} disabled={reading} onClick={()=>changeSource('camera')}><Camera size={15}/>Webcam</button></div>{source==='upload'?<><input ref={file} type="file" className="sr-only" aria-label="Upload foto employee" accept="image/jpeg,image/png,image/webp" onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/><Button className="w-full" type="button" variant="outline" disabled={reading} onClick={()=>file.current?.click()}><Upload/>{photo?'Ganti foto':'Pilih foto'}</Button><p className="photo-help">JPEG, PNG, WebP · maksimal 5 MB</p></>:<div className="webcam-actions">{cameraState==='active'?<Button type="button" onClick={capture}><Camera/>Ambil foto</Button>:<Button type="button" variant="outline" disabled={cameraState==='connecting'} onClick={()=>void startCamera()}><Camera/>{photo?'Ambil ulang':'Aktifkan webcam'}</Button>}</div>}</>}</section><section className="enrollment-fields">{review?<dl className="enrollment-review"><div><dt>Nama employee</dt><dd>{name}</dd></div><div><dt>Departemen</dt><dd>{department}</dd></div><div><dt>Jabatan</dt><dd>{role}</dd></div><div><dt>Sumber foto</dt><dd>{source==='camera'?'Webcam':'Upload foto'}</dd></div><div><dt>EMP ID</dt><dd>Dibuat saat disimpan</dd></div></dl>:<><label>Nama employee<input autoFocus maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="Contoh: Maya Putri" required/></label><label>Departemen<input maxLength={100} value={department} onChange={e=>setDepartment(e.target.value)} placeholder="Contoh: Guest Relations" required/></label><label>Jabatan<input maxLength={100} value={role} onChange={e=>setRole(e.target.value)} placeholder="Contoh: Lounge Host" required/></label></>}<div className="info-box"><ShieldCheck size={16}/><p>Foto dan profil disimpan hanya di browser ini untuk demo. Enrollment tidak menambahkan visitor atau mengubah occupancy.</p></div></section></div>{error&&<p className="identity-validation" role="alert">{error}</p>}<div className="identity-dialog-footer"><Button type="button" variant="ghost" disabled={busy} onClick={()=>review?setReview(false):onClose()}>{review?'Kembali':'Batal'}</Button><Button type="submit" disabled={busy||reading}>{review?<Check/>:<ArrowIcon/>}{busy?'Menyimpan…':review?'Konfirmasi enrollment':'Tinjau enrollment'}</Button></div></form></DialogContent></Dialog>;
}
function ArrowIcon(){return <UserRoundCheck size={16}/>;}
