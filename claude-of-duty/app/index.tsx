import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { MenuShell } from '../src/components/MenuShell';
import { Button } from '../src/components/Button';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { useGameStore } from '../src/game/store/gameStore';
import { useSettings } from '../src/game/store/settingsStore';
import { audio } from '../src/game/audio/AudioEngine';

export default function MainMenu() {
  const startMatch = useGameStore((s) => s.startMatch);
  const procedural = useSettings((s) => s.proceduralModels);
  const [booting, setBooting] = useState(false);

  const onDeploy = useCallback(async () => {
    if (booting) return;
    setBooting(true);
    audio.init();
    const { probeAllModels } = await import('../src/game/utils/ModelProbe');
    await probeAllModels();
    startMatch();
    router.push('/game');
  }, [booting, startMatch]);

  if (booting) return <LoadingScreen label="BOOTING VIBE ENGINE…" />;

  return (
    <MenuShell>
      <Text className="text-amber-300 text-[13px] tracking-[6px] mb-1">UNOFFICIAL FAN OPERATION</Text>
      <Text className="text-white font-bold text-[44px] leading-[46px] text-center">CLAUDE OF DUTY</Text>
      <Text className="text-cyan-300 font-bold text-[20px] tracking-[4px] mb-8">VIBE SLOPS II</Text>
      <Button title="▶  TAP TO DEPLOY" onPress={onDeploy} wide />
      <Button title="SETTINGS" onPress={() => router.push('/settings')} wide subtle />
      <Text className="text-slate-400 text-[11px] mt-8 text-center px-8">
        Hijacked-style yacht · NV4 carbine · Ghost bots{procedural ? ' · PROCEDURAL STAND-IN MODELS ACTIVE' : ''}
      </Text>
    </MenuShell>
  );
}
