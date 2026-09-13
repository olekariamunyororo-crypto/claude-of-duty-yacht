import * as THREE from 'three';
import { NV4 } from './weaponData';
import { recoilShot } from './Recoil';
import { playerFire } from './Ballistics';
import { world } from '../world';
import { coneDir } from '../utils/MathUtils';
import { audio } from '../audio/AudioEngine';
import { eyePosition, viewDir } from '../player/Camera';

let nextShot = 0;
const _o = new THREE.Vector3();
const _d = new THREE.Vector3();

export function weaponUpdate(t: number, wantFire: boolean): void {
  const p = world.player;
  const def = NV4;

  if (p.reloading) {
    if (t >= p.reloadEnd) {
      const need = def.magSize - p.mag;
      const take = Math.min(need, p.reserve);
      p.mag += take; p.reserve -= take;
      p.reloading = false;
      audio.play('reloadB', { gain: 0.6 });
    }
    return;
  }

  if (wantFire && t >= nextShot) {
    if (p.mag <= 0) {
      audio.play('empty', { gain: 0.5 });
      nextShot = t + 0.3;
      tryReload();
      return;
    }
    p.mag -= 1;
    nextShot = t + 60 / def.rpm;
    eyePosition(_o);
    viewDir(_d);
    const spread = (p.ads ? def.spreadAds : def.spreadHip) + p.bloom;
    coneDir(_d, spread, _d);
    playerFire(_o, _d, def);
    recoilShot(def);
    p.bloom = Math.min(def.bloomMax, p.bloom + def.bloomPerShot);
    world.events.shotT = t;
    world.shake.amp = Math.max(world.shake.amp, p.ads ? 0.012 : 0.02);
    audio.play('shot', { gain: 0.85, rate: 0.96 + Math.random() * 0.08 });
    if (Math.random() < 0.5) audio.play('shotFar', { gain: 0.12 });
  }
}

export function tryReload(): void {
  const p = world.player;
  if (p.reloading || p.mag >= NV4.magSize || p.reserve <= 0) return;
  p.reloading = true;
  p.reloadStart = world.time;
  p.reloadEnd = world.time + NV4.reloadTime;
  audio.play('reloadA', { gain: 0.6 });
}

export function weaponReset(): void { nextShot = 0; }
export function reloadProgress(): number {
  const p = world.player;
  if (!p.reloading) return 0;
  return Math.min(1, (world.time - p.reloadStart) / NV4.reloadTime);
}
