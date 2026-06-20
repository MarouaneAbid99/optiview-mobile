import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export function SignupScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', shopName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const onSubmit = async () => {
    setError('');
    if (form.password.length < 6) { setError('Mot de passe : 6 caractères minimum'); return; }
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim() });
    } catch (e) {
      const msg = e.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Échec de l’inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.logo}>OPTIVIEW</Text>
          <Text style={styles.subtitle}>Créer votre boutique</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Votre nom</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={(v) => set('name', v)} />
          <Text style={styles.label}>Nom de la boutique</Text>
          <TextInput style={styles.input} value={form.shopName} onChangeText={(v) => set('shopName', v)} />
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={form.email} onChangeText={(v) => set('email', v)} autoCapitalize="none" keyboardType="email-address" />
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput style={styles.input} value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry />

          <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer le compte</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 24 },
  logo: { fontSize: 30, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { color: colors.muted, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  button: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { color: colors.primary, textAlign: 'center', marginTop: 16, fontWeight: '600' },
  error: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 8, marginBottom: 8 },
});
