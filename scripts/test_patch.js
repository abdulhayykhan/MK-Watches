import sharp from 'sharp';

async function inspectPatch() {
  const { data, info } = await sharp('public/images/hero-front.jpg').raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  
  let maxLumInPatch = 0;
  let minLumInPatch = 999;
  let countOver40 = 0;

  for (let y = 150; y < 350; y++) {
    for (let x = 120; x < 240; x++) {
      const idx = (y * w + x) * 3;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (lum > maxLumInPatch) maxLumInPatch = lum;
      if (lum < minLumInPatch) minLumInPatch = lum;
      if (lum > 40) countOver40++;
    }
  }

  console.log({ minLumInPatch, maxLumInPatch, countOver40 });
}

inspectPatch();
