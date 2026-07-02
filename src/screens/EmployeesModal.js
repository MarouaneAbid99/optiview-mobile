import { useState, useEffect } from "react";
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usersAPI } from "../api/client";
import { Field, ButtonRow } from "../components/ui";
import { useToast } from "../components/Toast";
import { colors, radius, space, shadow } from "../theme";

export function EmployeesModal({ visible, onClose }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  const load = async () => {
    setLoading(true);
    try { const res = await usersAPI.listEmployees(); setEmployees(res.data || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (visible) { load(); setAddOpen(false); setForm({ name: "", email: "", password: "" }); } }, [visible]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const create = async () => {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      showError("Nom, email et mot de passe (6 car.) requis"); return;
    }
    setSaving(true);
    try {
      await usersAPI.createEmployee(form);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showSuccess("Employé créé");
      setAddOpen(false); setForm({ name: "", email: "", password: "" });
      load();
    } catch (e) { showError(e.response?.data?.message || "Erreur"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (emp) => {
    try {
      await usersAPI.setEmployeeActive(emp.id, !emp.active);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEmployees((p) => p.map((e) => e.id === emp.id ? { ...e, active: !emp.active } : e));
    } catch (e) { showError("Erreur"); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.grabber} />
          <View style={s.header}>
            <Text style={s.title}>Employés</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}><Ionicons name="close" size={20} color={colors.muted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {employees.map((emp) => (
              <View key={emp.id} style={s.empRow}>
                <View style={s.empAvatar}>
                  <Text style={s.empAvatarText}>{emp.name?.[0]?.toUpperCase() || "?"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.empName}>{emp.name}</Text>
                  <Text style={s.empEmail}>{emp.email}</Text>
                </View>
                <Switch
                  value={!!emp.active}
                  onValueChange={() => toggleActive(emp)}
                  trackColor={{ false: colors.border, true: colors.tealFaint }}
                  thumbColor={emp.active ? colors.teal : colors.mutedLight}
                />
              </View>
            ))}

            {employees.length === 0 && !loading && (
              <Text style={s.empty}>Aucun employé. Ajoutez-en un ci-dessous.</Text>
            )}

            <TouchableOpacity style={s.addBtn} onPress={() => setAddOpen((v) => !v)}>
              <Ionicons name={addOpen ? "chevron-up" : "add-circle-outline"} size={18} color={colors.teal} />
              <Text style={s.addBtnText}>{addOpen ? "Annuler" : "Ajouter un employé"}</Text>
            </TouchableOpacity>

            {addOpen && (
              <View style={s.addForm}>
                <Field label="Nom" value={form.name} onChangeText={(v) => set("name", v)} icon="person-outline" />
                <Field label="Email" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" icon="mail-outline" />
                <Field label="Mot de passe (6 car. min)" value={form.password} onChangeText={(v) => set("password", v)} secureTextEntry icon="lock-closed-outline" />
                <ButtonRow cancelLabel="Annuler" onCancel={() => setAddOpen(false)} actionLabel="Créer" onAction={create} loading={saving} actionIcon="add" />
              </View>
            )}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(11,27,58,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.lg, maxHeight: "85%", ...shadow.header },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 17, fontWeight: "800", color: colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  empRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.bg },
  empAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.tealFaint, alignItems: "center", justifyContent: "center" },
  empAvatarText: { fontSize: 16, fontWeight: "700", color: colors.teal },
  empName: { fontSize: 15, fontWeight: "600", color: colors.text },
  empEmail: { fontSize: 13, color: colors.muted, marginTop: 2 },
  empty: { color: colors.muted, fontSize: 14, textAlign: "center", marginVertical: 16 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14 },
  addBtnText: { color: colors.teal, fontWeight: "700", fontSize: 14 },
  addForm: { backgroundColor: colors.bg, borderRadius: radius.md, padding: 12, marginBottom: 8 },
});
