const fs = require('fs');
const { execSync } = require('child_process');

if (!fs.existsSync('icons')) {
  fs.mkdirSync('icons', { recursive: true });
}

const sizes = [16, 48, 128];

sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="26" fill="url(#grad)"/>
  <path d="M38 28h34l24 24v46a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6V34a6 6 0 0 1 6-6z" fill="#ffffff"/>
  <path d="M72 28v24h24" fill="#dbeafe"/>
  <rect x="42" y="64" width="44" height="22" rx="4" fill="#ef4444"/>
  <text x="64" y="78" fill="#ffffff" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="900" text-anchor="middle" dominant-baseline="middle">PDF</text>
</svg>`;

  const tempSvg = `icons/temp_${size}.svg`;
  const outPng = `icons/icon${size}.png`;

  fs.writeFileSync(tempSvg, svg);
  execSync(`sips -s format png ${tempSvg} --out ${outPng} > /dev/null 2>&1`);
  fs.unlinkSync(tempSvg);
  console.log(`Generated ${outPng}`);
});
console.log('✅ Extension icons ready in icons/!');
