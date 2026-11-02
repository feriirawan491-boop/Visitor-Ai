export type DateRange = { from: string; to: string };
export const defaultRange: DateRange = {from:'2026-10-29',to:'2026-10-29'};
export function siteDay(value:string):string {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
  const get=(type:string)=>parts.find(p=>p.type===type)?.value??'';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validRange(range:DateRange){
  const valid=(date:string)=>!date||/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;
  return valid(range.from)&&valid(range.to)&&(!range.from||!range.to||range.from<=range.to);
}
export function inRange(value:string|null,range:DateRange){if(!value)return false;const day=siteDay(value);return (!range.from||day>=range.from)&&(!range.to||day<=range.to);}
export function rangeLabel(range:DateRange){return !range.from&&!range.to?'Semua tanggal':`${range.from||'Awal data'} → ${range.to||'Terbaru'} · WIB`;}
