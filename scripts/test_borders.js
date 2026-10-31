import sharp from 'sharp';

async function checkBorders() {
  const { data, info } = await sharp('public/images/hero-front.jpg').raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  let topNonBlack = 0;
  let botNonBlack = 0;
  let leftNonBlack = 0;
  let rightNonBlack = 0;

  for (let x = 0; x < w; x++) {
    const lumTop = 0.299 * data[x * 3] + 0.587 * data[x * 3 + 1] + 0.114 * data[x * 3 + 2];
    const botIdx = ((h - 1) * w + x) * 3;
    const lumBot = 0.299 * data[botIdx] + 0.587 * data[botIdx + 1] + 0.114 * data[botIdx + 2];
    if (lumTop > 30) topNonBlack++;
    if (lumBot > 30) botNonBlack++;
  }

  for (let y = 0; y < h; y++) {
    const leftIdx = (y * w) * 3;
    const lumLeft = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
    const rightIdx = (y * w + (w - 1)) * 3;
    const lumRight = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
    if (lumLeft > 30) leftNonBlack++;
    if (lumRight > 30) rightNonBlack++;
  }

  console.log({ topNonBlack, botNonBlack, leftNonBlack, rightNonBlack });
}

checkBorders();
