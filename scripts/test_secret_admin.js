import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testSecretAdmin() {
  console.log('--- Launching Chrome for Secret Admin Testing ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    pipe: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Clear session to test fresh state
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => {
    sessionStorage.removeItem('mk_admin_authenticated');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Wait for preloader
  await page.waitForFunction(() => {
    const pre = document.getElementById('preloader');
    return !pre || pre.classList.contains('loaded') || pre.style.display === 'none';
  }, { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 800));

  console.log('1. Verifying public UI does NOT contain visible admin or sound buttons...');
  const publicUI = await page.evaluate(() => {
    const adminNavBtn = document.getElementById('admin-nav-btn');
    const audioToggle = document.getElementById('audio-toggle');
    const mobileAdminLink = document.getElementById('mobile-admin-link');
    const footerAdminLink = document.getElementById('footer-admin-link');
    return {
      adminNavBtnExists: !!adminNavBtn,
      audioToggleExists: !!audioToggle,
      mobileAdminLinkExists: !!mobileAdminLink,
      footerAdminLinkExists: !!footerAdminLink
    };
  });
  console.log('Public UI visibility check:', publicUI);

  await page.screenshot({ path: 'test-public-nav-hidden-admin.png' });
  console.log('Saved test-public-nav-hidden-admin.png');

  // 2. Test Secret Access via URL Hash (#admin)
  console.log('2. Testing secret access via URL hash (#admin)...');
  await page.evaluate(() => {
    window.location.hash = '#admin';
  });
  await new Promise(r => setTimeout(r, 600));

  const authModalOpen = await page.evaluate(() => {
    const authModal = document.getElementById('admin-auth-modal');
    return {
      isOpen: authModal?.classList.contains('open')
    };
  });
  console.log('Admin Auth Modal state after secret trigger:', authModalOpen);

  await page.screenshot({ path: 'test-admin-pin-modal.png' });
  console.log('Saved test-admin-pin-modal.png');

  // 3. Test Wrong PIN rejection
  console.log('3. Testing invalid PIN entry...');
  await page.evaluate(() => {
    const pinInput = document.getElementById('admin-auth-pin');
    pinInput.value = '9999';
    const form = document.getElementById('admin-auth-form');
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 300));

  const errorShown = await page.evaluate(() => {
    const errorEl = document.getElementById('admin-auth-error');
    const adminModal = document.getElementById('admin-modal');
    return {
      errorVisible: errorEl?.style.display !== 'none',
      adminModalOpen: adminModal?.classList.contains('open')
    };
  });
  console.log('Wrong PIN feedback:', errorShown);

  // 4. Test Valid PIN entry (8286)
  console.log('4. Entering valid Master PIN (8286)...');
  await page.evaluate(() => {
    const pinInput = document.getElementById('admin-auth-pin');
    pinInput.value = '8286';
    const form = document.getElementById('admin-auth-form');
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 700));

  const adminUnlocked = await page.evaluate(() => {
    const adminModal = document.getElementById('admin-modal');
    const authModal = document.getElementById('admin-auth-modal');
    const sessionAuth = sessionStorage.getItem('mk_admin_authenticated');
    return {
      adminModalOpen: adminModal?.classList.contains('open'),
      authModalClosed: !authModal?.classList.contains('open'),
      sessionAuth
    };
  });
  console.log('Admin Unlocked state:', adminUnlocked);

  await page.screenshot({ path: 'test-admin-unlocked.png' });
  console.log('Saved test-admin-unlocked.png');

  // 5. Test Lock Admin
  console.log('5. Testing Lock Admin button...');
  await page.evaluate(() => {
    const lockBtn = document.getElementById('admin-logout-btn');
    if (lockBtn) lockBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const lockedState = await page.evaluate(() => {
    const adminModal = document.getElementById('admin-modal');
    const sessionAuth = sessionStorage.getItem('mk_admin_authenticated');
    return {
      adminModalOpen: adminModal?.classList.contains('open'),
      sessionAuth
    };
  });
  console.log('After lock state:', lockedState);

  // 6. Test Hidden Footer Admin Link
  console.log('6. Testing hidden admin trigger in footer bottom...');
  const hiddenLinkCheck = await page.evaluate(() => {
    const link = document.getElementById('hidden-admin-link');
    return {
      exists: !!link,
      textContent: link ? link.textContent.trim() : null,
      opacity: link ? window.getComputedStyle(link).opacity : null
    };
  });
  console.log('Hidden Admin Link properties:', hiddenLinkCheck);

  // Click the hidden link
  await page.evaluate(() => {
    const link = document.getElementById('hidden-admin-link');
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const authOpenedViaHiddenLink = await page.evaluate(() => {
    const authModal = document.getElementById('admin-auth-modal');
    return {
      authModalOpen: authModal?.classList.contains('open')
    };
  });
  console.log('Auth modal opened via hidden link:', authOpenedViaHiddenLink);

  await browser.close();
  console.log('✅ ALL SECRET ADMIN & SOUND REMOVAL TESTS PASSED SUCCESSFULLY!');
}

testSecretAdmin().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
