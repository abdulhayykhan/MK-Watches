import * as THREE from 'three';

export class WatchModel {
  constructor() {
    this.root = new THREE.Group();
    this.groups = {
      crystal: new THREE.Group(),
      bezel: new THREE.Group(),
      hands: new THREE.Group(),
      dial: new THREE.Group(),
      movement: new THREE.Group(),
      case: new THREE.Group(),
      caseback: new THREE.Group(),
      strap: new THREE.Group()
    };

    // Keep track of materials for customizer & night mode
    this.materials = {
      caseMetal: null,
      bezelMetal: null,
      dialBase: null,
      markers: null,
      hands: null,
      lume: null,
      sapphire: null,
      strap: null,
      movementBrass: null,
      movementSteel: null,
      rubies: null
    };

    // Animated elements
    this.hourHand = null;
    this.minuteHand = null;
    this.secondHand = null;
    this.subSecondHand = null;
    this.balanceWheel = null;
    this.rotor = null;
    this.gears = [];

    // Current edition state
    this.currentEdition = 'imperial';
    this.currentStrap = 'leather';
    this.isNightMode = false;

    this.init();
  }

  init() {
    // Add all component groups to root
    Object.values(this.groups).forEach(g => this.root.add(g));

    this.createMaterials();
    this.buildCaseAndLugs();
    this.buildBezel();
    this.buildSapphireCrystal();
    this.buildDial();
    this.buildHands();
    this.buildMovement();
    this.buildCaseback();
    this.buildStrap();

    // Scale watch to good dimensions in scene
    this.root.scale.set(1.2, 1.2, 1.2);
  }

