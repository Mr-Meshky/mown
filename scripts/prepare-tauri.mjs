import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const STANDALONE = join(ROOT, '.next', 'standalone');
const DIST = join(ROOT, 'dist-tauri');
const LIB_SOURCE = join(ROOT, 'lib');

// Clean and create dist
if (existsSync(DIST)) {
  rmSync(DIST, { recursive: true });
}
mkdirSync(DIST, { recursive: true });

// Copy standalone build without node_modules
if (existsSync(STANDALONE)) {
  cpSync(STANDALONE, DIST, {
    recursive: true,
    filter: (src) => !src.includes('node_modules')
  });
}

// Copy lib folder (contains .yml workflow files)
if (existsSync(LIB_SOURCE)) {
  cpSync(LIB_SOURCE, join(DIST, 'lib'), {
    recursive: true
  });
}

console.log('Tauri distribution prepared successfully');
