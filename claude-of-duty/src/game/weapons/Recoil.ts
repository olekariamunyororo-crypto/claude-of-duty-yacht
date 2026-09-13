import { NV4, type WeaponDef } from './weaponData';
import { DEG, randRange, randSign } from '../utils/MathUtils';
import { world } from '../world';

export function recoilShot(def: WeaponDef = NV4): void {
  const amp = world.player.ads ? 0.75 : 1;
  world.player.recoilP += randRange(def.recoilPitch[0], def.recoilPitch[1]) * DEG * amp;
  world.player.recoilY += randRange(def.recoilYaw[0], def.recoilYaw[1]) * DEG * amp * randSign();
}

export function recoilReset(): void {
  world.player.recoilP = 0;
  world.player.recoilY = 0;
}
