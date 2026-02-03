// PWA Icon Generator Script
// Run: node generate-pwa-icons.js
// Requires: npm install sharp

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = path.join(__dirname, 'public', 'quiniela-logo.png');
const OUTPUT_DIR = path.join(__dirname, 'public');

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'pwa-maskable-192x192.png', size: 192, maskable: true },
  { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
];

async function generateIcons() {
  for (const { name, size, maskable } of sizes) {
    const outputPath = path.join(OUTPUT_DIR, name);
    
    if (maskable) {
      // For maskable icons, add padding (safe zone is 80% of the icon)
      const padding = Math.floor(size * 0.1);
      const innerSize = size - (padding * 2);
      
      await sharp(SOURCE_IMAGE)
        .resize(innerSize, innerSize, { fit: 'contain', background: { r: 22, g: 163, b: 74, alpha: 1 } })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 22, g: 163, b: 74, alpha: 1 } // #16a34a
        })
        .png()
        .toFile(outputPath);
    } else {
      await sharp(SOURCE_IMAGE)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outputPath);
    }
    
    console.log(`Generated: ${name}`);
  }
  
  console.log('All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
