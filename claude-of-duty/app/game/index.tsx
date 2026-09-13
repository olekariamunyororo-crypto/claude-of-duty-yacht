import { useEffect } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { GameCanvas } from '../../src/game/scene/GameCanvas';
import { HudCanvas } from '../../src/hud/HudCanvas';
import { TouchControls } from '../../src/game/input/TouchControls';
import { Killfeed } from '../../src/hud/Killfeed';
import { Popups, DeathOverlay, GameOverOverlay, PauseOverlay, CountdownOverlay } from '../../src/components/LoadingScreen';
import { useGameStore } from '../../src/game/store/gameStore';

export default function GameScreen() {
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    if (phase === 'menu') router.replace('/');
  }, [phase]);

  if (phase === 'menu') return <View className="flex-1 bg-black" />;

  return (
    <View className="flex-1 bg-black">
      <GameCanvas />
      <HudCanvas />
      <Killfeed />
      <Popups />
      {phase === 'countdown' && <CountdownOverlay />}
      {(phase === 'playing' || phase === 'countdown') && <TouchControls />}
      <DeathOverlay />
      {phase === 'paused' && <PauseOverlay />}
      {phase === 'gameover' && <GameOverOverlay />}
    </View>
  );
}
