import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { updateEvidence } from './evidence.mjs';
const npm=process.platform==='win32'?'npm.cmd':'npm';const started=Date.now();let total=0;
const base={...process.env,VISITOR_BUILD_DIR:'.next-flags',NEXT_PUBLIC_APP_MODE:'demo',NEXT_PUBLIC_DATA_SOURCE:'demo',NEXT_PUBLIC_PHASE5_ANALYTICS_ENABLED:'false',NEXT_PUBLIC_PHASE6_PROVIDER_ENABLED:'false',NEXT_PUBLIC_PHASE7_DEFINITIONS_ENABLED:'false'};
let server;
function stop(){if(server){try{if(process.platform!=='win32')process.kill(-server.pid,'SIGTERM');else server.kill();}catch{/* Already stopped. */}server=null;}}
process.on('SIGINT',()=>{stop();process.exit(130);});process.on('SIGTERM',()=>{stop();process.exit(143);});
try{
  for(const profile of ['features-off','access-off']){
    const env={...base,NEXT_PUBLIC_PHASE4_ACCESS_ENABLED:profile==='access-off'?'false':'true',VISITOR_FLAG_PROFILE:profile,VISITOR_FLAG_REPORT:`artifacts/${profile}.json`};
    const build=spawnSync(npm,['run','build'],{stdio:'inherit',env});if(build.status!==0)throw new Error('Rollback profile build failed.');
    server=spawn(npm,['exec','--','next','start','--hostname','127.0.0.1','--port','3110'],{stdio:'ignore',detached:process.platform!=='win32',env});
    let ready=false;for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:3110');if(r.ok){ready=true;break;}}catch{/* Starting. */}await new Promise(r=>setTimeout(r,250));}if(!ready)throw new Error('Rollback preview unavailable.');
    const result=spawnSync(npm,['run','test:e2e','--','--config=playwright.flags.config.ts'],{stdio:'inherit',env});if(result.status!==0)throw new Error('Rollback browser verification failed.');
    const stats=JSON.parse(readFileSync(env.VISITOR_FLAG_REPORT,'utf8')).stats;if(stats.unexpected||stats.flaky||stats.skipped)throw new Error('Rollback verification incomplete.');total+=stats.expected;stop();await new Promise(r=>setTimeout(r,400));
  }
  updateEvidence('flags',{status:'passed',durationMs:Date.now()-started,passed:total});
}catch{updateEvidence('flags',{status:'failed',durationMs:Date.now()-started});process.exitCode=1;}finally{stop();}
