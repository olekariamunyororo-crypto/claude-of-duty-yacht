import { Pressable, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  wide?: boolean;
  subtle?: boolean;
}

export function Button({ title, onPress, wide, subtle }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, wide && styles.wide, subtle ? styles.subtle : styles.primary]}
    >
      <Text style={[styles.text, subtle && styles.subtleText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  wide: { width: '100%', maxWidth: 360 },
  primary: { backgroundColor: '#f59e0b' },
  subtle: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  text: { color: '#05080d', fontWeight: '900', letterSpacing: 1.5, fontSize: 14 },
  subtleText: { color: '#e2e8f0' },
});
