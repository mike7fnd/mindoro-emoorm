const sharp = require('sharp');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const src = path.join(__dirname, '..', 'public', 'icons', 'app-icon.jpg');

async function run() {
  for (const s of sizes) {
    const out = path.join(__dirname, '..', 'public', 'icon-' + s + 'x' + s + '.png');
    await sharp(src).resize(s, s, { fit: 'cover' }).png().toFile(out);
    console.log('Created: icon-' + s + 'x' + s + '.png');
  }
  // Also copy to icons/ folder
  const iconsSizes = [192, 512];
  for (const s of iconsSizes) {
    const out = path.join(__dirname, '..', 'public', 'icons', 'icon-' + s + 'x' + s + '.png');
    await sharp(src).resize(s, s, { fit: 'cover' }).png().toFile(out);
    console.log('Created: icons/icon-' + s + 'x' + s + '.png');
  }
  console.log('Done!');
}

run().catch(console.error);
