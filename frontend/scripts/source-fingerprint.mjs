import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
export function sourceFingerprint(root = process.cwd()) {
  const files = [];
  const visit = path => {
    for (const item of readdirSync(path, { withFileTypes: true })) {
      const full = join(path, item.name);
      if (item.isDirectory()) visit(full);
      else if (/\.(tsx?|css|mjs|json)$/.test(item.name)) files.push(full);
    }
  };
  for (const directory of ['src', 'scripts', 'tests']) if (existsSync(join(root, directory))) visit(join(root, directory));
  for (const file of ['package.json', 'package-lock.json', 'next.config.ts', 'playwright.config.ts', 'playwright.flags.config.ts', 'eslint.config.mjs', 'tsconfig.json', '.env.example']) if (existsSync(join(root, file))) files.push(join(root, file));
  const digest = createHash('sha256');
  for (const file of files.sort()) { digest.update(relative(root, file).replaceAll('\\', '/')); digest.update('\0'); digest.update(readFileSync(file)); }
  return digest.digest('hex');
}
