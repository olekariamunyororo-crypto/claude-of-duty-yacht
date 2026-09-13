import { useFrame } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { world } from '../world';
import { spawnBot, updateBotAI } from './BotAI';
import { SPAWNS } from '../physics/Colliders';

export function BotsRig() {
  useEffect(() => {
    if (world.bots.length === 0) {
      for (let i = 0; i < 5; i++) {
        const s = SPAWNS[(i + 1) % SPAWNS.length];
        world.bots.push(spawnBot(i, s.pos, s.yaw));
      }
    }
  }, []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    world.bots.forEach((b) => updateBotAI(b, d));
  });

  return (
    <group>
      {world.bots.map((b) => (
        <mesh key={b.id} position={[b.pos.x, b.pos.y + 0.9, b.pos.z]}>
          <cylinderGeometry args={[0.38, 0.38, 1.8, 12]} />
          <meshStandardMaterial color={b.alive ? '#334455' : '#111820'} />
        </mesh>
      ))}
    </group>
  );
}
