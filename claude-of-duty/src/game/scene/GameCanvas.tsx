import { Canvas } from '@react-three/fiber';
import { StyleSheet, View } from 'react-native';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { StaticColliders } from '../physics/Colliders';
import { MapEnvironment } from './Map';
import { PlayerRig } from './Player';
import { BotsRig } from '../ai/Bots';
import { GrenadesLayer } from './Grenades';
import { EffectsLayer } from './Effects';
import { useSettings } from '../store/settingsStore';

export function GameCanvas() {
  const q = useSettings((s) => s.quality);
  const dpr = q === 'low' ? 1.0 : q === 'medium' ? 1.35 : 1.7;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas
        dpr={dpr}
        gl={{ powerPreference: 'high-performance', antialias: q !== 'low', depth: true }}
        camera={{ position: [0, 3.42, -25], fov: 75, near: 0.08, far: 320 }}
      >
        <PhysicsWorld>
          <ambientLight intensity={0.45} />
          <directionalLight position={[28, 48, 16]} intensity={1.3} castShadow={false} />
          <MapEnvironment />
          <StaticColliders />
          <PlayerRig />
          <BotsRig />
          <GrenadesLayer />
          <EffectsLayer />
        </PhysicsWorld>
      </Canvas>
    </View>
  );
}
