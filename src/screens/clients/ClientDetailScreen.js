import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking, Image, Modal, TextInput, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { clientsAPI } from "../../api/client";
import { uploadToCloudinary } from "../../api/upload";
import { Loader, PrimaryButton, Avatar, Badge } from "../../components/ui";
import { useToast } from "../../components/Toast";
import { colors, radius, space, shadow, statusStyle } from "../../theme";
import { ClientFormModal } from "./ClientFormModal";

const APPT_STATUS = { scheduled: "Prévu", done: "Terminé", cancelled: "Annulé" };
const APPT_COLOR = { scheduled: colors.blue, done: colors.teal, cancelled: colors.red };

export function ClientDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [client, setClient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullImage, setFullImage] = useState(null);
  const [apptModal, setApptModal] = useState(false);
  const { showError } = useToast();

  const load = useCallback(async () => {
    try {
      const [clientRes, apptRes] = await Promise.all([
        clientsAPI.getClientById(id),
        clientsAPI.getAppointments(id).catch(() => ({ data: [] })),
      ]);
      setClient(clientRes.data);
      setAppointments(apptRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = () => {
    Alert.alert("Supprimer", "Supprimer ce client ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        try { await clientsAPI.deleteClient(id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.goBack(); }
        catch (e) { showError(e.response?.data?.message || "Erreur"); }
      }},
    ]);
  };

  const whatsapp = () => {
    if (!client?.phone) return;
    let d = client.phone.replace(/\D/g, "");
    if (d.startsWith("0")) d = "212" + d.slice(1);
    else if (d.length === 9) d = "212" + d;
    Linking.openURL("https://wa.me/" + d);
  };

  const call = () => {
    if (!client?.phone) return;
    Linking.openURL("tel:" + client.phone);
  };

  const addPrescriptionPhoto = async (fromCamera) => {
    if (fromCamera) {
      const p = await ImagePicker.requestCameraPermissionsAsync();
      if (!p.granted) { alert("Autorisation caméra requise"); return; }
    } else {
      const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!p.granted) { alert("Autorisation galerie requise"); return; }
    }
    const picker = fromCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await picker({ quality: 0.7, allowsEditing: true });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(uri);
      await clientsAPI.createPrescription(client.id, { imageUrl: url, dateIssued: new Date().toISOString() });
      await load();
    } catch (e) {
      showError("Échec du téléversement");
    } finally {
      setUploading(false);
    }
  };

  const chooseSource = () => {
    Alert.alert("Ajouter une ordonnance", "Choisir la source", [
      { text: "Caméra", onPress: () => addPrescriptionPhoto(true) },
      { text: "Galerie", onPress: () => addPrescriptionPhoto(false) },
      { text: "Annuler", style: "cancel" },
    ]);
  };

  if (loading || !client) return <Loader />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.heroCard}>
        <Avatar letter={client.firstName?.[0] || "?"} size={64} bg={colors.teal} />
        <Text style={styles.heroName}>{client.firstName} {client.lastName}</Text>
        {!!client.phone && (
          <View style={styles.heroPill}>
            <Ionicons name="call-outline" size={13} color={colors.muted} />
            <Text style={styles.heroPillText}>{client.phone}</Text>
          </View>
        )}
        {!!client.email && (
          <View style={styles.heroPill}>
            <Ionicons name="mail-outline" size={13} color={colors.muted} />
            <Text style={styles.heroPillText}>{client.email}</Text>
          </View>
        )}
        <View style={styles.actionRow}>
          {!!client.phone && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.teal }]} onPress={call} activeOpacity={0.8}>
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.actionText}>Appeler</Text>
            </TouchableOpacity>
          )}
          {!!client.phone && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#25D366" }]} onPress={whatsapp} activeOpacity={0.8}>
              <Ionicons name="logo-whatsapp" size={16} color="#fff" />
              <Text style={styles.actionText}>WhatsApp</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.navy }]} onPress={() => setEditModal(true)} activeOpacity={0.8}>
            <Ionicons name="pencil" size={15} color="#fff" />
            <Text style={styles.actionText}>Modifier</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SectionCard title="Ordonnances" icon="document-text">
        <TouchableOpacity style={styles.addPhotoBtn} onPress={chooseSource} disabled={uploading}>
          <Ionicons name="camera" size={17} color={colors.teal} />
          <Text style={styles.addPhotoText}>{uploading ? "Téléversement..." : "+ Photo ordonnance"}</Text>
        </TouchableOpacity>
        {(client.prescriptions || []).length === 0
          ? <Text style={styles.muted}>Aucune ordonnance</Text>
          : client.prescriptions.map((p) => (
            <View key={p.id} style={styles.presRow}>
              {p.imageUrl ? (
                <TouchableOpacity onPress={() => setFullImage(p.imageUrl)}>
                  <Image source={{ uri: p.imageUrl }} style={styles.presThumb} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.presThumb, { alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }]}>
                  <Ionicons name="document-text-outline" size={20} color={colors.muted} />
                </View>
              )}
              <View>
                <Text style={styles.rowText}>OD: {p.sphereOD ?? "-"} / OG: {p.sphereOS ?? "-"}</Text>
                <Text style={styles.muted}>{p.dateIssued ? new Date(p.dateIssued).toLocaleDateString("fr-FR") : ""}</Text>
              </View>
            </View>
          ))}
      </SectionCard>

      <SectionCard title="Rendez-vous" icon="calendar">
        <TouchableOpacity style={styles.addPhotoBtn} onPress={() => setApptModal(true)}>
          <Ionicons name="add-circle-outline" size={17} color={colors.teal} />
          <Text style={styles.addPhotoText}>+ Nouveau rendez-vous</Text>
        </TouchableOpacity>
        {appointments.length === 0
          ? <Text style={styles.muted}>Aucun rendez-vous</Text>
          : appointments.map((a) => (
            <View key={a.id} style={styles.rowItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowText}>{new Date(a.dateTime).toLocaleDateString("fr-FR")} {new Date(a.dateTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</Text>
                {!!a.notes && <Text style={styles.muted}>{a.notes}</Text>}
              </View>
              <View style={[styles.apptBadge, { backgroundColor: (APPT_COLOR[a.status] || colors.blue) + "22" }]}>
                <Text style={[styles.apptBadgeText, { color: APPT_COLOR[a.status] || colors.blue }]}>{APPT_STATUS[a.status] || a.status}</Text>
              </View>
            </View>
          ))}
      </SectionCard>

      <SectionCard title="Commandes" icon="receipt">
        {(client.orders || []).length === 0
          ? <Text style={styles.muted}>Aucune commande</Text>
          : client.orders.map((o) => {
            const ss = statusStyle[o.status] || statusStyle.pending;
            return (
              <View key={o.id} style={styles.rowItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowText}>{o.orderNumber}</Text>
                  <Text style={styles.muted}>{o.totalPrice ? o.totalPrice.toLocaleString("fr-FR") + " MAD" : "—"}</Text>
                </View>
                <Badge label={o.status} bg={ss.bg} textColor={ss.text} />
              </View>
            );
          })}
      </SectionCard>

      <View style={{ paddingHorizontal: space.md }}>
        <PrimaryButton title="Supprimer le client" onPress={remove} color={colors.red} icon="trash-outline" />
      </View>

      <ClientFormModal visible={editModal} client={client} onClose={() => setEditModal(false)} onSaved={() => { setEditModal(false); load(); }} />

      <AppointmentModal visible={apptModal} clientId={id} onClose={() => setApptModal(false)} onSaved={() => { setApptModal(false); load(); }} />

      <Modal visible={!!fullImage} transparent animationType="fade" onRequestClose={() => setFullImage(null)}>
        <View style={styles.imgOverlay}>
          <TouchableOpacity style={styles.imgClose} onPress={() => setFullImage(null)}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          {fullImage && <Image source={{ uri: fullImage }} style={styles.imgFull} resizeMode="contain" />}
        </View>
      </Modal>
    </ScrollView>
  );
}

