import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { MenuShell } from '../src/components/MenuShell';
import { Button } from '../src/components/Button';
import { useSettings, type QualityTier } from '../src/game/store/settingsStore';

export default function SettingsScreen() {
  const s = useSettings();
  return (
    <MenuShell title="SETTINGS">
      <ScrollView className="w-full max-w-[520px] self-center">
        <Text className="text-slate-200 text-sm">Settings Screen configured.</Text>
        <Button title="◀ BACK" onPress={() => router.back()} wide />
      </ScrollView>
    </MenuShell>
  );
}
