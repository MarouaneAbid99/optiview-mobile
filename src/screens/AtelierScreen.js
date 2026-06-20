import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export function AtelierScreen() {
  return (
    <View style={styles.c}><Text style={styles.t}>Atelier</Text><Text style={styles.s}>À venir (Phase M2)</Text></View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  t: { fontSize: 22, fontWeight: '700', color: colors.text },
  s: { color: colors.muted, marginTop: 6 },
});
