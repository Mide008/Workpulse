// apps/web/scripts/generate-icons.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366F1" />
          <stop offset="100%" stop-color="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)" />
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
            font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.35}" fill="white">
        WP
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outputDir, `icon-${size}.png`));

  console.log(`✅ Generated icon-${size}.png`);
}

async function generateAll() {
  for (const size of sizes) {
    await generateIcon(size);
  }
  console.log('🎉 All icons generated!');
}

generateAll().catch(console.error);