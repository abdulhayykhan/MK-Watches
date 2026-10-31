# ⌚ MK Watches Pakistan — Luxury 3D E-Commerce Experience

> An ultra-luxury, high-performance 3D timepiece e-commerce platform and executive management system tailored for the Pakistan luxury watch market.

![MK Watches Preview](logo-black.png)

---

## ✨ Highlights & Features

### 🌟 Immersive 3D Atelier & Visualizer
- **Interactive Three.js 3D Viewport**: Full 360° rotational orbit controls, exploded layer inspection (Crystal, Bezel, Dial, Movement, Case, Caseback), and real-time mesh material changes.
- **Dynamic Edition Finishes**: Real-time switching between Imperial Gold, Stealth Obsidian, Platinum Silver, and Royal Emerald finishes.
- **Bespoke Strap Customizer**: Instantly swap between Alligator Leather, Oyster Steel, and Cyber Rubber straps.

### 🛍️ Public Storefront (`index.html`)
- **Curated Watch Catalog**: Featuring Swiss Automatics, Japanese Precision, and Lifestyle Chronographs (Rolex, Tissot, Omega, Seiko, G-Shock, Curren).
- **Dual Theme Architecture**: Seamless switching between **Executive Noir** (Dark Mode) and **Royal Champagne** (Light Mode) with zero layout shifting.
- **Cinematic Motion & Inertia**: Powered by **Lenis** smooth scroll and **GSAP** timeline animations.
- **Pakistan-First Checkout**: Built-in support for **Cash on Delivery (COD)**, TCS / Leopards Express delivery, Open Parcel Inspection guarantee, and Direct WhatsApp Order dispatch.
- **Cart & Bag Drawer**: Instant drawer with live price calculations, currency formatting in PKR, and local storage persistence.
- **100% Responsive Design**: Engineered and tested across Ultrawide 4K (2560px), Desktop, Tablet (Portrait & Landscape), and Mobile screens down to ultra-compact 320px.

### 🔐 Standalone Executive Management Portal (`admin.html`)
- **Discrete & Secure**: Standalone executive portal accessible only via encrypted Master PIN verification (`admin.html`).
- **Real-Time Warehouse Telemetry**: Live inventory valuation (PKR), stock status indicators, low-stock alerts, and replenishment triggers.
- **Timepiece Inventory Manager**: Inline price updates, stock increment/decrement, category filters, and live search.
- **Product Publisher**: Add new luxury models with custom titles, SKUs, specifications, pricing, and visual presets.
- **Orders Pipeline**: Real-time dispatch tracking for Cash on Delivery nationwide orders.
- **Cross-Tab Synchronization**: Instant state synchronization between the Admin Portal and Customer Storefront via BroadcastChannel & LocalStorage.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Build & Bundler** | [Vite 5](https://vitejs.dev/) |
| **3D Rendering** | [Three.js](https://threejs.org/) |
| **Animation & Scroll** | [GSAP](https://greensock.com/gsap/) (GreenSock) & [Lenis](https://lenis.darkroom.engineering/) |
| **Styles** | Custom Modular CSS3 (Design Tokens, Glassmorphism, CSS Grid, Flexbox) |
| **Logic & State** | Modern ES Modules (Vanilla JS, LocalStorage, BroadcastChannel) |
| **Delight & Feedback** | [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abdulhayykhan/MK-Watches.git
   cd MK-Watches
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```
   Outputs production assets to the `dist/` directory.

5. **Preview the production build:**
   ```bash
   npm run preview
   ```

---

## 📂 Project Architecture

```
MK-Watches/
├── admin.html             # Standalone executive commerce management portal
├── index.html             # Customer-facing luxury storefront & 3D visualizer
├── public/                # Static assets, high-res watch textures & models
│   ├── images/            # Curated timepiece images & exploded layers
│   ├── logo-black.png     # Dark edition insignia
│   └── logo-white.png     # Light edition insignia
├── src/
│   ├── admin.js           # Admin portal application logic & state sync
│   ├── main.js            # Storefront app initialization, Lenis & event handlers
│   ├── scene/             # Three.js 3D watch scene setup, lighting & controls
│   ├── styles/            # Styling architecture (main.css & admin.css)
│   └── utils/             # Inventory management, formatters & state storage
├── scripts/               # Deep visual audit, image processing & validation suites
├── package.json           # Project manifest & scripts
└── vite.config.js         # Multi-page Vite configuration (index.html + admin.html)
```

---

## 🔒 Executive Security

The admin management console is kept decoupled from public navigation and accessible strictly via credentialed PIN authentication on `admin.html`. Store telemetry, inventory updates, and order states are persisted securely with client-side reactive broadcast synchronization.

---

## 📄 License

Private repository & proprietary design for **MK Watches Pakistan**. All rights reserved.
