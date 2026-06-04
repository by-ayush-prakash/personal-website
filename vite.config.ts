import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import fs from 'fs';

// Auto-resolve gargoyle naming to prevent build issues
try {
  const imagesDir = path.resolve(process.cwd(), 'src/assets/images');
  const img1 = path.join(imagesDir, 'image-1.png');
  const img2 = path.join(imagesDir, 'image-2.png');
  if (fs.existsSync(img1) && !fs.existsSync(img2)) {
    fs.copyFileSync(img1, img2);
  }
} catch (e) {
  console.warn('Could not auto-copy image asset:', e);
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
