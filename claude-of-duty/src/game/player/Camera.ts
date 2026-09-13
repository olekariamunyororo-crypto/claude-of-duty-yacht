import * as THREE from 'three';
import { world } from '../world';
import { damp } from '../utils/MathUtils';

let fovCurrent = 75;
let shakeSeed = 0;

export function eyePosition(out: THREE.Vector3): THREE.Vector3 {
  const p = world.player;
  return out.set(p.pos.x, p.pos.y + p.eyeH + p.bobY - p.landDip, p.pos.z);
}

export function viewDir(out: THREE.Vector3): THREE.Vector3 {
  const p = world.player;
  const pitch = p.pitch + p.recoilP;
  const yaw = p.yaw + p.recoilY;
  const cp = Math.cos(pitch);
  return out.set(-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp).normalize();
}

export function applyCamera(cam: THREE.Camera, dt: number, baseFov: number, adsFov: number): void {
  const p = world.player;
  eyePosition(cam.position);

  world.shake.amp = Math.max(0, world.shake.amp - dt * 0.12);
  shakeSeed += dt * 60;
  if (world.shake.amp > 0.0005) {
    cam.position.x += Math.sin(shakeSeed * 1.3) * world.shake.amp;
    cam.position.y += Math.cos(shakeSeed * 1.7) * world.shake.amp;
  }

  cam.rotation.order = 'YXZ';
  cam.rotation.y = p.yaw + p.recoilY;
  cam.rotation.x = p.pitch + p.recoilP;
  const hSpeed = Math.hypot(p.vel.x, p.vel.z);
  cam.rotation.z = p.onGround ? Math.sin(p.bobPhase) * 0.012 * Math.min(1, hSpeed / 5) : 0;

  const targetFov = p.ads ? adsFov : baseFov;
  fovCurrent = damp(fovCurrent, targetFov, 14, dt);
  const pc = cam as THREE.PerspectiveCamera;
  if (pc.isPerspectiveCamera) { pc.fov = fovCurrent; pc.updateProjectionMatrix(); }
}
