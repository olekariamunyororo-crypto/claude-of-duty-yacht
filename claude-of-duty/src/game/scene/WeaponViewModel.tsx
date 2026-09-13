import { forwardRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { world } from '../world';

export const WeaponViewModel = forwardRef<THREE.Group>(function WeaponViewModel(_, ref) {
  const { camera } = useThree();

  useFrame(() => {
    // Follow camera
  });

  return (
    <group ref={ref}>
      <mesh position={[0.2, -0.22, -0.45]}>
        <boxGeometry args={[0.06, 0.1, 0.35]} />
        <meshStandardMaterial color="#2a3038" roughness={0.4} metalness={0.7} />
      </mesh>
    </group>
  );
});
