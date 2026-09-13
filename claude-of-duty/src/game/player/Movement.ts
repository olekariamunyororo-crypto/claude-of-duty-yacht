import { COLLIDERS } from '../physics/Colliders';

export const PLAYER = {
  radius: 0.4,
  height: 1.8,
  speedWalk: 5.2,
  speedSprint: 8.0,
  speedAds: 2.7,
  accelGround: 55,
  accelAir: 11,
  friction: 10,
  jumpVel: 5.6,
  gravity: 18,
  stepHeight: 0.55,
};

export interface MoveOut { grounded: boolean; hitWall: boolean; landed: boolean }

function overlaps(px: number, py: number, pz: number, b: { min: [number, number, number]; max: [number, number, number] }): boolean {
  const r = PLAYER.radius, h = PLAYER.height;
  return (
    px + r > b.min[0] && px - r < b.max[0] &&
    py + h > b.min[1] && py < b.max[1] &&
    pz + r > b.min[2] && pz - r < b.max[2]
  );
}

export function collideMove(
  pos: { x: number; y: number; z: number },
  vel: { x: number; y: number; z: number },
  dt: number,
  out: MoveOut,
): void {
  const r = PLAYER.radius, step = PLAYER.stepHeight;
  out.grounded = false; out.hitWall = false; out.landed = false;

  const sweepXZ = (axis: 'x' | 'z', delta: number) => {
    if (delta === 0) return;
    const np = pos[axis] + delta;
    for (const b of COLLIDERS) {
      const nx = axis === 'x' ? np : pos.x, nz = axis === 'z' ? np : pos.z;
      if (!overlaps(nx, pos.y + 0.02, nz, b)) continue;
      let stepped = false;
      if (pos.y + step >= b.max[1] && pos.y < b.max[1]) {
        let free = true;
        for (const c of COLLIDERS) if (overlaps(nx, b.max[1] + 0.01, nz, c)) { free = false; break; }
        if (free) { pos.y = b.max[1] + 0.01; stepped = true; }
      }
      if (!stepped) {
        pos[axis] = axis === 'x' ? (delta > 0 ? b.min[0] - r - 0.001 : b.max[0] + r + 0.001)
                                  : (delta > 0 ? b.min[2] - r - 0.001 : b.max[2] + r + 0.001);
        vel[axis] = 0; out.hitWall = true;
        return;
      }
    }
    pos[axis] = np;
  };

  sweepXZ('x', vel.x * dt);
  sweepXZ('z', vel.z * dt);

  const ny = pos.y + vel.y * dt;
  if (vel.y <= 0) {
    let groundY = -100;
    for (const b of COLLIDERS) {
      if (pos.x + r <= b.min[0] || pos.x - r >= b.max[0]) continue;
      if (pos.z + r <= b.min[2] || pos.z - r >= b.max[2]) continue;
      if (b.max[1] <= pos.y + 0.05 && b.max[1] >= ny - 0.3) groundY = Math.max(groundY, b.max[1]);
    }
    if (groundY > -99) {
      if (vel.y < -6) out.landed = true;
      pos.y = groundY; vel.y = 0; out.grounded = true;
    } else {
      pos.y = ny;
    }
  } else {
    let blocked = false;
    for (const b of COLLIDERS) {
      if (!overlaps(pos.x, ny, pos.z, b)) continue;
      pos.y = b.min[1] - PLAYER.height - 0.001; vel.y = 0; blocked = true; break;
    }
    if (!blocked) pos.y = ny;
  }
  if (!out.grounded) {
    for (const b of COLLIDERS) {
      if (pos.x + r <= b.min[0] || pos.x - r >= b.max[0]) continue;
      if (pos.z + r <= b.min[2] || pos.z - r >= b.max[2]) continue;
      if (Math.abs(pos.y - b.max[1]) < 0.02) { out.grounded = true; break; }
    }
  }
}

export function inPool(x: number, y: number, z: number): boolean {
  return x > 1.2 && x < 5.2 && z > -3.5 && z < 3.5 && y < 3.0 && y > 1.9;
}
