import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'visitor-bundle-'));
  cpSync(new URL('../../scripts/', import.meta.url), join(root, 'scripts'), { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
function analyze(root, distDir = '.next') {
  return spawnSync(process.execPath, [join(root, 'scripts/bundle-report.mjs')], {
    cwd: tmpdir(), encoding: 'utf8',
    env: { ...process.env, VISITOR_BUILD_DIR: distDir, NEXT_PUBLIC_APP_MODE: 'demo', NEXT_PUBLIC_DATA_SOURCE: 'demo' },
  });
}

test('bundle analysis finds project-relative nested chunks when invoked from another directory', t => {
  const root = fixture(t);
  const chunks = join(root, '.next/static/chunks');
  mkdirSync(join(chunks, 'nested'), { recursive: true });
  writeFileSync(join(chunks, 'app.js'), 'console.log("app");');
  writeFileSync(join(chunks, 'nested/chart.js'), 'console.log("chart");');
  writeFileSync(join(chunks, 'app.js.map'), '{}');
  const result = analyze(root);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(readFileSync(join(root, 'artifacts/bundle-demo.json'), 'utf8'));
  assert.equal(report.chunks, 2);
  assert.equal(report.withinBudget, true);
  assert.ok(report.gzipBytes > 0);
  assert.equal(JSON.parse(readFileSync(join(root, 'public/release-evidence.json'), 'utf8')).checks.build.status, 'passed');
});

test('missing or empty chunks fail explicit QA analysis without a false passing report', t => {
  const root = fixture(t);
  let result = analyze(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Run npm run build first/);
  assert.doesNotMatch(result.stderr, /ENOENT|at readdirSync/);
  mkdirSync(join(root, '.next/static/chunks'), { recursive: true });
  result = analyze(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no client JavaScript chunks/);
  assert.equal(existsSync(join(root, 'public/release-evidence.json')), false);
  assert.equal(existsSync(join(root, 'artifacts/bundle-demo.json')), false);
});

test('rollback analysis uses its own output without overwriting normal-build evidence', t => {
  const root = fixture(t);
  const chunks = join(root, '.next-flags/static/chunks');
  mkdirSync(chunks, { recursive: true });
  writeFileSync(join(chunks, 'app.js'), 'console.log("rollback");');
  const result = analyze(root, '.next-flags');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(readFileSync(join(root, 'artifacts/bundle-flags.json'), 'utf8')).chunks, 1);
  assert.equal(existsSync(join(root, 'public/release-evidence.json')), false);
});

test('a chunk above budget still fails the local release gate', t => {
  const root = fixture(t);
  const chunks = join(root, '.next/static/chunks');
  mkdirSync(chunks, { recursive: true });
  writeFileSync(join(chunks, 'large.js'), randomBytes(400_000).toString('hex'));
  const result = analyze(root);
  assert.equal(result.status, 1, result.stderr);
  const report = JSON.parse(readFileSync(join(root, 'artifacts/bundle-demo.json'), 'utf8'));
  assert.equal(report.withinBudget, false);
  assert.ok(report.largestGzipBytes > report.budget.chunkGzipBytes);
  assert.equal(JSON.parse(readFileSync(join(root, 'public/release-evidence.json'), 'utf8')).checks.build.status, 'failed');
});
