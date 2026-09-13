import { View, Text, StyleSheet } from 'react-native';
import { world } from '../game/world';
export function AmmoCounter() {
  return (
    <View style={styles.box}>
      <Text style={styles.ammo}>{world.player.mag} / {world.player.reserve}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  box: { padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8 },
  ammo: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});
