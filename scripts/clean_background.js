import sharp from 'sharp';

async function cleanHeroFront() {
  const { data, info } = await sharp('public/images/hero-front.jpg').raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const totalPixels = w * h;

  const isBg = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let qHead = 0;
  let qTail = 0;

  const getLum = (idx) => 0.299 * data[idx * 3] + 0.587 * data[idx * 3 + 1] + 0.114 * data[idx * 3 + 2];

  // Seed borders
  for (let x = 0; x < w; x++) {
    isBg[x] = 1;
    queue[qTail++] = x;
    const botIdx = (h - 1) * w + x;
    isBg[botIdx] = 1;
    queue[qTail++] = botIdx;
  }
  for (let y = 0; y < h; y++) {
    const leftIdx = y * w;
    isBg[leftIdx] = 1;
    queue[qTail++] = leftIdx;
    const rightIdx = y * w + (w - 1);
    isBg[rightIdx] = 1;
    queue[qTail++] = rightIdx;
  }

  // BFS flood fill into any background with lum < 48
  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % w;
    const cy = Math.floor(curr / w);

    const neighbors = [
      cy > 0 ? curr - w : -1,
      cy < h - 1 ? curr + w : -1,
      cx > 0 ? curr - 1 : -1,
      cx < w - 1 ? curr + 1 : -1
    ];

    for (const nb of neighbors) {
      if (nb >= 0 && !isBg[nb]) {
        const nx = nb % w;
        const ny = Math.floor(nb / w);
        const lum = getLum(nb);

        // Smudge zone on the left and behind top of strap
        const inSmudgeZone = (nx < 280 && ny > 120 && ny < 400 && nx < (360 - (ny - 130) * 0.75)) ||
                             (nx < 350 && ny < 220 && nx < (370 - (ny - 50) * 0.6));
        const threshold = inSmudgeZone ? 120 : 48;

        if (lum < threshold) {
          isBg[nb] = 1;
          queue[qTail++] = nb;
        }
      }
    }
  }

  const outBuf = Buffer.alloc(totalPixels * 4);
  for (let i = 0; i < totalPixels; i++) {
    const cx = i % w;
    const cy = Math.floor(i / w);
    const lum = getLum(i);

    let alpha = 255;
    const inSmudgeZone = (cx < 280 && cy > 120 && cy < 400 && cx < (360 - (cy - 130) * 0.75)) ||
                         (cx < 350 && cy < 220 && cx < (370 - (cy - 50) * 0.6));

    if (isBg[i] || (inSmudgeZone && lum < 120)) {
      if (lum <= 18 || inSmudgeZone) {
        alpha = 0;
      } else {
        alpha = Math.round(255 * Math.max(0, Math.min(1, (lum - 18) / 30)));
      }
    } else {
      alpha = 255;
    }

    outBuf[i * 4] = data[i * 3];
    outBuf[i * 4 + 1] = data[i * 3 + 1];
    outBuf[i * 4 + 2] = data[i * 3 + 2];
    outBuf[i * 4 + 3] = alpha;
  }

  await sharp(outBuf, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 8 })
    .toFile('public/images/hero-front.png');

  console.log('Cleaned hero-front.png successfully without smudge!');
}

async function cleanExploded() {
  const { data, info } = await sharp('public/images/exploded.jpg').raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const totalPixels = w * h;

  const isBg = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let qHead = 0;
  let qTail = 0;

  const getLum = (idx) => 0.299 * data[idx * 3] + 0.587 * data[idx * 3 + 1] + 0.114 * data[idx * 3 + 2];

  // Seed borders
  for (let x = 0; x < w; x++) {
    isBg[x] = 1;
    queue[qTail++] = x;
    const botIdx = (h - 1) * w + x;
    isBg[botIdx] = 1;
    queue[qTail++] = botIdx;
  }
  for (let y = 0; y < h; y++) {
    const leftIdx = y * w;
    isBg[leftIdx] = 1;
    queue[qTail++] = leftIdx;
    const rightIdx = y * w + (w - 1);
    isBg[rightIdx] = 1;
    queue[qTail++] = rightIdx;
  }

  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % w;
    const cy = Math.floor(curr / w);

    const neighbors = [
      cy > 0 ? curr - w : -1,
      cy < h - 1 ? curr + w : -1,
      cx > 0 ? curr - 1 : -1,
      cx < w - 1 ? curr + 1 : -1
    ];

    for (const nb of neighbors) {
      if (nb >= 0 && !isBg[nb]) {
        const lum = getLum(nb);
        if (lum < 55) {
          isBg[nb] = 1;
          queue[qTail++] = nb;
        }
      }
    }
  }

  const outBuf = Buffer.alloc(totalPixels * 4);
  for (let i = 0; i < totalPixels; i++) {
    const lum = getLum(i);
    let alpha = 255;
    if (isBg[i]) {
      if (lum <= 18) {
        alpha = 0;
      } else {
        alpha = Math.round(255 * Math.max(0, Math.min(1, (lum - 18) / 37)));
      }
    } else {
      alpha = 255;
    }

    outBuf[i * 4] = data[i * 3];
    outBuf[i * 4 + 1] = data[i * 3 + 1];
    outBuf[i * 4 + 2] = data[i * 3 + 2];
    outBuf[i * 4 + 3] = alpha;
  }

  await sharp(outBuf, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 8 })
    .toFile('public/images/exploded-clean.png');

  console.log('Cleaned exploded-clean.png successfully!');
}

async function main() {
  await cleanHeroFront();
  await cleanExploded();
}

main();
