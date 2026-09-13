import { useMemo } from 'react';
import * as THREE from 'three';
import { COLLIDERS } from '../physics/Colliders';

export function MapEnvironment() {
  const ocean = useMemo(() => new THREE.PlaneGeometry(600, 600, 8, 8), []);
  const sky = useMemo(() => new THREE.SphereGeometry(260, 16, 12), []);

  return (
    <group>
      <mesh geometry={sky}>
        <meshBasicMaterial color="#0c243b" side={THREE.BackSide} />
      </mesh>
      <mesh geometry={ocean} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
        <meshStandardMaterial color="#0d2e4a" roughness={0.2} metalness={0.8} />
      </mesh>
      {COLLIDERS.map((b, i) => {
        const cx = (b.min[0] + b.max[0]) / 2, cy = (b.min[1] + b.max[1]) / 2, cz = (b.min[2] + b.max[2]) / 2;
        const sx = b.max[0] - b.min[0], sy = b.max[1] - b.min[1], sz = b.max[2] - b.min[2];
        const color = b.kind === 'floor' ? '#8a7d65' : b.kind === 'crate' ? '#6b4d2e' : b.kind === 'metal' ? '#444c55' : '#b0b8bf';
        return (
          <mesh key={i} position={[cx, cy, cz]}>
            <boxGeometry args={[sx, sy, sz]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}
