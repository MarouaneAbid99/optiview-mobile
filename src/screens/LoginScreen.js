import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { colors, radius, space, shadow } from "../theme";

export function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const onSubmit = async () => {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Email invalide"); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e.response?.data?.message || "Échec de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.logoCircle}>
          <Ionicons name="eye" size={30} color={colors.teal} />
        </View>
        <Text style={styles.wordmark}>OPTIVIEW</Text>
        <Text style={styles.tagline}>Votre boutique, votre vision</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connexion</Text>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={15} color="#B91C1C" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={17} color={colors.muted} style={styles.inputIcon} />
          <TextInput style={styles.input} value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address" placeholder="email@boutique.ma"
            placeholderTextColor={colors.mutedLight} />
        </View>

        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={17} color={colors.muted} style={styles.inputIcon} />
          <TextInput style={[styles.input, { flex: 1 }]} value={password} onChangeText={setPassword}
            secureTextEntry={!showPw} placeholder="••••••••" placeholderTextColor={colors.mutedLight} />
          <TouchableOpacity onPress={() => setShowPw((v) => !v)}>
            <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={17} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setForgotOpen(true)} style={{ alignSelf: "flex-end", marginBottom: 4 }}>
          <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.link}>Nouvel opticien ? <Text style={{ color: colors.teal }}>Créer un compte</Text></Text>
        </TouchableOpacity>
      </View>

      <ForgotPasswordModal visible={forgotOpen} onClose={() => setForgotOpen(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", backgroundColor: colors.bg, padding: space.xl },
  brand: { alignItems: "center", marginBottom: 28 },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", marginBottom: 10, ...shadow.header },
  wordmark: { fontSize: 26, fontWeight: "900", color: colors.navy, letterSpacing: 4 },
  tagline: { fontSize: 12, color: colors.muted, marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: radius.xl, padding: space.xxl, ...shadow.card },
  cardTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.4 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: colors.bg, marginBottom: 4 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: colors.text },
  forgotLink: { fontSize: 12, color: colors.teal, fontWeight: "600", marginTop: 6 },
  button: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 14, alignItems: "center", marginTop: 16, marginBottom: 4 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  link: { color: colors.muted, textAlign: "center", marginTop: 14, fontSize: 13 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEE2E2", padding: 10, borderRadius: radius.sm, marginBottom: 10 },
  errorText: { color: "#B91C1C", fontSize: 13, flex: 1 },
});
