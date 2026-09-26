import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname || '.', './src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false,
    sourcemap: false
  },
  server: {
    port: 3000,
    host: true
  }
});
