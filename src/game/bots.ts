import * as THREE from 'three';
import { WAYPOINTS, SPAWNS, hasLOS } from './colliders';
import { collideMove, PLAYER, type MoveOut } from './movement';

export interface BotRuntime {
  id: number;
  name: string;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  respawnT: number;
  deathT: number;
  state: 'patrol' | 'combat';
  wp: number;
  prevWp: number;
  seeT: number;
  reactT: number;
  fireT: number;
  burst: number;
  strafe: number;
  strafeT: number;
  targetIsPlayer: boolean;
  targetBot: number;
  score: number;
  flashT: number;
  hitFlashT: number;
  stepAcc: number;
  grounded: boolean;
  hitWallCooldown: number;
}

const NAMES = ['GHOST_01', 'GHOST_02', 'GHOST_03', 'GHOST_04', 'GHOST_05'];
const botMoveOut: MoveOut = { grounded: false, hitWall: false, landed: false };

export function createBots(count = 5): BotRuntime[] {
  const bots: BotRuntime[] = [];
  for (let i = 0; i < count; i++) {
    const sp = SPAWNS[(i + 1) % SPAWNS.length];
    bots.push({
      id: i,
      name: NAMES[i % NAMES.length],
      pos: sp.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2)),
      vel: new THREE.Vector3(),
      yaw: sp.yaw,
      hp: 100,
      maxHp: 100,
      alive: true,
      respawnT: 0,
      deathT: -99,
      state: 'patrol',
      wp: Math.floor(Math.random() * WAYPOINTS.length),
      prevWp: -1,
      seeT: -99,
      reactT: 0,
      fireT: 0,
      burst: 0,
      strafe: Math.random() < 0.5 ? 1 : -1,
      strafeT: 1.0,
      targetIsPlayer: false,
      targetBot: -1,
      score: 0,
      flashT: -99,
      hitFlashT: -99,
      stepAcc: 0,
      grounded: true,
      hitWallCooldown: 0,
    });
  }
  return bots;
}

export function pickBotSpawn(bot: BotRuntime, playerPos: THREE.Vector3, bots: BotRuntime[]): THREE.Vector3 {
  let best = SPAWNS[0];
  let bestD = -1;
  for (let i = 0; i < SPAWNS.length; i++) {
    const s = SPAWNS[i];
    let minD = s.pos.distanceToSquared(playerPos);
    for (let j = 0; j < bots.length; j++) {
      const other = bots[j];
      if (other !== bot && other.alive) {
        minD = Math.min(minD, s.pos.distanceToSquared(other.pos));
      }
    }
    if (minD > bestD) {
      bestD = minD;
      best = s;
    }
  }
  return best.pos.clone();
}

const botEye = new THREE.Vector3();
const targetEye = new THREE.Vector3();

