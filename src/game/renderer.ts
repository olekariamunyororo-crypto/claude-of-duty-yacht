import * as THREE from 'three';
import { COLLIDERS, rayBox, rayCylinder, raySphere, coneDir } from './colliders';
import { PLAYER, collideMove, inPool, type MoveOut } from './movement';
import { NV4, FRAG } from './weapon';
import { createBots, updateBotAI, type BotRuntime } from './bots';
import { buildYachtScene, createGhostMesh, createNV4ViewModel } from './yachtScene';
import { audio } from './audio';
import type { GameSettings } from '../types';

export interface PlayerState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  pitch: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  deadT: number;
  lastDamageT: number;
  spawnProtT: number;
  onGround: boolean;
  sprint: boolean;
  ads: boolean;
  mag: number;
  reserve: number;
  grenades: number;
  reloading: boolean;
  reloadStart: number;
  reloadEnd: number;
  bobPhase: number;
  bobY: number;
  landDip: number;
  recoilP: number;
  recoilY: number;
  bloom: number;
  adsT: number;
  stepAcc: number;
}

export interface BulletTracer {
  mesh: THREE.Line;
  t0: number;
}

export interface ImpactEffect {
  mesh: THREE.Mesh;
  t0: number;
  kind: 'spark' | 'blood' | 'explosion';
}

export interface ActiveGrenade {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  mesh: THREE.Mesh;
  fuse: number;
  byPlayer: boolean;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  fire: boolean;
  ads: boolean;
  reload: boolean;
  frag: boolean;
  lookDX: number;
  lookDY: number;
  virtualMoveX: number;
  virtualMoveY: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private resizeObserver: ResizeObserver;
  private animId: number = 0;
  private lastTime: number = 0;
  private gameTime: number = 0;

  public player: PlayerState;
  public bots: BotRuntime[] = [];
  public botMeshes: { group: THREE.Group; inner: THREE.Group; flash: THREE.Mesh; tintMesh: THREE.Mesh }[] = [];