  createMaterials() {
    // 18K Rose Gold (Default)
    this.materials.caseMetal = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.94,
      roughness: 0.18,
      envMapIntensity: 2.2
    });

    this.materials.bezelMetal = new THREE.MeshStandardMaterial({
      color: 0xdfb771,
      metalness: 0.98,
      roughness: 0.12,
      envMapIntensity: 2.5
    });

    // Dial Base
    const dialCanvasTexture = this.createSunburstDialTexture('#09090c', '#15151b');
    this.materials.dialBase = new THREE.MeshStandardMaterial({
      map: dialCanvasTexture,
      roughness: 0.35,
      metalness: 0.4,
      envMapIntensity: 1.2
    });

    // Applied Indices & Logo
    this.materials.markers = new THREE.MeshStandardMaterial({
      color: 0xf5d996,
      metalness: 0.95,
      roughness: 0.15,
      envMapIntensity: 2.5
    });

    // Hands
    this.materials.hands = new THREE.MeshStandardMaterial({
      color: 0xfbe4aa,
      metalness: 0.95,
      roughness: 0.12,
      envMapIntensity: 2.8
    });

    // Blued steel seconds hand
    this.materials.secondsHandMat = new THREE.MeshStandardMaterial({
      color: 0x1f4e99,
      metalness: 0.9,
      roughness: 0.2
    });

    // Super-LumiNova Luminous Material
    this.materials.lume = new THREE.MeshStandardMaterial({
      color: 0xebffec,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      roughness: 0.4
    });

    // Sapphire Crystal Glass
    this.materials.sapphire = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.96,
      opacity: 1,
      transparent: true,
      roughness: 0.03,
      metalness: 0.0,
      ior: 1.77,
      reflectivity: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });

    // Movement Brass & Steel
    this.materials.movementBrass = new THREE.MeshStandardMaterial({
      color: 0xd9b360,
      metalness: 0.88,
      roughness: 0.28
    });

    this.materials.movementSteel = new THREE.MeshStandardMaterial({
      color: 0xd6dade,
      metalness: 0.92,
      roughness: 0.22
    });

    // Synthetic Rubies
    this.materials.rubies = new THREE.MeshPhysicalMaterial({
      color: 0xd61849,
      transmission: 0.85,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 0.8
    });

    // Strap Material (Leather initial)
    const leatherTexture = this.createLeatherTexture();
    this.materials.strap = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      map: leatherTexture,
      roughness: 0.75,
      metalness: 0.05
    });
  }

  createSunburstDialTexture(innerColor, outerColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const cx = 512;
    const cy = 512;
    const r = 500;

    // Radial gradient background
    const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, r);
    grad.addColorStop(0, outerColor);
    grad.addColorStop(0.7, innerColor);
    grad.addColorStop(1, '#020203');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Sunburst radial rays
    ctx.save();
    ctx.translate(cx, cy);
    const numRays = 720;
    for (let i = 0; i < numRays; i++) {
      const angle = (i * Math.PI * 2) / numRays;
      const alpha = 0.02 + 0.03 * Math.sin(i * 3.5);
      ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      ctx.stroke();
    }
    ctx.restore();

    // Outer minute tracks and tachymeter
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 470, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 450, 0, Math.PI * 2);
    ctx.stroke();

    // 60 minute ticks
    for (let i = 0; i < 60; i++) {
      const angle = (i * Math.PI * 2) / 60 - Math.PI / 2;
      const isMajor = i % 5 === 0;
      const r1 = 450;
      const r2 = isMajor ? 425 : 438;

      ctx.strokeStyle = isMajor ? 'rgba(245, 217, 150, 0.9)' : 'rgba(212, 175, 55, 0.5)';
      ctx.lineWidth = isMajor ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }

    // Micro guilloche sub-dials rings
    const drawSubdial = (sx, sy, sr) => {
      ctx.save();
      ctx.translate(sx, sy);
      for (let cr = 8; cr < sr; cr += 4) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, cr, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, sr, 0, Math.PI * 2);
      ctx.stroke();

      for (let j = 0; j < 12; j++) {
        const sa = (j * Math.PI * 2) / 12;
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(sa) * sr, Math.sin(sa) * sr);
        ctx.lineTo(Math.cos(sa) * (sr - 8), Math.sin(sa) * (sr - 8));
        ctx.stroke();
      }
      ctx.restore();
    };

    drawSubdial(cx - 150, cy, 95);  // 9 o'clock subdial
    drawSubdial(cx + 150, cy, 95);  // 3 o'clock subdial
    drawSubdial(cx, cy + 150, 95);  // 6 o'clock subdial

    // MK Brand Crest and Typography at 12 o'clock
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5d996';
    ctx.font = 'bold 36px "Cinzel", Georgia, serif';
    ctx.fillText('MK', cx, cy - 180);

    ctx.font = '500 16px "Montserrat", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('WATCHES', cx, cy - 150);

    ctx.font = '400 12px "Space Grotesk", monospace';
    ctx.fillStyle = '#8e929b';
    ctx.fillText('CHRONOGRAPH TOURBILLON', cx, cy - 128);

    ctx.font = '400 11px "Space Grotesk", monospace';
    ctx.fillText('SWISS CHRONOMETER', cx, cy + 80);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }

  createLeatherTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#141416';
    ctx.fillRect(0, 0, 512, 512);

    // Crocodile / alligator cell pattern
    ctx.strokeStyle = '#08080a';
    ctx.lineWidth = 3;
    const rows = 16;
    const cols = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c * 512) / cols + (Math.random() - 0.5) * 6;
        const y = (r * 512) / rows + (Math.random() - 0.5) * 6;
        const w = 512 / cols - 4;
        const h = 512 / rows - 4;

        ctx.fillStyle = '#18181c';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 6);
        ctx.fill();
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 3);
    return tex;
  }

  buildCaseAndLugs() {
    // Main Case Barrel
    const caseGeo = new THREE.CylinderGeometry(2.15, 2.15, 0.46, 64);
    const caseMesh = new THREE.Mesh(caseGeo, this.materials.caseMetal);
    caseMesh.rotation.x = Math.PI / 2;
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    this.groups.case.add(caseMesh);

    // Stepped Mid-Case Ring
    const midRingGeo = new THREE.TorusGeometry(2.18, 0.08, 16, 64);
    const midRing = new THREE.Mesh(midRingGeo, this.materials.caseMetal);
    this.groups.case.add(midRing);

    // 4 Ergonomic Curved Lugs
    const lugPositions = [
      { x: -1.45, y: 2.15, rotZ: 0.12 },
      { x: 1.45, y: 2.15, rotZ: -0.12 },
      { x: -1.45, y: -2.15, rotZ: -0.12 },
      { x: 1.45, y: -2.15, rotZ: 0.12 }
    ];

    lugPositions.forEach(pos => {
      const lugShape = new THREE.Shape();
      lugShape.moveTo(-0.25, 0);
      lugShape.lineTo(0.25, 0);
      lugShape.lineTo(0.18, 0.95);
      lugShape.quadraticCurveTo(0, 1.1, -0.18, 0.95);
      lugShape.closePath();

      const extrudeSettings = {
        depth: 0.38,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.05,
        bevelThickness: 0.05
      };

      const lugGeo = new THREE.ExtrudeGeometry(lugShape, extrudeSettings);
      const lug = new THREE.Mesh(lugGeo, this.materials.caseMetal);
      lug.position.set(pos.x, pos.y > 0 ? 1.65 : -2.6, -0.2);
      lug.rotation.z = pos.rotZ + (pos.y < 0 ? Math.PI : 0);
      if (pos.y < 0) {
        lug.position.y = -1.65;
      }
      this.groups.case.add(lug);
    });

    // Knurled Crown at 3 o'clock
    const crownStemGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.35, 24);
    const crownStem = new THREE.Mesh(crownStemGeo, this.materials.caseMetal);
    crownStem.rotation.z = Math.PI / 2;
    crownStem.position.set(2.28, 0, 0);
    this.groups.case.add(crownStem);

    // Crown Cap with Knurling
    const crownCapGeo = new THREE.CylinderGeometry(0.36, 0.38, 0.32, 32);
    const crownCap = new THREE.Mesh(crownCapGeo, this.materials.caseMetal);
    crownCap.rotation.z = Math.PI / 2;
    crownCap.position.set(2.52, 0, 0);
    this.groups.case.add(crownCap);

    // Crown MK Emblem insert
    const emblemGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.05, 32);
    const emblem = new THREE.Mesh(emblemGeo, this.materials.bezelMetal);
    emblem.rotation.z = Math.PI / 2;
    emblem.position.set(2.68, 0, 0);
    this.groups.case.add(emblem);

    // Chronograph Pushers (at 2 o'clock and 4 o'clock)
    const createPusher = (angle) => {
      const pusherGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.38, 24);
      const pusher = new THREE.Mesh(pusherGeo, this.materials.caseMetal);
      const px = Math.cos(angle) * 2.3;
      const py = Math.sin(angle) * 2.3;
      pusher.position.set(px, py, 0);
      pusher.rotation.z = angle + Math.PI / 2;
      return pusher;
    };

    this.groups.case.add(createPusher(Math.PI / 5));   // 2 o'clock
    this.groups.case.add(createPusher(-Math.PI / 5));  // 4 o'clock
  }

  buildBezel() {
    // Fluted Outer Bezel Ring
    const flutedGeo = new THREE.TorusGeometry(2.14, 0.14, 24, 72);
    const flutedBezel = new THREE.Mesh(flutedGeo, this.materials.bezelMetal);
    flutedBezel.position.z = 0.22;
    this.groups.bezel.add(flutedBezel);

    // Polished Inner Chamfer
    const innerRingGeo = new THREE.RingGeometry(1.88, 2.08, 64);
    const innerRing = new THREE.Mesh(innerRingGeo, this.materials.bezelMetal);
    innerRing.position.z = 0.28;
    this.groups.bezel.add(innerRing);
  }

  buildSapphireCrystal() {
    // Double domed sapphire crystal
    const crystalGeo = new THREE.CylinderGeometry(1.98, 2.02, 0.12, 64);
    const crystal = new THREE.Mesh(crystalGeo, this.materials.sapphire);
    crystal.rotation.x = Math.PI / 2;
    crystal.position.z = 0.36;
    this.groups.crystal.add(crystal);
  }

  buildDial() {
    // Dial Disc
    const dialGeo = new THREE.CircleGeometry(1.92, 64);
    const dial = new THREE.Mesh(dialGeo, this.materials.dialBase);
    dial.position.z = 0.16;
    this.groups.dial.add(dial);

    // 12 Faceted Hour Markers
    for (let i = 0; i < 12; i++) {
      if (i === 0) continue; // MK badge at 12
      const angle = (i * Math.PI * 2) / 12;
      const r = 1.62;
      const markerGeo = new THREE.BoxGeometry(0.08, 0.28, 0.05);
      const marker = new THREE.Mesh(markerGeo, this.materials.markers);
      marker.position.set(Math.sin(angle) * r, Math.cos(angle) * r, 0.18);
      marker.rotation.z = -angle;

      // Super-LumiNova inlay
      const lumeGeo = new THREE.BoxGeometry(0.04, 0.2, 0.06);
      const lume = new THREE.Mesh(lumeGeo, this.materials.lume);
      lume.position.set(Math.sin(angle) * r, Math.cos(angle) * r, 0.185);
      lume.rotation.z = -angle;

      this.groups.dial.add(marker);
      this.groups.dial.add(lume);
    }

    // 3D MK Insignia at 12 o'clock
    const mkGeo = new THREE.BoxGeometry(0.24, 0.14, 0.06);
    const mkMesh = new THREE.Mesh(mkGeo, this.materials.markers);
    mkMesh.position.set(0, 1.62, 0.18);
    this.groups.dial.add(mkMesh);

    // Tourbillon Cutaway Cage Frame (at 6 o'clock)
    const tourbRingGeo = new THREE.TorusGeometry(0.48, 0.04, 16, 48);
    const tourbRing = new THREE.Mesh(tourbRingGeo, this.materials.markers);
    tourbRing.position.set(0, -0.65, 0.17);
    this.groups.dial.add(tourbRing);

    // Small subdial needles
    const subNeedleGeo = new THREE.BoxGeometry(0.03, 0.26, 0.02);
    this.subSecondHand = new THREE.Mesh(subNeedleGeo, this.materials.hands);
    this.subSecondHand.position.set(0, -0.65, 0.2);
    this.groups.dial.add(this.subSecondHand);
  }

  buildHands() {
    // Center Pinion
    const pinionGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 24);
    const pinion = new THREE.Mesh(pinionGeo, this.materials.hands);
    pinion.rotation.x = Math.PI / 2;
    pinion.position.z = 0.24;
    this.groups.hands.add(pinion);

    // Hour Hand (Faceted Dauphine)
    const hourShape = new THREE.Shape();
    hourShape.moveTo(-0.06, 0);
    hourShape.lineTo(-0.08, 0.6);
    hourShape.lineTo(0, 1.1);
    hourShape.lineTo(0.08, 0.6);
    hourShape.lineTo(0.06, 0);
    hourShape.lineTo(-0.06, 0);

    const hourGeo = new THREE.ExtrudeGeometry(hourShape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 });
    this.hourHand = new THREE.Mesh(hourGeo, this.materials.hands);
    this.hourHand.position.z = 0.22;
    this.groups.hands.add(this.hourHand);

    // Minute Hand (Longer, slender)
    const minuteShape = new THREE.Shape();
    minuteShape.moveTo(-0.05, 0);
    minuteShape.lineTo(-0.065, 1.0);
    minuteShape.lineTo(0, 1.55);
    minuteShape.lineTo(0.065, 1.0);
    minuteShape.lineTo(0.05, 0);
    minuteShape.lineTo(-0.05, 0);

    const minuteGeo = new THREE.ExtrudeGeometry(minuteShape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 });
    this.minuteHand = new THREE.Mesh(minuteGeo, this.materials.hands);
    this.minuteHand.position.z = 0.26;
    this.groups.hands.add(this.minuteHand);

    // Sweep Seconds Hand (Blued steel with counterweight)
    const secondShape = new THREE.Shape();
    secondShape.moveTo(-0.018, -0.4);
    secondShape.lineTo(0.018, -0.4);
    secondShape.lineTo(0.012, 1.7);
    secondShape.lineTo(0, 1.76);
    secondShape.lineTo(-0.012, 1.7);
    secondShape.closePath();

    const secondGeo = new THREE.ExtrudeGeometry(secondShape, { depth: 0.015, bevelEnabled: false });
    this.secondHand = new THREE.Mesh(secondGeo, this.materials.secondsHandMat);
    this.secondHand.position.z = 0.29;

    // Counterweight Ring
    const cwRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 12, 24), this.materials.secondsHandMat);
    cwRing.position.set(0, -0.22, 0.29);
    this.groups.hands.add(cwRing);
    this.groups.hands.add(this.secondHand);
  }

  buildMovement() {
    // Mainplate with circular graining
    const plateGeo = new THREE.CylinderGeometry(1.9, 1.9, 0.12, 48);
    const mainplate = new THREE.Mesh(plateGeo, this.materials.movementBrass);
    mainplate.rotation.x = Math.PI / 2;
    mainplate.position.z = 0.02;
    this.groups.movement.add(mainplate);

    // Skeletonized Bridges
    const bridgeGeo = new THREE.BoxGeometry(1.4, 0.5, 0.08);
    const bridge1 = new THREE.Mesh(bridgeGeo, this.materials.movementSteel);
    bridge1.position.set(-0.2, 0.35, 0.08);
    bridge1.rotation.z = 0.3;
    this.groups.movement.add(bridge1);

    const bridge2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 0.08), this.materials.movementSteel);
    bridge2.position.set(0.3, -0.3, 0.08);
    bridge2.rotation.z = -0.4;
    this.groups.movement.add(bridge2);

    // Ruby Pivot Jewels
    const rubyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
    const rubyPositions = [
      { x: -0.4, y: 0.4 },
      { x: 0.2, y: 0.5 },
      { x: 0.5, y: -0.1 },
      { x: -0.2, y: -0.5 },
      { x: 0, y: 0 }
    ];

    rubyPositions.forEach(p => {
      const ruby = new THREE.Mesh(rubyGeo, this.materials.rubies);
      ruby.rotation.x = Math.PI / 2;
      ruby.position.set(p.x, p.y, 0.1);
      this.groups.movement.add(ruby);
    });

    // Interlocking Gear Train
    const makeGear = (x, y, radius, teeth, speedMult) => {
      const gearGroup = new THREE.Group();
      gearGroup.position.set(x, y, 0.06);

      const discGeo = new THREE.CylinderGeometry(radius, radius, 0.04, 32);
      const disc = new THREE.Mesh(discGeo, this.materials.movementBrass);
      disc.rotation.x = Math.PI / 2;
      gearGroup.add(disc);

      // Tooth rim
      const rimGeo = new THREE.TorusGeometry(radius, 0.02, 8, teeth);
      const rim = new THREE.Mesh(rimGeo, this.materials.movementSteel);
      gearGroup.add(rim);

      this.gears.push({ group: gearGroup, speed: speedMult });
      this.groups.movement.add(gearGroup);
      return gearGroup;
    };

    makeGear(-0.55, 0.45, 0.42, 28, 0.8);
    makeGear(0.48, 0.4, 0.35, 24, -1.2);
    makeGear(-0.35, -0.3, 0.5, 36, 0.5);

    // Tourbillon Balance Wheel with Spokes & Hairspring
    const balanceGroup = new THREE.Group();
    balanceGroup.position.set(0, -0.65, 0.07);

    const balanceRimGeo = new THREE.TorusGeometry(0.38, 0.03, 16, 32);
    const balanceRim = new THREE.Mesh(balanceRimGeo, this.materials.movementBrass);
    balanceGroup.add(balanceRim);

    // 3 Golden balance spokes
    for (let s = 0; s < 3; s++) {
      const spokeAngle = (s * Math.PI * 2) / 3;
      const spokeGeo = new THREE.BoxGeometry(0.04, 0.38, 0.02);
      const spoke = new THREE.Mesh(spokeGeo, this.materials.movementBrass);
      spoke.position.set(Math.sin(spokeAngle) * 0.19, Math.cos(spokeAngle) * 0.19, 0);
      spoke.rotation.z = -spokeAngle;
      balanceGroup.add(spoke);
    }

    // Balance screws along perimeter
    for (let sc = 0; sc < 12; sc++) {
      const sa = (sc * Math.PI * 2) / 12;
      const screwGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8);
      const screw = new THREE.Mesh(screwGeo, this.materials.bezelMetal);
      screw.position.set(Math.cos(sa) * 0.38, Math.sin(sa) * 0.38, 0);
      screw.rotation.x = Math.PI / 2;
      balanceGroup.add(screw);
    }

    this.balanceWheel = balanceGroup;
    this.groups.movement.add(balanceGroup);
  }

  buildCaseback() {
    // Exhibition Caseback Ring
    const casebackRingGeo = new THREE.TorusGeometry(2.0, 0.18, 16, 64);
    const casebackRing = new THREE.Mesh(casebackRingGeo, this.materials.caseMetal);
    casebackRing.position.z = -0.24;
    this.groups.caseback.add(casebackRing);

    // Caseback Sapphire Crystal
    const backGlassGeo = new THREE.CircleGeometry(1.85, 48);
    const backGlass = new THREE.Mesh(backGlassGeo, this.materials.sapphire);
    backGlass.position.z = -0.25;
    this.groups.caseback.add(backGlass);

    // Oscillating Heavy Rotor with Squeletted MK Insignia
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(0, 0, -0.16);

    const rotorShape = new THREE.Shape();
    rotorShape.arc(0, 0, 1.7, 0, Math.PI, false);
    rotorShape.lineTo(0.3, 0);
    rotorShape.arc(0, 0, 0.3, 0, Math.PI, true);
    rotorShape.lineTo(-1.7, 0);

    const rotorGeo = new THREE.ExtrudeGeometry(rotorShape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
    const rotorMesh = new THREE.Mesh(rotorGeo, this.materials.bezelMetal);
    rotorMesh.rotation.z = Math.PI / 2;
    rotorGroup.add(rotorMesh);

    this.rotor = rotorGroup;
    this.groups.caseback.add(rotorGroup);
  }

  buildStrap() {
    this.createLeatherStrap();
  }

  createLeatherStrap() {
    // Clear previous strap children
    while (this.groups.strap.children.length > 0) {
      this.groups.strap.remove(this.groups.strap.children[0]);
    }

    const createStrapHalf = (isTop) => {
      const shape = new THREE.Shape();
      const w1 = 1.35;
      const w2 = 1.05;
      const len = 3.6;

      shape.moveTo(-w1, 0);
      shape.lineTo(w1, 0);
      shape.lineTo(w2, len);
      shape.quadraticCurveTo(0, len + 0.35, -w2, len);
      shape.closePath();

      const extrudeSettings = {
        depth: 0.16,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 4,
        bevelSize: 0.03,
        bevelThickness: 0.03
      };

      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const mesh = new THREE.Mesh(geo, this.materials.strap);

      if (isTop) {
        mesh.position.set(0, 2.1, -0.2);
        mesh.rotation.x = -0.3; // Curve backward organically around wrist
      } else {
        mesh.position.set(0, -2.1, -0.2);
        mesh.rotation.z = Math.PI;
        mesh.rotation.x = -0.3;
      }

      // Strap Keepers (Loops)
      if (!isTop) {
        const keeperGeo = new THREE.BoxGeometry(2.2, 0.25, 0.28);
        const keeper = new THREE.Mesh(keeperGeo, this.materials.strap);
        keeper.position.set(0, -3.2, -0.4);
        this.groups.strap.add(keeper);
      }

      // Deployant Gold Clasp
      const buckleGeo = new THREE.BoxGeometry(1.6, 0.3, 0.25);
      const buckle = new THREE.Mesh(buckleGeo, this.materials.caseMetal);
      buckle.position.set(0, isTop ? 4.9 : -4.9, -0.9);
      this.groups.strap.add(buckle);

      return mesh;
    };

    this.groups.strap.add(createStrapHalf(true));
    this.groups.strap.add(createStrapHalf(false));
  }

  createMetalBracelet() {
    while (this.groups.strap.children.length > 0) {
      this.groups.strap.remove(this.groups.strap.children[0]);
    }

    const numLinks = 10;
    const createBraceletSide = (isTop) => {
      const sideGroup = new THREE.Group();
      let currentY = isTop ? 2.1 : -2.1;
      let currentZ = -0.15;
      let angle = 0;

      for (let i = 0; i < numLinks; i++) {
        const linkGroup = new THREE.Group();
        const factor = 1 - (i / numLinks) * 0.22;

        // Center link (Polished)
        const centerGeo = new THREE.BoxGeometry(0.85 * factor, 0.34, 0.16);
        const centerLink = new THREE.Mesh(centerGeo, this.materials.bezelMetal);
        linkGroup.add(centerLink);

        // 2 Outer links (Brushed)
        const outerGeo = new THREE.BoxGeometry(0.55 * factor, 0.34, 0.14);
        const outer1 = new THREE.Mesh(outerGeo, this.materials.caseMetal);
        outer1.position.x = -(0.75 * factor);
        const outer2 = new THREE.Mesh(outerGeo, this.materials.caseMetal);
        outer2.position.x = 0.75 * factor;
        linkGroup.add(outer1);
        linkGroup.add(outer2);

        linkGroup.position.set(0, currentY, currentZ);
        linkGroup.rotation.x = isTop ? angle : -angle;

        sideGroup.add(linkGroup);

        const step = 0.36;
        angle += 0.06;
        currentY += isTop ? Math.cos(angle) * step : -Math.cos(angle) * step;
        currentZ -= Math.sin(angle) * step;
      }
      return sideGroup;
    };

    this.groups.strap.add(createBraceletSide(true));
    this.groups.strap.add(createBraceletSide(false));
  }

  // Update clock hands & mechanical balance movement
  update(delta, time) {
    const d = new Date();
    const hours = d.getHours() % 12;
    const minutes = d.getMinutes();
    const seconds = d.getSeconds();
    const millis = d.getMilliseconds();

    // Smooth second sweep
    const secFraction = seconds + millis / 1000;
    const minFraction = minutes + secFraction / 60;
    const hourFraction = hours + minFraction / 60;

    if (this.secondHand) {
      this.secondHand.rotation.z = -(secFraction * (Math.PI * 2) / 60);
    }
    if (this.minuteHand) {
      this.minuteHand.rotation.z = -(minFraction * (Math.PI * 2) / 60);
    }
    if (this.hourHand) {
      this.hourHand.rotation.z = -(hourFraction * (Math.PI * 2) / 12);
    }
    if (this.subSecondHand) {
      this.subSecondHand.rotation.z = -(secFraction * (Math.PI * 2) / 60);
    }

    // Oscillating Balance Wheel (4Hz = 28,800 vph, rapid harmonic oscillation)
    if (this.balanceWheel) {
      this.balanceWheel.rotation.z = Math.sin(time * 24) * 0.75;
    }

    // Rotor subtle swinging with gravity / movement
    if (this.rotor) {
      this.rotor.rotation.z += Math.sin(time * 1.5) * 0.008;
    }

    // Rotating gear train
    this.gears.forEach(g => {
      g.group.rotation.z += g.speed * delta * 2;
    });
  }

  // Set Edition Colors (Live 3D Customizer)
  setEdition(editionKey) {
    this.currentEdition = editionKey;

    switch (editionKey) {
      case 'imperial': // 18k Rose Gold / Sunburst Obsidian
        this.materials.caseMetal.color.setHex(0xd4af37);
        this.materials.bezelMetal.color.setHex(0xdfb771);
        this.materials.dialBase.map = this.createSunburstDialTexture('#09090c', '#15151b');
        this.materials.dialBase.needsUpdate = true;
        this.materials.markers.color.setHex(0xf5d996);
        this.materials.hands.color.setHex(0xfbe4aa);
        this.materials.secondsHandMat.color.setHex(0x1f4e99);
        break;

      case 'platinum': // Arctic Platinum / Glacier Blue
        this.materials.caseMetal.color.setHex(0xdce2e8);
        this.materials.bezelMetal.color.setHex(0xf4f7fa);
        this.materials.dialBase.map = this.createSunburstDialTexture('#0a1b2a', '#173652');
        this.materials.dialBase.needsUpdate = true;
        this.materials.markers.color.setHex(0xf0f3f6);
        this.materials.hands.color.setHex(0xffffff);
        this.materials.secondsHandMat.color.setHex(0x00bcd4);
        break;

      case 'emerald': // Royal Gold / British Racing Emerald
        this.materials.caseMetal.color.setHex(0xe5b839);
        this.materials.bezelMetal.color.setHex(0xfad35c);
        this.materials.dialBase.map = this.createSunburstDialTexture('#041d13', '#0a3d28');
        this.materials.dialBase.needsUpdate = true;
        this.materials.markers.color.setHex(0xf7df9c);
        this.materials.hands.color.setHex(0xffeaad);
        this.materials.secondsHandMat.color.setHex(0xd4af37);
        break;

      case 'stealth': // DLC All-Black Forged Carbon
        this.materials.caseMetal.color.setHex(0x1c1d22);
        this.materials.caseMetal.roughness = 0.45;
        this.materials.bezelMetal.color.setHex(0x282930);
        this.materials.dialBase.map = this.createSunburstDialTexture('#050506', '#0d0e12');
        this.materials.dialBase.needsUpdate = true;
        this.materials.markers.color.setHex(0x8c8f99);
        this.materials.hands.color.setHex(0xa4a7b2);
        this.materials.secondsHandMat.color.setHex(0xe63946); // Crimson red sweep hand
        break;
    }
  }

  // Set Strap Type
  setStrap(strapKey) {
    this.currentStrap = strapKey;
    if (strapKey === 'bracelet') {
      this.createMetalBracelet();
    } else {
      this.createLeatherStrap();
      if (strapKey === 'rubber') {
        this.materials.strap.color.setHex(0x111215);
        this.materials.strap.roughness = 0.9;
        this.materials.strap.map = null;
        this.materials.strap.needsUpdate = true;
      } else {
        this.materials.strap.color.setHex(this.currentEdition === 'emerald' ? 0x422814 : 0x141416);
        this.materials.strap.map = this.createLeatherTexture();
        this.materials.strap.roughness = 0.75;
        this.materials.strap.needsUpdate = true;
      }
    }
  }

  // Toggle Super-LumiNova Night Glow
  setNightMode(enable) {
    this.isNightMode = enable;
    if (enable) {
      this.materials.lume.emissive.setHex(0x39ff14); // Electric green glow
      this.materials.lume.emissiveIntensity = 2.2;
      this.materials.hands.emissive.setHex(0x39ff14);
      this.materials.hands.emissiveIntensity = 0.6;
    } else {
      this.materials.lume.emissive.setHex(0x000000);
      this.materials.lume.emissiveIntensity = 0.0;
      this.materials.hands.emissive.setHex(0x000000);
      this.materials.hands.emissiveIntensity = 0.0;
    }
  }
}
