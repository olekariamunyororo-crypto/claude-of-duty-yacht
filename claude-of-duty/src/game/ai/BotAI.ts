import * as THREE from 'three';
import { world, type BotRuntime } from '../world';
import { WAYPOINTS } from '../physics/Colliders';
import { botFire, hasLOS } from '../weapons/Ballistics';
import { botFootsteps } from '../audio/Footsteps';

const NAMES = ['GHOST_01', 'GHOST_02', 'GHOST_03', 'GHOST_04', 'GHOST_05'];

export function spawnBot(id: number, pos: THREE.Vector3, yaw: number): BotRuntime {
  return {
    id, name: NAMES[id % NAMES.length],
    pos: pos.clone(), vel: new THREE.Vector3(), yaw,
    hp: 100, alive: true, respawnT: 0, deathT: 0,
    state: 'patrol', wp: 0, prevWp: -1,
    seeT: -99, reactT: 0.28, fireT: 0, burst: 0,
    strafe: 0, strafeT: 0,
    targetIsPlayer: true, targetBot: -1,
    score: 0, flashT: -99, hitFlashT: -99, stepAcc: 0,
    grounded: true, hitWallCooldown: 0,
  };
}

export function updateBotAI(b: BotRuntime, dt: number): void {
  if (!b.alive) {
    if (world.time >= b.respawnT) {
      b.alive = true; b.hp = 100;
      b.pos.set(0, 3.42, 24);
    }
    return;
  }

  // Waypoint navigation
  const wp = WAYPOINTS[b.wp];
  if (wp) {
    const d = new THREE.Vector3().subVectors(wp.p, b.pos);
    d.y = 0;
    if (d.length() < 1.0) {
      const nextIdx = wp.links[Math.floor(Math.random() * wp.links.length)];
      if (nextIdx !== undefined) b.wp = nextIdx;
    } else {
      d.normalize();
      b.yaw = Math.atan2(-d.x, -d.z);
      b.pos.addScaledVector(d, 4.2 * dt);
      botFootsteps(b, dt, 4.2);
    }
  }

  // Combat check with player
  const p = world.player;
  if (p.alive && b.pos.distanceTo(p.pos) < 30 && hasLOS(b.pos, p.pos)) {
    if (world.time >= b.fireT) {
      b.fireT = world.time + 0.15;
      botFire(b.id, new THREE.Vector3(b.pos.x, b.pos.y + 1.4, b.pos.z), new THREE.Vector3(p.pos.x, p.pos.y + 1.3, p.pos.z), 0.05);
    }
  }
}
