export const evidenceChecks=['lint','typecheck','unit','build','e2e','flags'];
const number=value=>Number.isFinite(value)&&value>=0?value:null;
const date=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))?new Date(value).toISOString():null;
/** Whitelist public QA metadata. Never forwards paths, errors, test payloads or arbitrary fields. */
export function publicEvidence(input, source, profile){
  if(!input||input.schema!==1||typeof input.source!=='string'||!/^[a-f0-9]{64}$/.test(input.source)||!date(input.generatedAt)||!input.checks||typeof input.checks!=='object')return {state:'unavailable',source:null,generatedAt:null,checks:[]};
  const current=input.source===source&&input.profile===profile;
  const checks=evidenceChecks.map(name=>{const row=input.checks[name]??{};let status=['passed','failed','not-run'].includes(row.status)?row.status:'not-run';
    if(name==='e2e'&&status==='passed'&&(number(row.failed)!==0||number(row.skipped)!==0||number(row.flaky)!==0||number(row.passed)===null))status='failed';
    const bundle=name==='build'&&row.bundle?{chunks:number(row.bundle.chunks),gzipBytes:number(row.bundle.gzipBytes),largestGzipBytes:number(row.bundle.largestGzipBytes),totalBudget:number(row.bundle.totalBudget),chunkBudget:number(row.bundle.chunkBudget)}:null;
    return {name,status:current?status:'stale',at:date(row.at),durationMs:number(row.durationMs),passed:number(row.passed),failed:number(row.failed),skipped:number(row.skipped),flaky:number(row.flaky),bundle};
  });
  return {state:current?'current':'stale',source:typeof input.source==='string'&&/^[a-f0-9]{64}$/.test(input.source)?input.source:null,generatedAt:date(input.generatedAt),checks};
}
