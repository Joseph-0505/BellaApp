import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em dev, o backend roda no Docker atras do nginx (https://bellaapp.local) e nao e
// exposto em localhost. O proxy abaixo repassa /api pra ele, evitando CORS.
// Para apontar pra um backend local, defina VITE_DEV_API_PROXY (ex: http://localhost:3000).
const apiProxyTarget = process.env.VITE_DEV_API_PROXY || 'https://bellaapp.local';

export default defineConfig({
  plugins: [react()],

  server: {
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
