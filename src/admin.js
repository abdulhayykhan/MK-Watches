import confetti from 'canvas-confetti';
import { inventoryManager, PRESET_IMAGE_OPTIONS } from './utils/inventory.js';

// Format PKR Currency
const formatPKR = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(amount).replace('PKR', 'Rs.');
};

// Admin Valid Security PINs
const ADMIN_PINS = ['8286', 'admin123', 'admin'];

class AdminPortal {
  constructor() {
    this.currentSelectedImg = '/images/watch-rolex.jpg';
    this.activeTab = 'overview';
    this.initAuth();
    this.initClock();
    this.initTabs();
    this.initInventoryUI();
    this.initAddProductUI();
    this.initOrdersUI();
    this.initSettingsUI();
    this.initCrossTabSync();
  }

  // ==========================================
  // 1. AUTHENTICATION & SESSION MANAGEMENT
  // ==========================================
  initAuth() {
    this.loginView = document.getElementById('admin-login-view');
    this.dashboardView = document.getElementById('admin-dashboard-view');
    this.loginForm = document.getElementById('admin-login-form');
    this.passcodeInput = document.getElementById('admin-passcode');
    this.loginError = document.getElementById('admin-login-error');
    this.toggleEyeBtn = document.getElementById('toggle-pin-visibility');
    this.signoutBtn = document.getElementById('btn-admin-signout');

    // Check existing session
    const isAuth = sessionStorage.getItem('mk_admin_authenticated') === 'true';
    if (isAuth) {
      this.showDashboard();
    } else {
      this.showLogin();
    }

    // Toggle PIN visibility
    if (this.toggleEyeBtn && this.passcodeInput) {
      this.toggleEyeBtn.addEventListener('click', () => {
        const isPwd = this.passcodeInput.type === 'password';
        this.passcodeInput.type = isPwd ? 'text' : 'password';
      });
    }

    // Handle Login Form
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = this.passcodeInput.value.trim();
        if (ADMIN_PINS.includes(pin)) {
          sessionStorage.setItem('mk_admin_authenticated', 'true');
          if (this.loginError) this.loginError.style.display = 'none';
          this.passcodeInput.value = '';
          this.showDashboard();
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
        } else {
          if (this.loginError) this.loginError.style.display = 'block';
          this.passcodeInput.select();
        }
      });
    }

    // Handle Signout
    if (this.signoutBtn) {
      this.signoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('mk_admin_authenticated');
        this.showLogin();
      });
    }
  }

  showLogin() {
    if (this.loginView) this.loginView.style.display = 'flex';
    if (this.dashboardView) this.dashboardView.style.display = 'none';
    if (this.passcodeInput) this.passcodeInput.focus();
  }

  showDashboard() {
    if (this.loginView) this.loginView.style.display = 'none';
    if (this.dashboardView) this.dashboardView.style.display = 'block';
    this.refreshAll();
  }

  // ==========================================
  // 2. LIVE PKT TIME CLOCK
  // ==========================================
  initClock() {
    const clockEl = document.getElementById('clock-time');
    const updateTime = () => {
      if (clockEl) {
        clockEl.textContent = new Date().toLocaleTimeString('en-US', {
          timeZone: 'Asia/Karachi',
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  // ==========================================
  // 3. TAB NAVIGATION
  // ==========================================
  initTabs() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const gotoBtns = document.querySelectorAll('.btn-goto-tab');

    const switchTab = (tabId) => {
      this.activeTab = tabId;
      navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabId);
      });

      document.querySelectorAll('.admin-pane').forEach(pane => {
        pane.classList.remove('active');
      });

      const targetPane = document.getElementById(`pane-${tabId}`);
      if (targetPane) targetPane.classList.add('active');

      this.refreshAll();
    };

    navItems.forEach(item => {
      item.addEventListener('click', () => switchTab(item.dataset.tab));
    });

    gotoBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.target));
    });

    this.switchTab = switchTab;
  }

  // ==========================================
  // 4. INVENTORY & STOCK MANAGEMENT
  // ==========================================
  initInventoryUI() {
    this.tableBody = document.getElementById('inventory-table-body');
    this.searchInput = document.getElementById('admin-search-input');
    this.filterCat = document.getElementById('admin-filter-category');
    this.filterStock = document.getElementById('admin-filter-stock');

    // Edit modal elements
    this.editModal = document.getElementById('admin-edit-modal');
    this.editForm = document.getElementById('edit-product-form');
    this.closeEditBtn = document.getElementById('btn-close-edit');
    this.cancelEditBtn = document.getElementById('btn-cancel-edit');

    if (this.searchInput) this.searchInput.addEventListener('input', () => this.renderInventoryTable());
    if (this.filterCat) this.filterCat.addEventListener('change', () => this.renderInventoryTable());
    if (this.filterStock) this.filterStock.addEventListener('change', () => this.renderInventoryTable());

    // Edit Modal close handlers
    if (this.closeEditBtn) this.closeEditBtn.addEventListener('click', () => this.closeEditModal());
    if (this.cancelEditBtn) this.cancelEditBtn.addEventListener('click', () => this.closeEditModal());
    if (this.editModal) {
      this.editModal.addEventListener('click', (e) => {
        if (e.target === this.editModal) this.closeEditModal();
      });
    }

    // Edit Form submit
    if (this.editForm) {
      this.editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-prod-id')?.value;
        const name = document.getElementById('edit-prod-name')?.value;
        const price = Number(document.getElementById('edit-prod-price')?.value);
        const strikePrice = Number(document.getElementById('edit-prod-strike')?.value) || undefined;
        const stock = parseInt(document.getElementById('edit-prod-stock')?.value, 10) || 0;
        const sku = document.getElementById('edit-prod-sku')?.value;
        const caliber = document.getElementById('edit-prod-caliber')?.value;

        inventoryManager.updateProduct(id, {
          name,
          price,
          strikePrice,
          stock,
          sku,
          caliber
        });

        this.closeEditModal();
        this.refreshAll();
      });
    }
  }

  openEditModal(product) {
    if (!this.editModal) return;
    document.getElementById('edit-prod-id').value = product.id;
    document.getElementById('edit-prod-name').value = product.name;
    document.getElementById('edit-prod-price').value = product.price;
    document.getElementById('edit-prod-strike').value = product.strikePrice || '';
    document.getElementById('edit-prod-stock').value = product.stock || 0;
    document.getElementById('edit-prod-sku').value = product.sku || '';
    document.getElementById('edit-prod-caliber').value = product.caliber || '';
    this.editModal.classList.add('open');
  }

  closeEditModal() {
    if (this.editModal) this.editModal.classList.remove('open');
  }

  renderInventoryTable() {
    if (!this.tableBody) return;
    const products = inventoryManager.getProducts();
    const query = (this.searchInput?.value || '').toLowerCase().trim();
    const cat = this.filterCat?.value || 'all';
    const stockFilter = this.filterStock?.value || 'all';

    const filtered = products.filter(p => {
      const matchQuery = !query || 
        p.name.toLowerCase().includes(query) || 
        (p.brand && p.brand.toLowerCase().includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query));

      const matchCat = cat === 'all' || p.category === cat;

      let matchStock = true;
      const stock = p.stock || 0;
      if (stockFilter === 'in_stock') matchStock = stock > 5;
      else if (stockFilter === 'low_stock') matchStock = stock > 0 && stock <= 5;
      else if (stockFilter === 'out_of_stock') matchStock = stock === 0;

      return matchQuery && matchCat && matchStock;
    });

    if (filtered.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center-empty">
            No timepieces match your current search and filter settings.
          </td>
        </tr>
      `;
      return;
    }

    this.tableBody.innerHTML = filtered.map(p => {
      const stock = p.stock || 0;
      let badgeHtml = '';
      if (stock > 5) {
        badgeHtml = `<span class="badge-stock badge-in-stock">In Stock (${stock})</span>`;
      } else if (stock > 0) {
        badgeHtml = `<span class="badge-stock badge-low-stock">Low Stock (${stock})</span>`;
      } else {
        badgeHtml = `<span class="badge-stock badge-out-stock">Out of Stock</span>`;
      }

      return `
        <tr data-id="${p.id}">
          <td>
            <div class="product-cell">
              <img src="${p.img}" alt="${p.name}" class="product-thumb" />
              <div class="product-meta">
                <span class="product-name">${p.name}</span>
                <span class="product-sub">${p.brand || 'MK Watches'} • <span class="product-sku">SKU: ${p.sku || 'N/A'}</span></span>
              </div>
            </div>
          </td>
          <td>
            <span style="text-transform: capitalize; color: var(--text-muted);">${p.category}</span>
          </td>
          <td>
            <strong style="color: var(--gold-light);">${formatPKR(p.price)}</strong>
            ${p.strikePrice && p.strikePrice > p.price ? `<div style="text-decoration: line-through; font-size: 0.72rem; color: var(--text-dim);">${formatPKR(p.strikePrice)}</div>` : ''}
          </td>
          <td>
            <div class="stock-control-wrap">
              <button class="btn-stock-adj btn-minus" data-id="${p.id}">-</button>
              <span class="stock-value">${stock}</span>
              <button class="btn-stock-adj btn-plus" data-id="${p.id}">+</button>
            </div>
          </td>
          <td>${badgeHtml}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.4rem;">
              <button class="action-btn-sm btn-edit" data-id="${p.id}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                <span>Edit</span>
              </button>
              <button class="action-btn-sm action-btn-danger btn-del" data-id="${p.id}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Wire table button events
    this.tableBody.querySelectorAll('.btn-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        inventoryManager.adjustStock(btn.dataset.id, 1);
        this.refreshAll();
      });
    });

    this.tableBody.querySelectorAll('.btn-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        inventoryManager.adjustStock(btn.dataset.id, -1);
        this.refreshAll();
      });
    });

    this.tableBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = inventoryManager.getProductById(btn.dataset.id);
        if (product) this.openEditModal(product);
      });
    });

    this.tableBody.querySelectorAll('.btn-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = inventoryManager.getProductById(btn.dataset.id);
        if (product && confirm(`Remove "${product.name}" from public store catalog?`)) {
          inventoryManager.deleteProduct(btn.dataset.id);
          this.refreshAll();
        }
      });
    });
  }

  // ==========================================
  // 5. ADD PRODUCT WITH IMAGES
  // ==========================================
  initAddProductUI() {
    this.addForm = document.getElementById('add-product-form');
    this.imgPreview = document.getElementById('form-img-preview');
    this.fileInput = document.getElementById('prod-file-input');
    this.dropzone = document.getElementById('upload-dropzone');
    this.imgUrlInput = document.getElementById('prod-img-url');
    this.presetGallery = document.getElementById('admin-preset-gallery');

    // Preset gallery
    if (this.presetGallery) {
      this.presetGallery.innerHTML = PRESET_IMAGE_OPTIONS.map((item, idx) => `
        <div class="preset-thumb ${idx === 0 ? 'selected' : ''}" data-path="${item.path}" title="${item.label}">
          <img src="${item.path}" alt="${item.label}" />
        </div>
      `).join('');

      this.presetGallery.querySelectorAll('.preset-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
          this.presetGallery.querySelectorAll('.preset-thumb').forEach(t => t.classList.remove('selected'));
          thumb.classList.add('selected');
          const path = thumb.dataset.path;
          this.currentSelectedImg = path;
          if (this.imgPreview) this.imgPreview.src = path;
          if (this.imgUrlInput) this.imgUrlInput.value = '';
        });
      });
    }

    // File upload
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.currentSelectedImg = event.target.result;
            if (this.imgPreview) this.imgPreview.src = this.currentSelectedImg;
            if (this.presetGallery) {
              this.presetGallery.querySelectorAll('.preset-thumb').forEach(t => t.classList.remove('selected'));
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Direct URL input
    if (this.imgUrlInput) {
      this.imgUrlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
          this.currentSelectedImg = url;
          if (this.imgPreview) this.imgPreview.src = url;
          if (this.presetGallery) {
            this.presetGallery.querySelectorAll('.preset-thumb').forEach(t => t.classList.remove('selected'));
          }
        }
      });
    }

    // Form submit
    if (this.addForm) {
      this.addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('prod-name')?.value;
        const brand = document.getElementById('prod-brand')?.value;
        const category = document.getElementById('prod-category')?.value;
        const price = Number(document.getElementById('prod-price')?.value);
        const strikePrice = Number(document.getElementById('prod-strike')?.value) || undefined;
        const stock = parseInt(document.getElementById('prod-stock')?.value, 10) || 0;
        const sku = document.getElementById('prod-sku')?.value;
        const movement = document.getElementById('prod-movement')?.value;
        const caseSpecs = document.getElementById('prod-case')?.value;
        const warranty = document.getElementById('prod-warranty')?.value;
        const desc = document.getElementById('prod-desc')?.value;

        inventoryManager.addProduct({
          name,
          brand,
          category,
          price,
          strikePrice,
          stock,
          sku,
          movement,
          caseSpecs,
          warranty,
          description: desc,
          caliber: `${movement || 'Automatic Movement'} • ${caseSpecs || 'Stainless Steel'}`,
          img: this.currentSelectedImg || '/images/watch-rolex.jpg'
        });

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        this.addForm.reset();
        this.switchTab('inventory');
      });
    }
  }

  // ==========================================
  // 6. ORDERS & COD DELIVERY MANAGEMENT
  // ==========================================
  initOrdersUI() {
    this.ordersTableBody = document.getElementById('orders-table-body');
    this.overviewOrdersBody = document.getElementById('overview-orders-tbody');
    this.exportCsvBtn = document.getElementById('btn-export-csv');

    if (this.exportCsvBtn) {
      this.exportCsvBtn.addEventListener('click', () => this.exportOrdersCSV());
    }
  }

  renderOrdersTable() {
    const orders = inventoryManager.getOrders();

    // Render in Overview
    if (this.overviewOrdersBody) {
      if (orders.length === 0) {
        this.overviewOrdersBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center-empty">No orders placed yet. Customer COD orders will appear here automatically.</td>
          </tr>
        `;
      } else {
        this.overviewOrdersBody.innerHTML = orders.slice(0, 5).map(o => `
          <tr>
            <td><strong style="color: var(--gold-light);">${o.orderNumber || o.id}</strong></td>
            <td>${o.customer.name || 'Valued Client'}</td>
            <td>${o.customer.city || 'Karachi'}</td>
            <td>${(o.items || []).map(i => `${i.name} (x${i.quantity})`).join(', ')}</td>
            <td><strong>${formatPKR(o.totalAmount)}</strong></td>
            <td><span class="badge-stock badge-in-stock">${o.status || 'Confirmed'}</span></td>
          </tr>
        `).join('');
      }
    }

    // Render in Dedicated Orders Pane
    if (this.ordersTableBody) {
      if (orders.length === 0) {
        this.ordersTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center-empty">No nationwide Cash on Delivery orders recorded yet.</td>
          </tr>
        `;
        return;
      }

      this.ordersTableBody.innerHTML = orders.map(o => {
        const orderDate = new Date(o.timestamp).toLocaleString('en-PK', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });

        const statusOptions = [
          'Pending Verification',
          'Confirmed (TCS Dispatch Pending)',
          'In Transit via TCS Express',
          'Delivered & Collected',
          'Cancelled / Returned'
        ];

        const selectOptionsHtml = statusOptions.map(opt => `
          <option value="${opt}" ${o.status === opt ? 'selected' : ''}>${opt}</option>
        `).join('');

        const cleanPhone = (o.customer.phone || '').replace(/[^0-9]/g, '');
        const waLink = cleanPhone ? `https://wa.me/92${cleanPhone.replace(/^0/, '')}` : '#';

        return `
          <tr data-id="${o.id}">
            <td>
              <div style="font-weight: 700; color: var(--gold-light);">${o.orderNumber || o.id}</div>
              <div style="font-size: 0.72rem; color: var(--text-dim);">${orderDate}</div>
            </td>
            <td>
              <div style="font-weight: 600; color: #fff;">${o.customer.name || 'Valued Customer'}</div>
              <div style="font-size: 0.75rem;">
                <a href="${waLink}" target="_blank" style="color: #25D366; text-decoration: none;">📱 ${o.customer.phone || 'N/A'}</a>
              </div>
            </td>
            <td>
              <div style="font-weight: 600;">${o.customer.city || 'Karachi'}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); max-width: 220px;">${o.customer.address || ''}</div>
            </td>
            <td>
              ${(o.items || []).map(i => `
                <div style="font-size: 0.78rem; margin-bottom: 2px;">
                  • <strong>${i.name}</strong> <span style="color: var(--gold-primary);">x${i.quantity}</span>
                </div>
              `).join('')}
            </td>
            <td>
              <div style="font-weight: 700; color: var(--gold-light);">${formatPKR(o.totalAmount)}</div>
              <div style="font-size: 0.68rem; color: #25D366;">${o.customer.payment || 'Cash on Delivery'}</div>
            </td>
            <td>
              <select class="order-status-dropdown" data-id="${o.id}">
                ${selectOptionsHtml}
              </select>
            </td>
          </tr>
        `;
      }).join('');

      this.ordersTableBody.querySelectorAll('.order-status-dropdown').forEach(sel => {
        sel.addEventListener('change', () => {
          inventoryManager.updateOrderStatus(sel.dataset.id, sel.value);
          this.refreshAll();
        });
      });
    }
  }

  exportOrdersCSV() {
    const orders = inventoryManager.getOrders();
    if (orders.length === 0) {
      alert('No orders available to export.');
      return;
    }

    const headers = ['Order #', 'Date', 'Customer Name', 'Phone', 'City', 'Delivery Address', 'Items', 'Total PKR', 'Payment Mode', 'Status'];
    const rows = orders.map(o => [
      o.orderNumber || o.id,
      new Date(o.timestamp).toISOString(),
      `"${(o.customer.name || '').replace(/"/g, '""')}"`,
      `"${o.customer.phone || ''}"`,
      `"${o.customer.city || ''}"`,
      `"${(o.customer.address || '').replace(/"/g, '""')}"`,
      `"${(o.items || []).map(i => `${i.name} (x${i.quantity})`).join('; ')}"`,
      o.totalAmount,
      `"${o.customer.payment || ''}"`,
      `"${o.status || ''}"`
    ]);

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `MK_Watches_Orders_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==========================================
  // 7. SETTINGS & SYSTEM UTILITIES
  // ==========================================
  initSettingsUI() {
    const backupBtn = document.getElementById('btn-backup-json');
    const resetFactoryBtn = document.getElementById('btn-reset-factory');

    if (backupBtn) {
      backupBtn.addEventListener('click', () => {
        const data = {
          products: inventoryManager.getProducts(),
          orders: inventoryManager.getOrders(),
          exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MK_Watches_Backup_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    }

    if (resetFactoryBtn) {
      resetFactoryBtn.addEventListener('click', () => {
        if (confirm('Reset store catalog to original 8 factory default models? Any custom added timepieces will be reset.')) {
          inventoryManager.resetToDefaults();
          this.refreshAll();
          alert('Store catalog reset to default 8 factory models.');
        }
      });
    }
  }

  // ==========================================
  // 8. KPI BADGES & REFRESH LOGIC
  // ==========================================
  refreshKPIs() {
    const kpis = inventoryManager.getKPIs();
    const elProds = document.getElementById('kpi-total-prods');
    const elStock = document.getElementById('kpi-total-stock');
    const elLow = document.getElementById('kpi-low-stock');
    const elOut = document.getElementById('kpi-out-stock');
    const elValue = document.getElementById('kpi-inv-value');
    const elOrders = document.getElementById('kpi-orders-count');
    const badgeProds = document.getElementById('badge-total-prods');
    const badgeOrders = document.getElementById('badge-total-orders');

    if (elProds) elProds.textContent = kpis.totalProducts;
    if (elStock) elStock.textContent = kpis.totalStock;
    if (elLow) elLow.textContent = kpis.lowStockCount;
    if (elOut) elOut.textContent = kpis.outOfStockCount;
    if (elValue) elValue.textContent = formatPKR(kpis.inventoryValuePKR);
    if (elOrders) elOrders.textContent = kpis.totalOrders;

    if (badgeProds) badgeProds.textContent = kpis.totalProducts;
    if (badgeOrders) badgeOrders.textContent = kpis.totalOrders;
  }

  refreshAll() {
    this.refreshKPIs();
    this.renderInventoryTable();
    this.renderOrdersTable();
  }

  // ==========================================
  // 9. CROSS-TAB & MULTI-WINDOW SYNC
  // ==========================================
  initCrossTabSync() {
    window.addEventListener('storage', () => {
      this.refreshAll();
    });

    window.addEventListener('mk:inventory-updated', () => {
      this.refreshAll();
    });

    window.addEventListener('mk:orders-updated', () => {
      this.refreshAll();
    });
  }
}

// Bootstrap Admin Portal
document.addEventListener('DOMContentLoaded', () => {
  new AdminPortal();
});
