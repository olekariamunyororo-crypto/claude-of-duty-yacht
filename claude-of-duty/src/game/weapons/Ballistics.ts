import * as THREE from 'three';
import { COLLIDERS } from '../physics/Colliders';
import { rayBox, rayCylinder, raySphere, coneDir } from '../utils/MathUtils';
import { world } from '../world';
import { useGameStore } from '../store/gameStore';
import { audio } from '../audio/AudioEngine';
import { spatial } from '../audio/Attenuation';

function raycastWorld(o: THREE.Vector3, d: THREE.Vector3, maxT: number): number {
  let best = -1;
  for (const b of COLLIDERS) {
    const t = rayBox(o.x, o.y, o.z, d.x, d.y, d.z, b, maxT);
    if (t >= 0 && (best < 0 || t < best)) best = t;
  }
  return best;
}

function hitBot(o: THREE.Vector3, d: THREE.Vector3, botId: number, maxT: number): { t: number; head: boolean } | null {
  const b = world.bots[botId];
  if (!b || !b.alive) return null;
  const th = raySphere(o.x, o.y, o.z, d.x, d.y, d.z, b.pos.x, b.pos.y + 1.62, b.pos.z, 0.26, maxT);
  if (th >= 0) return { t: th, head: true };
  const tb = rayCylinder(o.x, o.y, o.z, d.x, d.y, d.z, b.pos.x, b.pos.z, b.pos.y + 0.1, b.pos.y + 1.52, 0.38, maxT);
  if (tb >= 0) return { t: tb, head: false };
  return null;
}

function damageMult(dist: number): number {
  const f: [number, number][] = [[18, 1], [32, 0.85], [50, 0.7]];
  for (let i = f.length - 1; i >= 0; i--) if (dist >= f[i][0]) return f[i][1];
  return 1;
}

function pushTracer(a: THREE.Vector3, b: THREE.Vector3) {
  const tr = world.fx.tracers;
  tr.push({ ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, t0: world.time });
  if (tr.length > 24) tr.shift();
}

function pushImpact(x: number, y: number, z: number, kind: 'spark' | 'blood' | 'explosion') {
  const im = world.fx.impacts;
  im.push({ x, y, z, t0: world.time, kind });
  if (im.length > 40) im.shift();
}

export function playerFire(o: THREE.Vector3, dir: THREE.Vector3, def: { damageBody: number; damageHead: number }): void {
  const wallT = raycastWorld(o, dir, 120);
  let bestBot = -1, bestT = wallT >= 0 ? wallT : 120, bestHead = false;
  for (let i = 0; i < world.bots.length; i++) {
    const h = hitBot(o, dir, i, bestT);
    if (h) { bestBot = i; bestT = h.t; bestHead = h.head; }
  }

  const end = new THREE.Vector3().copy(dir).multiplyScalar(bestT).add(o);
  if (bestBot >= 0) {
    const bot = world.bots[bestBot];
    const dmg = (bestHead ? def.damageHead : def.damageBody) * damageMult(bestT);
    bot.hp -= dmg;
    bot.hitFlashT = world.time;
    pushImpact(end.x, end.y, end.z, 'blood');
    pushTracer(o, end);
    const st = useGameStore.getState();
    if (bot.hp <= 0) {
      bot.alive = false;
      bot.deathT = world.time;
      bot.respawnT = world.time + 4;
      world.events.hitKillT = world.time;
      st.addKill('YOU', bot.name, 'NV-4', bestHead, true);
      audio.play('kill', { gain: 0.8 });
    } else {
      world.events.hitT = world.time;
      audio.play('hit', { gain: 0.55 });
    }
    return;
  }

  if (wallT >= 0) {
    pushImpact(end.x, end.y, end.z, 'spark');
    world.fx.impulses.push({ x: end.x, y: end.y, z: end.z, dx: dir.x, dy: dir.y, dz: dir.z, power: 0.9 });
  }
  pushTracer(o, end);
}

export function botFire(botId: number, o: THREE.Vector3, aimAt: THREE.Vector3, spread: number): void {
  const dir = new THREE.Vector3().subVectors(aimAt, o).normalize();
  coneDir(dir, spread, dir);
  const wallT = raycastWorld(o, dir, 90);
  const maxT = wallT >= 0 ? wallT : 90;

  const p = world.player;
  let hitPlayerT = -1, hitPlayerHead = false;
  if (p.alive && world.time - p.spawnProtT > 1.2) {
    const th = raySphere(o.x, o.y, o.z, dir.x, dir.y, dir.z, p.pos.x, p.pos.y + 1.62, p.pos.z, 0.26, maxT);
    const tb = rayCylinder(o.x, o.y, o.z, dir.x, dir.y, dir.z, p.pos.x, p.pos.z, p.pos.y + 0.1, p.pos.y + 1.52, 0.38, maxT);
    if (th >= 0) { hitPlayerT = th; hitPlayerHead = true; }
    else if (tb >= 0) hitPlayerT = tb;
  }

  let hitBotId = -1, hitBotT = maxT, hitBotHead = false;
  for (let i = 0; i < world.bots.length; i++) {
    if (i === botId) continue;
    const h = hitBot(o, dir, i, hitBotT);
    if (h) { hitBotId = i; hitBotT = h.t; hitBotHead = h.head; }
  }

  const end = new THREE.Vector3().copy(dir).multiplyScalar(Math.min(maxT, 90)).add(o);
  pushTracer(o, end);
  const bot = world.bots[botId];
  const sp = spatial(p.pos, p.yaw, o);
  audio.play('shot', { gain: 0.5 * sp.gain, pan: sp.pan });
  if (sp.gain < 0.55) audio.play('shotFar', { gain: 0.6 * sp.gain, pan: sp.pan });
  bot.flashT = world.time;

  const store = useGameStore.getState();
  if (hitPlayerT >= 0 && (hitBotId < 0 || hitPlayerT < hitBotT)) {
    const dmg = hitPlayerHead ? 22 : 14;
    import('../player/Health').then((m) => m.damagePlayer(dmg, o, bot.name));
    pushImpact(p.pos.x, p.pos.y + 1.3, p.pos.z, 'blood');
  } else if (hitBotId >= 0) {
    const target = world.bots[hitBotId];
    target.hp -= hitBotHead ? 24 : 15;
    target.hitFlashT = world.time;
    if (target.hp <= 0) {
      target.alive = false; target.deathT = world.time; target.respawnT = world.time + 4;
      bot.score += 1;
      store.addKill(bot.name, target.name, 'NV-4', hitBotHead, false);
    }
    pushImpact(end.x, end.y, end.z, 'blood');
  } else if (wallT >= 0) {
    pushImpact(end.x, end.y, end.z, 'spark');
  }
}

export function hasLOS(a: THREE.Vector3, b: THREE.Vector3): boolean {
  const d = new THREE.Vector3().subVectors(b, a);
  const dist = d.length();
  if (dist < 0.001) return true;
  d.divideScalar(dist);
  const t = raycastWorld(a, d, dist - 0.15);
  return t < 0;
}
