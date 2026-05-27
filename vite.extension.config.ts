import { cpSync } from 'fs';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const root = resolve(__dirname, 'extension');
const outDir = resolve(__dirname, 'dist-extension');

function copyManifestPlugin() {
  return {
    name: 'copy-manifest',
    closeBundle() {
      cpSync(resolve(root, 'manifest.json'), resolve(outDir, 'manifest.json'));
    },
  };
}

export default defineConfig({
  plugins: [react(), copyManifestPlugin()],
  // Setting root to the extension folder makes popup.html output at the root of outDir
  root,
  publicDir: false,
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(root, 'popup.html'),
      },
    },
  },
});
