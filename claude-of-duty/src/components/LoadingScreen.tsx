import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../game/store/gameStore';

export function LoadingScreen({ label = 'LOADING…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.txt}>{label}</Text>
    </View>
  );
}

export function Popups() {
  const popups = useGameStore((s) => s.popups);
  return (
    <View pointerEvents="none" style={styles.popupBox}>
      {popups.map((p) => (
        <Text key={p.id} style={[styles.popupText, p.big && styles.popupBig]}>{p.text}</Text>
      ))}
    </View>
  );
}

export function DeathOverlay() {
  const death = useGameStore((s) => s.death);
  if (!death) return null;
  return (
    <View pointerEvents="none" style={styles.deathOverlay}>
      <Text style={styles.deathTitle}>ELIMINATED</Text>
      <Text style={styles.deathSub}>by {death.killer}</Text>
    </View>
  );
}

export function GameOverOverlay() {
  const store = useGameStore();
  return (
    <View style={styles.centerOverlay}>
      <Text style={styles.goTitle}>MATCH COMPLETED</Text>
      <Text style={styles.goScore}>YOUR KILLS: {store.playerScore}</Text>
    </View>
  );
}

export function PauseOverlay() {
  return (
    <View style={styles.centerOverlay}>
      <Text style={styles.goTitle}>PAUSED</Text>
    </View>
  );
}

export function CountdownOverlay() {
  const cd = useGameStore((s) => s.countdown);
  return (
    <View pointerEvents="none" style={styles.center}>
      <Text style={styles.cdText}>{Math.ceil(cd)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#05080d', alignItems: 'center', justifyContent: 'center' },
  txt: { color: '#f59e0b', fontWeight: 'bold', fontSize: 18, letterSpacing: 2 },
  popupBox: { position: 'absolute', top: '35%', width: '100%', alignItems: 'center' },
  popupText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 16, textShadowColor: 'black', textShadowRadius: 4 },
  popupBig: { fontSize: 22, color: '#ef4444' },
  deathOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(153,27,27,0.4)', alignItems: 'center', justifyContent: 'center' },
  deathTitle: { color: '#ef4444', fontWeight: '900', fontSize: 32, letterSpacing: 4 },
  deathSub: { color: 'white', fontWeight: 'bold', fontSize: 14, marginTop: 4 },
  centerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,8,13,0.85)', alignItems: 'center', justifyContent: 'center' },
  goTitle: { color: 'white', fontWeight: '900', fontSize: 28, letterSpacing: 3 },
  goScore: { color: '#f59e0b', fontWeight: 'bold', fontSize: 16, marginTop: 8 },
  cdText: { color: '#fbbf24', fontWeight: '900', fontSize: 64 },
});
