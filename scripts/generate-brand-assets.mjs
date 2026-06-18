import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

await mkdir('assets', { recursive: true });

await sharp('branding/spendfox-icon-light.svg')
  .resize(1024, 1024)
  .png({ compressionLevel: 9 })
  .toFile('assets/icon.png');

await sharp('branding/spendfox-mark-light.svg')
  .resize(1024, 1024)
  .png({ compressionLevel: 9 })
  .toFile('assets/adaptive-icon.png');

await sharp('branding/spendfox-mark-light.svg')
  .resize(384, 384)
  .png({ compressionLevel: 9 })
  .toFile('assets/spendfox-mark.png');

await sharp('branding/spendfox-icon-light.svg')
  .resize(64, 64)
  .png({ compressionLevel: 9 })
  .toFile('assets/favicon.png');
