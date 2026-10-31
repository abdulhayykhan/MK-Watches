import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imagesDir = 'public/images';

async function removeBlackBackground(inputPath, outputPath, thresholdLow = 8, thresholdHigh = 28) {
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  const outBuf = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    
    // Perceived luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    let alpha = 255;

    if (lum <= thresholdLow) {
      alpha = 0;
    } else if (lum < thresholdHigh) {
      alpha = Math.round(255 * ((lum - thresholdLow) / (thresholdHigh - thresholdLow)));
    }

    outBuf[i * 4] = r;
    outBuf[i * 4 + 1] = g;
    outBuf[i * 4 + 2] = b;
    outBuf[i * 4 + 3] = alpha;
  }

  await sharp(outBuf, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 8 })
    .toFile(outputPath);

  console.log(`Created transparent: ${outputPath}`);
}

async function sliceExplodedLayers() {
  const inputPath = path.join(imagesDir, 'exploded.jpg');
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;

  // The exploded tiers roughly correspond to vertical slices:
  // Tier 1: Crystal (y: 0.03 to 0.20)
  // Tier 2: Bezel (y: 0.12 to 0.28)
  // Tier 3: Dial (y: 0.23 to 0.43)
  // Tier 4: Movement (y: 0.38 to 0.64)
  // Tier 5: Case (y: 0.52 to 0.78)
  // Tier 6: Caseback (y: 0.70 to 0.98)

  const tiers = [
    { name: 'exploded-tier1-crystal.png', yStart: 0.03, yEnd: 0.22 },
    { name: 'exploded-tier2-bezel.png', yStart: 0.12, yEnd: 0.29 },
    { name: 'exploded-tier3-dial.png', yStart: 0.24, yEnd: 0.44 },
    { name: 'exploded-tier4-movement.png', yStart: 0.39, yEnd: 0.65 },
    { name: 'exploded-tier5-case.png', yStart: 0.53, yEnd: 0.78 },
    { name: 'exploded-tier6-caseback.png', yStart: 0.71, yEnd: 0.98 }
  ];

  for (const tier of tiers) {
    const y0 = Math.floor(tier.yStart * height);
    const y1 = Math.floor(tier.yEnd * height);
    const sliceH = y1 - y0;
    const outBuf = Buffer.alloc(width * sliceH * 4);

    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 3;
        const dstIdx = ((y - y0) * width + x) * 4;

        const r = data[srcIdx];
        const g = data[srcIdx + 1];
        const b = data[srcIdx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        let alpha = 255;
        if (lum <= 10) {
          alpha = 0;
        } else if (lum < 30) {
          alpha = Math.round(255 * ((lum - 10) / 20));
        }

        // Soft vertical edge feathering so slices blend organically
        const edgeDist = Math.min(y - y0, y1 - y);
        if (edgeDist < 12) {
          alpha = Math.round(alpha * (edgeDist / 12));
        }

        outBuf[dstIdx] = r;
        outBuf[dstIdx + 1] = g;
        outBuf[dstIdx + 2] = b;
        outBuf[dstIdx + 3] = alpha;
      }
    }

    await sharp(outBuf, { raw: { width, height: sliceH, channels: 4 } })
      .png({ compressionLevel: 8 })
      .toFile(path.join(imagesDir, tier.name));

    console.log(`Created slice: ${tier.name}`);
  }
}

async function main() {
  await removeBlackBackground(`${imagesDir}/hero-front.jpg`, `${imagesDir}/hero-front.png`);
  await removeBlackBackground(`${imagesDir}/hero-angle.jpg`, `${imagesDir}/hero-angle.png`);
  await removeBlackBackground(`${imagesDir}/caseback.jpg`, `${imagesDir}/caseback.png`);
  await removeBlackBackground(`${imagesDir}/edition-platinum.jpg`, `${imagesDir}/edition-platinum.png`);
  await removeBlackBackground(`${imagesDir}/edition-emerald.jpg`, `${imagesDir}/edition-emerald.png`);
  await removeBlackBackground(`${imagesDir}/edition-stealth.jpg`, `${imagesDir}/edition-stealth.png`);
  await sliceExplodedLayers();
  console.log('All watch images processed successfully!');
}

main().catch(console.error);
