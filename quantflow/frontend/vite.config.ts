// Dev server: proxies REST (/api) and the WebSocket (/stream) to the FastAPI backend on :8010,
// so the browser only ever talks to one origin (no CORS / mixed-content trouble).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const target = process.env.BACKEND_URL || 'http://127.0.0.1:8010';
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, host: '0.0.0.0',
    proxy: {
      '/api': { target, changeOrigin: true },
      '/stream': { target: target.replace(/^http/, 'ws'), ws: true, changeOrigin: true },
    },
  },
});
