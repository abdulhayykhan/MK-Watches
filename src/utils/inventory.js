// MK Watches Pakistan - Inventory & Order Management System
// Real-time localStorage persistence with custom event dispatching

export const DEFAULT_PRODUCTS = [
  {
    id: 'rolex-submariner-date',
    name: 'Rolex Submariner Date',
    brand: 'Rolex',
    category: 'luxury',
    price: 485000,
    strikePrice: 520000,
    discount: '-7% OFF',
    caliber: 'Black Ceramic Bezel • 904L Oystersteel',
    description: 'Swiss Automatic 3235 movement, 300M water resistance, Cyclops date magnifier.',
    img: '/images/watch-rolex.jpg',
    stock: 4,
    sku: 'ROL-SUB-3235',
    movement: 'Swiss Automatic 3235',
    caseSpecs: '41mm Oystersteel 904L',
    waterResistance: '300M / 1000ft',
    warranty: '2 Years International'
  },
  {
    id: 'tissot-prx-powermatic-80',
    name: 'Tissot PRX Powermatic 80',
    brand: 'Tissot',
    category: 'luxury',
    price: 185000,
    strikePrice: 210000,
    discount: '-12% OFF',
    caliber: 'Ice Blue Waffle Dial • Swiss Automatic',
    description: '80-hour power reserve, Nivachron balance spring, integrated steel bracelet.',
    img: '/images/watch-tissot.jpg',
    stock: 7,
    sku: 'TIS-PRX-P80-BL',
    movement: 'Powermatic 80.111',
    caseSpecs: '40mm 316L Stainless Steel',
    waterResistance: '100M / 330ft',
    warranty: '2 Years Official'
  },
  {
    id: 'mk-lexington-chronograph',
    name: 'MK Lexington Chronograph',
    brand: 'Michael Kors',
    category: 'fashion',
    price: 48500,
    strikePrice: 62000,
    discount: '-22% OFF',
    caliber: '18K Rose Gold Finish • Obsidian Dial',
    description: 'Triple-register chronograph, date window at 4:30, hand-stitched alligator strap.',
    img: '/images/edition-imperial.jpg',
    stock: 12,
    sku: 'MK-LEX-8286',
    movement: 'Precision Japanese Quartz',
    caseSpecs: '44mm PVD Rose Gold',
    waterResistance: '50M / 165ft',
    warranty: '1 Year Warranty'
  },
  {
    id: 'casio-edifice-chronograph',
    name: 'Casio Edifice Chronograph',
    brand: 'Casio Edifice',
    category: 'japanese',
    price: 28500,
    strikePrice: 35000,
    discount: '-19% OFF',
    caliber: 'Navy Blue Sunburst • Japanese Quartz',
    description: '1/10th second stopwatch, sapphire crystal glass, 100M water resistance.',
    img: '/images/watch-casio.jpg',
    stock: 15,
    sku: 'CAS-EF-550D',
    movement: 'Miyota Japanese Quartz',
    caseSpecs: '43mm Stainless Steel',
    waterResistance: '100M',
    warranty: '1 Year Official Casio'
  },
  {
    id: 'omega-seamaster-aqua-terra',
    name: 'Omega Seamaster Aqua Terra',
    brand: 'Omega',
    category: 'luxury',
    price: 320000,
    strikePrice: 360000,
    discount: '-11% OFF',
    caliber: 'Glacier Navy • Co-Axial Master Chronometer',
    description: 'METAS certified, antimagnetic to 15,000 gauss, solid steel bracelet.',
    img: '/images/edition-platinum.jpg',
    stock: 3,
    sku: 'OMG-SEA-8900',
    movement: 'Omega Master Chronometer 8900',
    caseSpecs: '41mm Steel with Teak Dial',
    waterResistance: '150M',
    warranty: '5 Years International'
  },
  {
    id: 'seiko-presage-cocktail-time',
    name: 'Seiko Presage Cocktail Time',
    brand: 'Seiko',
    category: 'japanese',
    price: 68000,
    strikePrice: 82000,
    discount: '-17% OFF',
    caliber: 'Emerald Green Sunburst • Automatic 4R35',
    description: 'Box-shaped Hardlex crystal, exhibition caseback, tan calfskin leather strap.',
    img: '/images/edition-emerald.jpg',
    stock: 6,
    sku: 'SEI-SRPB43',
    movement: 'Seiko 4R35 Automatic',
    caseSpecs: '40.5mm Polished Steel',
    waterResistance: '50M',
    warranty: '1 Year International'
  },
  {
    id: 'g-shock-carbon-core-guard',
    name: 'G-Shock Carbon Core Guard',
    brand: 'G-Shock',
    category: 'japanese',
    price: 22500,
    strikePrice: 28000,
    discount: '-20% OFF',
    caliber: 'Matte Stealth Black • Shock Resistant',
    description: '200M water resistant, carbon fiber reinforced structure, double LED light.',
    img: '/images/edition-stealth.jpg',
    stock: 9,
    sku: 'GSH-GA2100',
    movement: 'Casio Tough Quartz Module',
    caseSpecs: '45.4mm Carbon Core Guard',
    waterResistance: '200M',
    warranty: '1 Year Warranty'
  },
  {
    id: 'curren-classic-chronometer',
    name: 'Curren Classic Chronometer',
    brand: 'Curren',
    category: 'budget',
    price: 8999,
    strikePrice: 13500,
    discount: '-33% OFF',
    caliber: 'Dual Tone Black & Rose Gold • Leather',
    description: 'Working sub-dials, date calendar, hardened mineral glass, premium gift box.',
    img: '/images/watch-curren.jpg',
    stock: 24,
    sku: 'CUR-8329-BG',
    movement: 'Japanese Quartz Chronograph',
    caseSpecs: '46mm Alloy with IP Plating',
    waterResistance: '30M Splash Resistant',
    warranty: '6 Months Warranty'
  }
];

