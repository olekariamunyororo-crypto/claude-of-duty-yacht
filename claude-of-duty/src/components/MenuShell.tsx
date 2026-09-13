import { View, Text, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';

export function MenuShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05080d', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: 'white', fontWeight: 'bold', fontSize: 24, letterSpacing: 2, marginBottom: 20 },
});
