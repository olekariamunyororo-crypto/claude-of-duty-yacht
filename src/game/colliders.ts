import * as THREE from 'three';

export type BoxKind = 'floor' | 'wall' | 'crate' | 'railing' | 'hull' | 'metal';

export interface LevelBox {
  min: [number, number, number];
  max: [number, number, number];
  kind: BoxKind;
  deck: number;
}

function buildLevel(): LevelBox[] {
  const L: LevelBox[] = [];
  const B = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, kind: BoxKind, deck: number) =>
    L.push({ min: [x0, y0, z0], max: [x1, y1, z1], kind, deck });

  // Hull shell boundaries
  B(-7.8, -2, -30.8, -7, 8, 30.8, 'hull', 0);
  B(7, -2, -30.8, 7.8, 8, 30.8, 'hull', 0);
  B(-7.8, -2, -30.8, 7.8, 8, -30, 'hull', 0);
  B(-7.8, -2, 30, 7.8, 8, 30.8, 'hull', 0);

  // Lower deck floor (y = 0)
  B(-7.8, -1, -30.8, 7.8, 0, 30.8, 'floor', 0);

  // Upper deck slabs (y = 3.4) around stair holes + pool
  B(-7, 3, -30, 7, 3.4, -12, 'floor', 1);      // A: aft helipad zone
  B(-7, 3, -12, -6.2, 3.4, -8, 'floor', 1);    // B1
  B(-4.2, 3, -12, 7, 3.4, -8, 'floor', 1);     // B2
  B(-7, 3, -8, 7, 3.4, -3.5, 'floor', 1);      // C
  B(-7, 3, -3.5, 1.2, 3.4, 3.5, 'floor', 1);   // D1 (pool hole x1.2..5.2)
  B(5.2, 3, -3.5, 7, 3.4, 3.5, 'floor', 1);    // D2
  B(-7, 3, 3.5, 7, 3.4, 8, 'floor', 1);        // E
  B(-7, 3, 8, 4.2, 3.4, 12, 'floor', 1);       // F1 (fore stair hole x4.2..6.2)
  B(6.2, 3, 8, 7, 3.4, 12, 'floor', 1);        // F2
  B(-7, 3, 12, 7, 3.4, 30, 'floor', 1);        // G: bow zone

  // Mid-starboard pool
  B(1.2, 2.0, -3.5, 5.2, 2.2, 3.5, 'floor', 0); // pool bottom
  B(1.2, 2.2, -3.5, 5.2, 3.4, -3.3, 'wall', 1);
  B(1.2, 2.2, 3.3, 5.2, 3.4, 3.5, 'wall', 1);
  B(1.2, 2.2, -3.3, 1.4, 3.4, 3.3, 'wall', 1);
  B(5.0, 2.2, -3.3, 5.2, 3.4, 3.3, 'wall', 1);
  B(3.9, 2.2, -3.5, 4.55, 3.2, -2.6, 'metal', 0);   // pool step 1
  B(4.55, 2.2, -3.5, 5.2, 2.75, -2.6, 'metal', 0);  // pool step 2

  // Aft stairwell (port, x -6.2..-4.2, z -12..-8) ascending toward stern
  for (let i = 0; i < 8; i++) {
    const t = 0.425 * (i + 1);
    B(-6.2, t - 0.35, -12 + 0.5 * i, -4.2, t, -11.5 + 0.5 * i, 'metal', 0);
  }
  B(-6.5, 0, -12, -6.2, 3.4, -8, 'wall', 0);
  B(-4.2, 0, -12, -3.9, 3.4, -8, 'wall', 0);

  // Fore stairwell (starboard, x 4.2..6.2, z 8..12) descending toward stern
  for (let i = 0; i < 8; i++) {
    const t = 3.4 - 0.425 * i;
    B(4.2, t - 0.35, 8 + 0.5 * i, 6.2, t, 8.5 + 0.5 * i, 'metal', 0);
  }
  B(3.9, 0, 8, 4.2, 3.4, 12, 'wall', 0);
  B(6.2, 0, 8, 6.5, 3.4, 12, 'wall', 0);

  // Superstructure (bridge & cabin)
  B(-1.1, 3.4, -4.5, -0.8, 5.55, -1, 'wall', 1);
  B(-1.1, 3.4, 1, -0.8, 5.55, 4.5, 'wall', 1);
  B(-6.4, 3.4, -4.8, -4.4, 5.55, -4.5, 'wall', 1);
  B(-3.4, 3.4, -4.8, -0.8, 5.55, -4.5, 'wall', 1);
  B(-6.4, 3.4, 4.5, -4.4, 5.55, 4.8, 'wall', 1);
  B(-2.4, 3.4, 4.5, -0.8, 5.55, 4.8, 'wall', 1);
  B(-6.7, 3.4, -4.5, -6.4, 5.55, 4.5, 'wall', 1);
  B(-6.0, 3.4, -2.5, -3.8, 4.5, -1.5, 'crate', 1); // bar counter inside
  B(-6.7, 5.55, -4.8, -0.8, 5.8, 4.8, 'floor', 2); // roof deck
  B(-6.7, 5.8, -4.8, -0.8, 6.45, -4.65, 'railing', 2);
  B(-6.7, 5.8, 4.65, -0.8, 6.45, 4.8, 'railing', 2);
  B(-6.7, 5.8, -4.8, -6.55, 6.45, 4.8, 'railing', 2);
  B(-0.95, 5.8, -4.8, -0.8, 6.45, 4.8, 'railing', 2);

  // Crate hops to roof
  B(-0.35, 3.4, -2.55, 0.75, 4.2, -1.45, 'crate', 1);
  B(-0.35, 3.4, -0.95, 0.75, 5.0, 0.15, 'crate', 1);

  // Lower interior deck: engine room, lounge, storage
  B(-6.7, 0, -16.3, -4.5, 3.2, -16, 'wall', 0);
  B(-3.5, 0, -16.3, -1.6, 3.2, -16, 'wall', 0);
  B(-1.9, 0, -28, -1.6, 3.2, -19, 'wall', 0);
  B(-1.9, 0, -17.6, -1.6, 3.2, -16, 'wall', 0);
  B(-5.9, 0, -24.5, -4.5, 1.7, -23.1, 'metal', 0); // generator 1
  B(-4.0, 0, -21.5, -2.6, 1.7, -20.1, 'metal', 0); // generator 2
  B(-6.7, 2.2, -28, -6.3, 2.6, -16, 'metal', 0);   // overhead pipes
  B(1.6, 0, -6, 1.9, 3.2, -1.2, 'wall', 0);        // lounge wall
  B(1.6, 0, 1.2, 1.9, 3.2, 6, 'wall', 0);
  B(3.6, 0, -2.2, 6.2, 1.1, -1.2, 'crate', 0);     // lounge bar
  B(6.2, 0, -5.5, 6.7, 2.2, -4.5, 'metal', 0);
  B(1.6, 0, 15.7, 3.8, 3.2, 16, 'wall', 0);        // storage north
  B(4.8, 0, 15.7, 6.7, 3.2, 16, 'wall', 0);
  B(1.6, 0, 16, 1.9, 3.2, 28, 'wall', 0);
  B(2.6, 0, 20, 3.7, 1.1, 21.1, 'crate', 0);
  B(4.8, 0, 24, 5.9, 1.1, 25.1, 'crate', 0);

  // Deck railings (prevent accidental falling off the boat)
  B(-7.2, 3.4, -30, -6.9, 4.3, 30, 'railing', 1);
  B(6.9, 3.4, -30, 7.2, 4.3, 30, 'railing', 1);
  B(-7.2, 3.4, -30.2, 7.2, 4.3, -29.8, 'railing', 1);
  B(-7.2, 3.4, 29.8, 7.2, 4.3, 30.2, 'railing', 1);

  // Tactical cover crates
  B(0.4, 0, -14.05, 1.5, 1.1, -12.95, 'crate', 0);
  B(-1.5, 0, 7.95, -0.4, 1.1, 9.05, 'crate', 0);
  B(-2.5, 3.4, -21.5, -1.4, 4.5, -20.4, 'crate', 1);
  B(1.5, 3.4, 22, 2.6, 4.5, 23.1, 'crate', 1);
  B(-4.5, 3.4, 12, -3.4, 4.5, 13.1, 'crate', 1);
  B(2.0, 3.4, -11, 3.1, 4.5, -9.9, 'crate', 1);

  return L;
}

