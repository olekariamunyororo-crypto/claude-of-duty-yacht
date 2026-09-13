import { input, consumeJump } from '../input/InputManager';
import { PLAYER, collideMove, inPool, type MoveOut } from '../player/Movement';
import { world } from '../world';
import { clamp } from '../utils/MathUtils';
import { playerFootsteps } from '../audio/Footsteps';
import { audio } from '../audio/AudioEngine';

const out: MoveOut = { grounded: false, hitWall: false, landed: false };

export function updatePlayerMovement(dt: number): void {
  const p = world.player;
  const sens = 0.0022 * (world.cfg.sensitivity / 5) * (p.ads ? 0.55 : 1);
  const look = input.consumeLook();
  p.yaw -= look.dx * sens;
  p.pitch = clamp(p.pitch - look.dy * sens * (world.cfg.invertY ? -1 : 1), -1.45, 1.45);

  const wantFire = input.fire;
  p.ads = input.ads && !p.reloading;
  p.sprint = !p.ads && !wantFire && (input.sprintLock || input.move.y > 0.85) && !p.reloading;

  const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
  const fX = -sy, fZ = -cy, rX = cy, rZ = -sy;
  const mx = input.move.x, my = input.move.y;
  const mag = Math.min(1, Math.hypot(mx, my));
  const wishX = fX * my + rX * mx;
  const wishZ = fZ * my + rZ * mx;
  const wl = Math.hypot(wishX, wishZ) || 1;

  let speed = p.sprint ? PLAYER.speedSprint : p.ads ? PLAYER.speedAds : PLAYER.speedWalk;
  if (inPool(p.pos.x, p.pos.y, p.pos.z)) speed *= 0.55;

  const targetX = (wishX / wl) * speed * mag;
  const targetZ = (wishZ / wl) * speed * mag;
  const accel = p.onGround ? PLAYER.accelGround : PLAYER.accelAir;
  const t = Math.min(1, (accel * dt) / Math.max(speed, 0.001));
  if (mag > 0.01) {
    p.vel.x += (targetX - p.vel.x) * t;
    p.vel.z += (targetZ - p.vel.z) * t;
  } else if (p.onGround) {
    const f = Math.max(0, 1 - PLAYER.friction * dt);
    p.vel.x *= f; p.vel.z *= f;
  }

  p.vel.y -= PLAYER.gravity * dt;
  if (consumeJump() && p.onGround) {
    p.vel.y = PLAYER.jumpVel;
    p.onGround = false;
    audio.play('jump', { gain: 0.4 });
  }

  const fallSpeed = p.vel.y;
  collideMove(p.pos, p.vel, dt, out);
  p.onGround = out.grounded;
  if (out.landed) {
    p.landDip = Math.min(0.16, -fallSpeed * 0.018);
    audio.play('land', { gain: 0.5 });
    world.shake.amp = Math.max(world.shake.amp, 0.02);
  }
  p.landDip = Math.max(0, p.landDip - dt * 0.8);

  const hSpeed = Math.hypot(p.vel.x, p.vel.z);
  if (p.onGround && hSpeed > 0.5) {
    p.bobPhase += hSpeed * dt * 1.7;
    p.bobY = Math.sin(p.bobPhase * 2) * 0.028;
    playerFootsteps(dt, hSpeed, true, p.pos);
  } else {
    p.bobY *= 0.8;
  }

  p.recoilP *= Math.max(0, 1 - 10 * dt);
  p.recoilY *= Math.max(0, 1 - 10 * dt);
  p.bloom = Math.max(0, p.bloom - dt * 6);
  p.adsT = clamp(p.adsT + (p.ads ? dt / 0.22 : -dt / 0.18), 0, 1);
}
