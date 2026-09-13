import { world } from '../world';
import { useGameStore } from '../store/gameStore';
import { audio } from '../audio/AudioEngine';
import { SPAWNS } from '../physics/Colliders';
import { recoilReset } from '../weapons/Recoil';
import { weaponReset } from '../weapons/WeaponState';
import { NV4 } from '../weapons/weaponData';

export function damagePlayer(amount: number, fromPos: { x: number; y: number; z: number }, killer: string): void {
  const p = world.player;
  if (!p.alive || useGameStore.getState().phase !== 'playing') return;
  if (world.time - p.spawnProtT < 1.2) return;
  p.hp -= amount;
  p.lastDamageT = world.time;
  world.shake.amp = Math.max(world.shake.amp, 0.035);

  const dx = fromPos.x - p.pos.x, dz = fromPos.z - p.pos.z;
  const worldAng = Math.atan2(dx, -dz);
  const rel = worldAng + p.yaw;
  const e = world.events;
  e.dmgAng[e.dmgIdx] = rel;
  e.dmgT[e.dmgIdx] = world.time;
  e.dmgIdx = (e.dmgIdx + 1) % 3;

  audio.play('hurt', { gain: 0.7 });
  if (p.hp <= 0) {
    p.hp = 0;
    p.alive = false;
    p.deadT = world.time;
    const store = useGameStore.getState();
    store.setDeath(killer);
    const bot = world.bots.find((b) => b.name === killer);
    if (bot) bot.score += 1;
    store.addKill(killer, 'YOU', 'NV-4', false, false);
    audio.play('explode', { gain: 0.35, rate: 1.6 });
  }
}

export function updateHealth(dt: number): void {
  const p = world.player;
  if (!p.alive) return;
  if (p.hp < p.maxHp && world.time - p.lastDamageT > 3.5) {
    p.hp = Math.min(p.maxHp, p.hp + 40 / 60);
  }
}

export function respawnPlayer(): void {
  const p = world.player;
  let best = SPAWNS[0], bestD = -1;
  for (const s of SPAWNS) {
    let minD = 1e9;
    for (const b of world.bots) if (b.alive) minD = Math.min(minD, s.pos.distanceToSquared(b.pos));
    if (minD > bestD) { bestD = minD; best = s; }
  }
  p.pos.copy(best.pos);
  p.vel.set(0, 0, 0);
  p.yaw = best.yaw; p.pitch = 0;
  p.hp = p.maxHp; p.alive = true;
  p.mag = NV4.magSize; p.reserve = NV4.reserveMax; p.grenades = 2;
  p.reloading = false;
  p.spawnProtT = world.time;
  recoilReset(); weaponReset();
  useGameStore.getState().setDeath(null);
}