export const PRESET_IMAGE_OPTIONS = [
  { label: 'Rolex Submariner (Black Ceramic)', path: '/images/watch-rolex.jpg' },
  { label: 'Tissot PRX (Ice Blue Dial)', path: '/images/watch-tissot.jpg' },
  { label: 'Casio Edifice (Navy Chrono)', path: '/images/watch-casio.jpg' },
  { label: 'Curren Classic (Dual-Tone)', path: '/images/watch-curren.jpg' },
  { label: 'Imperial Rose Gold (Edition)', path: '/images/edition-imperial.jpg' },
  { label: 'Glacier Platinum (Edition)', path: '/images/edition-platinum.jpg' },
  { label: 'Emerald Presage (Edition)', path: '/images/edition-emerald.jpg' },
  { label: 'Stealth Carbon (Edition)', path: '/images/edition-stealth.jpg' },
  { label: 'Front Angle Hero Watch', path: '/images/hero-front.png' }
];

const STORAGE_KEYS = {
  PRODUCTS: 'mk_inventory_products',
  ORDERS: 'mk_inventory_orders'
};

class InventoryManager {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.resetToDefaults();
    }
  }

  getProducts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading products from localStorage:', e);
    }
    return DEFAULT_PRODUCTS;
  }

  saveProducts(products) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      window.dispatchEvent(new CustomEvent('mk:inventory-updated', { detail: { products } }));
    } catch (e) {
      console.error('Error saving products to localStorage:', e);
    }
  }

  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  addProduct(productData) {
    const products = this.getProducts();
    const id = (productData.name || 'watch')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const price = Number(productData.price) || 0;
    const strikePrice = Number(productData.strikePrice) || Math.round(price * 1.15);
    const discount = strikePrice > price 
      ? `-${Math.round(((strikePrice - price) / strikePrice) * 100)}% OFF` 
      : '';

    const newProduct = {
      id,
      name: productData.name?.trim() || 'New Luxury Timepiece',
      brand: productData.brand?.trim() || 'MK Watches',
      category: productData.category || 'luxury',
      price: price,
      strikePrice: strikePrice,
      discount: discount,
      caliber: productData.caliber?.trim() || 'Precision Caliber • Sapphire Glass',
      description: productData.description?.trim() || 'Genuine timepiece, precision engineered with full manufacturer warranty.',
      img: productData.img || '/images/watch-rolex.jpg',
      stock: Math.max(0, parseInt(productData.stock, 10) || 0),
      sku: productData.sku?.trim() || ('MK-' + Math.random().toString(36).substring(2, 7).toUpperCase()),
      movement: productData.movement?.trim() || 'Precision Quartz/Automatic',
      caseSpecs: productData.caseSpecs?.trim() || '42mm Stainless Steel',
      waterResistance: productData.waterResistance?.trim() || '100M Water Resistant',
      warranty: productData.warranty?.trim() || '1 Year Warranty',
      createdAt: new Date().toISOString()
    };

    products.unshift(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  updateProduct(id, updatedFields) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const existing = products[index];
    const updated = { ...existing, ...updatedFields };

    if (updatedFields.price !== undefined || updatedFields.strikePrice !== undefined) {
      const price = Number(updated.price);
      const strike = Number(updated.strikePrice);
      if (strike > price) {
        updated.discount = `-${Math.round(((strike - price) / strike) * 100)}% OFF`;
      } else {
        updated.discount = '';
      }
    }

    if (updatedFields.stock !== undefined) {
      updated.stock = Math.max(0, parseInt(updated.stock, 10) || 0);
    }

    products[index] = updated;
    this.saveProducts(products);
    return updated;
  }

  updateStock(id, newStock) {
    const stock = Math.max(0, parseInt(newStock, 10) || 0);
    return this.updateProduct(id, { stock });
  }

  adjustStock(id, delta) {
    const product = this.getProductById(id);
    if (!product) return null;
    const current = product.stock || 0;
    const nextStock = Math.max(0, current + delta);
    return this.updateStock(id, nextStock);
  }

  deductStock(id, quantity = 1) {
    const product = this.getProductById(id);
    if (!product) return false;
    const currentStock = product.stock || 0;
    const nextStock = Math.max(0, currentStock - quantity);
    this.updateStock(id, nextStock);
    return true;
  }

  deleteProduct(id) {
    let products = this.getProducts();
    const beforeCount = products.length;
    products = products.filter(p => p.id !== id);
    if (products.length !== beforeCount) {
      this.saveProducts(products);
      return true;
    }
    return false;
  }

  getOrders() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading orders from localStorage:', e);
    }
    return [];
  }

  addOrder(orderData) {
    const orders = this.getOrders();
    const orderNumber = 'MK-' + Date.now().toString().slice(-6);
    const newOrder = {
      id: 'ord-' + Date.now(),
      orderNumber,
      timestamp: new Date().toISOString(),
      customer: {
        name: orderData.customer?.name || 'Customer',
        phone: orderData.customer?.phone || '',
        city: orderData.customer?.city || 'Karachi',
        address: orderData.customer?.address || '',
        payment: orderData.customer?.payment || 'Cash on Delivery',
        openParcel: orderData.customer?.openParcel || 'Yes'
      },
      items: orderData.items || [],
      totalAmount: Number(orderData.totalAmount) || 0,
      status: 'Confirmed (TCS Dispatch Pending)'
    };

    orders.unshift(newOrder);
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      window.dispatchEvent(new CustomEvent('mk:orders-updated', { detail: { orders } }));
    } catch (e) {
      console.error('Error saving order to localStorage:', e);
    }
    return newOrder;
  }

  updateOrderStatus(orderId, newStatus) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
        window.dispatchEvent(new CustomEvent('mk:orders-updated', { detail: { orders } }));
      } catch (e) {}
    }
    return order;
  }

  getKPIs() {
    const products = this.getProducts();
    const orders = this.getOrders();

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStockCount = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;
    const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;
    const inventoryValuePKR = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
    const totalOrders = orders.length;
    const totalRevenuePKR = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      totalProducts,
      totalStock,
      lowStockCount,
      outOfStockCount,
      inventoryValuePKR,
      totalOrders,
      totalRevenuePKR
    };
  }

  resetToDefaults() {
    this.saveProducts(DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS;
  }
}

export const inventoryManager = new InventoryManager();
