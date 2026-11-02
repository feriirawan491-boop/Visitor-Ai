import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { sourceFingerprint } from './source-fingerprint.mjs';
import { validateReleaseConfig } from './release-config.mjs';
export const checkNames = ['lint', 'typecheck', 'unit', 'build', 'e2e', 'flags'];
export function updateEvidence(name, result) {
  const source = sourceFingerprint(); const configuration = validateReleaseConfig(process.env);
  let previous;
  try { previous = JSON.parse(readFileSync('public/release-evidence.json', 'utf8')); } catch { previous = null; }
  if (previous?.source !== source || previous?.profile !== configuration.profile) previous = null;
  const checks = Object.fromEntries(checkNames.map(key => [key, { status: 'not-run' }]));
  if (previous) for (const key of checkNames) checks[key] = previous.checks[key] ?? checks[key];
  checks[name] = { ...result, at: new Date().toISOString() };
  const manifest = { schema: 1, source, profile: configuration.profile, environment: 'local-demo', generatedAt: new Date().toISOString(), checks };
  mkdirSync('public', { recursive: true });
  writeFileSync('public/release-evidence.json.tmp', JSON.stringify(manifest, null, 2) + '\n');
  renameSync('public/release-evidence.json.tmp', 'public/release-evidence.json');
  return manifest;
}
export function readLocalReport(path) { return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null; }
