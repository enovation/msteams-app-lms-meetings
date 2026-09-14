import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react({ jsxRuntime: 'classic' })],
  build: {
    outDir: 'build'
  },
  server: {
    port: 3000
  }
});
