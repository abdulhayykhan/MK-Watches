import sharp from 'sharp';
import path from 'path';

async function testCorners() {
  const { data, info } = await sharp('public/images/hero-front.jpg').raw().toBuffer({ resolveWithObject: true });
  console.log('Size:', info.width, info.height);
  
  const getPixel = (x, y) => {
    const idx = (y * info.width + x) * 3;
    return [data[idx], data[idx + 1], data[idx + 2]];
  };

  console.log('Top-Left (0,0):', getPixel(0, 0));
  console.log('Top-Right (1023,0):', getPixel(1023, 0));
  console.log('Bottom-Left (0,1023):', getPixel(0, 1023));
  console.log('Bottom-Right (1023,1023):', getPixel(1023, 1023));
}

testCorners();
