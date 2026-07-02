import { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { authAPI } from "../api/client";
import { colors, radius, space, shadow } from "../theme";

export function ForgotPasswordModal({ visible, onClose }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reset = () => { setStep(1); setEmail(""); setCode(""); setPassword(""); setError(""); setSuccess(""); };
  const handleClose = () => { reset(); onClose(); };

  const sendCode = async () => {
    if (!email.trim()) { setError("Entrez votre email"); return; }
    setError(""); setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setStep(2);
      setSuccess("Un code a été envoyé à votre email.");
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de l'envoi");
    } finally { setLoading(false); }
  };

  const doReset = async () => {
    if (!code.trim()) { setError("Entrez le code reçu"); return; }
    if (password.length < 6) { setError("Mot de passe : 6 caractères minimum"); return; }
    setError(""); setLoading(true);
    try {
      await authAPI.resetPassword({ email: email.trim(), code: code.trim(), password });
      setStep(3);
    } catch (e) {
      setError(e.response?.data?.message || "Code invalide ou expiré");
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.grabber} />
          <View style={s.header}>
            <Text style={s.title}>Mot de passe oublié</Text>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {step === 1 && (
            <>
              <Text style={s.hint}>Entrez votre email pour recevoir un code de réinitialisation.</Text>
              {!!error && <Text style={s.error}>{error}</Text>}
              <Text style={s.label}>Email</Text>
              <View style={s.inputWrap}>
                <Ionicons name="mail-outline" size={17} color={colors.muted} style={{ marginRight: 8 }} />
                <TextInput style={s.input} value={email} onChangeText={setEmail}
                  autoCapitalize="none" keyboardType="email-address" placeholder="votre@email.com"
                  placeholderTextColor={colors.mutedLight} />
              </View>
              <TouchableOpacity style={s.btn} onPress={sendCode} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Envoyer le code</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              {!!success && <Text style={s.successText}>{success}</Text>}
              {!!error && <Text style={s.error}>{error}</Text>}
              <Text style={s.label}>Code reçu par email</Text>
              <View style={s.inputWrap}>
                <Ionicons name="key-outline" size={17} color={colors.muted} style={{ marginRight: 8 }} />
                <TextInput style={s.input} value={code} onChangeText={setCode}
                  keyboardType="number-pad" placeholder="123456" placeholderTextColor={colors.mutedLight} />
              </View>
              <Text style={s.label}>Nouveau mot de passe</Text>
              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={17} color={colors.muted} style={{ marginRight: 8 }} />
                <TextInput style={[s.input, { flex: 1 }]} value={password} onChangeText={setPassword}
                  secureTextEntry={!showPw} placeholder="6 caractères minimum" placeholderTextColor={colors.mutedLight} />
                <TouchableOpacity onPress={() => setShowPw((v) => !v)}>
                  <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={17} color={colors.muted} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.btn} onPress={doReset} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Réinitialiser</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 3 && (
            <>
              <View style={s.successBox}>
                <Ionicons name="checkmark-circle" size={48} color={colors.teal} />
                <Text style={s.successTitle}>Mot de passe mis à jour</Text>
                <Text style={s.hint}>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</Text>
              </View>
              <TouchableOpacity style={s.btn} onPress={handleClose}>
                <Text style={s.btnText}>Fermer</Text>
              </TouchableOpacity>
            </>
          )}
          <View style={{ height: 24 }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(11,27,58,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.lg, ...shadow.header },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 17, fontWeight: "800", color: colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  hint: { fontSize: 14, color: colors.muted, marginBottom: 16, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6, marginTop: 8, textTransform: "uppercase", letterSpacing: 0.4 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: colors.bg, marginBottom: 4 },
  input: { flex: 1, fontSize: 15, color: colors.text },
  btn: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  error: { color: colors.red, fontSize: 13, marginBottom: 8 },
  successText: { color: colors.teal, fontSize: 13, marginBottom: 8 },
  successBox: { alignItems: "center", paddingVertical: 24, gap: 12 },
  successTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
});
