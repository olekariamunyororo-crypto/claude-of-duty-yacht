import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { world } from '../world';
import { applyCamera } from '../player/Camera';
import { updatePlayerMovement } from '../physics/CharacterController';
import { weaponUpdate } from '../weapons/WeaponState';
import { updateHealth } from '../player/Health';
import { input } from '../input/InputManager';
import { NV4 } from '../weapons/weaponData';
import { WeaponViewModel } from './WeaponViewModel';

export function PlayerRig() {
  const { camera } = useThree();
  const gunGroup = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    world.time += d;
    updatePlayerMovement(d);
    weaponUpdate(world.time, input.fire);
    updateHealth(d);
    applyCamera(camera, d, 75, NV4.adsFov);
  });

  return <WeaponViewModel ref={gunGroup} />;
}
