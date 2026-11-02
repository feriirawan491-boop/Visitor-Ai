import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { updateEvidence } from './evidence.mjs';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const mode = process.argv[2] ?? 'code';
function run(name, command, args, env = process.env) {
  const start = Date.now(); const result = spawnSync(command, args, { stdio: 'inherit', env });
  let bundle; if(name==='build'){try{bundle=JSON.parse(readFileSync('public/release-evidence.json','utf8')).checks.build.bundle;}catch{/* Missing evidence stays missing. */}}
  updateEvidence(name, { status: result.status === 0 ? 'passed' : 'failed', durationMs: Date.now() - start,...(bundle?{bundle}:{}) });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
for (const [name, args] of [['lint', ['run', 'lint']], ['typecheck', ['run', 'typecheck']]]) run(name, npm, args);
run('unit', process.execPath, ['--test', ...readdirSync('tests/unit').filter(n => n.endsWith('.test.mjs')).map(n => `tests/unit/${n}`)]);
if (mode === 'code') process.exit(0);
run('build', npm, ['run', 'build']);
const server = spawn(npm, ['exec', '--', 'next', 'start', '--hostname', '127.0.0.1', '--port', '3100'], { stdio: 'ignore', detached: process.platform !== 'win32' });
function stop() { try { if (process.platform !== 'win32') process.kill(-server.pid, 'SIGTERM'); else server.kill('SIGTERM'); } catch { /* Already stopped. */ } }
process.on('SIGINT', () => { stop(); process.exit(130); });process.on('SIGTERM', () => { stop(); process.exit(143); });
try {
  let ready = false;
  for (let i = 0; i < 100; i++) { if (server.exitCode !== null) break; try { const response = await fetch('http://127.0.0.1:3100'); if (response.ok) { ready = true; break; } } catch { /* Starting. */ } await new Promise(resolve => setTimeout(resolve, 250)); }
  if (!ready) throw new Error('QA preview server belum siap.');
  mkdirSync('artifacts', { recursive: true });
  const start = Date.now();
  const result = spawnSync(npm, ['run', 'test:e2e', '--', '--workers=2'], { stdio: 'inherit', env: { ...process.env, VISITOR_E2E_BASE_URL: 'http://127.0.0.1:3100', VISITOR_QA_REPORT: 'artifacts/playwright-results.json' } });
  let counts = {};
  try { const stats = JSON.parse(readFileSync('artifacts/playwright-results.json', 'utf8')).stats; counts = { passed: stats.expected, failed: stats.unexpected, skipped: stats.skipped, flaky: stats.flaky }; } catch { /* Incomplete report is never a pass. */ }
  updateEvidence('e2e', { status: result.status === 0 && counts.failed === 0 && counts.skipped === 0 && counts.flaky === 0 ? 'passed' : 'failed', durationMs: Date.now() - start, ...counts });
  if (result.status !== 0 || counts.failed !== 0 || counts.skipped !== 0 || counts.flaky !== 0) process.exitCode = 1;
} finally { stop(); }