  public input: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
    fire: false,
    ads: false,
    reload: false,
    frag: false,
    lookDX: 0,
    lookDY: 0,
    virtualMoveX: 0,
    virtualMoveY: 0,
  };

  public settings: GameSettings;
  private nextPlayerShot: number = 0;
  private moveOut: MoveOut = { grounded: false, hitWall: false, landed: false };

  // Viewmodel
  private viewModel: { group: THREE.Group; flash: THREE.Mesh; light: THREE.PointLight };
  private sway = { x: 0, y: 0 };
  private shakeAmp = 0;

  // Visual Effects
  private tracers: BulletTracer[] = [];
  private impacts: ImpactEffect[] = [];
  private grenades: ActiveGrenade[] = [];
  private updateWaterScene: (dt: number) => void = () => {};

  // FPS metric
  private frameCount = 0;
  private fpsTimer = 0;
  public currentFps = 60;

  // Callbacks
  public onHudUpdate?: (data: {
    hp: number;
    mag: number;
    reserve: number;
    grenades: number;
    reloading: boolean;
    reloadProgress: number;
    yaw: number;
    px: number;
    pz: number;
    bloom: number;
    adsT: number;
    fps: number;
    alive: boolean;
    botRadar: { x: number; z: number; alive: boolean }[];
  }) => void;

  public onHitmarker?: (isKill: boolean) => void;
  public onDamageTaken?: (sourcePos: THREE.Vector3) => void;
  public onKill?: (killer: string, victim: string, weapon: string, headshot: boolean, byPlayer: boolean) => void;
  public onPlayerDeath?: (killer: string) => void;

  constructor(canvas: HTMLCanvasElement, settings: GameSettings) {
    this.canvas = canvas;
    this.settings = settings;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: settings.quality === 'high',
      powerPreference: 'high-performance',
    });
    this.updateDpr();

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#101c28');
    this.scene.fog = new THREE.FogExp2('#101c28', 0.007);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.05, 300);
    this.scene.add(this.camera);

    // Initial Player State
    this.player = {
      pos: new THREE.Vector3(0, 3.42, -25),
      vel: new THREE.Vector3(),
      yaw: Math.PI,
      pitch: 0,
      hp: 100,
      maxHp: 100,
      alive: true,
      deadT: 0,
      lastDamageT: -99,
      spawnProtT: 0,
      onGround: true,
      sprint: false,
      ads: false,
      mag: NV4.magSize,
      reserve: NV4.reserveMax,
      grenades: 2,
      reloading: false,
      reloadStart: 0,
      reloadEnd: 0,
      bobPhase: 0,
      bobY: 0,
      landDip: 0,
      recoilP: 0,
      recoilY: 0,
      bloom: 0,
      adsT: 0,
      stepAcc: 0,
    };

    // Build Yacht & Level
    const { updateWater } = buildYachtScene(this.scene);
    this.updateWaterScene = updateWater;

    // Create Viewmodel
    this.viewModel = createNV4ViewModel();
    this.camera.add(this.viewModel.group);

    // Create Bots
    this.initBots(5);

    // Resize handling
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.canvas);
    this.onResize();

    this.lastTime = performance.now();
  }

  public updateSettings(newSettings: GameSettings) {
    this.settings = newSettings;
    this.updateDpr();
    audio.setVolume(newSettings.volume);
  }

  private updateDpr() {
    const dpr = this.settings.quality === 'low' ? 0.75 : this.settings.quality === 'medium' ? 1.0 : Math.min(window.devicePixelRatio, 1.5);
    this.renderer.setPixelRatio(dpr);
  }

  private onResize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public initBots(count = 5) {
    // Remove old meshes
    this.botMeshes.forEach((m) => this.scene.remove(m.group));
    this.botMeshes = [];

    this.bots = createBots(count);
    for (let i = 0; i < this.bots.length; i++) {
      const meshData = createGhostMesh();
      this.botMeshes.push(meshData);
      this.scene.add(meshData.group);
    }
  }

  public start() {
    this.lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      this.gameTime += dt;

      this.update(dt);
      this.render();

      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }

  public destroy() {
    this.stop();
    this.resizeObserver.disconnect();
    this.renderer.dispose();
  }

  public respawnPlayer() {
    const p = this.player;
    p.pos.set(0, 3.42, -25);
    p.vel.set(0, 0, 0);
    p.yaw = Math.PI;
    p.pitch = 0;
    p.hp = p.maxHp;
    p.alive = true;
    p.deadT = 0;
    p.mag = NV4.magSize;
    p.reserve = NV4.reserveMax;
    p.grenades = 2;
    p.reloading = false;
    p.recoilP = 0;
    p.recoilY = 0;
    p.bloom = 0;
    p.spawnProtT = this.gameTime;
  }

  // --- Main Update Loop ---
  private update(dt: number) {
    // FPS counter
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.currentFps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.updateWaterScene(dt);

    if (this.player.alive) {
      this.updatePlayerInput(dt);
      this.updatePlayerMovement(dt);
      this.updateWeapon(dt);
      this.updatePlayerHealth(dt);
    } else {
      // Death camera sinks
      this.player.landDip = Math.min(1.2, this.player.landDip + dt * 1.5);
    }

    this.updateCamera(dt);
    this.updateViewModel(dt);
    this.updateBotsSimulation(dt);
    this.updateGrenades(dt);
    this.updateEffects(dt);

    // Emit HUD telemetry
    if (this.onHudUpdate) {
      const p = this.player;
      const rlProg = p.reloading ? (this.gameTime - p.reloadStart) / NV4.reloadTime : 0;
      this.onHudUpdate({
        hp: p.hp,
        mag: p.mag,
        reserve: p.reserve,
        grenades: p.grenades,
        reloading: p.reloading,
        reloadProgress: Math.min(1, rlProg),
        yaw: p.yaw,
        px: p.pos.x,
        pz: p.pos.z,
        bloom: p.bloom,
        adsT: p.adsT,
        fps: this.currentFps,
        alive: p.alive,
        botRadar: this.bots.map((b) => ({ x: b.pos.x, z: b.pos.z, alive: b.alive })),
      });
    }
  }

  private updatePlayerInput(dt: number) {
    const p = this.player;
    const sens = 0.0022 * (this.settings.sensitivity / 5) * (p.ads ? 0.55 : 1.0);
    const invertY = this.settings.invertY ? -1 : 1;

    // Look rotation
    p.yaw -= this.input.lookDX * sens;
    p.pitch = Math.max(-1.45, Math.min(1.45, p.pitch - this.input.lookDY * sens * invertY));
    this.input.lookDX = 0;
    this.input.lookDY = 0;

    // Reload trigger
    if (this.input.reload) {
      this.input.reload = false;
      this.tryReload();
    }

    // Frag grenade trigger
    if (this.input.frag) {
      this.input.frag = false;
      this.throwFrag();
    }
  }

  private updatePlayerMovement(dt: number) {
    const p = this.player;

    // Stances
    p.ads = this.input.ads && !p.reloading;
    const wantsSprint = (this.input.sprint || this.input.virtualMoveY > 0.8) && !p.ads && !p.reloading && !this.input.fire;
    p.sprint = wantsSprint;

    // Movement axes (Keyboard WASD + Virtual Joystick)
    let moveX = 0;
    let moveZ = 0;

    if (this.input.forward) moveZ += 1;
    if (this.input.backward) moveZ -= 1;
    if (this.input.left) moveX -= 1;
    if (this.input.right) moveX += 1;

    moveX += this.input.virtualMoveX;
    moveZ += this.input.virtualMoveY;

    const inputMag = Math.min(1, Math.hypot(moveX, moveZ));

    // World relative wish vector
    const sy = Math.sin(p.yaw);
    const cy = Math.cos(p.yaw);
    const fX = -sy;
    const fZ = -cy;
    const rX = cy;
    const rZ = -sy;

    let wishX = fX * moveZ + rX * moveX;
    let wishZ = fZ * moveZ + rZ * moveX;
    const wl = Math.hypot(wishX, wishZ) || 1;

    let targetSpeed = p.sprint ? PLAYER.speedSprint : p.ads ? PLAYER.speedAds : PLAYER.speedWalk;
    if (inPool(p.pos.x, p.pos.y, p.pos.z)) {
      targetSpeed *= 0.55;
    }

    const tx = (wishX / wl) * targetSpeed * inputMag;
    const tz = (wishZ / wl) * targetSpeed * inputMag;

    const accel = p.onGround ? PLAYER.accelGround : PLAYER.accelAir;
    const t = Math.min(1, (accel * dt) / Math.max(targetSpeed, 0.001));

    if (inputMag > 0.01) {
      p.vel.x += (tx - p.vel.x) * t;
      p.vel.z += (tz - p.vel.z) * t;
    } else if (p.onGround) {
      const f = Math.max(0, 1 - PLAYER.friction * dt);
      p.vel.x *= f;
      p.vel.z *= f;
    }

    // Gravity & Jump
    p.vel.y -= PLAYER.gravity * dt;
    if (this.input.jump && p.onGround) {
      this.input.jump = false;
      p.vel.y = PLAYER.jumpVel;
      p.onGround = false;
      audio.play('jump', { gain: 0.45 });
    }

    const fallSpeed = p.vel.y;
    collideMove(p.pos, p.vel, dt, this.moveOut);
    p.onGround = this.moveOut.grounded;

    if (this.moveOut.landed) {
      p.landDip = Math.min(0.18, -fallSpeed * 0.02);
      audio.play('land', { gain: 0.55 });
      this.shakeAmp = Math.max(this.shakeAmp, 0.025);
    }
    p.landDip = Math.max(0, p.landDip - dt * 0.9);

    // Footsteps & View Bobbing
    const hSpeed = Math.hypot(p.vel.x, p.vel.z);
    if (p.onGround && hSpeed > 0.6) {
      p.bobPhase += hSpeed * dt * 1.8;
      p.bobY = Math.sin(p.bobPhase * 2) * 0.026;

      p.stepAcc += hSpeed * dt;
      if (p.stepAcc > 2.2) {
        p.stepAcc = 0;
        audio.play(Math.random() < 0.5 ? 'step' : 'step2', { gain: p.sprint ? 0.6 : 0.4 });
      }
    } else {
      p.bobY *= 0.8;
    }

    // Decay recoil & bloom
    p.recoilP *= Math.max(0, 1 - 10 * dt);
    p.recoilY *= Math.max(0, 1 - 10 * dt);
    p.bloom = Math.max(0, p.bloom - dt * 6);
    p.adsT = Math.max(0, Math.min(1, p.adsT + (p.ads ? dt / NV4.adsTime : -dt / (NV4.adsTime * 0.9))));
  }

  private updateWeapon(dt: number) {
    const p = this.player;

    if (p.reloading) {
      if (this.gameTime >= p.reloadEnd) {
        const needed = NV4.magSize - p.mag;
        const take = Math.min(needed, p.reserve);
        p.mag += take;
        p.reserve -= take;
        p.reloading = false;
        audio.play('reloadB', { gain: 0.65 });
      }
      return;
    }

    if (this.input.fire && this.gameTime >= this.nextPlayerShot) {
      if (p.mag <= 0) {
        audio.play('empty', { gain: 0.5 });
        this.nextPlayerShot = this.gameTime + 0.28;
        this.tryReload();
        return;
      }

      p.mag -= 1;
      this.nextPlayerShot = this.gameTime + 60 / NV4.rpm;

      // Calculate spread and ray
      const spread = (p.ads ? NV4.spreadAds : NV4.spreadHip) + p.bloom;
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);

      const fireDir = new THREE.Vector3();
      coneDir(camDir, spread, fireDir);

      this.fireBullet(this.camera.position, fireDir, true, 'YOU');

      // Recoil kick
      const recoilAmp = p.ads ? 0.65 : 1.0;
      p.recoilP += (NV4.recoilPitch[0] + Math.random() * (NV4.recoilPitch[1] - NV4.recoilPitch[0])) * (Math.PI / 180) * recoilAmp;
      p.recoilY += (NV4.recoilYaw[0] + Math.random() * (NV4.recoilYaw[1] - NV4.recoilYaw[0])) * (Math.PI / 180) * (Math.random() < 0.5 ? -1 : 1) * recoilAmp;
      p.bloom = Math.min(NV4.bloomMax, p.bloom + NV4.bloomPerShot);
      this.shakeAmp = Math.max(this.shakeAmp, p.ads ? 0.015 : 0.025);

      audio.play('shot', { gain: 0.85, rate: 0.97 + Math.random() * 0.06 });
      if (Math.random() < 0.4) audio.play('shotFar', { gain: 0.15 });

      // Trigger muzzle flash on viewmodel
      this.viewModel.flash.visible = true;
      this.viewModel.light.intensity = 22;
      setTimeout(() => {
        this.viewModel.flash.visible = false;
        this.viewModel.light.intensity = 0;
      }, 45);
    }
  }

  public tryReload() {
    const p = this.player;
    if (p.reloading || p.mag >= NV4.magSize || p.reserve <= 0) return;
    p.reloading = true;
    p.reloadStart = this.gameTime;
    p.reloadEnd = this.gameTime + NV4.reloadTime;
    audio.play('reloadA', { gain: 0.65 });
  }

  public throwFrag() {
    const p = this.player;
    if (p.grenades <= 0) return;
    p.grenades -= 1;

    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    const vel = camDir.clone().multiplyScalar(FRAG.throwSpeed);
    vel.y += FRAG.upKick;

    const geo = new THREE.IcosahedronGeometry(0.12, 1);
    const mat = new THREE.MeshStandardMaterial({ color: '#2f4228', roughness: 0.4, metalness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(this.camera.position).addScaledVector(camDir, 0.6);
    this.scene.add(mesh);

    this.grenades.push({
      pos: mesh.position.clone(),
      vel,
      mesh,
      fuse: FRAG.fuse,
      byPlayer: true,
    });

    audio.play('ui', { gain: 0.4, rate: 0.7 });
  }

  private fireBullet(origin: THREE.Vector3, dir: THREE.Vector3, isPlayer: boolean, shooterName: string) {
    let hitT = 120;
    let hitBotIdx = -1;
    let isHeadshot = false;

    // Raycast world colliders
    for (let i = 0; i < COLLIDERS.length; i++) {
      const b = COLLIDERS[i];
      const t = rayBox(origin.x, origin.y, origin.z, dir.x, dir.y, dir.z, b, hitT);
      if (t >= 0 && t < hitT) {
        hitT = t;
      }
    }

    // Raycast bots
    for (let i = 0; i < this.bots.length; i++) {
      const bot = this.bots[i];
      if (!bot.alive) continue;
      // Head sphere
      const th = raySphere(origin.x, origin.y, origin.z, dir.x, dir.y, dir.z, bot.pos.x, bot.pos.y + 1.68, bot.pos.z, 0.25, hitT);
      if (th >= 0 && th < hitT) {
        hitT = th;
        hitBotIdx = i;
        isHeadshot = true;
        continue;
      }
      // Body cylinder
      const tb = rayCylinder(origin.x, origin.y, origin.z, dir.x, dir.y, dir.z, bot.pos.x, bot.pos.z, bot.pos.y + 0.1, bot.pos.y + 1.55, 0.36, hitT);
      if (tb >= 0 && tb < hitT) {
        hitT = tb;
        hitBotIdx = i;
        isHeadshot = false;
      }
    }

    // Check hit on player if fired by bot
    if (!isPlayer && this.player.alive && this.gameTime - this.player.spawnProtT > 1.2) {
      const p = this.player;
      const th = raySphere(origin.x, origin.y, origin.z, dir.x, dir.y, dir.z, p.pos.x, p.pos.y + 1.68, p.pos.z, 0.25, hitT);
      const tb = rayCylinder(origin.x, origin.y, origin.z, dir.x, dir.y, dir.z, p.pos.x, p.pos.z, p.pos.y + 0.1, p.pos.y + 1.55, 0.36, hitT);
      const playerHitT = th >= 0 ? th : tb;
      if (playerHitT >= 0 && playerHitT < hitT) {
        hitT = playerHitT;
        this.damagePlayer(th >= 0 ? 25 : 15, origin, shooterName);
      }
    }

    const hitPoint = origin.clone().addScaledVector(dir, hitT);

    // Tracer line
    this.createTracer(origin, hitPoint);

    // Damage bot
    if (hitBotIdx >= 0) {
      const bot = this.bots[hitBotIdx];
      const dmg = isHeadshot ? NV4.damageHead : NV4.damageBody;
      bot.hp -= dmg;
      bot.hitFlashT = this.gameTime;

      this.createImpact(hitPoint, 'blood');

      if (isPlayer) {
        if (bot.hp <= 0) {
          bot.alive = false;
          bot.deathT = this.gameTime;
          bot.respawnT = this.gameTime + 4.0;
          audio.play('kill', { gain: 0.85 });
          if (this.onHitmarker) this.onHitmarker(true);
          if (this.onKill) this.onKill('YOU', bot.name, 'NV-4', isHeadshot, true);
        } else {
          audio.play('hit', { gain: 0.6 });
          if (this.onHitmarker) this.onHitmarker(false);
        }
      } else {
        if (bot.hp <= 0) {
          bot.alive = false;
          bot.deathT = this.gameTime;
          bot.respawnT = this.gameTime + 4.0;
          if (this.onKill) this.onKill(shooterName, bot.name, 'NV-4', isHeadshot, false);
        }
      }
    } else if (hitT < 119) {
      this.createImpact(hitPoint, 'spark');
    }
  }

  public damagePlayer(amount: number, fromPos: THREE.Vector3, killerName: string) {
    const p = this.player;
    if (!p.alive) return;
    p.hp -= amount;
    p.lastDamageT = this.gameTime;
    this.shakeAmp = Math.max(this.shakeAmp, 0.04);

    audio.play('hurt', { gain: 0.7 });
    if (this.onDamageTaken) this.onDamageTaken(fromPos);

    if (p.hp <= 0) {
      p.hp = 0;
      p.alive = false;
      p.deadT = this.gameTime;
      audio.play('explode', { gain: 0.4, rate: 1.5 });
      if (this.onKill) this.onKill(killerName, 'YOU', 'NV-4', false, false);
      if (this.onPlayerDeath) this.onPlayerDeath(killerName);
    }
  }

  private updatePlayerHealth(dt: number) {
    const p = this.player;
    if (p.hp < p.maxHp && this.gameTime - p.lastDamageT > 3.5) {
      p.hp = Math.min(p.maxHp, p.hp + 38 * dt);
    }
  }

  private updateCamera(dt: number) {
    const p = this.player;

    // Eye position with view bobbing & landing dip
    this.camera.position.set(
      p.pos.x,
      p.pos.y + 1.62 + p.bobY - p.landDip,
      p.pos.z,
    );

    // Screen shake
    this.shakeAmp = Math.max(0, this.shakeAmp - dt * 0.15);
    if (this.shakeAmp > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeAmp;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeAmp;
    }

    // View rotation with recoil
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = p.yaw + p.recoilY;
    this.camera.rotation.x = p.pitch + p.recoilP;

    // Slight view roll when strafing
    const hSpeed = Math.hypot(p.vel.x, p.vel.z);
    this.camera.rotation.z = p.onGround ? Math.sin(p.bobPhase) * 0.012 * Math.min(1, hSpeed / 5) : 0;

    // ADS FOV Zoom
    const targetFov = p.ads ? NV4.adsFov : 75;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 1 - Math.exp(-14 * dt));
    this.camera.updateProjectionMatrix();
  }

  private updateViewModel(dt: number) {
    const p = this.player;
    const g = this.viewModel.group;

    // Look sway
    this.sway.x = THREE.MathUtils.lerp(this.sway.x, -this.input.lookDX * 0.001, 1 - Math.exp(-10 * dt));
    this.sway.y = THREE.MathUtils.lerp(this.sway.y, this.input.lookDY * 0.001, 1 - Math.exp(-10 * dt));

    const hipPos = new THREE.Vector3(0.24, -0.28, -0.52);
    const adsPos = new THREE.Vector3(0, -0.165, -0.38);

    const bx = Math.sin(p.bobPhase) * 0.012 * (1 - p.adsT * 0.7);
    const by = Math.abs(Math.cos(p.bobPhase)) * 0.01 * (1 - p.adsT * 0.7);

    // Reload animation dip
    let reloadDip = 0;
    let reloadRot = 0;
    if (p.reloading) {
      const prog = (this.gameTime - p.reloadStart) / NV4.reloadTime;
      reloadDip = Math.sin(prog * Math.PI) * 0.16;
      reloadRot = Math.sin(prog * Math.PI) * 0.6;
    }

    const kick = p.recoilP * 0.8;

    g.position.set(
      THREE.MathUtils.lerp(hipPos.x, adsPos.x, p.adsT) + bx + this.sway.x,
      THREE.MathUtils.lerp(hipPos.y, adsPos.y, p.adsT) + by + this.sway.y - reloadDip,
      THREE.MathUtils.lerp(hipPos.z, adsPos.z, p.adsT) + kick,
    );

    g.rotation.set(
      kick * 1.8 + reloadRot,
      this.sway.x * 2.5,
      this.sway.y * 1.5,
    );
  }

  private updateBotsSimulation(dt: number) {
    updateBotAI(
      this.bots,
      dt,
      this.gameTime,
      { pos: this.player.pos, alive: this.player.alive, spawnProtT: this.player.spawnProtT },
      (bot, aimPoint) => {
        // Bot fired
        const eyePos = new THREE.Vector3(bot.pos.x, bot.pos.y + 1.45, bot.pos.z);
        const dir = aimPoint.clone().sub(eyePos).normalize();
        this.fireBullet(eyePos, dir, false, bot.name);

        audio.playAt('shot', eyePos, this.player.pos, this.player.yaw, 0.55);

        // Flash
        const mesh = this.botMeshes[bot.id];
        if (mesh) {
          mesh.flash.visible = true;
          setTimeout(() => {
            mesh.flash.visible = false;
          }, 45);
        }
      },
    );

    // Update 3D meshes for bots
    for (let i = 0; i < this.bots.length; i++) {
      const b = this.bots[i];
      const m = this.botMeshes[i];
      if (!m) continue;

      m.group.position.copy(b.pos);
      m.group.rotation.y = b.yaw;

      if (b.alive) {
        m.group.visible = true;
        const hs = Math.hypot(b.vel.x, b.vel.z);
        m.inner.position.y = Math.abs(Math.sin(this.gameTime * 8 + b.id)) * 0.04 * Math.min(1, hs / 4);
        m.inner.rotation.z = -b.strafe * 0.08;
        m.inner.rotation.x = 0;

        // Hit flash red tint
        const isHit = this.gameTime - b.hitFlashT < 0.1;
        (m.tintMesh.material as THREE.MeshStandardMaterial).color.set(isHit ? '#ef4444' : '#1e252d');
      } else {
        // Fall over & sink
        const age = this.gameTime - b.deathT;
        m.inner.rotation.x = Math.min(Math.PI / 2, age * 5);
        m.inner.position.y = -Math.min(0.4, Math.max(0, age - 2) * 0.5);
      }
    }
  }

  private updateGrenades(dt: number) {
    const r = 0.12;
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.fuse -= dt;

      if (g.fuse <= 0) {
        this.explodeGrenade(g.pos, g.byPlayer);
        this.scene.remove(g.mesh);
        this.grenades.splice(i, 1);
        continue;
      }

      g.vel.y -= 18 * dt;

      // X bounce
      let nx = g.pos.x + g.vel.x * dt;
      for (let j = 0; j < COLLIDERS.length; j++) {
        const b = COLLIDERS[j];
        if (nx + r > b.min[0] && nx - r < b.max[0] && g.pos.y + r > b.min[1] && g.pos.y - r < b.max[1] && g.pos.z + r > b.min[2] && g.pos.z - r < b.max[2]) {
          g.vel.x *= -0.45;
          nx = g.pos.x;
          break;
        }
      }
      g.pos.x = nx;

      // Z bounce
      let nz = g.pos.z + g.vel.z * dt;
      for (let j = 0; j < COLLIDERS.length; j++) {
        const b = COLLIDERS[j];
        if (g.pos.x + r > b.min[0] && g.pos.x - r < b.max[0] && g.pos.y + r > b.min[1] && g.pos.y - r < b.max[1] && nz + r > b.min[2] && nz - r < b.max[2]) {
          g.vel.z *= -0.45;
          nz = g.pos.z;
          break;
        }
      }
      g.pos.z = nz;

      // Y bounce
      let ny = g.pos.y + g.vel.y * dt;
      let bounced = false;
      for (let j = 0; j < COLLIDERS.length; j++) {
        const b = COLLIDERS[j];
        if (g.pos.x + r > b.min[0] && g.pos.x - r < b.max[0] && ny + r > b.min[1] && ny - r < b.max[1] && g.pos.z + r > b.min[2] && g.pos.z - r < b.max[2]) {
          if (g.vel.y < 0) {
            ny = b.max[1] + r;
            g.vel.y = Math.abs(g.vel.y) > 2 ? Math.abs(g.vel.y) * 0.4 : 0;
            if (g.vel.y > 0.4) bounced = true;
          } else {
            ny = b.min[1] - r;
            g.vel.y = 0;
          }
          break;
        }
      }
      g.pos.y = ny;

      if (bounced) {
        audio.play('bounce', { gain: 0.4 });
      }

      // Rest friction
      if (g.vel.y === 0) {
        g.vel.x *= 0.85;
        g.vel.z *= 0.85;
      }

      g.mesh.position.copy(g.pos);
      g.mesh.rotation.x += dt * 4;
      g.mesh.rotation.z += dt * 3;
    }
  }

  private explodeGrenade(pos: THREE.Vector3, byPlayer: boolean) {
    this.createImpact(pos, 'explosion');
    audio.playAt('explode', pos, this.player.pos, this.player.yaw, 1.0);
    this.shakeAmp = Math.max(this.shakeAmp, 0.12);

    // Damage player
    if (this.player.alive) {
      const d = pos.distanceTo(this.player.pos);
      if (d <= FRAG.radius) {
        const dmg = FRAG.damage * (1 - d / FRAG.radius);
        this.damagePlayer(dmg, pos, byPlayer ? 'YOUR FRAG' : 'ENEMY FRAG');
      }
    }

    // Damage bots
    for (let i = 0; i < this.bots.length; i++) {
      const b = this.bots[i];
      if (!b.alive) continue;
      const d = pos.distanceTo(b.pos);
      if (d <= FRAG.radius) {
        const dmg = FRAG.damage * (1 - d / FRAG.radius);
        b.hp -= dmg;
        b.hitFlashT = this.gameTime;
        if (b.hp <= 0) {
          b.alive = false;
          b.deathT = this.gameTime;
          b.respawnT = this.gameTime + 4.0;
          if (byPlayer) {
            if (this.onKill) this.onKill('YOU', b.name, 'FRAG', false, true);
          } else {
            if (this.onKill) this.onKill('GHOST', b.name, 'FRAG', false, false);
          }
        }
      }
    }
  }

  private createTracer(start: THREE.Vector3, end: THREE.Vector3) {
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({
      color: '#7dd3fc',
      transparent: true,
      opacity: 0.9,
      linewidth: 2,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.tracers.push({ mesh: line, t0: this.gameTime });
  }

  private createImpact(pos: THREE.Vector3, kind: 'spark' | 'blood' | 'explosion') {
    const geo = new THREE.SphereGeometry(kind === 'explosion' ? 1.4 : 0.16, 8, 8);
    const col = kind === 'blood' ? '#dc2626' : kind === 'explosion' ? '#f97316' : '#fde047';
    const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);
    this.impacts.push({ mesh, t0: this.gameTime, kind });
  }

  private updateEffects(dt: number) {
    // Tracers fade quickly
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tr = this.tracers[i];
      const age = (this.gameTime - tr.t0) / 0.08;
      if (age >= 1) {
        this.scene.remove(tr.mesh);
        tr.mesh.geometry.dispose();
        (tr.mesh.material as THREE.Material).dispose();
        this.tracers.splice(i, 1);
      } else {
        (tr.mesh.material as THREE.LineBasicMaterial).opacity = 0.9 * (1 - age);
      }
    }

    // Impacts fade and expand
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const imp = this.impacts[i];
      const maxAge = imp.kind === 'explosion' ? 0.6 : 0.25;
      const age = (this.gameTime - imp.t0) / maxAge;
      if (age >= 1) {
        this.scene.remove(imp.mesh);
        imp.mesh.geometry.dispose();
        (imp.mesh.material as THREE.Material).dispose();
        this.impacts.splice(i, 1);
      } else {
        const mat = imp.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 1 - age;
        const scale = 1 + age * (imp.kind === 'explosion' ? 4 : 2);
        imp.mesh.scale.set(scale, scale, scale);
      }
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }
}
