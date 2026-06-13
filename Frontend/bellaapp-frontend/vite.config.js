import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em dev, o backend roda no Docker atras do nginx (https://bellaapp.local) e nao e
// exposto em localhost. O proxy abaixo repassa /api pra ele, evitando CORS.
// Para apontar pra um backend local, defina VITE_DEV_API_PROXY (ex: http://localhost:3000).
const apiProxyTarget = process.env.VITE_DEV_API_PROXY || 'https://bellaapp.local';

export default defineConfig({
  plugins: [react()],

  server: {
    // Ignora artefatos de teste no watcher: regenerados pelos E2E, eles fazem
    // o FSWatcher do Vite quebrar (UNKNOWN scandir) se o dev server estiver rodando.
    watch: {
      ignored: ['**/playwright-report/**', '**/test-results/**'],
    },
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },

  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