export function updateBotAI(
  bots: BotRuntime[],
  dt: number,
  time: number,
  player: { pos: THREE.Vector3; alive: boolean; spawnProtT: number },
  onBotFire: (bot: BotRuntime, targetPos: THREE.Vector3) => void,
) {
  for (let i = 0; i < bots.length; i++) {
    const bot = bots[i];
    if (!bot.alive) {
      if (time >= bot.respawnT) {
        bot.pos.copy(pickBotSpawn(bot, player.pos, bots));
        bot.vel.set(0, 0, 0);
        bot.hp = bot.maxHp;
        bot.alive = true;
        bot.state = 'patrol';
        bot.seeT = -99;
      }
      continue;
    }

    // Perception check (staggered)
    if ((bot.id + Math.floor(time * 6)) % 3 === 0) {
      let saw = false;
      botEye.set(bot.pos.x, bot.pos.y + 1.6, bot.pos.z);

      if (player.alive && time - player.spawnProtT > 1.2) {
        targetEye.set(player.pos.x, player.pos.y + 1.5, player.pos.z);
        const dist = botEye.distanceTo(targetEye);
        if (dist < 45 && hasLOS(botEye, targetEye)) {
          bot.seeT = time;
          bot.targetIsPlayer = true;
          bot.targetBot = -1;
          saw = true;
        }
      }

      if (!saw) {
        for (let j = 0; j < bots.length; j++) {
          const other = bots[j];
          if (other === bot || !other.alive) continue;
          targetEye.set(other.pos.x, other.pos.y + 1.5, other.pos.z);
          const dist = botEye.distanceTo(targetEye);
          if (dist < 38 && hasLOS(botEye, targetEye)) {
            bot.seeT = time;
            bot.targetIsPlayer = false;
            bot.targetBot = other.id;
            saw = true;
            break;
          }
        }
      }

      if (saw) {
        bot.state = 'combat';
      } else if (time - bot.seeT > 2.2) {
        bot.state = 'patrol';
      }
    }

    // Movement & Combat
    let wishX = 0;
    let wishZ = 0;
    let speed = 4.2;
    let faceX = 0;
    let faceZ = 0;

    if (bot.state === 'combat') {
      const tgtPos = bot.targetIsPlayer
        ? player.pos
        : bots[bot.targetBot]?.alive
        ? bots[bot.targetBot].pos
        : null;

      if (tgtPos) {
        const dx = tgtPos.x - bot.pos.x;
        const dz = tgtPos.z - bot.pos.z;
        const d = Math.hypot(dx, dz) || 1;
        faceX = dx / d;
        faceZ = dz / d;

        // Strafe
        bot.strafeT -= dt;
        if (bot.strafeT <= 0) {
          bot.strafe *= -1;
          bot.strafeT = 0.8 + Math.random() * 1.0;
        }

        wishX = -faceZ * bot.strafe * 0.75;
        wishZ = faceX * bot.strafe * 0.75;

        if (d > 22) {
          wishX += faceX * 0.8;
          wishZ += faceZ * 0.8;
        } else if (d < 7) {
          wishX -= faceX * 0.8;
          wishZ -= faceZ * 0.8;
        }

        const wl = Math.hypot(wishX, wishZ) || 1;
        wishX /= wl;
        wishZ /= wl;
        speed = 3.6;

        // Burst firing
        if (time - bot.seeT < 0.6 && time > bot.reactT) {
          bot.fireT -= dt;
          if (bot.burst > 0 && bot.fireT <= 0) {
            bot.burst -= 1;
            bot.fireT = 0.12;
            const aimPoint = new THREE.Vector3(
              tgtPos.x + (Math.random() - 0.5) * 0.4,
              tgtPos.y + 0.9 + Math.random() * 0.6,
              tgtPos.z + (Math.random() - 0.5) * 0.4,
            );
            onBotFire(bot, aimPoint);
            if (bot.burst <= 0) {
              bot.reactT = time + 0.4 + Math.random() * 0.5;
            }
          } else if (bot.burst <= 0) {
            bot.burst = Math.floor(3 + Math.random() * 4);
            bot.reactT = time + 0.35 + Math.random() * 0.3;
          }
        }
      }
    } else {
      // Waypoint patrol
      const wp = WAYPOINTS[bot.wp] ?? WAYPOINTS[0];
      const dx = wp.p.x - bot.pos.x;
      const dz = wp.p.z - bot.pos.z;
      const d = Math.hypot(dx, dz);
      const stuck = d < 1.4 || Math.hypot(bot.vel.x, bot.vel.z) < 0.3;

      if (stuck && time > bot.hitWallCooldown) {
        bot.hitWallCooldown = time + 1.0;
        const links = wp.links;
        if (links.length > 0) {
          let next = links[Math.floor(Math.random() * links.length)];
          if (next === bot.prevWp && links.length > 1) {
            next = links[(links.indexOf(next) + 1) % links.length];
          }
          bot.prevWp = bot.wp;
          bot.wp = next;
        }
      }

      if (d > 0.05) {
        wishX = dx / d;
        wishZ = dz / d;
      }
      faceX = wishX;
      faceZ = wishZ;
    }

    // Apply movement physics
    const wl2 = Math.hypot(wishX, wishZ);
    const tvx = wl2 > 0.01 ? (wishX / wl2) * speed : 0;
    const tvz = wl2 > 0.01 ? (wishZ / wl2) * speed : 0;
    bot.vel.x += (tvx - bot.vel.x) * Math.min(1, 8 * dt);
    bot.vel.z += (tvz - bot.vel.z) * Math.min(1, 8 * dt);
    bot.vel.y -= PLAYER.gravity * dt;

    collideMove(bot.pos, bot.vel, dt, botMoveOut);
    bot.grounded = botMoveOut.grounded;

    // Smooth turn towards face direction
    if (faceX !== 0 || faceZ !== 0) {
      const wantYaw = Math.atan2(-faceX, -faceZ);
      let diff = wantYaw - bot.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      bot.yaw += Math.max(-6 * dt, Math.min(6 * dt, diff));
    }
  }
}
