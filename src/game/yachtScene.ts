import * as THREE from 'three';
import { COLLIDERS, type LevelBox } from './colliders';

// Generate procedural textures with HTML5 Canvas / DataTexture
export function createNoiseTexture(size = 128, base: [number, number, number] = [180, 180, 180], variation = 20): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = (Math.random() - 0.5) * variation;
    imgData.data[i * 4] = Math.min(255, Math.max(0, base[0] + v));
    imgData.data[i * 4 + 1] = Math.min(255, Math.max(0, base[1] + v));
    imgData.data[i * 4 + 2] = Math.min(255, Math.max(0, base[2] + v));
    imgData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

export function createDeckWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#bfa588';
  ctx.fillRect(0, 0, 256, 256);

  // Planks
  const plankH = 16;
  for (let y = 0; y < 256; y += plankH) {
    ctx.fillStyle = y % 32 === 0 ? '#b69a7c' : '#c4aa8e';
    ctx.fillRect(0, y, 256, plankH - 1);
    ctx.fillStyle = '#6b543e';
    ctx.fillRect(0, y + plankH - 1, 256, 1); // seam
  }

  // Subtle grain
  const imgData = ctx.getImageData(0, 0, 256, 256);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + n));
    imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + n));
    imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 12);
  return tex;
}

export function createHelipadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark non-skid tarmac
  ctx.fillStyle = '#22272e';
  ctx.fillRect(0, 0, 512, 512);

  // Outer safety circle
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#e5a922';
  ctx.beginPath();
  ctx.arc(256, 256, 210, 0, Math.PI * 2);
  ctx.stroke();

  // White "H"
  ctx.fillStyle = '#f0f3f6';
  // Left post
  ctx.fillRect(160, 140, 36, 232);
  // Right post
  ctx.fillRect(316, 140, 36, 232);
  // Crossbar
  ctx.fillRect(196, 238, 120, 36);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function createWaterTexture(): { tex: THREE.CanvasTexture; update: (dt: number) => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  let offset = 0;

  const update = (dt: number) => {
    offset += dt * 1.5;
    const imgData = ctx.createImageData(128, 128);
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const i = (y * 128 + x) * 4;
        const wave = Math.sin((x * 0.1) + offset) + Math.cos((y * 0.15) - offset);
        const col = 180 + wave * 35;
        imgData.data[i] = 30;
        imgData.data[i + 1] = Math.min(255, Math.max(0, col));
        imgData.data[i + 2] = 230;
        imgData.data[i + 3] = 210;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    tex.needsUpdate = true;
  };

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  return { tex, update };
}

