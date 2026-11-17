import { defineConfig } from 'vite';

export default defineConfig({
  base: '/sans-visual-atlas/',
  publicDir: false,
  esbuild: { jsx: 'automatic' },
  build: { assetsDir: 'ui' }
});
