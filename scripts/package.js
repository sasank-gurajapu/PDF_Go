const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Ensure vendor and icons exist
console.log('📦 Step 1: Checking icons and vendor bundles...');
require('./generate-icons');
require('./build-vendor');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

const zipPath = path.resolve('dist/PDF_Go.zip');
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log('📦 Step 2: Packaging distribution ZIP...');
const filesToInclude = [
  'manifest.json',
  'index.html',
  'css',
  'js',
  'vendor',
  'icons',
  'README.md',
  'LICENSE'
].filter(f => fs.existsSync(f));

const cmd = `zip -q -r "${zipPath}" ${filesToInclude.join(' ')}`;
execSync(cmd);

const stats = fs.statSync(zipPath);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`\n🎉 Success! Standalone package created at:`);
console.log(`   ${zipPath} (${sizeMb} MB)`);
console.log(`\n👉 Users can:`);
console.log(`   1. Download PDF_Go.zip and extract it anywhere.`);
console.log(`   2. In Chrome, navigate to chrome://extensions`);
console.log(`   3. Enable "Developer mode" (top right).`);
console.log(`   4. Click "Load unpacked" and select the extracted folder.`);
console.log(`   5. Pin PDF_Go to the toolbar for 1-click access anytime!\n`);
