import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class ExplodedViewManager {
  constructor(watchModel, camera, scene, canvas) {
    this.watch = watchModel;
    this.camera = camera;
    this.scene = scene;
    this.canvas = canvas;

    this.hotspots = [
      { id: 'hotspot-crystal', getGroup: () => this.watch.groups?.crystal, offset: new THREE.Vector3(1.2, 0.2, 0.1) },
      { id: 'hotspot-bezel', getGroup: () => this.watch.groups?.bezel, offset: new THREE.Vector3(-1.4, 0.1, 0.1) },
      { id: 'hotspot-dial', getGroup: () => this.watch.groups?.dial, offset: new THREE.Vector3(1.3, 0.1, 0.1) },
      { id: 'hotspot-movement', getGroup: () => this.watch.groups?.movement, offset: new THREE.Vector3(-1.5, 0.0, 0.1) },
      { id: 'hotspot-case', getGroup: () => this.watch.groups?.case, offset: new THREE.Vector3(1.4, -0.1, 0.1) }
    ];

    // Smooth physics-based transform targets (interpolated in render loop)
    const initParams = this.getResponsiveParams();
    this.target = {
      x: initParams.heroX,
      y: initParams.heroY,
      z: 0,
      scale: initParams.heroScale,
      rotX: 0.12,
      rotY: -0.25,
      rotZ: 0,
      explosion: 0,
      canvasOpacity: 1
    };

    this.current = {
      x: initParams.heroX,
      y: initParams.heroY,
      z: 0,
      scale: initParams.heroScale,
      rotX: 0.12,
      rotY: -0.25,
      rotZ: 0,
      explosion: 0,
      canvasOpacity: 1
    };

    // Interactive mouse / touch orbit offsets
    this.orbitAngles = { x: 0, y: 0 };
    this.targetOrbitAngles = { x: 0, y: 0 };

    this.initScrollTimeline();
    this.initMouseInteractivity();
    this.updateLayout();

    window.addEventListener('resize', () => {
      this.updateLayout();
      ScrollTrigger.refresh();
    });
  }

  getResponsiveParams() {
    const w = window.innerWidth;
    if (w <= 768) {
      return {
        isMobile: true,
        isTablet: false,
        heroScale: 0.50,
        heroX: 0,
        heroY: 0.88,
        showroomScale: 0.48,
        showroomX: 0,
        showroomY: 0.72,
        customizerScale: 0.48,
        customizerX: 0,
        customizerY: 0.82
      };
    } else if (w <= 1024) {
      return {
        isMobile: false,
        isTablet: true,
        heroScale: 0.65,
        heroX: 1.15,
        heroY: -0.05,
        showroomScale: 0.65,
        showroomX: 0.85,
        showroomY: 0,
        customizerScale: 0.65,
        customizerX: -0.85,
        customizerY: 0
      };
    } else {
      return {
        isMobile: false,
        isTablet: false,
        heroScale: 0.85,
        heroX: 2.45,
        heroY: -0.05,
        showroomScale: 0.85,
        showroomX: 1.45,
        showroomY: 0,
        customizerScale: 0.85,
        customizerX: -1.35,
        customizerY: 0
      };
    }
  }

  updateLayout() {
    if (!this.watch || !this.watch.root) return;
    const params = this.getResponsiveParams();
    this.target.scale = params.heroScale;
    this.target.x = params.heroX;
    this.target.y = params.heroY;
  }

  initScrollTimeline() {
    // 1. HERO SECTION SCROLL CURVE
    // Smoothly rotates and glides watch towards center as user scrolls out of hero
    ScrollTrigger.create({
      trigger: '.hero-section',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress;
        const params = this.getResponsiveParams();
        
        if (params.isMobile) {
          this.target.x = params.heroX;
          this.target.y = params.heroY - p * 0.16;
          this.target.scale = params.heroScale;
        } else {
          this.target.x = params.heroX - p * (params.isTablet ? 0.35 : 0.95);
          this.target.y = params.heroY - p * 0.12;
          this.target.scale = params.heroScale;
        }

        // Luxurious 3D tilt: catch studio reflections on bezel and sapphire
        this.target.rotY = -0.25 + p * 0.42;
        this.target.rotX = 0.12 + p * 0.06;
        this.target.rotZ = -p * 0.04;
        this.target.explosion = 0;
      }
    });

    // 2. EXPLODED ANATOMY SECTION (Pinned 3D Inspection)
    // Smoothly explodes timepiece layers and allows complete 3D inspection
    ScrollTrigger.create({
      trigger: '.anatomy-section',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress;
        const params = this.getResponsiveParams();

        this.target.x = params.showroomX;
        this.target.y = params.showroomY;
        this.target.scale = params.showroomScale;
        this.target.z = 0;

        // Progressive, physics-driven explosion parameter
        this.target.explosion = p;

        // Dynamic multi-axis presentation as components separate
        this.target.rotX = 0.14 + Math.sin(p * Math.PI) * 0.08;
        this.target.rotY = 0.18 - p * 0.36;
        this.target.rotZ = Math.sin(p * Math.PI) * 0.02;
      }
    });

    // 3. CUSTOMIZER ATELIER SECTION
    // Seamlessly transitions the watch to the left slot, framing customization controls
    ScrollTrigger.create({
      trigger: '.customizer-section',
      start: 'top 85%',
      end: 'center center',
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress;
        const params = this.getResponsiveParams();

        // Smooth glide across screen to the left
        const startX = params.showroomX;
        const targetX = params.customizerX;
        this.target.x = startX + (targetX - startX) * p;
        this.target.y = params.customizerY;
        this.target.scale = params.customizerScale;
        this.target.z = 0.25 * p;

        // Return to fully assembled, angled showcase
        this.target.explosion = (1 - p) * this.target.explosion;
        this.target.rotX = 0.08;
        this.target.rotY = 0.15;
        this.target.rotZ = 0;
      }
    });

    // 4. CURATED CATALOG SECTION
    // Cinematic graceful exit: scales down and fades canvas so product catalog is 100% clean
    ScrollTrigger.create({
      trigger: '.collections-section',
      start: 'top 90%',
      end: 'top 25%',
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress;
        const params = this.getResponsiveParams();

        // Recede back in depth and scale down gracefully
        const factor = Math.max(0.001, 1 - p);
        this.target.scale = params.customizerScale * factor;
        this.target.z = -2.5 * p;
        this.target.canvasOpacity = Math.max(0, 1 - p * 1.05);

        if (this.canvas) {
          this.canvas.style.opacity = String(this.target.canvasOpacity);
        }
      }
    });
  }

  initMouseInteractivity() {
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, a, input, select, .modal-box, .customizer-panel, .part-card, .footer')) {
        return;
      }
      isDragging = true;
      prevMouse.x = e.clientX;
      prevMouse.y = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;

      if (!isDragging) {
        // Subtle optical parallax based on cursor position
        this.targetOrbitAngles.y = normX * 0.14;
        this.targetOrbitAngles.x = normY * 0.10;
      } else {
        const deltaX = e.clientX - prevMouse.x;
        const deltaY = e.clientY - prevMouse.y;

        this.targetOrbitAngles.y += deltaX * 0.006;
        this.targetOrbitAngles.x += deltaY * 0.006;

        prevMouse.x = e.clientX;
        prevMouse.y = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch support for mobile devices
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        if (e.target.closest('button, a, input, select, .modal-box, .customizer-panel, .part-card, .footer')) {
          return;
        }
        isDragging = true;
        prevMouse.x = e.touches[0].clientX;
        prevMouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - prevMouse.x;
        const deltaY = e.touches[0].clientY - prevMouse.y;

        this.targetOrbitAngles.y += deltaX * 0.007;
        this.targetOrbitAngles.x += deltaY * 0.007;

        prevMouse.x = e.touches[0].clientX;
        prevMouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });
  }

  // Physics-based Frame Loop (Called every requestAnimationFrame)
  update(delta) {
    if (!this.watch || !this.watch.root) return;

    // Damping coefficient with physical mass
    const damp = Math.min(1, 8.5 * delta);

    // 1. Smoothly interpolate spatial coordinates (x, y, z)
    this.current.x += (this.target.x - this.current.x) * damp;
    this.current.y += (this.target.y - this.current.y) * damp;
    this.current.z += (this.target.z - this.current.z) * damp;
    this.current.scale += (this.target.scale - this.current.scale) * damp;

    // 2. Smoothly interpolate scroll rotation angles
    this.current.rotX += (this.target.rotX - this.current.rotX) * damp;
    this.current.rotY += (this.target.rotY - this.current.rotY) * damp;
    this.current.rotZ += (this.target.rotZ - this.current.rotZ) * damp;

    // 3. Smoothly interpolate mouse / touch orbit angles
    this.orbitAngles.x += (this.targetOrbitAngles.x - this.orbitAngles.x) * damp;
    this.orbitAngles.y += (this.targetOrbitAngles.y - this.orbitAngles.y) * damp;

    // 4. Smoothly interpolate explosion progress
    this.current.explosion += (this.target.explosion - this.current.explosion) * damp;

    // 5. Apply physical transform with subtle luxury micro-floating motion
    const floatY = Math.sin(Date.now() * 0.0016) * 0.012;
    this.watch.root.position.set(
      this.current.x,
      this.current.y + floatY,
      this.current.z
    );

    // Total rotation combines scroll-directed path + user interactive orbit
    this.watch.root.rotation.set(
      this.current.rotX + this.orbitAngles.x,
      this.current.rotY + this.orbitAngles.y,
      this.current.rotZ
    );

    this.watch.root.scale.setScalar(this.current.scale);

    // Update deconstructed layers & component materials
    if (this.watch.setExplosionProgress) {
      this.watch.setExplosionProgress(this.current.explosion);
    }

    // 6. Update 3D hotspot coordinates with GPU transform
    this.updateHotspotScreenCoordinates();
  }

  updateHotspotScreenCoordinates() {
    const tempV = new THREE.Vector3();

    this.hotspots.forEach(hs => {
      const el = document.getElementById(hs.id);
      const group = hs.getGroup ? hs.getGroup() : hs.group;
      if (!el || !group) return;

      const offsetMult = window.innerWidth < 768 ? 0.45 : (window.innerWidth < 1024 ? 0.75 : 1.0);
      tempV.copy(hs.offset).multiplyScalar(offsetMult);
      group.localToWorld(tempV);
      tempV.project(this.camera);

      if (tempV.z > 1) {
        el.style.opacity = '0';
        return;
      }

      const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;

      const clampedX = Math.max(20, Math.min(window.innerWidth - 20, x));
      const clampedY = Math.max(70, Math.min(window.innerHeight - 50, y));

      // Use GPU-accelerated translate3d to avoid layout thrashing
      el.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
      el.style.left = '0px';
      el.style.top = '0px';
    });
  }
}
