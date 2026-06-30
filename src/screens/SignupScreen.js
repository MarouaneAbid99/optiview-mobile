import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, radius, space, shadow } from '../theme';

export function SignupScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', shopName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const onSubmit = async () => {
    setError('');
    if (form.password.length < 6) { setError('Mot de passe : 6 caractères minimum'); return; }
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim() });
    } catch (e) {
      const msg = e.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Échec de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Navy brand band */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="eye" size={30} color={colors.teal} />
          </View>
          <Text style={styles.wordmark}>OPTIVIEW</Text>
          <Text style={styles.tagline}>Créez votre boutique en ligne</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nouveau compte</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={15} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {[
            { k: 'name',     label: 'Votre nom',         icon: 'person-outline',   kbType: undefined },
            { k: 'shopName', label: 'Nom de la boutique', icon: 'storefront-outline', kbType: undefined },
            { k: 'email',    label: 'Email',              icon: 'mail-outline',     kbType: 'email-address' },
          ].map(({ k, label, icon, kbType }) => (
            <View key={k}>
              <Text style={styles.label}>{label}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name={icon} size={17} color={colors.muted} style={styles.inputIcon} />
                <TextInput style={styles.input} value={form[k]} onChangeText={(v) => set(k, v)}
                  autoCapitalize={k === 'email' ? 'none' : 'words'} keyboardType={kbType}
                  placeholderTextColor={colors.mutedLight} />
              </View>
            </View>
          ))}

          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={17} color={colors.muted} style={styles.inputIcon} />
            <TextInput style={[styles.input, { flex: 1 }]} value={form.password} onChangeText={(v) => set('password', v)}
              secureTextEntry={!showPw} placeholder="6 caractères minimum" placeholderTextColor={colors.mutedLight} />
            <TouchableOpacity onPress={() => setShowPw((v) => !v)}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={17} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer le compte</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Déjà un compte ? <Text style={{ color: colors.teal }}>Se connecter</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: space.xl },
  brand: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    ...shadow.header,
  },
  wordmark: { fontSize: 26, fontWeight: '900', color: colors.navy, letterSpacing: 4 },
  tagline: { fontSize: 12, color: colors.muted, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: radius.xl, padding: space.xxl, ...shadow.card },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 11, backgroundColor: colors.bg, marginBottom: 4,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: colors.text },
  button: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 20, marginBottom: 4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { color: colors.muted, textAlign: 'center', marginTop: 14, fontSize: 13 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2', padding: 10, borderRadius: radius.sm, marginBottom: 10 },
  errorText: { color: '#B91C1C', fontSize: 13, flex: 1 },
});