function AppointmentModal({ visible, clientId, onClose, onSaved }) {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { showError, showSuccess } = useToast();

  const save = async () => {
    setSaving(true);
    try {
      await clientsAPI.createAppointment(clientId, { dateTime: date.toISOString(), notes: notes || null, status: "scheduled" });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showSuccess("Rendez-vous créé");
      onSaved();
    } catch (e) {
      showError(e.response?.data?.message || "Erreur");
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={am.overlay}>
        <View style={am.sheet}>
          <View style={am.grabber} />
          <View style={am.header}>
            <Text style={am.title}>Nouveau rendez-vous</Text>
            <TouchableOpacity onPress={onClose} style={am.closeBtn}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <Text style={am.label}>Date et heure</Text>
          <TouchableOpacity style={am.dateBtn} onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar-outline" size={17} color={colors.teal} />
            <Text style={am.dateBtnText}>{date.toLocaleDateString("fr-FR")} à {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display={Platform.OS === "ios" ? "inline" : "default"}
              minimumDate={new Date()}
              onChange={(e, selected) => { setShowPicker(Platform.OS === "ios"); if (selected) setDate(selected); }}
            />
          )}

          <Text style={am.label}>Notes (optionnel)</Text>
          <TextInput
            style={am.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ex: Contrôle de vue"
            placeholderTextColor={colors.mutedLight}
            multiline
          />

          <TouchableOpacity style={am.saveBtn} onPress={save} disabled={saving}>
            <Text style={am.saveBtnText}>{saving ? "..." : "Créer le rendez-vous"}</Text>
          </TouchableOpacity>
          <View style={{ height: 16 }} />
        </View>
      </View>
    </Modal>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={16} color={colors.teal} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  heroCard: { backgroundColor: colors.navy, alignItems: "center", paddingTop: 28, paddingBottom: 20, paddingHorizontal: space.lg, marginHorizontal: space.md, marginTop: space.md, marginBottom: 12, borderRadius: radius.xl, ...shadow.header },
  heroName: { fontSize: 20, fontWeight: "800", color: "#fff", marginTop: 10 },
  heroPill: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  heroPillText: { color: "rgba(255,255,255,0.65)", fontSize: 13 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 16, flexWrap: "wrap", justifyContent: "center" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.full },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  sectionCard: { backgroundColor: "#fff", marginHorizontal: space.md, marginBottom: 10, padding: 14, borderRadius: radius.md, ...shadow.card },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  rowItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.bg },
  rowText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  muted: { color: colors.muted, fontSize: 13, marginTop: 2 },
  addPhotoBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, marginBottom: 6 },
  addPhotoText: { color: colors.teal, fontWeight: "600", fontSize: 14 },
  presRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.bg },
  presThumb: { width: 48, height: 48, borderRadius: radius.sm },
  apptBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.full },
  apptBadgeText: { fontSize: 11, fontWeight: "700" },
  imgOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" },
  imgClose: { position: "absolute", top: 50, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  imgFull: { width: "100%", height: "80%" },
});

const am = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(11,27,58,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.lg, ...shadow.header },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 17, fontWeight: "800", color: colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6, marginTop: 8, textTransform: "uppercase", letterSpacing: 0.4 },
  dateBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.tealFaint, marginBottom: 4 },
  dateBtnText: { fontSize: 15, color: colors.text, fontWeight: "600" },
  notesInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.text, backgroundColor: colors.bg, minHeight: 72, textAlignVertical: "top" },
  saveBtn: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
