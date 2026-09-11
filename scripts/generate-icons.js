import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SVG_PATH = join(__dirname, '../src/assets/icon.svg');
const OUT_DIR = join(__dirname, '../public/icons');

const SIZES = [16, 32, 48, 128];

async function generateIcons() {
  console.log('Generating extension icons from SVG...');
  
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(SVG_PATH);

  try {
    for (const size of SIZES) {
      const outPath = join(OUT_DIR, `icon${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outPath);
      console.log(`✓ Generated icon${size}.png`);
    }
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
