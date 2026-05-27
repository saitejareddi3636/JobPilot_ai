import { cpSync } from 'fs';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const root   = resolve(__dirname, 'extension');
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
  root,
  publicDir: false,
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup:   resolve(root, 'popup.html'),
        content: resolve(root, 'content.ts'),
      },
      output: {
        // content script must be a plain IIFE, not an ES module
        entryFileNames: chunk =>
          chunk.name === 'content' ? 'content.js' : 'assets/[name]-[hash].js',
        format: 'es',
      },
    },
  },
});
