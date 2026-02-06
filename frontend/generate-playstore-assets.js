/**
 * Generate Google Play Store assets
 * Run: node generate-playstore-assets.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ASSETS_DIR = './playstore-assets';
const SOURCE_ICON = './public/pwa-512x512.png';
const SOURCE_LOGO = './public/quiniela-logo.png';

// Create assets directory
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

async function generateAssets() {
  console.log('🎨 Generating Google Play Store assets...\n');

  try {
    // 1. App Icon (512x512) - no transparency
    console.log('📱 Creating app icon (512x512)...');
    await sharp(SOURCE_ICON)
      .resize(512, 512)
      .flatten({ background: '#0f172a' }) // Remove transparency
      .png()
      .toFile(path.join(ASSETS_DIR, 'app-icon-512.png'));
    console.log('   ✅ app-icon-512.png created\n');

    // 2. Feature Graphic (1024x500)
    console.log('🖼️  Creating feature graphic (1024x500)...');
    
    // Create a feature graphic with gradient background and centered logo
    const featureGraphic = await sharp({
      create: {
        width: 1024,
        height: 500,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
      }
    })
    .composite([
      {
        input: Buffer.from(`
          <svg width="1024" height="500">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#1e3a5f;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="1024" height="500" fill="url(#grad)"/>
            <text x="512" y="420" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#16a34a" text-anchor="middle">QUINIELA</text>
            <text x="512" y="470" font-family="Arial, sans-serif" font-size="24" fill="#94a3b8" text-anchor="middle">Liga MX Predictions</text>
          </svg>
        `),
        top: 0,
        left: 0
      }
    ])
    .png()
    .toFile(path.join(ASSETS_DIR, 'feature-graphic-1024x500.png'));
    
    // Now add the logo on top
    const logoBuffer = await sharp(SOURCE_LOGO)
      .resize(200, 200)
      .toBuffer();
    
    await sharp(path.join(ASSETS_DIR, 'feature-graphic-1024x500.png'))
      .composite([
        {
          input: logoBuffer,
          top: 100,
          left: 412 // (1024 - 200) / 2
        }
      ])
      .toFile(path.join(ASSETS_DIR, 'feature-graphic-final.png'));
    
    // Rename final file
    fs.renameSync(
      path.join(ASSETS_DIR, 'feature-graphic-final.png'),
      path.join(ASSETS_DIR, 'feature-graphic-1024x500.png')
    );
    
    console.log('   ✅ feature-graphic-1024x500.png created\n');

    // 3. Create a simple banner template
    console.log('📸 Creating screenshot frame template...');
    await sharp({
      create: {
        width: 1080,
        height: 1920,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      }
    })
    .png()
    .toFile(path.join(ASSETS_DIR, 'screenshot-template-1080x1920.png'));
    console.log('   ✅ screenshot-template-1080x1920.png created\n');

    console.log('✨ All assets generated in:', ASSETS_DIR);
    console.log('\n📋 Next steps:');
    console.log('   1. Take screenshots of your app on a phone/emulator');
    console.log('   2. Upload app-icon-512.png to Play Console');
    console.log('   3. Upload feature-graphic-1024x500.png to Play Console');
    console.log('   4. Upload at least 2 phone screenshots\n');

  } catch (error) {
    console.error('❌ Error generating assets:', error.message);
    console.log('\n💡 Make sure source images exist:');
    console.log('   - ' + SOURCE_ICON);
    console.log('   - ' + SOURCE_LOGO);
  }
}

generateAssets();
