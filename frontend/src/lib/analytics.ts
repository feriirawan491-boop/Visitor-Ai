// Aggregate-only demo adapter. Never imports identity, camera, employee or operational repositories.
import { accountFor, hasPermission, readDemoSession, getSites } from './access';
import { validRange } from './date-range';
export { managementViews, type ManagementView } from './analytics-routes';
export type AggregateFilter={siteIds:string[];from:string;to:string;granularity:'hour'|'day'};
export type AggregateScenario='normal'|'unavailable'|'zero'|'offline'|'no-completed'|'timezone'|'export-error'|'export-forbidden';
export type TrafficPoint={label:string;entries:number|null;exits:number|null;unique:number|null;partial:boolean};
export type SiteAggregate={siteId:string;name:string;timezone:string;entries:number|null;exits:number|null;unique:number|null;occupancy:number|null;coverage:number;uptime:number;completed:number;open:number;unpaired:number;pending:number;durationCounts:number[];mean:number|null;median:number|null;p90:number|null;series:TrafficPoint[];offlineMinutes:number};
export type AggregateResponse={filters:AggregateFilter;sites:SiteAggregate[];series:TrafficPoint[];entries:number|null;exits:number|null;unique:number|null;occupancy:number|null;coverage:number;completed:number;open:number;unpaired:number;pending:number;durationCounts:number[];mean:number|null;median:number|null;p90:number|null;version:number;updatedAt:string;occupancyAt:string;peak:TrafficPoint|null;incompatibleTimezone:boolean;previous:{entries:number|null;from:string;to:string}};
export const durationBuckets=[{label:'< 15 menit',minutes:8},{label:'15–30 menit',minutes:23},{label:'30–60 menit',minutes:45},{label:'60–120 menit',minutes:90},{label:'≥ 120 menit',minutes:150}];
export const analyticsDefault=(allowed:string[]):AggregateFilter=>({siteIds:[...allowed].sort(),from:'2026-10-29',to:'2026-10-29',granularity:'hour'});
export function validateFilter(filter:AggregateFilter,allowed:string[]){
  if(!filter.siteIds.length)throw new Error('Pilih minimal satu site yang ditugaskan.');
  if(filter.siteIds.some(id=>!allowed.includes(id)))throw new Error('Site berada di luar cakupan akun.');
  if(!filter.from||!filter.to||!validRange(filter))throw new Error('Rentang tanggal tidak valid. Tanggal awal harus sebelum atau sama dengan tanggal akhir.');
  if((Date.parse(filter.to)-Date.parse(filter.from))/86400000>365)throw new Error('Pilih rentang maksimal 366 hari.');
}
export function filterQuery(filter:AggregateFilter){const q=new URLSearchParams({sites:filter.siteIds.join(','),from:filter.from,to:filter.to,grain:filter.granularity});return q.toString();}
export function parseAnalyticsFilter(query:string,allowed:string[]):{filter:AggregateFilter;warning:string}{
  if(!query)return {filter:analyticsDefault(allowed),warning:''};
  const q=new URLSearchParams(query);const siteIds=[...new Set((q.get('sites')??allowed.join(',')).split(',').filter(Boolean))].sort();
  const filter:AggregateFilter={siteIds,from:q.get('from')??'2026-10-29',to:q.get('to')??'2026-10-29',granularity:q.get('grain')==='day'?'day':'hour'};
  try{validateFilter(filter,allowed);return {filter,warning:''};}catch(e){return {filter:analyticsDefault(allowed),warning:`Filter alamat tidak diterapkan: ${(e as Error).message}`};}
}
const sum=(values:(number|null)[])=>values.every(v=>v===null)?null:values.reduce<number>((a,v)=>a+(v??0),0);
function stats(counts:number[]){const n=counts.reduce((a,b)=>a+b,0);if(!n)return {mean:null,median:null,p90:null};const at=(rank:number)=>{let c=0;for(let i=0;i<counts.length;i++){c+=counts[i];if(c>=rank)return durationBuckets[i].minutes;}return null;};return {mean:counts.reduce((a,c,i)=>a+c*durationBuckets[i].minutes,0)/n,median:at(Math.ceil(n*.5)),p90:at(Math.ceil(n*.9))};}
function days(from:string,to:string){const result:string[]=[];for(let t=Date.parse(from);t<=Date.parse(to);t+=86400000)result.push(new Date(t).toISOString().slice(0,10));return result;}
function siteFixture(siteId:string,filter:AggregateFilter,scenario:AggregateScenario,version:number):SiteAggregate{
  const directory=getSites();const site=directory.find(s=>s.id===siteId)!;const index=directory.indexOf(site);const selected=days(filter.from,filter.to);const counts=[0,0,0,0,0];let entries=0,exits=0,completed=0,open=0,unpaired=0,pending=0,knownDays=0,coverageSum=0,offlineMinutes=0;const dailyUnique:number[]=[];const raw:TrafficPoint[]=[];
  for(const day of selected){
    const exists=['SITE-001','SITE-002','SITE-003'].includes(siteId)&&day>='2026-10-20'&&day<='2026-10-29';const zero=scenario==='zero'||day==='2026-10-22';const offline=scenario==='offline'||day==='2026-10-20';const pairExample=day==='2026-10-21';const partial=exists&&!offline&&index===1&&day==='2026-10-29'&&!zero;
    if(exists){knownDays++;coverageSum+=offline?0:partial?98.61:100;offlineMinutes+=offline?1440:partial?20:0;}
    let dailyEntries=0,dailyExits=0;
    for(let h=0;h<24;h++){
      const eligible=exists&&!offline;const base=h<6||h>22?0:Math.round((index===0?12:8)*(1+Math.sin((h-7)/15*Math.PI))+(Number(day.slice(-2))%4)*2);
      const incoming=pairExample?(h===10?2:0):zero?0:base;const outgoing=pairExample?(h===11?3:0):zero?0:Math.max(0,base-(h<12?2:-1));
      const correction=version>1&&day==='2026-10-29'&&h===10&&!zero&&!pairExample?1:0;
      const e=eligible?incoming+correction:null;const x=eligible?outgoing:null;dailyEntries+=e??0;dailyExits+=x??0;
      raw.push({label:`${day} ${String(h).padStart(2,'0')}:00`,entries:e,exits:x,unique:e===null?null:pairExample?(h===10?1:0):Math.round(e*.82),partial:!eligible||partial&&h===12});
    }
    if(exists&&!offline){entries+=dailyEntries;exits+=dailyExits;dailyUnique.push(pairExample?1:Math.round(dailyEntries*.76));
      const c=zero||scenario==='no-completed'?0:pairExample?1:Math.max(0,Math.floor(dailyExits*.92));completed+=c;open+=zero?0:pairExample?1:8+index;unpaired+=zero?0:pairExample?2:3;pending+=zero?0:pairExample?0:4+index;
      const allocations=c===0?[0,0,0,0,0]:pairExample?[0,0,1,0,0]:[Math.floor(c*.1),Math.floor(c*.24),Math.floor(c*.37),Math.floor(c*.22),0];allocations[4]=c-allocations.slice(0,4).reduce((a,b)=>a+b,0);allocations.forEach((n,i)=>counts[i]+=n);
    }
  }
  const observed=raw.some(r=>r.entries!==null);const unique=dailyUnique.length?Math.max(...dailyUnique)+Math.floor((dailyUnique.reduce((a,b)=>a+b,0)-Math.max(...dailyUnique))*.38):null;
  const series=filter.granularity==='hour'?raw:selected.map(day=>{const rows=raw.filter(r=>r.label.startsWith(day));return {label:day,entries:sum(rows.map(r=>r.entries)),exits:sum(rows.map(r=>r.exits)),unique:rows.every(r=>r.unique===null)?null:day==='2026-10-21'?1:Math.round(rows.reduce((n,r)=>n+(r.entries??0),0)*.76),partial:rows.some(r=>r.partial)};});
  // Occupancy is a separate point-in-time fixture, independent of historical filters.
  return {siteId,name:site.name,timezone:scenario==='timezone'&&index===1?'Asia/Makassar':site.timezone,entries:observed?entries:null,exits:observed?exits:null,unique:observed?unique:null,occupancy:scenario==='offline'||!['SITE-001','SITE-002','SITE-003'].includes(siteId)?null:32+index*7,coverage:coverageSum/selected.length,uptime:knownDays?Math.max(0,100-offlineMinutes/(knownDays*1440)*100):0,completed,open,unpaired,pending,durationCounts:counts,...stats(counts),series,offlineMinutes};
}
export function buildAggregate(filter:AggregateFilter,scenario:AggregateScenario='normal',version=1):AggregateResponse{
  const rows=filter.siteIds.map(id=>siteFixture(id,filter,scenario,version));const series=(rows[0]?.series??[]).map((p,i)=>({...p,entries:sum(rows.map(s=>s.series[i].entries)),exits:sum(rows.map(s=>s.series[i].exits)),unique:sum(rows.map(s=>s.series[i].unique)),partial:rows.some(s=>s.series[i].partial)}));
  const counts=durationBuckets.map((_,i)=>rows.reduce((a,s)=>a+s.durationCounts[i],0));
  const n=days(filter.from,filter.to).length;const previousTo=new Date(Date.parse(filter.from)-86400000).toISOString().slice(0,10);const previousFrom=new Date(Date.parse(filter.from)-n*86400000).toISOString().slice(0,10);const previous=rows.map(s=>siteFixture(s.siteId,{...filter,from:previousFrom,to:previousTo},scenario,version));
  const incompatibleTimezone=new Set(rows.map(r=>r.timezone)).size>1;
  return {filters:{...filter,siteIds:[...filter.siteIds]},sites:rows,series:incompatibleTimezone?[]:series,entries:sum(rows.map(r=>r.entries)),exits:sum(rows.map(r=>r.exits)),unique:sum(rows.map(r=>r.unique)),occupancy:sum(rows.map(r=>r.occupancy)),coverage:rows.reduce((a,r)=>a+r.coverage,0)/rows.length,completed:rows.reduce((a,r)=>a+r.completed,0),open:rows.reduce((a,r)=>a+r.open,0),unpaired:rows.reduce((a,r)=>a+r.unpaired,0),pending:rows.reduce((a,r)=>a+r.pending,0),durationCounts:counts,...stats(counts),version,updatedAt:version>1?'2026-10-29T07:10:00Z':'2026-10-29T07:00:00Z',occupancyAt:'2026-10-29T07:00:00Z',peak:incompatibleTimezone?null:series.filter(p=>p.entries!==null).reduce<TrafficPoint|null>((a,p)=>!a||p.entries!>a.entries!?p:a,null),incompatibleTimezone,previous:{entries:sum(previous.map(s=>s.entries)),from:previousFrom,to:previousTo}};
}
function authorize(filter:AggregateFilter){const session=readDemoSession();if(!hasPermission(session,'aggregates:read'))throw new Error('Akses agregat tidak diizinkan.');validateFilter(filter,accountFor(session!).siteIds);}
export async function loadAggregate(filter:AggregateFilter,signal:AbortSignal,scenario:AggregateScenario,version:number):Promise<AggregateResponse>{
  authorize(filter);await new Promise<void>((resolve,reject)=>{const stop=()=>{clearTimeout(timer);reject(new DOMException('Dibatalkan','AbortError'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',stop);resolve();},300);if(signal.aborted)stop();else signal.addEventListener('abort',stop,{once:true});});
  if(signal.aborted)throw new DOMException('Dibatalkan','AbortError');authorize(filter);if(scenario==='unavailable')throw new Error('Sumber agregat demo tidak tersedia. Coba muat ulang atau pilih skenario normal.');return buildAggregate(filter,scenario,version);
}
export const formatCount=(n:number|null)=>n===null?'N/A':new Intl.NumberFormat('id-ID').format(n);
export function csvCell(value:string|number|null){const text=value===null?'N/A':String(value);return `"${(/^[\s]*[=+@-]/.test(text)?"'":'')+text.replaceAll('"','""')}"`;}
export type ReportMetric='summary'|'traffic'|'duration';
export function aggregateCSV(data:AggregateResponse,metric:ReportMetric){
  authorize(data.filters);
  const meta=[['Visitor AI','Aggregate-only local demo'],['Period',data.filters.from,data.filters.to],['Sites',data.filters.siteIds.join(' | ')],['Granularity',data.filters.granularity],['Timezones',data.sites.map(s=>`${s.siteId}: ${s.timezone}`).join(' | ')],['Version',data.version],['Updated at',data.updatedAt],['Occupancy as of',data.occupancyAt],['Unique method','Distinct per-site demo; summed across sites without cross-site dedup'],['Duration method','Completed paired sessions only; representative fixture minutes'],['Coverage','Observed counts only; missing intervals are not zero']];
  const rows:(string|number|null)[][]=metric==='summary'?[['Site','Name','Timezone','IN','OUT','Unique per site','Current occupancy','Coverage %','Uptime %','Completed sessions','Mean minutes','Median minutes','P90 minutes','Pending ambiguous'],...data.sites.map(s=>[s.siteId,s.name,s.timezone,s.entries,s.exits,s.unique,s.occupancy,+s.coverage.toFixed(2),+s.uptime.toFixed(2),s.completed,s.mean===null?null:+s.mean.toFixed(1),s.median,s.p90,s.pending])]:metric==='traffic'?[['Site','Timezone','Bucket local','IN observed','OUT observed','Unique in bucket','Incomplete'],...data.sites.flatMap(s=>s.series.map(p=>[s.siteId,s.timezone,p.label,p.entries,p.exits,p.unique,p.partial?'yes':'no']))]:[['Site','Timezone','Duration bucket','Completed sessions'],...data.sites.flatMap(s=>durationBuckets.map((b,i)=>[s.siteId,s.timezone,b.label,s.durationCounts[i]]))];
  return '\uFEFF'+[...meta,[],...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
}
