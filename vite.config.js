import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base './' keeps every asset relative so the build works from any sub-path
// (GitHub Pages project sites, etc.).
// viteSingleFile() inlines JS/CSS/fonts/images into one dist/index.html, so
// the demo can also be opened by double-clicking the file (file://). For
// development use `npm run dev`.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  define: {
    __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 19) + 'Z'),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