export const COLLIDERS: LevelBox[] = buildLevel();

// Waypoint Graph for Bot AI
const WP: [number, number, number][] = [
  [0, 3.42, -24], [5, 3.42, -16], [6, 3.42, -6], [6, 3.42, 0], [6, 3.42, 6],
  [3, 3.42, 9], [3, 3.42, 14], [0, 3.42, 24], [-5, 3.42, 14], [-5, 3.42, 6],
  [-3.9, 3.42, 3.4], [-3.9, 3.42, -0.5], [-4, 3.42, -6.5], [-3, 3.42, -16],
  [-3, 3.42, -10], [-5.2, 0, -12.5], [-5.2, 1.7, -10], [-5.2, 3.42, -7.5],
  [0, 0.02, 0], [-5.2, 0.02, -15.5], [-4, 0.02, -16.6], [0, 0.02, -20],
  [0, 0.02, 10], [0, 0.02, 20], [3.6, 0.02, 13.5], [4.3, 0.02, 14.5],
  [4.5, 0.02, 20], [4, 0.02, -1], [4, 0.02, -11], [4, 0.02, -22],
  [5.2, 0.02, 12.6], [5.2, 1.7, 10], [5.2, 3.42, 7.5],
];

const LINKS: number[][] = [
  [1, 13], [0, 2, 15], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 8], [7, 9], [8, 10],
  [9, 11], [10, 12], [11, 13], [12, 0], [13, 1], [1, 16], [15, 17], [16, 12],
  [19, 22, 28], [18, 20], [19, 21], [20, 29], [18, 23], [22, 24], [23, 25],
  [24, 26, 30], [25, 23], [28, 18], [27, 29], [28, 21], [25, 31], [30, 32], [31, 5],
];

