import { useFrame } from '@react-three/fiber';
import { world } from '../world';

export function EffectsLayer() {
  useFrame(() => {
    const now = world.time;
    world.fx.tracers = world.fx.tracers.filter((t) => now - t.t0 < 0.12);
    world.fx.impacts = world.fx.impacts.filter((im) => now - im.t0 < 0.6);
  });
  return null;
}
