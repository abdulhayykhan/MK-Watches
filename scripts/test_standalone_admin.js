import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testStandaloneAdmin() {
  console.log('--- Launching Chrome for Standalone Admin Site Testing ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    pipe: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // ============================================================
  // STEP 1: Verify Public Storefront (index.html)
  // ============================================================
  console.log('\n--- STEP 1: Verifying Public Storefront (index.html) ---');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  const storefrontChecks = await page.evaluate(() => {
    return {
      adminNavBtnExists: !!document.getElementById('admin-nav-btn'),
      audioToggleExists: !!document.getElementById('audio-toggle'),
      mobileAdminLinkExists: !!document.getElementById('mobile-admin-link'),
      footerAdminLinkExists: !!document.getElementById('footer-admin-link'),
      adminModalInIndex: !!document.getElementById('admin-modal'),
      adminAuthModalInIndex: !!document.getElementById('admin-auth-modal'),
      hiddenLinkExists: !!document.getElementById('hidden-admin-link'),
      hiddenLinkHref: document.getElementById('hidden-admin-link')?.getAttribute('href'),
      hiddenLinkText: document.getElementById('hidden-admin-link')?.textContent.trim()
    };
  });

  console.log('Storefront verification:', storefrontChecks);
  if (storefrontChecks.adminModalInIndex) {
    throw new Error('Admin modal still exists in index.html!');
  }
  if (storefrontChecks.adminNavBtnExists) {
    throw new Error('Admin nav button is still visible in storefront!');
  }

  await page.screenshot({ path: 'test-storefront-clean.png' });
  console.log('Saved test-storefront-clean.png');

  // ============================================================
  // STEP 2: Navigate to Standalone Admin Site (admin.html)
  // ============================================================
  console.log('\n--- STEP 2: Navigating to Standalone Admin Site (admin.html) ---');
  // Clear session to test unauthorized access
  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => sessionStorage.removeItem('mk_admin_authenticated'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  const authScreenState = await page.evaluate(() => {
    const loginView = document.getElementById('admin-login-view');
    const dashboardView = document.getElementById('admin-dashboard-view');
    return {
      loginViewVisible: window.getComputedStyle(loginView).display !== 'none',
      dashboardViewHidden: window.getComputedStyle(dashboardView).display === 'none'
    };
  });

  console.log('Initial Auth Screen State (Unauthorized user):', authScreenState);
  if (!authScreenState.loginViewVisible || !authScreenState.dashboardViewHidden) {
    throw new Error('Dashboard was accessible without authentication!');
  }

  await page.screenshot({ path: 'test-admin-site-login-screen.png' });
  console.log('Saved test-admin-site-login-screen.png');

  // ============================================================
  // STEP 3: Test Wrong PIN Rejection
  // ============================================================
  console.log('\n--- STEP 3: Testing Unauthorized PIN (9999) ---');
  await page.evaluate(() => {
    const input = document.getElementById('admin-passcode');
    input.value = '9999';
    const form = document.getElementById('admin-login-form');
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 400));

  const invalidFeedback = await page.evaluate(() => {
    const errorEl = document.getElementById('admin-login-error');
    const dashboardView = document.getElementById('admin-dashboard-view');
    return {
      errorDisplayed: window.getComputedStyle(errorEl).display !== 'none',
      errorText: errorEl.textContent.trim(),
      dashboardStillHidden: window.getComputedStyle(dashboardView).display === 'none'
    };
  });

  console.log('Invalid PIN response:', invalidFeedback);
  if (!invalidFeedback.errorDisplayed || !invalidFeedback.dashboardStillHidden) {
    throw new Error('Invalid PIN was not rejected properly!');
  }

  // ============================================================
  // STEP 4: Authenticate with Master PIN (8286)
  // ============================================================
  console.log('\n--- STEP 4: Entering Master Security PIN (8286) ---');
  await page.evaluate(() => {
    const input = document.getElementById('admin-passcode');
    input.value = '8286';
    const form = document.getElementById('admin-login-form');
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 800));

  const dashboardState = await page.evaluate(() => {
    const loginView = document.getElementById('admin-login-view');
    const dashboardView = document.getElementById('admin-dashboard-view');
    const totalProds = document.getElementById('kpi-total-prods')?.textContent.trim();
    const totalStock = document.getElementById('kpi-total-stock')?.textContent.trim();
    const invValue = document.getElementById('kpi-inv-value')?.textContent.trim();
    const tableRows = document.querySelectorAll('#inventory-table-body tr').length;
    return {
      loginViewHidden: window.getComputedStyle(loginView).display === 'none',
      dashboardViewVisible: window.getComputedStyle(dashboardView).display === 'block',
      totalProds,
      totalStock,
      invValue,
      tableRows
    };
  });

  console.log('Unlocked Dashboard State:', dashboardState);
  if (!dashboardState.dashboardViewVisible) {
    throw new Error('Dashboard failed to open after entering correct PIN!');
  }

  await page.screenshot({ path: 'test-admin-site-dashboard-unlocked.png' });
  console.log('Saved test-admin-site-dashboard-unlocked.png');

  // ============================================================
  // STEP 5: Test Tab Switching & Adding Product
  // ============================================================
  console.log('\n--- STEP 5: Testing Tab Navigation to Inventory & Add Product ---');
  // Switch to Inventory tab
  await page.evaluate(() => {
    const tab = document.querySelector('.nav-item[data-tab="inventory"]');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const inventoryTabActive = await page.evaluate(() => {
    const pane = document.getElementById('pane-inventory');
    return pane?.classList.contains('active');
  });
  console.log('Inventory pane active:', inventoryTabActive);

  // Switch to Add Product tab
  await page.evaluate(() => {
    const tab = document.querySelector('.nav-item[data-tab="add-product"]');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const addProductTabActive = await page.evaluate(() => {
    const pane = document.getElementById('pane-add-product');
    const presetsCount = document.querySelectorAll('#admin-preset-gallery .preset-thumb').length;
    return {
      paneActive: pane?.classList.contains('active'),
      presetsCount
    };
  });
  console.log('Add Product pane state:', addProductTabActive);

  await page.screenshot({ path: 'test-admin-site-add-product.png' });
  console.log('Saved test-admin-site-add-product.png');

  // ============================================================
  // STEP 6: Test Lock Admin Signout
  // ============================================================
  console.log('\n--- STEP 6: Testing Lock Admin Signout ---');
  await page.evaluate(() => {
    const signoutBtn = document.getElementById('btn-admin-signout');
    if (signoutBtn) signoutBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const afterSignoutState = await page.evaluate(() => {
    const loginView = document.getElementById('admin-login-view');
    const dashboardView = document.getElementById('admin-dashboard-view');
    const sessionAuth = sessionStorage.getItem('mk_admin_authenticated');
    return {
      loginViewVisible: window.getComputedStyle(loginView).display !== 'none',
      dashboardViewHidden: window.getComputedStyle(dashboardView).display === 'none',
      sessionAuth
    };
  });

  console.log('After Signout State:', afterSignoutState);
  if (!afterSignoutState.loginViewVisible || afterSignoutState.sessionAuth !== null) {
    throw new Error('Signout failed to lock admin session!');
  }

  await browser.close();
  console.log('\n🎉 ALL STANDALONE ADMIN SITE TESTS PASSED WITH 100% SUCCESS!');
}

testStandaloneAdmin().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
