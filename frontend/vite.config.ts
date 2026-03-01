import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    host: true,
    port: 4173,
    // allow Railway/other hosts
    allowedHosts: true,
  },
});
