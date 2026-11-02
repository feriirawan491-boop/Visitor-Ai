'use client';
import { useEffect, useState } from 'react';
import { CalendarDays, Check, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { defaultRange, rangeLabel, validRange, type DateRange } from '@/lib/date-range';
export function GlobalDateFilter({range,onChange}:{range:DateRange;onChange:(range:DateRange)=>void}){
  const [draft,setDraft]=useState(range);const [error,setError]=useState('');
  useEffect(()=>{setDraft(range);setError('');},[range.from,range.to]);
  const presets=[{label:'Hari ini',from:'2026-10-29',to:'2026-10-29'},{label:'Kemarin',from:'2026-10-28',to:'2026-10-28'},{label:'7 hari terakhir',from:'2026-10-23',to:'2026-10-29'},{label:'Semua data',from:'',to:''}];
  function apply(next:DateRange){if(!validRange(next)){setError('Rentang tanggal tidak valid. Tanggal awal tidak boleh melewati tanggal akhir.');return;}setError('');onChange({...next});}
  return <section className="global-filter" aria-label="Global date range filter"><div className="global-filter-intro"><span><CalendarDays size={19}/></span><div><h2>Global Date Range Filter</h2><p>Monitoring, Visitor & History · WIB · tanggal contoh 29 Okt 2026</p></div></div><div className="global-filter-controls"><div className="date-presets">{presets.map(p=><button key={p.label} aria-pressed={range.from===p.from&&range.to===p.to} onClick={()=>{setDraft({from:p.from,to:p.to});apply({from:p.from,to:p.to});}}>{p.label}</button>)}</div><div className="global-custom-dates"><label><span className="sr-only">Tanggal awal global</span><input type="date" aria-label="Tanggal awal global" value={draft.from} onChange={e=>setDraft(d=>({...d,from:e.target.value}))}/></label><span>sampai</span><label><span className="sr-only">Tanggal akhir global</span><input type="date" aria-label="Tanggal akhir global" value={draft.to} onChange={e=>setDraft(d=>({...d,to:e.target.value}))}/></label><Button size="sm" onClick={()=>apply(draft)}><Check/>Terapkan</Button><Button variant="outline" size="sm" onClick={()=>{setDraft({...defaultRange});apply(defaultRange);}}><RotateCcw/>Reset</Button></div></div>{error&&<p className="global-filter-error" role="alert">{error}</p>}<div className="global-filter-scope">Periode aktif: <strong>{rangeLabel(range)}</strong><span>Occupancy menampilkan kondisi terkini. Employee & antrean tetap memakai data operasional aktif.</span></div></section>;
}
