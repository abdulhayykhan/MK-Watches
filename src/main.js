import * as THREE from 'three';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import confetti from 'canvas-confetti';
import { PhotorealisticWatch } from './scene/PhotorealisticWatch.js';
import { ExplodedViewManager } from './scene/ExplodedViewManager.js';
import { inventoryManager, PRESET_IMAGE_OPTIONS } from './utils/inventory.js';

gsap.registerPlugin(ScrollTrigger);

class App {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    
    // Prevent browser auto-scroll restoration on reload
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    try {
      this.initLenis();
      this.initThree();
      this.initLighting();
      this.initParticles();
      this.initWatch();
      this.initExplodedManager();
      this.initUI();
      this.initCursor();
      this.initResize();
    } catch (err) {
      console.error('Initialization error in App:', err);
    } finally {
      this.initPreloader();
      this.animate();
    }
  }

  initLenis() {
    this.lenis = new Lenis({
      duration: 1.35,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.2,
      infinite: false
    });

    // Directly sync Lenis smooth scroll with GSAP ScrollTrigger
    this.lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 7.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.clock = new THREE.Clock();
  }

  initLighting() {
    // Soft Ambient
    const ambientLight = new THREE.AmbientLight(0xfff6eb, 1.1);
    this.scene.add(ambientLight);

    // Warm Key Spotlight (18K Gold Glow)
    this.keyLight = new THREE.SpotLight(0xfff0dd, 5.0, 30, Math.PI / 4, 0.4, 1.2);
    this.keyLight.position.set(4, 5, 6);
    this.keyLight.castShadow = true;
    this.scene.add(this.keyLight);

    // Cool Rim Spotlight (Reflections on Sapphire Crystal)
    this.rimLight = new THREE.SpotLight(0xdbe9f6, 4.2, 25, Math.PI / 3, 0.5, 1);
    this.rimLight.position.set(-5, -4, 4);
    this.scene.add(this.rimLight);

    // Top Rim Backlight for sapphire edge dispersion
    const backRim = new THREE.DirectionalLight(0xffe8ba, 2.5);
    backRim.position.set(0, 6, -4);
    this.scene.add(backRim);

    // Bottom Fill Light
    const bottomFill = new THREE.DirectionalLight(0x94a6b8, 1.2);
    bottomFill.position.set(0, -5, 2);
    this.scene.add(bottomFill);

    // UV Blacklight for Night Glow Mode
    this.uvLight = new THREE.PointLight(0x39ff14, 0, 10);
    this.uvLight.position.set(0, 0, 2);
    this.scene.add(this.uvLight);
  }

  initParticles() {
    // Golden micro-dust particles drifting in the spotlight
    const count = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      scales[i] = Math.random() * 0.04 + 0.015;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    // Particle Texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 240, 200, 1)');
    grad.addColorStop(0.5, 'rgba(212, 175, 55, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.16,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xf5d996
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  initWatch() {
    this.watch = new PhotorealisticWatch();
    this.scene.add(this.watch.root);

    // Initial position & scale handled responsively
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    const initScale = isMobile ? 0.50 : (isTablet ? 0.65 : 0.85);
    const initX = isMobile ? 0 : (isTablet ? 1.15 : 2.50);
    const initY = isMobile ? 0.88 : -0.05;

    this.watch.root.scale.setScalar(initScale);
    this.watch.root.position.set(initX, initY, 0);
    this.watch.root.rotation.set(0.12, -0.25, 0);
  }

  initExplodedManager() {
    this.explodedManager = new ExplodedViewManager(
      this.watch,
      this.camera,
      this.scene,
      this.canvas
    );
  }

  initCursor() {
    const cursor = document.querySelector('.custom-cursor');
    const follower = document.querySelector('.custom-cursor-follower');

    if (!cursor || !follower) return;

    // Check if device supports hover and fine pointer (disable on touch/mobile)
    const hasPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!hasPointer) {
      cursor.style.display = 'none';
      follower.style.display = 'none';
      return;
    }

    cursor.style.opacity = '0';
    follower.style.opacity = '0';
    cursor.style.pointerEvents = 'none';
    follower.style.pointerEvents = 'none';

    let mouseX = -200;
    let mouseY = -200;
    let followerX = -200;
    let followerY = -200;
    let hasMoved = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!hasMoved) {
        hasMoved = true;
        followerX = mouseX;
        followerY = mouseY;
        cursor.style.opacity = '1';
        follower.style.opacity = '1';
      }
      cursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    });

    document.documentElement.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
      follower.style.opacity = '0';
    });

    document.documentElement.addEventListener('mouseenter', () => {
      if (hasMoved) {
        cursor.style.opacity = '1';
        follower.style.opacity = '1';
      }
    });

    const updateFollower = () => {
      if (hasMoved) {
        followerX += (mouseX - followerX) * 0.18;
        followerY += (mouseY - followerY) * 0.18;
        follower.style.transform = `translate(${followerX - 19}px, ${followerY - 19}px)`;
      }
      requestAnimationFrame(updateFollower);
    };
    updateFollower();

    // Event delegation for all current and future interactive items
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('button, a, .part-card, .edition-btn, .strap-btn, input, select, .watch-card, .filter-tab')) {
        follower.classList.add('hovered');
      } else {
        follower.classList.remove('hovered');
      }
    });
  }

  initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const progressBar = document.querySelector('.loader-bar');
    const statusText = document.querySelector('.loader-status');

    let progress = 0;
    const interval = setInterval(() => {
      progress = Math.min(88, progress + Math.floor(Math.random() * 15) + 12);
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (statusText) statusText.textContent = `CONNECTING SHOWROOM... ${progress}%`;
    }, 60);

    const finishPreloader = () => {
      clearInterval(interval);
      if (progressBar) progressBar.style.width = '100%';
      if (statusText) statusText.textContent = 'CONNECTING COMPLETE';

      setTimeout(() => {
        preloader.classList.add('loaded');
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 800);

        // Intro watch entrance animation
        if (this.watch && this.watch.root) {
          gsap.from(this.watch.root.position, {
            z: -4,
            duration: 1.8,
            ease: 'power3.out'
          });
          gsap.from(this.watch.root.rotation, {
            y: Math.PI * 1.5,
            duration: 2.2,
            ease: 'power3.out'
          });
        }
      }, 350);
    };

    if (this.watch && this.watch.readyPromise) {
      this.watch.readyPromise.then(() => finishPreloader());
      // Failsafe timeout 2.5s
      setTimeout(finishPreloader, 2500);
    } else {
      setTimeout(finishPreloader, 600);
    }
  }

  initUI() {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    });

    // Theme Switcher Manager (Dark / White Mode)
    const themeBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('mk_theme') || 'dark';

    const setTheme = (theme) => {
      const isDark = theme === 'dark';
      document.body.classList.toggle('theme-dark', isDark);
      document.body.classList.toggle('theme-light', !isDark);

      // In white mode -> use logo-white.png; in dark mode -> use logo-black.png
      const logoFile = isDark ? 'logo-black.png' : 'logo-white.png';

      // Update navbar, preloader, and footer logos
      const navLogo = document.getElementById('nav-logo');
      if (navLogo) navLogo.src = logoFile;

      const preloaderLogo = document.getElementById('preloader-logo');
      if (preloaderLogo) preloaderLogo.src = logoFile;

      const footerLogo = document.getElementById('footer-logo');
      if (footerLogo) footerLogo.src = logoFile;

      const mobileDrawerLogo = document.getElementById('mobile-drawer-logo');
      if (mobileDrawerLogo) mobileDrawerLogo.src = logoFile;

      // Update site favicon
      const favicon = document.getElementById('site-favicon') || document.querySelector("link[rel*='icon']");
      if (favicon) favicon.href = logoFile;

      // Update button UI
      if (themeBtn) {
        const textSpan = themeBtn.querySelector('.theme-text');
        const sunIcon = themeBtn.querySelector('.theme-icon-sun');
        const moonIcon = themeBtn.querySelector('.theme-icon-moon');
        if (textSpan) textSpan.textContent = isDark ? 'DARK' : 'WHITE';
        if (sunIcon) sunIcon.style.display = isDark ? 'block' : 'none';
        if (moonIcon) moonIcon.style.display = isDark ? 'none' : 'block';
      }

      localStorage.setItem('mk_theme', theme);
    };

    setTheme(savedTheme);

    // Mobile Navigation Drawer Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-nav-drawer');
    const mobileClose = document.getElementById('mobile-nav-close');
    const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    const toggleMobileMenu = (open) => {
      if (!mobileDrawer || !mobileBackdrop) return;
      mobileDrawer.classList.toggle('open', open);
      mobileBackdrop.classList.toggle('open', open);
      document.body.classList.toggle('no-scroll', open);
    };

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        toggleMobileMenu(true);
      });
    }

    if (mobileClose) {
      mobileClose.addEventListener('click', () => {
        toggleMobileMenu(false);
      });
    }

    if (mobileBackdrop) {
      mobileBackdrop.addEventListener('click', () => {
        toggleMobileMenu(false);
      });
    }

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        toggleMobileMenu(false);
      });
    });

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const isCurrentLight = document.body.classList.contains('theme-light');
        const nextTheme = isCurrentLight ? 'dark' : 'light';
        setTheme(nextTheme);
      });
    }

    // Customizer Editions (Real Photography Switching in PKR)
    const editionBtns = document.querySelectorAll('.edition-btn');
    const priceDisplay = document.querySelector('.price-val');
    const prices = {
      imperial: 'Rs. 48,500',
      platinum: 'Rs. 58,000',
      emerald: 'Rs. 52,500',
      stealth: 'Rs. 44,000'
    };

    editionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        editionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const edition = btn.dataset.edition;
        this.watch.setEdition(edition);
        if (priceDisplay && prices[edition]) {
          priceDisplay.textContent = prices[edition];
        }
      });
    });

    // Strap Buttons
    const strapBtns = document.querySelectorAll('.strap-btn');
    strapBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        strapBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Night Mode Toggle (Super-LumiNova)
    const lumeToggle = document.getElementById('lume-toggle');
    if (lumeToggle) {
      lumeToggle.addEventListener('change', (e) => {
        const checked = e.target.checked;
        this.watch.setNightMode(checked);
        gsap.to(this.uvLight, {
          intensity: checked ? 2.5 : 0,
          duration: 0.4
        });
        gsap.to(this.keyLight, {
          intensity: checked ? 0.8 : 5.0,
          duration: 0.4
        });
      });
    }

    // Exploded View Part Cards click to scroll to tier
    const partCards = document.querySelectorAll('.part-card');
    partCards.forEach((card, idx) => {
      card.addEventListener('click', () => {
        const anatomySection = document.querySelector('.anatomy-section');
        if (anatomySection) {
          const rect = anatomySection.getBoundingClientRect();
          const targetY = window.scrollY + rect.top + (idx / partCards.length) * (rect.height - window.innerHeight);
          this.lenis.scrollTo(targetY, { duration: 1.2 });
        }
      });
    });

    // =========================================================================
    // INVENTORY MANAGEMENT, DYNAMIC CATALOG & COMMERCE SYSTEM
    // =========================================================================

    const formatPKR = (amount) => {
      return 'Rs. ' + Number(amount || 0).toLocaleString('en-PK');
    };

    // --- Dynamic Storefront Catalog Rendering ---
    const collectionsGrid = document.getElementById('collections-grid');
    const filterTabs = document.querySelectorAll('.catalog-filter-bar .filter-tab');
    let currentCatalogFilter = 'all';

    const renderCatalog = (filter = currentCatalogFilter) => {
      currentCatalogFilter = filter;
      const products = inventoryManager.getProducts();

      // Update Filter Counts
      const countAll = products.length;
      const countLuxury = products.filter(p => p.category === 'luxury').length;
      const countJapanese = products.filter(p => p.category === 'japanese').length;
      const countFashion = products.filter(p => p.category === 'fashion').length;
      const countBudget = products.filter(p => p.category === 'budget').length;

      const elAll = document.getElementById('filter-count-all');
      const elLux = document.getElementById('filter-count-luxury');
      const elJap = document.getElementById('filter-count-japanese');
      const elFash = document.getElementById('filter-count-fashion');
      const elBudg = document.getElementById('filter-count-budget');

      if (elAll) elAll.textContent = countAll;
      if (elLux) elLux.textContent = countLuxury;
      if (elJap) elJap.textContent = countJapanese;
      if (elFash) elFash.textContent = countFashion;
      if (elBudg) elBudg.textContent = countBudget;

      const filtered = filter === 'all' 
        ? products 
        : products.filter(p => p.category === filter);

      if (!collectionsGrid) return;

      if (filtered.length === 0) {
        collectionsGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
            <p style="font-family: var(--font-serif); font-size: 1.25rem; margin-bottom: 0.5rem;">No watches found in this category</p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Use the Admin Dashboard to add new timepieces.</p>
          </div>
        `;
        return;
      }

      collectionsGrid.innerHTML = filtered.map(p => {
        const stock = p.stock || 0;
        let stockBadgeHtml = '';
        if (stock > 5) {
          stockBadgeHtml = `<span class="badge-stock badge-in-stock">✓ In Stock (${stock} Units)</span>`;
        } else if (stock > 0) {
          stockBadgeHtml = `<span class="badge-stock badge-low-stock">⚠️ Only ${stock} Left</span>`;
        } else {
          stockBadgeHtml = `<span class="badge-stock badge-out-stock">❌ Out of Stock</span>`;
        }

        const isOutOfStock = stock <= 0;
        const discountHtml = p.discount ? `<span class="badge-discount">${p.discount}</span>` : '';
        const strikeHtml = p.strikePrice && p.strikePrice > p.price ? `<span class="price-strike">${formatPKR(p.strikePrice)}</span>` : '';

        const whatsappMsg = `Hello MK Watches Pakistan, I want to order the ${p.name} (${formatPKR(p.price)}) via Cash on Delivery (COD).`;

        return `
          <div class="watch-card" data-category="${p.category}" data-id="${p.id}">
            <div class="watch-preview-box">
              <div class="card-badges">
                <span class="badge-brand">${p.brand || 'MK WATCHES'}</span>
                ${discountHtml}
              </div>
              <img src="${p.img}" alt="${p.name}" class="watch-card-photo" loading="lazy" />
            </div>
            ${stockBadgeHtml}
            <div class="badge-cod">✓ Free Express Delivery + COD</div>
            <h3 class="watch-name">${p.name}</h3>
            <div class="watch-caliber">${p.caliber || 'Precision Engineered'}</div>
            <p class="part-desc" style="margin-bottom: 0.8rem;">${p.description || 'Authentic branded timepiece with full manufacturer warranty.'}</p>
            <div class="price-container">
              <span class="price-pkr">${formatPKR(p.price)}</span>
              ${strikeHtml}
            </div>
            <div class="card-actions-row">
              ${isOutOfStock 
                ? `<button class="btn-card-reserve btn-disabled" disabled>Out of Stock</button>` 
                : `<button class="btn-card-reserve" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-img="${p.img}">Add to Cart</button>`
              }
              <a href="https://wa.me/923001234567?text=${encodeURIComponent(whatsappMsg)}" target="_blank" class="btn-whatsapp-sm" title="Order on WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.13.555 4.133 1.528 5.875l-1.628 5.953 6.104-1.602c1.677.904 3.593 1.414 5.624 1.414 6.627 0 12-5.373 12-12s-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        `;
      }).join('');

      // Wire newly rendered Add to Cart buttons
      collectionsGrid.querySelectorAll('.btn-card-reserve:not(.btn-disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const name = btn.dataset.name;
          const price = Number(btn.dataset.price);
          const img = btn.dataset.img;

          const product = inventoryManager.getProductById(id);
          const availableStock = product ? (product.stock || 0) : 10;

          const existing = cart.find(i => i.id === id);
          if (existing) {
            if (existing.quantity >= availableStock) {
              alert(`Only ${availableStock} units available in stock for ${name}.`);
              return;
            }
            existing.quantity++;
          } else {
            if (availableStock <= 0) {
              alert(`Sorry, ${name} is out of stock!`);
              return;
            }
            cart.push({ id, name, price, img, quantity: 1 });
          }

          saveCart();
          updateCartUI();

          const prevText = btn.textContent;
          btn.textContent = 'ADDED TO CART ✓';
          btn.style.borderColor = '#28a745';
          btn.style.color = '#28a745';

          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#D4AF37', '#ECC880', '#25D366']
          });

          setTimeout(() => {
            btn.textContent = prevText;
            btn.style.borderColor = '';
            btn.style.color = '';
          }, 2000);
        });
      });
    };

    // Filter Tabs Click
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderCatalog(tab.dataset.filter);
      });
    });

    // Initial Catalog Render
    renderCatalog('all');

    // --- Shopping Cart & Pakistan COD State Management ---
    const bagBtn = document.getElementById('bag-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartClose = document.getElementById('cart-close');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartWhatsappBtn = document.getElementById('cart-whatsapp-checkout');
    const bagBadges = document.querySelectorAll('.bag-badge');

    let cart = [];
    try {
      const stored = localStorage.getItem('mk_pakistan_cart');
      if (stored) cart = JSON.parse(stored);
    } catch (e) {
      cart = [];
    }

    const saveCart = () => {
      try {
        localStorage.setItem('mk_pakistan_cart', JSON.stringify(cart));
      } catch (e) {}
    };

    const updateCartUI = () => {
      const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      bagBadges.forEach(badge => {
        badge.textContent = totalCount;
      });

      if (cartTotalPrice) {
        cartTotalPrice.textContent = formatPKR(totalPrice);
      }

      if (cartItemsContainer) {
        if (cart.length === 0) {
          cartItemsContainer.innerHTML = `
            <div id="cart-empty-state" style="margin: auto; text-align: center; padding: 2rem 1rem;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" stroke-width="1.5" style="margin-bottom: 1rem;">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <div style="font-family: var(--font-serif); font-size: 1.1rem; margin-bottom: 0.5rem; color: #fff;">YOUR CART IS EMPTY</div>
              <p style="font-size: 0.82rem; color: var(--text-muted); max-width: 260px; margin: 0 auto;">Select any watch and click "Add to Cart" to order with Cash on Delivery.</p>
            </div>
          `;
        } else {
          cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
              <img src="${item.img}" alt="${item.name}" class="cart-item-img" />
              <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${formatPKR(item.price)}</div>
                <div class="cart-item-controls">
                  <div class="cart-qty-group">
                    <button class="cart-qty-btn cart-qty-minus" data-id="${item.id}">-</button>
                    <span class="cart-qty-val">${item.quantity}</span>
                    <button class="cart-qty-btn cart-qty-plus" data-id="${item.id}">+</button>
                  </div>
                  <button class="cart-item-remove-btn" data-id="${item.id}" title="Remove item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          `).join('');

          cartItemsContainer.querySelectorAll('.cart-qty-plus').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.dataset.id;
              const item = cart.find(i => i.id === id);
              if (item) {
                const product = inventoryManager.getProductById(id);
                const maxStock = product ? (product.stock || 0) : 99;
                if (item.quantity + 1 > maxStock) {
                  alert(`Maximum stock reached (${maxStock} units).`);
                  return;
                }
                item.quantity++;
                saveCart();
                updateCartUI();
              }
            });
          });

          cartItemsContainer.querySelectorAll('.cart-qty-minus').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.dataset.id;
              const item = cart.find(i => i.id === id);
              if (item) {
                item.quantity--;
                if (item.quantity <= 0) {
                  cart = cart.filter(i => i.id !== id);
                }
                saveCart();
                updateCartUI();
              }
            });
          });

          cartItemsContainer.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.dataset.id;
              cart = cart.filter(i => i.id !== id);
              saveCart();
              updateCartUI();
            });
          });
        }
      }

      if (cartWhatsappBtn) {
        if (cart.length > 0) {
          const itemLines = cart.map(i => `• ${i.name} (Qty: ${i.quantity}) - ${formatPKR(i.price * i.quantity)}`).join('\n');
          const message = `Assalam-o-Alaikum MK Watches Pakistan,\n\nI want to place an order for the following watch(es) via Cash on Delivery (COD):\n\n${itemLines}\n\nTotal Amount: ${formatPKR(totalPrice)}\nDelivery: Free TCS Nationwide\nInspection: Open parcel check requested\n\nPlease confirm my order.`;
          cartWhatsappBtn.href = `https://wa.me/923001234567?text=${encodeURIComponent(message)}`;
        } else {
          cartWhatsappBtn.href = 'https://wa.me/923001234567?text=Assalam-o-Alaikum%20MK%20Watches%2C%20I%20want%20to%20inquire%20about%20ordering%20a%20watch%20via%20COD';
        }
      }
    };

    updateCartUI();

    if (bagBtn && cartDrawer) {
      bagBtn.addEventListener('click', () => {
        cartDrawer.classList.toggle('open');
      });
    }

    if (cartClose && cartDrawer) {
      cartClose.addEventListener('click', () => {
        cartDrawer.classList.remove('open');
      });
    }

    // --- VIP Modal / Pakistan Checkout Form Handlers ---
    const modal = document.getElementById('vip-modal');
    const modalTriggers = document.querySelectorAll('.vip-trigger');
    const modalClose = document.getElementById('modal-close');
    const vipForm = document.getElementById('vip-reservation-form');

    modalTriggers.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('open');
        if (cartDrawer) cartDrawer.classList.remove('open');
      });
    });

    if (modalClose) {
      modalClose.addEventListener('click', () => {
        modal.classList.remove('open');
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    if (vipForm) {
      vipForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('checkout-name')?.value || 'Valued Customer';
        const phone = document.getElementById('checkout-phone')?.value || '';
        const city = document.getElementById('checkout-city')?.value || 'Karachi';
        const address = document.getElementById('checkout-address')?.value || '';
        const payment = document.getElementById('checkout-payment')?.value || 'Cash on Delivery';
        const openParcel = document.getElementById('open-parcel-check')?.checked ? 'Yes (Open Parcel Inspection)' : 'Standard';

        // Collect order items & Deduct Stock from Inventory
        let orderItems = [];
        let orderDetails = '';
        let total = 0;

        if (cart.length > 0) {
          orderItems = [...cart];
          orderDetails = cart.map(i => `• ${i.name} (Qty: ${i.quantity}) - ${formatPKR(i.price * i.quantity)}`).join('\n');
          total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          // Deduct stock in real-time
          cart.forEach(item => {
            inventoryManager.deductStock(item.id, item.quantity);
          });
        } else {
          orderItems = [{ id: 'mk-signature-bespoke', name: 'MK Signature Watch (Customizer Edition)', price: 48500, quantity: 1 }];
          orderDetails = `• MK Signature Watch (Customizer Edition) - Rs. 48,500`;
          total = 48500;
        }

        // Record Order in Inventory Management Suite
        inventoryManager.addOrder({
          customer: { name, phone, city, address, payment, openParcel },
          items: orderItems,
          totalAmount: total
        });

        const whatsappOrderMsg = `🇵🇰 NEW CASH ON DELIVERY ORDER - MK WATCHES\n\n*Customer Details:*\n• Name: ${name}\n• WhatsApp: ${phone}\n• City: ${city}\n• Delivery Address: ${address}\n• Payment Mode: ${payment}\n• Open Parcel Check: ${openParcel}\n\n*Ordered Watches:*\n${orderDetails}\n\n*Total Payable:* ${formatPKR(total)}\n*Delivery:* Free TCS Express (2-3 Days)\n\nPlease confirm dispatch of my parcel.`;

        confetti({
          particleCount: 160,
          spread: 100,
          origin: { y: 0.55 },
          colors: ['#D4AF37', '#F5E2B3', '#FFFFFF', '#25D366']
        });

        const submitBtn = vipForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'ORDER PLACED & STOCK RESERVED ✓';
        submitBtn.style.background = '#28a745';
        submitBtn.style.color = '#fff';

        // Clear cart
        cart = [];
        saveCart();
        updateCartUI();

        // Open WhatsApp order chat
        setTimeout(() => {
          const waUrl = `https://wa.me/923001234567?text=${encodeURIComponent(whatsappOrderMsg)}`;
          window.open(waUrl, '_blank');

          modal.classList.remove('open');
          submitBtn.textContent = 'CONFIRM CASH ON DELIVERY ORDER';
          submitBtn.style.background = '';
          submitBtn.style.color = '';
          vipForm.reset();
        }, 1800);
      });
    }

    // =========================================================================
    // SECRET ADMIN PORTAL NAVIGATION & LIVE STOREFRONT SYNC
    // =========================================================================

    // 1. Secret Keyboard Shortcut (Ctrl + Shift + A or Alt + A)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        window.location.href = 'admin.html';
      }
    });

    // 2. Secret URL Hash / Query Parameter (#admin or ?admin)
    const checkUrlForAdmin = () => {
      if (window.location.hash === '#admin' || window.location.search.includes('admin')) {
        window.location.href = 'admin.html';
      }
    };
    window.addEventListener('hashchange', checkUrlForAdmin);
    checkUrlForAdmin();

    // 3. Secret Triple-Click on MK Watches Brand Logo
    const navLogo = document.getElementById('nav-logo');
    let logoClickCount = 0;
    let logoClickTimer = null;
    if (navLogo) {
      navLogo.addEventListener('click', (e) => {
        logoClickCount++;
        clearTimeout(logoClickTimer);
        if (logoClickCount >= 3) {
          e.preventDefault();
          logoClickCount = 0;
          window.location.href = 'admin.html';
        } else {
          logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 600);
        }
      });
    }

    // 4. Live Storefront Catalog Sync when modified in Admin Portal
    window.addEventListener('storage', (e) => {
      if (e.key === 'mk_watches_catalog' || !e.key) {
        renderCatalog(currentCatalogFilter);
      }
    });

    window.addEventListener('mk:inventory-updated', () => {
      renderCatalog(currentCatalogFilter);
    });

  }

  initResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    if (this.watch) {
      this.watch.update(delta, elapsedTime);
    }

    if (this.explodedManager) {
      this.explodedManager.update(delta);
    }

    if (this.particles) {
      this.particles.rotation.y = elapsedTime * 0.02;
      this.particles.rotation.x = Math.sin(elapsedTime * 0.01) * 0.1;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

function startApp() {
  try {
    new App();
  } catch (err) {
    console.error('Fatal error starting app:', err);
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('loaded');
      setTimeout(() => { preloader.style.display = 'none'; }, 600);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