export const WAYPOINTS = WP.map((p, i) => ({ p: new THREE.Vector3(...p), links: LINKS[i] ?? [] }));

export const SPAWNS: { pos: THREE.Vector3; yaw: number }[] = [
  { pos: new THREE.Vector3(0, 3.42, -25), yaw: Math.PI },
  { pos: new THREE.Vector3(0, 3.42, 25), yaw: 0 },
  { pos: new THREE.Vector3(4, 0.02, -22), yaw: Math.PI },
  { pos: new THREE.Vector3(-4, 0.02, -19), yaw: Math.PI / 2 },
  { pos: new THREE.Vector3(0, 0.02, 22), yaw: 0 },
  { pos: new THREE.Vector3(5, 3.42, -14), yaw: Math.PI },
  { pos: new THREE.Vector3(-5, 3.42, 14), yaw: 0 },
];

/** Ray vs axis-aligned box (slab test) */
export function rayBox(
  ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, b: LevelBox, maxT: number,
): number {
  let tmin = 0, tmax = maxT;
  if (Math.abs(dx) < 1e-8) { if (ox < b.min[0] || ox > b.max[0]) return -1; }
  else { let t1 = (b.min[0] - ox) / dx, t2 = (b.max[0] - ox) / dx; if (t1 > t2) { const t = t1; t1 = t2; t2 = t; } tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); if (tmin > tmax) return -1; }
  if (Math.abs(dy) < 1e-8) { if (oy < b.min[1] || oy > b.max[1]) return -1; }
  else { let t1 = (b.min[1] - oy) / dy, t2 = (b.max[1] - oy) / dy; if (t1 > t2) { const t = t1; t1 = t2; t2 = t; } tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); if (tmin > tmax) return -1; }
  if (Math.abs(dz) < 1e-8) { if (oz < b.min[2] || oz > b.max[2]) return -1; }
  else { let t1 = (b.min[2] - oz) / dz, t2 = (b.max[2] - oz) / dz; if (t1 > t2) { const t = t1; t1 = t2; t2 = t; } tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); if (tmin > tmax) return -1; }
  return tmin;
}

/** Ray vs vertical cylinder */
export function rayCylinder(
  ox: number, oy: number, oz: number, dx: number, dy: number, dz: number,
  cx: number, cz: number, y0: number, y1: number, r: number, maxT: number,
): number {
  const mx = ox - cx, mz = oz - cz;
  const a = dx * dx + dz * dz;
  const b = 2 * (mx * dx + mz * dz);
  const c = mx * mx + mz * mz - r * r;
  if (a < 1e-8) return -1;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return -1;
  const sq = Math.sqrt(disc);
  let t = (-b - sq) / (2 * a);
  if (t < 0) t = (-b + sq) / (2 * a);
  if (t < 0 || t > maxT) return -1;
  const y = oy + dy * t;
  if (y < y0 || y > y1) return -1;
  return t;
}

/** Ray vs sphere (for headshots) */
export function raySphere(
  ox: number, oy: number, oz: number, dx: number, dy: number, dz: number,
  cx: number, cy: number, cz: number, r: number, maxT: number,
): number {
  const mx = ox - cx, my = oy - cy, mz = oz - cz;
  const b = 2 * (mx * dx + my * dy + mz * dz);
  const c = mx * mx + my * my + mz * mz - r * r;
  const disc = b * b - 4 * c;
  if (disc < 0) return -1;
  const sq = Math.sqrt(disc);
  let t = (-b - sq) / 2;
  if (t < 0) t = (-b + sq) / 2;
  if (t < 0 || t > maxT) return -1;
  return t;
}

export function raycastWorld(o: THREE.Vector3, d: THREE.Vector3, maxT: number): number {
  let best = -1;
  for (let i = 0; i < COLLIDERS.length; i++) {
    const b = COLLIDERS[i];
    const t = rayBox(o.x, o.y, o.z, d.x, d.y, d.z, b, maxT);
    if (t >= 0 && (best < 0 || t < best)) best = t;
  }
  return best;
}

export function hasLOS(a: THREE.Vector3, b: THREE.Vector3): boolean {
  const d = new THREE.Vector3().subVectors(b, a);
  const dist = d.length();
  if (dist < 0.001) return true;
  d.divideScalar(dist);
  const t = raycastWorld(a, d, dist - 0.15);
  return t < 0;
}

const _u = new THREE.Vector3();
const _v = new THREE.Vector3();
export function coneDir(dir: THREE.Vector3, spread: number, out: THREE.Vector3): THREE.Vector3 {
  out.copy(dir).normalize();
  if (spread <= 0) return out;
  if (Math.abs(out.y) < 0.99) _u.set(0, 1, 0).cross(out).normalize();
  else _u.set(1, 0, 0).cross(out).normalize();
  _v.crossVectors(out, _u);
  const ang = Math.random() * Math.PI * 2;
  const rad = Math.sqrt(Math.random()) * spread;
  out.addScaledVector(_u, Math.cos(ang) * rad).addScaledVector(_v, Math.sin(ang) * rad).normalize();
  return out;
}
