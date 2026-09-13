import * as THREE from 'three';

export interface BotRuntime {
  id: number; name: string;
  pos: THREE.Vector3; vel: THREE.Vector3; yaw: number;
  hp: number; alive: boolean; respawnT: number; deathT: number;
  state: 'patrol' | 'combat';
  wp: number; prevWp: number;
  seeT: number; reactT: number; fireT: number; burst: number;
  strafe: number; strafeT: number;
  targetIsPlayer: boolean; targetBot: number;
  score: number; flashT: number; hitFlashT: number; stepAcc: number;
  grounded: boolean; hitWallCooldown: number;
}

export interface Tracer { ax: number; ay: number; az: number; bx: number; by: number; bz: number; t0: number }
export interface Impact { x: number; y: number; z: number; t0: number; kind: 'spark' | 'blood' | 'explosion' }
export interface Grenade { pos: THREE.Vector3; vel: THREE.Vector3; fuse: number; byPlayer: boolean; spin: number }
export interface Impulse { x: number; y: number; z: number; dx: number; dy: number; dz: number; power: number }

export const world = {
  time: 0,
  perf: { fps: 60, acc: 0, frames: 0 },
  cfg: { sensitivity: 5, invertY: false, quality: 'medium' as string, volume: 0.8 },
  player: {
    pos: new THREE.Vector3(0, 3.42, -25), vel: new THREE.Vector3(),
    yaw: Math.PI, pitch: 0,
    hp: 100, maxHp: 100, alive: true, deadT: 0, killer: '',
    lastDamageT: -99, spawnProtT: -99,
    onGround: true, sprint: false, ads: false,
    mag: 30, reserve: 120, grenades: 2, reloading: false, reloadEnd: 0, reloadStart: 0,
    bobPhase: 0, bobY: 0, landDip: 0, stepAcc: 0,
    recoilP: 0, recoilY: 0, bloom: 0, adsT: 0,
    eyeH: 1.62,
  },
  bots: [] as BotRuntime[],
  fx: {
    tracers: [] as Tracer[],
    impacts: [] as Impact[],
    grenades: [] as Grenade[],
    impulses: [] as Impulse[],
  },
  events: {
    shotT: -99, hitT: -99, hitKillT: -99, dmgT: [-99, -99, -99], dmgAng: [0, 0, 0], dmgIdx: 0,
    aimName: '', aimT: -99, explosionT: -99,
  },
  shake: { amp: 0 },
  muzzle: new THREE.Vector3(),
};

export function resetWorldMatch() {
  const p = world.player;
  p.hp = p.maxHp; p.alive = true; p.deadT = 0;
  p.mag = 30; p.reserve = 120; p.grenades = 2;
  p.reloading = false; p.bloom = 0; p.recoilP = 0; p.recoilY = 0; p.adsT = 0;
  p.vel.set(0, 0, 0);
  world.bots.length = 0;
  world.fx.tracers.length = 0; world.fx.impacts.length = 0;
  world.fx.grenades.length = 0; world.fx.impulses.length = 0;
  world.shake.amp = 0;
  world.events.shotT = -99; world.events.hitT = -99; world.events.hitKillT = -99;
  world.time = 0;
}
