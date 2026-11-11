import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the dashboard runs on port 5173 and forwards API and
// WebSocket traffic to the Spring Boot server on port 8080.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/ws': { target: 'ws://localhost:8080', ws: true },
    },
  },
});
