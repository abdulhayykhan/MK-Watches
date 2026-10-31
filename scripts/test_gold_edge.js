import sharp from 'sharp';

async function findGoldEdge() {
  const { data, info } = await sharp('public/images/hero-front.jpg').raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  
  for (let y = 150; y < 400; y += 30) {
    let minGoldX = 999;
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Rose gold has high red, moderate green, lower blue: r > 120, r > b + 30
      if (r > 130 && r > b + 25 && g > 70) {
        if (x < minGoldX) minGoldX = x;
      }
    }
    console.log(`y = ${y}, leftmost gold x = ${minGoldX}`);
  }
}

findGoldEdge();
