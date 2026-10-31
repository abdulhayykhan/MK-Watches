import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runResponsiveTests() {
  console.log('Launching headless browser with Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    pipe: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  // 1. MOBILE TEST (390x844)
  console.log('--- Testing Mobile Viewport (390x844) ---');
  const pageM = await browser.newPage();
  await pageM.setViewport({ width: 390, height: 844 });
  await pageM.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await pageM.waitForFunction(() => {
    const pre = document.getElementById('preloader');
    return !pre || pre.classList.contains('loaded') || pre.style.display === 'none';
  }, { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 800));

  await pageM.screenshot({ path: 'test-mobile-hero.png' });
  console.log('Saved test-mobile-hero.png');

  // Test Mobile Hamburger Drawer
  await pageM.evaluate(() => {
    const btn = document.getElementById('mobile-menu-btn');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await pageM.screenshot({ path: 'test-mobile-drawer.png' });
  console.log('Saved test-mobile-drawer.png');

  // Close drawer
  await pageM.evaluate(() => {
    const closeBtn = document.getElementById('mobile-nav-close');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Scroll to Showroom on Mobile
  await pageM.evaluate(() => {
    document.getElementById('showroom').scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await pageM.screenshot({ path: 'test-mobile-showroom.png' });
  console.log('Saved test-mobile-showroom.png');

  // Scroll to Catalog on Mobile
  await pageM.evaluate(() => {
    document.getElementById('catalog').scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await pageM.screenshot({ path: 'test-mobile-catalog.png' });
  console.log('Saved test-mobile-catalog.png');

  await pageM.close();

  // 2. TABLET TEST (768x1024)
  console.log('--- Testing Tablet Viewport (768x1024) ---');
  const pageT = await browser.newPage();
  await pageT.setViewport({ width: 768, height: 1024 });
  await pageT.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await pageT.waitForFunction(() => {
    const pre = document.getElementById('preloader');
    return !pre || pre.classList.contains('loaded') || pre.style.display === 'none';
  }, { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 800));

  await pageT.screenshot({ path: 'test-tablet-hero.png' });
  console.log('Saved test-tablet-hero.png');

  await pageT.evaluate(() => {
    document.getElementById('showroom').scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await pageT.screenshot({ path: 'test-tablet-showroom.png' });
  console.log('Saved test-tablet-showroom.png');

  await pageT.evaluate(() => {
    document.getElementById('catalog').scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await pageT.screenshot({ path: 'test-tablet-catalog.png' });
  console.log('Saved test-tablet-catalog.png');

  await pageT.close();

  // 3. DESKTOP TEST (1440x900)
  console.log('--- Testing Desktop Viewport (1440x900) ---');
  const pageD = await browser.newPage();
  await pageD.setViewport({ width: 1440, height: 900 });
  await pageD.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await pageD.waitForFunction(() => {
    const pre = document.getElementById('preloader');
    return !pre || pre.classList.contains('loaded') || pre.style.display === 'none';
  }, { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 800));

  await pageD.screenshot({ path: 'test-desktop-hero.png' });
  console.log('Saved test-desktop-hero.png');

  await pageD.evaluate(() => {
    document.getElementById('showroom').scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await pageD.screenshot({ path: 'test-desktop-showroom.png' });
  console.log('Saved test-desktop-showroom.png');

  await pageD.evaluate(() => {
    document.getElementById('catalog').scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await pageD.screenshot({ path: 'test-desktop-catalog.png' });
  console.log('Saved test-desktop-catalog.png');

  await pageD.close();
  await browser.close();

  console.log('All responsive tests completed successfully!');
}

runResponsiveTests().catch(err => {
  console.error('Responsive tests failed:', err);
  process.exit(1);
});
