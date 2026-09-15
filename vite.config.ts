import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  // classic runtime: installed React is 16.13.0, one minor version older than
  // 16.14.0, which is what first shipped the react/jsx-runtime module the
  // automatic runtime needs.
  plugins: [react({ jsxRuntime: 'classic' })],
  build: {
    outDir: 'build'
  },
  server: {
    port: 3000
  }
});