export function buildYachtScene(scene: THREE.Scene): { updateWater: (dt: number) => void } {
  // 1. Sky Dome & Lighting
  const skyGeo = new THREE.SphereGeometry(260, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    color: '#3a729e',
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // Ocean Water Plane
  const oceanGeo = new THREE.PlaneGeometry(600, 600);
  const oceanMat = new THREE.MeshStandardMaterial({
    color: '#134e70',
    roughness: 0.1,
    metalness: 0.8,
  });
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -1.2;
  scene.add(ocean);

  // Sunlight & Ambient
  const hemiLight = new THREE.HemisphereLight('#cbe5ff', '#23394a', 0.95);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight('#fff2d4', 1.4);
  sunLight.position.set(30, 45, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 120;
  sunLight.shadow.camera.left = -40;
  sunLight.shadow.camera.right = 40;
  sunLight.shadow.camera.top = 40;
  sunLight.shadow.camera.bottom = -40;
  scene.add(sunLight);

  // 2. Textures & Materials
  const deckWood = createDeckWoodTexture();
  const hullMat = new THREE.MeshStandardMaterial({ color: '#f3f6f9', roughness: 0.25, metalness: 0.15 });
  const deckWoodMat = new THREE.MeshStandardMaterial({ map: deckWood, roughness: 0.65 });
  const lowerFloorMat = new THREE.MeshStandardMaterial({ color: '#4d5763', roughness: 0.8 });
  const wallMat = new THREE.MeshStandardMaterial({ color: '#e8edf2', roughness: 0.5 });
  const interiorWallMat = new THREE.MeshStandardMaterial({ color: '#2b343e', roughness: 0.7 });
  const metalMat = new THREE.MeshStandardMaterial({ color: '#687787', metalness: 0.7, roughness: 0.3 });
  const crateMat = new THREE.MeshStandardMaterial({ color: '#966d48', roughness: 0.85 });
  const railingMat = new THREE.MeshStandardMaterial({ color: '#c5d0dc', metalness: 0.8, roughness: 0.2 });

  // 3. Hull Mesh (Streamlined luxury superyacht)
  const hullGroup = new THREE.Group();

  // Main hull body
  const hullGeo = new THREE.BoxGeometry(15, 6.8, 62);
  const hullMesh = new THREE.Mesh(hullGeo, hullMat);
  hullMesh.position.set(0, 1.4, 0);
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  hullGroup.add(hullMesh);

  // Bow wedge (pointed front)
  const bowGeo = new THREE.ConeGeometry(7.5, 12, 4);
  const bowMesh = new THREE.Mesh(bowGeo, hullMat);
  bowMesh.rotation.x = Math.PI / 2;
  bowMesh.rotation.y = Math.PI / 4;
  bowMesh.position.set(0, 1.4, 34);
  hullGroup.add(bowMesh);

  // Radar mast on superstructure top
  const mastGeo = new THREE.CylinderGeometry(0.12, 0.18, 5, 8);
  const mastMesh = new THREE.Mesh(mastGeo, metalMat);
  mastMesh.position.set(0, 8.4, -1);
  hullGroup.add(mastMesh);

  const radarDiscGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.25, 12);
  const radarDisc = new THREE.Mesh(radarDiscGeo, hullMat);
  radarDisc.position.set(0, 10.4, -1);
  hullGroup.add(radarDisc);

  scene.add(hullGroup);

  // 4. Helipad Graphic
  const helipadTex = createHelipadTexture();
  const heliGeo = new THREE.CircleGeometry(5.4, 32);
  const heliMat = new THREE.MeshStandardMaterial({ map: helipadTex, roughness: 0.8 });
  const helipad = new THREE.Mesh(heliGeo, heliMat);
  helipad.rotation.x = -Math.PI / 2;
  helipad.position.set(0, 3.42, -24);
  helipad.receiveShadow = true;
  scene.add(helipad);

  // 5. Pool with water
  const { tex: waterTex, update: updateWater } = createWaterTexture();
  const poolWaterGeo = new THREE.PlaneGeometry(3.8, 6.8);
  const poolWaterMat = new THREE.MeshStandardMaterial({
    map: waterTex,
    transparent: true,
    opacity: 0.8,
    roughness: 0.1,
    metalness: 0.1,
  });
  const poolWater = new THREE.Mesh(poolWaterGeo, poolWaterMat);
  poolWater.rotation.x = -Math.PI / 2;
  poolWater.position.set(3.2, 2.95, 0);
  scene.add(poolWater);

  // Pool interior turquoise liner
  const poolLinerGeo = new THREE.BoxGeometry(4.0, 1.3, 7.0);
  const poolLinerMat = new THREE.MeshStandardMaterial({ color: '#17a2b8', roughness: 0.4 });
  const poolLiner = new THREE.Mesh(poolLinerGeo, poolLinerMat);
  poolLiner.position.set(3.2, 2.5, 0);
  scene.add(poolLiner);

  // 6. Level Colliders Mesh rendering
  for (let i = 0; i < COLLIDERS.length; i++) {
    const b = COLLIDERS[i];
    if (b.kind === 'hull') continue; // hull is rendered above

    const wx = b.max[0] - b.min[0];
    const wy = b.max[1] - b.min[1];
    const wz = b.max[2] - b.min[2];
    const cx = (b.min[0] + b.max[0]) / 2;
    const cy = (b.min[1] + b.max[1]) / 2;
    const cz = (b.min[2] + b.max[2]) / 2;

    const geo = new THREE.BoxGeometry(wx, wy, wz);
    let mat: THREE.Material = wallMat;

    if (b.kind === 'floor') {
      mat = b.deck === 0 ? lowerFloorMat : deckWoodMat;
    } else if (b.kind === 'wall') {
      mat = b.deck === 0 ? interiorWallMat : wallMat;
    } else if (b.kind === 'crate') {
      mat = crateMat;
    } else if (b.kind === 'metal') {
      mat = metalMat;
    } else if (b.kind === 'railing') {
      mat = railingMat;
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, cy, cz);
    mesh.castShadow = b.kind === 'crate' || b.kind === 'wall';
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // 7. Tactical Red & Orange Barrels
  const barrelPositions: [number, number, number][] = [
    [5.6, 3.9, -10],
    [-5.0, 3.9, -5.6],
    [2.0, 3.9, 16],
    [-2.0, 3.9, 18],
    [5.6, 0.5, 3],
  ];
  const barrelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.95, 12);
  const redBarrelMat = new THREE.MeshStandardMaterial({ color: '#b93122', roughness: 0.4 });
  const yellowBarrelMat = new THREE.MeshStandardMaterial({ color: '#d98b2c', roughness: 0.4 });

  barrelPositions.forEach((pos, idx) => {
    const bMesh = new THREE.Mesh(barrelGeo, idx % 2 === 0 ? redBarrelMat : yellowBarrelMat);
    bMesh.position.set(pos[0], pos[1], pos[2]);
    bMesh.castShadow = true;
    scene.add(bMesh);
  });

  // 8. Strip lights in interior corridor & engine room
  const lightPositions: [number, number, number][] = [
    [0, 3.1, -20],
    [0, 3.1, -8],
    [0, 3.1, 8],
    [0, 3.1, 20],
    [-3.8, 3.1, -20],
    [3.8, 3.1, 20],
  ];
  const stripGeo = new THREE.BoxGeometry(1.6, 0.08, 0.2);
  const stripMat = new THREE.MeshBasicMaterial({ color: '#88e4ff' });

  lightPositions.forEach((pos) => {
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(pos[0], pos[1], pos[2]);
    scene.add(strip);

    const pt = new THREE.PointLight('#7dd3fc', 12, 9);
    pt.position.set(pos[0], pos[1] - 0.2, pos[2]);
    scene.add(pt);
  });

  return { updateWater };
}

// 3D Ghost Bot Character Mesh builder
export function createGhostMesh(): {
  group: THREE.Group;
  inner: THREE.Group;
  flash: THREE.Mesh;
  tintMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);

  // Tactical Uniform Dark Grey/Navy
  const suitMat = new THREE.MeshStandardMaterial({ color: '#1e252d', roughness: 0.7 });
  const vestMat = new THREE.MeshStandardMaterial({ color: '#14181d', roughness: 0.8 });
  const skullMaskMat = new THREE.MeshStandardMaterial({ color: '#d8dee4', roughness: 0.5 });
  const visorMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
  const gunMat = new THREE.MeshStandardMaterial({ color: '#0f1317', metalness: 0.8, roughness: 0.3 });

  // Body Capsule
  const bodyGeo = new THREE.CapsuleGeometry(0.32, 0.8, 4, 8);
  const body = new THREE.Mesh(bodyGeo, suitMat);
  body.position.y = 0.95;
  inner.add(body);

  // Tactical Vest
  const vestGeo = new THREE.BoxGeometry(0.55, 0.52, 0.38);
  const vest = new THREE.Mesh(vestGeo, vestMat);
  vest.position.y = 1.05;
  inner.add(vest);

  // Head & Ghost Skull Mask
  const headGeo = new THREE.SphereGeometry(0.2, 10, 8);
  const head = new THREE.Mesh(headGeo, skullMaskMat);
  head.position.y = 1.68;
  inner.add(head);

  // Visor
  const visorGeo = new THREE.BoxGeometry(0.26, 0.08, 0.08);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 1.7, -0.18);
  inner.add(visor);

  // Carbine Weapon held in hands
  const gunGeo = new THREE.BoxGeometry(0.08, 0.12, 0.58);
  const gun = new THREE.Mesh(gunGeo, gunMat);
  gun.position.set(0.24, 1.25, -0.28);
  inner.add(gun);

  // Muzzle Flash plane
  const flashGeo = new THREE.PlaneGeometry(0.3, 0.3);
  const flashMat = new THREE.MeshBasicMaterial({
    color: '#ffc107',
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.set(0.24, 1.25, -0.62);
  flash.visible = false;
  inner.add(flash);

  return { group, inner, flash, tintMesh: body };
}

// 3D Viewmodel for player's NV-4 Carbine
export function createNV4ViewModel(): {
  group: THREE.Group;
  flash: THREE.Mesh;
  light: THREE.PointLight;
} {
  const group = new THREE.Group();

  const gunMat = new THREE.MeshStandardMaterial({ color: '#16191d', metalness: 0.85, roughness: 0.25 });
  const accentMat = new THREE.MeshStandardMaterial({ color: '#e67e22', metalness: 0.5, roughness: 0.4 });
  const opticMat = new THREE.MeshBasicMaterial({ color: '#00e5ff' });

  // Main Receiver
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.52), gunMat);
  group.add(receiver);

  // Barrel
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.42), gunMat);
  barrel.position.set(0, 0.01, -0.45);
  group.add(barrel);

  // Magazine
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.09), gunMat);
  mag.position.set(0, -0.16, 0.06);
  group.add(mag);

  // Stock
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.22), gunMat);
  stock.position.set(0, -0.02, 0.34);
  group.add(stock);

  // Picatinny Rail & Orange Accent strip
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.22), accentMat);
  rail.position.set(0, 0.09, -0.18);
  group.add(rail);

  // Reflex Sight Reticle
  const opticHousing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.08), gunMat);
  opticHousing.position.set(0, 0.12, -0.12);
  group.add(opticHousing);

  const reticleDot = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), opticMat);
  reticleDot.position.set(0, 0.12, -0.165);
  group.add(reticleDot);

  // Muzzle flash
  const flashGeo = new THREE.PlaneGeometry(0.24, 0.24);
  const flashMat = new THREE.MeshBasicMaterial({
    color: '#ffbe3b',
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.set(0, 0.03, -0.7);
  flash.visible = false;
  group.add(flash);

  const light = new THREE.PointLight('#ffc107', 0, 10);
  light.position.set(0, 0.1, -0.7);
  group.add(light);

  return { group, flash, light };
}
