import { View, StyleSheet } from 'react-native';
export function Crosshair() {
  return (
    <View pointerEvents="none" style={styles.center}>
      <View style={styles.dot} />
    </View>
  );
}
const styles = StyleSheet.create({
  center: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)' },
});
