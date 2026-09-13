import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { world } from '../world';
import { audio } from '../audio/AudioEngine';

export function GrenadesLayer() {
  useFrame((_, dt) => {
    const g = world.fx.grenades;
    for (let i = g.length - 1; i >= 0; i--) {
      const item = g[i];
      item.fuse -= dt;
      item.vel.y -= 18 * dt;
      item.pos.addScaledVector(item.vel, dt);
      if (item.fuse <= 0) {
        audio.play('explode', { gain: 0.9 });
        world.shake.amp = Math.max(world.shake.amp, 0.08);
        g.splice(i, 1);
      }
    }
  });

  return null;
}
