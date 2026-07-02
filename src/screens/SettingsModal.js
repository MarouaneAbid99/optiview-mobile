import { useState, useEffect } from "react";
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Application from "expo-application";
import * as Haptics from "expo-haptics";
import { usersAPI } from "../api/client";
import { Field, ButtonRow } from "../components/ui";
import { useToast } from "../components/Toast";
import { colors, radius, space, shadow } from "../theme";

export function SettingsModal({ visible, onClose }) {
  const [form, setForm] = useState({ name: "", address: "", city: "", phone: "", ice: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const res = await usersAPI.getMyShop();
        const sp = res.data;
        setForm({ name: sp.name || "", address: sp.address || "", city: sp.city || "", phone: sp.phone || "", ice: sp.ice || "" });
      } catch (e) { console.error(e); }
    })();
  }, [visible]);

  const { showSuccess, showError } = useToast();
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await usersAPI.updateMyShop(form);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showSuccess("Paramètres sauvegardés");
      onClose();
    } catch (e) { showError(e.response?.data?.message || "Erreur"); }
    finally { setSaving(false); }
  };

  const version = Application.nativeApplicationVersion || "1.0.0";
  const build = Application.nativeBuildVersion || "1";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.grabber} />
          <View style={s.header}>
            <Text style={s.title}>Paramètres boutique</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}><Ionicons name="close" size={20} color={colors.muted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Field label="Nom de la boutique" value={form.name} onChangeText={(v) => set("name", v)} icon="storefront-outline" />
            <Field label="Adresse" value={form.address} onChangeText={(v) => set("address", v)} icon="location-outline" />
            <Field label="Ville" value={form.city} onChangeText={(v) => set("city", v)} icon="business-outline" />
            <Field label="Téléphone" value={form.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" icon="call-outline" />
            <Field label="ICE" value={form.ice} onChangeText={(v) => set("ice", v)} icon="card-outline" />
            <ButtonRow cancelLabel="Annuler" onCancel={onClose} actionLabel="Enregistrer" onAction={save} loading={saving} actionIcon="checkmark" />
            <View style={s.footer}>
              <Text style={s.footerApp}>OPTIVIEW</Text>
              <Text style={s.footerSub}>Version {version} (build {build})</Text>
              <Text style={s.footerBrand}>Abidigital</Text>
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(11,27,58,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.lg, maxHeight: "90%", ...shadow.header },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 17, fontWeight: "800", color: colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  footer: { alignItems: "center", marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.bg },
  footerApp: { fontSize: 14, fontWeight: "900", color: colors.navy, letterSpacing: 3 },
  footerSub: { fontSize: 12, color: colors.muted, marginTop: 4 },
  footerBrand: { fontSize: 11, color: colors.mutedLight, marginTop: 2 },
});
