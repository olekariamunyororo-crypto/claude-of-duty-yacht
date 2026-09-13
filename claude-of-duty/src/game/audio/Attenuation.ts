import * as THREE from 'three';
export interface SpatialParams { gain: number; pan: number }
export function spatial(eye: THREE.Vector3, yaw: number, src: THREE.Vector3): SpatialParams {
  const dx = src.x - eye.x, dy = src.y - eye.y, dz = src.z - eye.z;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const gain = 1 / (1 + 0.09 * d);
  const rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const len = Math.max(d, 0.5);
  const pan = Math.max(-1, Math.min(1, ((dx * rx + dz * rz) / len) * 0.8));
  return { gain, pan };
}
