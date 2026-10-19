const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Ensure vendor directory exists
if (!fs.existsSync('vendor')) {
  fs.mkdirSync('vendor', { recursive: true });
}

// 1. Copy pdf-lib.min.js
fs.copyFileSync('node_modules/pdf-lib/dist/pdf-lib.min.js', 'vendor/pdf-lib.min.js');

// 2. Build standalone pdf.worker.min.js with globalName: pdfjsWorker
esbuild.buildSync({
  entryPoints: ['node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'],
  bundle: true,
  outfile: 'vendor/pdf.worker.min.js',
  format: 'iife',
  globalName: 'pdfjsWorker',
  minify: true,
  target: ['es2020']
});

// 3. Build unified self-contained pdf.min.js containing both PDF.js and the worker handler
// so it works in both worker mode and fallback main-thread mode without any CORS or origin restrictions
const tempEntry = 'temp_bundle_entry.js';
fs.writeFileSync(tempEntry, `
import * as pdfjsLib from "./node_modules/pdfjs-dist/legacy/build/pdf.mjs";
import * as pdfjsWorker from "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs";

if (typeof window !== "undefined") {
  window.pdfjsWorker = pdfjsWorker;
  window.pdfjsLib = pdfjsLib;
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "./vendor/pdf.worker.min.js";
  } catch (e) {}
} else if (typeof globalThis !== "undefined") {
  globalThis.pdfjsWorker = pdfjsWorker;
  globalThis.pdfjsLib = pdfjsLib;
}

export { pdfjsLib, pdfjsWorker };
`);

esbuild.buildSync({
  entryPoints: [tempEntry],
  bundle: true,
  outfile: 'vendor/pdf.min.js',
  format: 'iife',
  globalName: 'PDFJS_STANDALONE',
  minify: true,
  target: ['es2020']
});

fs.unlinkSync(tempEntry);
console.log('✅ Vendor bundles built successfully in vendor/ (pdf-lib, pdf.min.js, pdf.worker.min.js)!');
