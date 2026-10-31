import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve('audit_results');
const BASE_URL = 'http://localhost:3000/';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop_2560', width: 2560, height: 1440, deviceScaleFactor: 1 },
  { name: 'desktop_1440', width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: 'laptop_1280', width: 1280, height: 800, deviceScaleFactor: 1 },
  { name: 'tablet_land_1024', width: 1024, height: 768, deviceScaleFactor: 1 },
  { name: 'tablet_port_768', width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: 'mobile_lg_430', width: 430, height: 932, deviceScaleFactor: 2 },
  { name: 'mobile_std_390', width: 390, height: 844, deviceScaleFactor: 2 },
  { name: 'mobile_sm_360', width: 360, height: 740, deviceScaleFactor: 2 },
  { name: 'mobile_xs_320', width: 320, height: 568, deviceScaleFactor: 2 }
];

async function runAudit() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const report = {
    timestamp: new Date().toISOString(),
    storefront: {},
    admin: {},
    consoleErrors: [],
    overflowIssues: [],
    layoutIssues: []
  };

  console.log('--- STARTING STOREFRONT COMPREHENSIVE AUDIT ---');

  for (const vp of VIEWPORTS) {
    console.log(`\nTesting Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    const page = await browser.newPage();
    await page.setViewport(vp);

    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.consoleErrors.push({ viewport: vp.name, error: msg.text() });
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // 1. Check Horizontal Overflow
    const overflowInfo = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const offending = [];
      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        // Ignore custom cursor or offscreen drawer backdrop
        if (el.classList.contains('custom-cursor') || el.classList.contains('custom-cursor-follower')) return;
        if (rect.right > docW + 1.5) {
          offending.push({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            right: Math.round(rect.right),
            docWidth: docW,
            diff: Math.round(rect.right - docW)
          });
        }
      });
      return { docW, scrollW, hasOverflow: scrollW > docW, offending: offending.slice(0, 8) };
    });

    if (overflowInfo.hasOverflow) {
      report.overflowIssues.push({ viewport: vp.name, overflowInfo });
      console.log(`[OVERFLOW DETECTED] in ${vp.name}: scrollW=${overflowInfo.scrollW} > docW=${overflowInfo.docW}`);
    }

    // Capture Full Page Sections in Dark Mode
    const sections = ['#hero', '#brands', '#showroom', '#customizer', '#catalog', '#trust', '#reviews', 'footer'];
    for (const sec of sections) {
      const el = await page.$(sec);
      if (el) {
        await page.evaluate(s => {
          const target = document.querySelector(s);
          if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
        }, sec);
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Capture Hero Screenshot
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUTPUT_DIR, `storefront_${vp.name}_dark_hero.png`) });

    // Capture Customizer Screenshot
    await page.evaluate(() => document.querySelector('#customizer')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUTPUT_DIR, `storefront_${vp.name}_dark_customizer.png`) });

    // Capture Catalog Screenshot
    await page.evaluate(() => document.querySelector('#catalog')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUTPUT_DIR, `storefront_${vp.name}_dark_catalog.png`) });

    // Test Light Mode for key viewports
    if (['desktop_1440', 'tablet_port_768', 'mobile_std_390'].includes(vp.name)) {
      await page.evaluate(() => document.querySelector('#theme-toggle')?.click());
      await new Promise(r => setTimeout(r, 500));
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: path.join(OUTPUT_DIR, `storefront_${vp.name}_light_hero.png`) });

      await page.evaluate(() => document.querySelector('#catalog')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: path.join(OUTPUT_DIR, `storefront_${vp.name}_light_catalog.png`) });

      // Switch back to dark mode
      await page.evaluate(() => document.querySelector('#theme-toggle')?.click());
      await new Promise(r => setTimeout(r, 300));
    }

    // If mobile/tablet, test mobile nav drawer
    if (vp.width <= 768) {
      await page.evaluate(() => document.querySelector('#mobile-menu-btn')?.click());
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(OUTPUT_DIR, `storefront_${vp.name}_drawer_open.png`) });
      await page.evaluate(() => document.querySelector('#mobile-nav-close')?.click());
      await new Promise(r => setTimeout(r, 300));
    }

    // Test Cart Drawer and Checkout Modal
    if (['desktop_1440', 'mobile_std_390'].includes(vp.name)) {
      // Add first product to cart
      await page.evaluate(() => {
        const btn = document.querySelector('.btn-card-reserve');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 400));

      // Open Cart
      await page.evaluate(() => document.querySelector('#bag-btn')?.click());
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(OUTPUT_DIR, `storefront_${vp.name}_cart_with_item.png`) });
      await page.evaluate(() => document.querySelector('#cart-close')?.click());
      await new Promise(r => setTimeout(r, 300));

      // Open Checkout Modal
      await page.evaluate(() => document.querySelector('.vip-trigger')?.click());
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(OUTPUT_DIR, `storefront_${vp.name}_checkout_modal.png`) });
      await page.evaluate(() => document.querySelector('#modal-close')?.click());
      await new Promise(r => setTimeout(r, 300));
    }

    await page.close();
  }

  console.log('\n--- STARTING STANDALONE ADMIN PORTAL AUDIT ---');

  const adminViewports = [
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_390', width: 390, height: 844 },
    { name: 'mobile_320', width: 320, height: 568 }
  ];

  for (const avp of adminViewports) {
    console.log(`Testing Admin Viewport: ${avp.name} (${avp.width}x${avp.height})`);
    const page = await browser.newPage();
    await page.setViewport(avp);

    await page.goto(`${BASE_URL}admin.html`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Capture Login Gate
    await page.screenshot({ path: path.join(OUTPUT_DIR, `admin_${avp.name}_01_login_gate.png`) });

    // Unlock Admin with Master PIN 8286
    await page.evaluate(() => {
      const pinInput = document.getElementById('admin-passcode');
      const loginForm = document.getElementById('admin-login-form');
      if (pinInput && loginForm) {
        pinInput.value = '8286';
        loginForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
    await new Promise(r => setTimeout(r, 600));

    // Capture Admin Dashboard Top (Overview & KPIs)
    await page.screenshot({ path: path.join(OUTPUT_DIR, `admin_${avp.name}_02_dashboard_kpis.png`) });

    // Switch to Inventory Tab
    await page.evaluate(() => {
      const btn = document.querySelector('.nav-item[data-tab="inventory"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUTPUT_DIR, `admin_${avp.name}_03_inventory_table.png`) });

    // Switch to Add Product Tab
    await page.evaluate(() => {
      const btn = document.querySelector('.nav-item[data-tab="add-product"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUTPUT_DIR, `admin_${avp.name}_04_add_product_form.png`) });

    // Switch to Orders Tab
    await page.evaluate(() => {
      const btn = document.querySelector('.nav-item[data-tab="orders"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUTPUT_DIR, `admin_${avp.name}_05_orders_table.png`) });

    // Check Admin Horizontal Overflow
    const adminOverflow = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const offending = [];
      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > docW + 1.5) {
          offending.push({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            right: Math.round(rect.right),
            docWidth: docW,
            diff: Math.round(rect.right - docW)
          });
        }
      });
      return { docW, scrollW, hasOverflow: scrollW > docW, offending: offending.slice(0, 8) };
    });

    if (adminOverflow.hasOverflow) {
      report.overflowIssues.push({ page: 'admin', viewport: avp.name, adminOverflow });
      console.log(`[ADMIN OVERFLOW DETECTED] in ${avp.name}: scrollW=${adminOverflow.scrollW} > docW=${adminOverflow.docW}`);
    } else {
      console.log(`[ADMIN OVERFLOW CHECK PASSED] in ${avp.name}: 0 overflow pixels.`);
    }

    await page.close();
  }

  await browser.close();

  fs.writeFileSync(path.join(OUTPUT_DIR, 'audit_report.json'), JSON.stringify(report, null, 2));
  console.log('\n--- AUDIT COMPLETE! Full results written to audit_results/audit_report.json ---');
}

runAudit().catch(console.error);
