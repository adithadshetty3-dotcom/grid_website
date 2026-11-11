import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(projectDir, '..');

export default defineConfig({
  plugins: [react()],
  // The pilot lives in /react-pilot but deliberately reuses the repository's
  // existing ../style.css rather than copying or replacing the shared system.
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: false,
      },
    },
    fs: {
      allow: [repositoryRoot],
    },
  },
});
