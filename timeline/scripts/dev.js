import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const apiPort = Number(process.env.TIMELINE_PORT || 5001);
const vitePort = Number(process.env.TIMELINE_VITE_PORT || 5173);
const children = [];
let stopping = false;
let exitCode = 0;

function portIsListening(port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    const timeout = setTimeout(() => socket.destroy(new Error('Port check timed out.')), 1500);
    socket.once('connect', () => { clearTimeout(timeout); socket.destroy(); resolve(true); });
    socket.once('error', (error) => {
      clearTimeout(timeout);
      if (error.code === 'ECONNREFUSED') resolve(false);
      else reject(error);
    });
  });
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  exitCode = code;
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
  if (children.every((child) => child.exitCode !== null)) process.exit(exitCode);
}

function run(name, args, env = process.env) {
  const child = spawn(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
  children.push(child);
  child.once('error', (error) => {
    process.stderr.write(`${name} could not start: ${error.message}\nRun npm ci from timeline/ and check the documented setup.\n`);
    stop(1);
  });
  child.once('exit', (code, signal) => {
    if (!stopping) {
      process.stderr.write(`${name} stopped${signal ? ` (${signal})` : ` (exit ${code})`}. Stopping the other Timeline process.\n`);
      stop(code || (signal ? 1 : 0));
    } else if (children.every((item) => item.exitCode !== null)) {
      process.exit(exitCode);
    }
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

for (const [port, label] of [[apiPort, 'Express API'], [vitePort, 'Vite frontend']]) {
  if (await portIsListening(port)) {
    process.stderr.write(`${label} port ${port} is already in use. Stop that server yourself, then start Timeline again.\n`);
    process.exitCode = 1;
    process.exit();
  }
}

process.stdout.write(`GRID Timeline local development\nFrontend: http://127.0.0.1:${vitePort}/\nAPI:      http://127.0.0.1:${apiPort}/api\nStop with Ctrl+C; only the two child processes started here are stopped.\n`);
run('Express API', ['--env-file-if-exists=.env', '--watch', 'backend/src/server.js']);
run('Vite frontend', [vite, 'frontend', '--config', 'frontend/vite.config.js', '--host', '127.0.0.1', '--port', String(vitePort), '--strictPort'], {
  ...process.env,
  VITE_TIMELINE_API_PROXY_TARGET: process.env.VITE_TIMELINE_API_PROXY_TARGET || `http://127.0.0.1:${apiPort}`,
});
