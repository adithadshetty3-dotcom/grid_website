import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const result = spawnSync(process.execPath, [vite, 'build', 'frontend', '--config', 'frontend/vite.config.js', '--outDir', '../public', '--emptyOutDir'], {
  cwd: root,
  env: { ...process.env, VITE_TIMELINE_PRIVATE_BLOB_UPLOAD: 'true' },
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
