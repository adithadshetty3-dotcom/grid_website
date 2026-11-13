import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = (env.VITE_TIMELINE_API_BASE || '').replace(/\/+$/, '');
  const apiRoute = `${apiBase}/api` || '/api';
  return {
    // Use / for the standalone preview. The integrating lead may set
    // VITE_TIMELINE_BASE (for example /timeline/) to mount the built assets
    // below a path without rewriting asset URLs by hand.
    base: env.VITE_TIMELINE_BASE || '/',
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      proxy: {
        [apiRoute]: {
          target: env.VITE_TIMELINE_API_PROXY_TARGET || 'http://127.0.0.1:5001',
          changeOrigin: false,
          rewrite: apiBase ? (requestPath) => requestPath.slice(apiBase.length) || '/' : undefined,
        },
      },
      fs: {
        allow: [projectDir],
      },
    },
  };
});
