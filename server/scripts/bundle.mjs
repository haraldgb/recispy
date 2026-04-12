import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const outNodeModules = path.join(dist, 'node_modules');

await rm(outNodeModules, { recursive: true, force: true });
await mkdir(outNodeModules, { recursive: true });

await cp(path.join(root, 'node_modules'), outNodeModules, { recursive: true });
await cp(
  path.join(root, 'src/db/migrations'),
  path.join(dist, 'src/db/migrations'),
  { recursive: true },
);

console.log('bundle: copied node_modules and migrations');
