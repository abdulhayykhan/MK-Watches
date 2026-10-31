import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runVerification() {
  console.log('Launching headless browser with Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    pipe: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Wait for preloader to disappear
  await page.waitForFunction(() => {
    const pre = document.getElementById('preloader');
    return !pre || pre.classList.contains('loaded') || pre.style.display === 'none';
  }, { timeout: 5000 });

  await new Promise(r => setTimeout(r, 1000));
  console.log('Preloader dismissed successfully.');

  // 1. Hero Screenshot
  await page.screenshot({ path: 'test-hero.png' });
  console.log('Saved test-hero.png');

  // Check DOM collision between brand and nav-links
  const navCollision = await page.evaluate(() => {
    const brand = document.querySelector('.brand-wrapper').getBoundingClientRect();
    const links = document.querySelector('.nav-links').getBoundingClientRect();
    const firstLink = document.querySelector('.nav-links li:first-child').getBoundingClientRect();
    const actions = document.querySelector('.nav-actions').getBoundingClientRect();
    const heroTitle = document.querySelector('.hero-title').getBoundingClientRect();
    return {
      brandRight: brand.right,
      firstLinkLeft: firstLink.left,
      brandOverlap: brand.right > firstLink.left,
      linksRight: links.right,
      actionsLeft: actions.left,
      actionsOverlap: links.right > actions.left,
      heroTitleRect: { left: heroTitle.left, right: heroTitle.right, width: heroTitle.width }
    };
  });
  console.log('Nav Check:', navCollision);

  // 2. Scroll to Anatomy / Showroom Section
  await page.evaluate(() => {
    const el = document.getElementById('showroom');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1200));

  const showroomCheck = await page.evaluate(() => {
    const nav = document.querySelector('.navbar').getBoundingClientRect();
    const heading = document.querySelector('.anatomy-sidebar .section-heading').getBoundingClientRect();
    const sidebar = document.querySelector('.anatomy-sidebar').getBoundingClientRect();
    return {
      navBottom: nav.bottom,
      headingTop: heading.top,
      sidebarTop: sidebar.top,
      isHeadingHidden: heading.top < nav.bottom,
      sidebarHeight: sidebar.height
    };
  });
  console.log('Showroom Heading Check:', showroomCheck);

  await page.screenshot({ path: 'test-showroom.png' });
  console.log('Saved test-showroom.png');

  // Scroll further down into showroom to trigger exploded mesh + 3D pins
  await page.evaluate(() => {
    window.scrollBy(0, 800);
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'test-showroom-exploded.png' });
  console.log('Saved test-showroom-exploded.png');

  // 3. Scroll to Catalog & Test Filters
  await page.evaluate(() => {
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 800));

  // Click 'Luxury Swiss' filter
  await page.evaluate(() => {
    const tab = document.querySelector('.filter-tab[data-filter="luxury"]');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'test-catalog-luxury.png' });
  console.log('Saved test-catalog-luxury.png');

  // 4. Test Add to Cart
  const cartResult = await page.evaluate(() => {
    const addBtn = document.querySelector('.btn-card-reserve');
    if (addBtn) addBtn.click();
    const bagBadge = document.querySelector('.bag-badge')?.textContent;
    return { clicked: !!addBtn, badge: bagBadge };
  });
  console.log('Cart Click Result:', cartResult);

  // Open Cart Drawer
  await page.evaluate(() => {
    const bagBtn = document.getElementById('bag-btn');
    if (bagBtn) bagBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'test-cart-drawer.png' });
  console.log('Saved test-cart-drawer.png');

  // 5. Test Theme Toggle to White Mode
  await page.evaluate(() => {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const themeInfo = await page.evaluate(() => {
    const isLight = document.body.classList.contains('theme-light');
    const navLogoSrc = document.getElementById('nav-logo')?.src;
    return { isLight, navLogoSrc };
  });
  console.log('Theme Toggle Info:', themeInfo);
  await page.screenshot({ path: 'test-light-mode.png' });
  console.log('Saved test-light-mode.png');

  await browser.close();
  console.log('Console logs from page:', consoleMessages.slice(0, 10));
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
