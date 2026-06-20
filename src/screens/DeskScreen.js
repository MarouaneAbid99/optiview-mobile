import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export function DeskScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Bonjour, {user?.name}</Text>
      <Text style={styles.s}>{user?.shop?.name || (user?.role === 'DEVELOPER' ? 'Développeur' : '')}</Text>
      <TouchableOpacity style={styles.btn} onPress={logout}><Text style={styles.btnT}>Déconnexion</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 20 },
  t: { fontSize: 22, fontWeight: '700', color: colors.text },
  s: { color: colors.muted, marginTop: 6, marginBottom: 24 },
  btn: { backgroundColor: colors.red, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnT: { color: '#fff', fontWeight: '700' },
});
