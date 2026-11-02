import { existsSync, readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { updateEvidence } from './evidence.mjs';
// Resolve build artifacts relative to this project, including when invoked from another cwd.
process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const directory = process.env.VISITOR_BUILD_DIR ?? '.next';
const chunkDirectory = join(directory, 'static', 'chunks');
if (!existsSync(chunkDirectory)) {
  process.stderr.write('Bundle analysis unavailable: client chunks were not found. Run npm run build first and verify VISITOR_BUILD_DIR. Deployment builds do not require this optional report.\n');
  process.exit(1);
}
const chunks = [];
function visit(path) { for (const name of readdirSync(path)) { const file = join(path, name); if (statSync(file).isDirectory()) visit(file); else if (name.endsWith('.js')) { const data = readFileSync(file); chunks.push({ file: basename(file), bytes: data.length, gzipBytes: gzipSync(data).length }); } } }
visit(chunkDirectory);
if (!chunks.length) {
  process.stderr.write('Bundle analysis failed: no client JavaScript chunks found. An empty report cannot pass the release gate.\n');
  process.exit(1);
}
const report = { chunks: chunks.length, totalBytes: chunks.reduce((a, c) => a + c.bytes, 0), gzipBytes: chunks.reduce((a, c) => a + c.gzipBytes, 0), largestGzipBytes: Math.max(0, ...chunks.map(c => c.gzipBytes)), budget: { totalGzipBytes: 1572864, chunkGzipBytes: 256000 }, scope: 'all-client-js-chunks-not-initial-route', files: chunks.sort((a, b) => b.gzipBytes - a.gzipBytes) };
report.withinBudget = report.gzipBytes <= report.budget.totalGzipBytes && report.largestGzipBytes <= report.budget.chunkGzipBytes;
mkdirSync('artifacts', { recursive: true });writeFileSync(`artifacts/bundle-${directory === '.next' ? 'demo' : 'flags'}.json`, JSON.stringify(report, null, 2));
if (directory === '.next') updateEvidence('build', { status: report.withinBudget ? 'passed' : 'failed', bundle: { chunks: report.chunks, gzipBytes: report.gzipBytes, largestGzipBytes: report.largestGzipBytes, totalBudget: report.budget.totalGzipBytes, chunkBudget: report.budget.chunkGzipBytes, scope: report.scope } });
process.stdout.write(`Bundle: ${report.chunks} chunks, ${report.gzipBytes} bytes gzip total, ${report.largestGzipBytes} bytes gzip largest. Local demo budget: ${report.withinBudget ? 'PASS' : 'FAIL'}.\n`);
if (!report.withinBudget) process.exitCode = 1;
