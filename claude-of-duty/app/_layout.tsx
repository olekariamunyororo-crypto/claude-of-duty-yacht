import { View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { initSentry } from '../src/sentry/init';
import { ErrorBoundary } from '../src/sentry/ErrorBoundary';
import '../src/hud/hudState';

initSentry();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: '#05080d' }}>
          <StatusBar hidden />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#05080d' } }} />
        </View>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
