import * as THREE from 'three';
import gsap from 'gsap';

export class PhotorealisticWatch {
  constructor() {
    this.root = new THREE.Group();
    this.textureLoader = new THREE.TextureLoader();

    // Groups for different sections
    this.mainWatchGroup = new THREE.Group();
    this.explodedGroup = new THREE.Group();

    this.root.add(this.mainWatchGroup);
    this.root.add(this.explodedGroup);

    // Layer slices for exploded view
    this.explodedLayers = [];
    this.hotspotAnchors = [];

    // Textures dict
    this.textures = {};
    this.currentEdition = 'imperial';
    this.isNightMode = false;

    // Ready promise for preloader synchronization
    let heroResolve;
    this.readyPromise = new Promise((res) => { heroResolve = res; });
    this._heroResolve = heroResolve;

    // Synchronously build hierarchy and trigger texture loads
    this.buildMainWatch();
    this.buildExplodedLayers();
    this.loadTextures();

    // Position watch comfortably on the right side of the screen
    this.root.position.set(2.05, 0, 0);
    this.root.scale.set(0.95, 0.95, 0.95);
  }

  loadTextures() {
    const paths = {
      imperial: '/images/hero-front.png',
      angle: '/images/hero-angle.png',
      caseback: '/images/caseback.png',
      platinum: '/images/edition-platinum.png',
      emerald: '/images/edition-emerald.png',
      stealth: '/images/edition-stealth.png',
      exploded: '/images/exploded-clean.png'
    };

    Object.entries(paths).forEach(([key, url]) => {
      this.textureLoader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.anisotropy = 16;
          this.textures[key] = tex;

          if (key === this.currentEdition && this.watchMaterial) {
            this.watchMaterial.map = tex;
            this.watchMaterial.opacity = 1;
            this.watchMaterial.needsUpdate = true;
            if (this.sheenMat) this.sheenMat.opacity = 0.3;
            if (this._heroResolve) this._heroResolve();
          }

          if (key === 'exploded' && this.explodedMat) {
            this.explodedMat.map = tex;
            this.explodedMat.needsUpdate = true;
          }
        },
        undefined,
        (err) => {
          console.warn(`Failed loading texture ${url}`, err);
          if (this._heroResolve) this._heroResolve();
        }
      );
    });
  }

  buildMainWatch() {
    // 1. Photorealistic Watch Plane (Front View)
    const aspect = 1.0;
    const size = 4.4;
    const planeGeo = new THREE.PlaneGeometry(size, size);

    this.watchMaterial = new THREE.MeshBasicMaterial({
      map: this.textures.imperial || null,
      transparent: true,
      opacity: this.textures.imperial ? 1 : 0,
      alphaTest: 0.02,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.frontWatchMesh = new THREE.Mesh(planeGeo, this.watchMaterial);
    this.frontWatchMesh.position.set(0, 0, 0.05);
    this.mainWatchGroup.add(this.frontWatchMesh);

    // 2. Realistic 3D Glass Sheen Highlight (Curved light reflection sweep)
    const sheenCanvas = document.createElement('canvas');
    sheenCanvas.width = 512;
    sheenCanvas.height = 512;
    const sctx = sheenCanvas.getContext('2d');
    const grad = sctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.48, 'rgba(255, 240, 210, 0.18)');
    grad.addColorStop(0.52, 'rgba(255, 255, 255, 0.35)');
    grad.addColorStop(0.56, 'rgba(255, 240, 210, 0.12)');
    grad.addColorStop(0.68, 'rgba(255, 255, 255, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 512, 512);

    const sheenTex = new THREE.CanvasTexture(sheenCanvas);
    const sheenGeo = new THREE.CircleGeometry(1.5, 64);
    this.sheenMat = new THREE.MeshBasicMaterial({
      map: sheenTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0,
      depthWrite: false
    });

    this.sheenMesh = new THREE.Mesh(sheenGeo, this.sheenMat);
    this.sheenMesh.position.set(0, 0.08, 0.08);
    this.mainWatchGroup.add(this.sheenMesh);

    // 3. Super-LumiNova Electric Green Glow Overlay
    const lumeCanvas = document.createElement('canvas');
    lumeCanvas.width = 512;
    lumeCanvas.height = 512;
    const lctx = lumeCanvas.getContext('2d');
    const lgrad = lctx.createRadialGradient(256, 256, 40, 256, 256, 220);
    lgrad.addColorStop(0, 'rgba(57, 255, 20, 0.45)');
    lgrad.addColorStop(0.7, 'rgba(57, 255, 20, 0.2)');
    lgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    lctx.fillStyle = lgrad;
    lctx.fillRect(0, 0, 512, 512);

    this.lumeTex = new THREE.CanvasTexture(lumeCanvas);
    this.lumeMat = new THREE.MeshBasicMaterial({
      map: this.lumeTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0,
      depthWrite: false
    });

    this.lumeMesh = new THREE.Mesh(new THREE.CircleGeometry(1.5, 64), this.lumeMat);
    this.lumeMesh.position.set(0, 0.08, 0.07);
    this.mainWatchGroup.add(this.lumeMesh);
  }

  buildExplodedLayers() {
    // Crisp Unified Deconstructed Exploded Watch
    const size = 5.2;
    const geo = new THREE.PlaneGeometry(size, size);
    this.explodedMat = new THREE.MeshBasicMaterial({
      map: this.textures.exploded || null,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.explodedWatchMesh = new THREE.Mesh(geo, this.explodedMat);
    this.explodedGroup.add(this.explodedWatchMesh);

    // Precision 3D Hotspot Anchors corresponding to actual components
    this.groups = {
      crystal: new THREE.Group(),
      bezel: new THREE.Group(),
      dial: new THREE.Group(),
      movement: new THREE.Group(),
      case: new THREE.Group(),
      caseback: new THREE.Group()
    };

    this.groups.crystal.position.set(0, 1.85, 0.1);
    this.groups.bezel.position.set(0, 1.25, 0.1);
    this.groups.dial.position.set(0, 0.65, 0.1);
    this.groups.movement.position.set(0, -0.05, 0.1);
    this.groups.case.position.set(0, -0.75, 0.1);
    this.groups.caseback.position.set(0, -1.65, 0.1);

    Object.values(this.groups).forEach(g => this.explodedGroup.add(g));
  }

  // Update real-time subtle glass sheen animation that dynamically tracks 3D orientation
  update(delta, time) {
    if (this.sheenMesh && this.sheenMat) {
      const rotY = this.root ? this.root.rotation.y : 0;
      const rotX = this.root ? this.root.rotation.x : 0;
      // Physical reflection sweep across curved sapphire crystal
      this.sheenMesh.rotation.z = Math.sin(time * 0.3) * 0.15 + rotY * 0.75 - rotX * 0.25;
      const baseOpacity = 0.26 + Math.cos(rotY * 1.5) * 0.12 + Math.sin(time * 0.6) * 0.05;
      this.sheenMat.opacity = Math.max(0.1, Math.min(0.48, baseOpacity));
    }
  }

  // Exploded View Scroll Handler
  setExplosionProgress(progress) {
    // Hermite smoothstep for natural, gradual cross-fade without visual popping
    const smoothstep = (min, max, value) => {
      const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
      return x * x * (3 - 2 * x);
    };

    const fadeIn = smoothstep(0.04, 0.20, progress);
    const fadeOut = 1 - smoothstep(0.85, 0.98, progress);
    const explodedAlpha = fadeIn * fadeOut;

    if (this.watchMaterial) {
      this.watchMaterial.opacity = 1 - explodedAlpha;
    }

    if (this.explodedMat) {
      this.explodedMat.opacity = explodedAlpha;
    }

    // Toggle 3D Hotspot pins
    const isExplodedVisible = progress > 0.10 && progress < 0.92;
    const hotspots = document.querySelectorAll('.hotspot-pin');
    hotspots.forEach(pin => {
      pin.classList.toggle('visible', isExplodedVisible);
    });

    // Update active part card in HTML
    const stepCards = document.querySelectorAll('.part-card');
    if (stepCards.length > 0 && isExplodedVisible) {
      const normalizedP = Math.max(0, Math.min(0.999, (progress - 0.12) / 0.75));
      const stepIndex = Math.min(Math.floor(normalizedP * stepCards.length), stepCards.length - 1);
      stepCards.forEach((card, idx) => {
        card.classList.toggle('active', idx === stepIndex);
      });
    } else if (progress <= 0.10 && stepCards.length > 0) {
      stepCards.forEach((card, idx) => {
        card.classList.toggle('active', idx === 0);
      });
    }
  }

  // Live Edition Swapping in Atelier
  setEdition(editionKey) {
    this.currentEdition = editionKey;
    const tex = this.textures[editionKey];

    if (tex && this.watchMaterial) {
      // 3D smooth tilt and flip animation
      gsap.to(this.root.rotation, {
        y: this.root.rotation.y + Math.PI * 2,
        duration: 0.8,
        ease: 'power3.out'
      });

      this.watchMaterial.map = tex;
      this.watchMaterial.needsUpdate = true;
    }
  }

  // Super-LumiNova Night Mode Glow
  setNightMode(enable) {
    this.isNightMode = enable;
    if (this.lumeMat) {
      gsap.to(this.lumeMat, {
        opacity: enable ? 0.75 : 0,
        duration: 0.4
      });
    }
  }
}
