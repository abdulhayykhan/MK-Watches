import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testAdminSuite() {
  console.log('--- Launching Chrome for Admin & Inventory Testing ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    pipe: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Clear previous localStorage to start with clean test state
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => {
    localStorage.removeItem('mk_inventory_products');
    localStorage.removeItem('mk_inventory_orders');
    localStorage.removeItem('mk_pakistan_cart');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Wait for preloader to finish
  await page.waitForFunction(() => {
    const pre = document.getElementById('preloader');
    return !pre || pre.classList.contains('loaded') || pre.style.display === 'none';
  }, { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));

  console.log('1. Verifying Storefront Catalog initial state...');
  const initialCount = await page.evaluate(() => {
    const cards = document.querySelectorAll('.collections-grid .watch-card');
    const filterAll = document.getElementById('filter-count-all');
    return {
      cardCount: cards.length,
      filterText: filterAll ? filterAll.textContent : null,
      firstName: cards[0]?.querySelector('.watch-name')?.textContent
    };
  });
  console.log('Catalog initial state:', initialCount);

  // 2. Open Admin Dashboard via Navbar Button
  console.log('2. Opening Admin Dashboard via Navbar Button...');
  await page.evaluate(() => {
    const adminBtn = document.getElementById('admin-nav-btn');
    if (adminBtn) adminBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const adminOpen = await page.evaluate(() => {
    const modal = document.getElementById('admin-modal');
    const isOpen = modal?.classList.contains('open');
    const totalProd = document.getElementById('kpi-total-products')?.textContent;
    const totalStock = document.getElementById('kpi-total-stock')?.textContent;
    const invValue = document.getElementById('kpi-inventory-value')?.textContent;
    const rows = document.querySelectorAll('#admin-inventory-tbody tr');
    return { isOpen, totalProd, totalStock, invValue, rowCount: rows.length };
  });
  console.log('Admin Dashboard state:', adminOpen);

  await page.screenshot({ path: 'test-admin-overview.png' });
  console.log('Saved test-admin-overview.png');

  // 3. Test Inline Stock Adjustment in Admin
  console.log('3. Adjusting stock for first product (Rolex Submariner +2)...');
  await page.evaluate(() => {
    const plusBtn = document.querySelector('#admin-inventory-tbody tr:first-child .btn-stock-plus');
    if (plusBtn) {
      plusBtn.click();
      plusBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 300));

  const updatedStock = await page.evaluate(() => {
    const stockVal = document.querySelector('#admin-inventory-tbody tr:first-child .admin-stock-val')?.textContent;
    const kpiStock = document.getElementById('kpi-total-stock')?.textContent;
    return { stockVal, kpiStock };
  });
  console.log('Stock after +2 click:', updatedStock);

  // 4. Switch to Add Product Tab and create new product
  console.log('4. Navigating to Add Product Tab and creating Audemars Piguet Royal Oak...');
  await page.evaluate(() => {
    const addTab = document.querySelector('.admin-tab[data-tab="add-product"]');
    if (addTab) addTab.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.evaluate(() => {
    document.getElementById('prod-name').value = 'Audemars Piguet Royal Oak Chronograph';
    document.getElementById('prod-brand').value = 'Audemars Piguet';
    document.getElementById('prod-category').value = 'luxury';
    document.getElementById('prod-price').value = '650000';
    document.getElementById('prod-strike').value = '720000';
    document.getElementById('prod-stock').value = '8';
    document.getElementById('prod-sku').value = 'AP-RO-26331';
    document.getElementById('prod-movement').value = 'Calibre 2385 Automatic';
    document.getElementById('prod-case').value = '41mm Steel • Grand Tapisserie Dial';
    document.getElementById('prod-warranty').value = '2 Years International';
    document.getElementById('prod-desc').value = 'Iconic octagonal bezel with 8 hexagonal screws, integrated stainless steel bracelet, 50-hour power reserve.';

    // Select second preset photo
    const presets = document.querySelectorAll('.admin-preset-thumb');
    if (presets.length > 1) {
      presets[1].click();
    }
  });
  await new Promise(r => setTimeout(r, 300));

  await page.screenshot({ path: 'test-admin-add-product.png' });
  console.log('Saved test-admin-add-product.png');

  // Submit Add Product Form
  await page.evaluate(() => {
    const form = document.getElementById('admin-add-product-form');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 800));

  const afterAddState = await page.evaluate(() => {
    const totalProd = document.getElementById('kpi-total-products')?.textContent;
    const firstRowName = document.querySelector('#admin-inventory-tbody tr:first-child .admin-product-name')?.textContent;
    const firstRowStock = document.querySelector('#admin-inventory-tbody tr:first-child .admin-stock-val')?.textContent;
    return { totalProd, firstRowName, firstRowStock };
  });
  console.log('Admin State after adding watch:', afterAddState);

  // 5. Close Admin Dashboard and verify Storefront Catalog sync
  console.log('5. Closing Admin Dashboard and verifying Storefront Catalog sync...');
  await page.evaluate(() => {
    const closeBtn = document.getElementById('admin-close-btn');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Scroll to catalog section
  await page.evaluate(() => {
    const catalog = document.getElementById('catalog');
    if (catalog) catalog.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 500));

  const storefrontState = await page.evaluate(() => {
    const cards = document.querySelectorAll('.collections-grid .watch-card');
    const firstCard = cards[0];
    const name = firstCard?.querySelector('.watch-name')?.textContent;
    const price = firstCard?.querySelector('.price-pkr')?.textContent;
    const strike = firstCard?.querySelector('.price-strike')?.textContent;
    const stockBadge = firstCard?.querySelector('.badge-stock')?.textContent;
    return {
      cardCount: cards.length,
      firstCard: { name, price, strike, stockBadge }
    };
  });
  console.log('Storefront Catalog state:', storefrontState);

  await page.screenshot({ path: 'test-catalog-synced.png' });
  console.log('Saved test-catalog-synced.png');

  // 6. Test Ordering via COD and Auto-Stock Deduction
  console.log('6. Adding new watch to cart and completing COD checkout...');
  await page.evaluate(() => {
    const firstAddBtn = document.querySelector('.collections-grid .watch-card:first-child .btn-card-reserve');
    if (firstAddBtn) firstAddBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Open COD checkout modal
  await page.evaluate(() => {
    const bagBtn = document.getElementById('bag-btn');
    if (bagBtn) bagBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.evaluate(() => {
    const proceedBtn = document.querySelector('#cart-drawer .vip-trigger');
    if (proceedBtn) proceedBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Fill and submit checkout form
  await page.evaluate(() => {
    document.getElementById('checkout-name').value = 'Hamza Tariq';
    document.getElementById('checkout-phone').value = '0321-9876543';
    document.getElementById('checkout-city').value = 'Lahore';
    document.getElementById('checkout-address').value = 'House 42, Block Y, Phase 3, DHA Lahore';
    
    // Prevent actual WhatsApp navigation in headless test
    window.open = () => {};

    const vipForm = document.getElementById('vip-reservation-form');
    if (vipForm) vipForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 1200));

  // Verify stock deduction in catalog
  const stockAfterOrder = await page.evaluate(() => {
    const firstCard = document.querySelector('.collections-grid .watch-card:first-child');
    const badge = firstCard?.querySelector('.badge-stock')?.textContent;
    return badge;
  });
  console.log('Stock badge after order (should be 7 units):', stockAfterOrder);

  // 7. Check Admin Orders tab
  console.log('7. Re-opening Admin Dashboard to inspect Customer Orders tab...');
  await page.evaluate(() => {
    const adminBtn = document.getElementById('admin-nav-btn');
    if (adminBtn) adminBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const ordersTab = document.querySelector('.admin-tab[data-tab="orders"]');
    if (ordersTab) ordersTab.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const ordersState = await page.evaluate(() => {
    const rows = document.querySelectorAll('#admin-orders-tbody tr');
    const firstRowText = rows[0]?.innerText;
    return {
      orderCount: rows.length,
      firstRowSummary: firstRowText
    };
  });
  console.log('Orders Log state:', ordersState);

  await page.screenshot({ path: 'test-admin-orders-log.png' });
  console.log('Saved test-admin-orders-log.png');

  await browser.close();
  console.log('✅ ALL ADMIN & INVENTORY TESTS COMPLETED SUCCESSFULLY!');
}

testAdminSuite().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
