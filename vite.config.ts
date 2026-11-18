import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  build: { outDir: 'dist', target: 'es2022' },
  plugins: [{
    name: 'kraterika-game-manifest',
    generateBundle() {
      // Keep a single canonical game manifest at repository root.
      // This is NOT an SDK wiring, Studio trusted component or candidate exporter.
      const source = readFileSync(join(root, 'ludory.project.json'));
      this.emitFile({ type: 'asset', fileName: 'ludory.project.json', source });
    }
  }]
});
