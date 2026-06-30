import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking, Image, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { clientsAPI } from '../../api/client';
import { uploadToCloudinary } from '../../api/upload';
import { Loader, PrimaryButton, Avatar, Badge } from '../../components/ui';
import { colors, radius, space, shadow, statusStyle } from '../../theme';
import { ClientFormModal } from './ClientFormModal';

export function ClientDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullImage, setFullImage] = useState(null);

  const load = useCallback(async () => {
    try { const res = await clientsAPI.getClientById(id); setClient(res.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = () => {
    Alert.alert('Supprimer', 'Supprimer ce client ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await clientsAPI.deleteClient(id); navigation.goBack(); }
        catch (e) { Alert.alert('Erreur', e.response?.data?.message || 'Erreur'); }
      } },
    ]);
  };

  const whatsapp = () => {
    if (!client?.phone) return;
    let d = client.phone.replace(/\D/g, '');
    if (d.startsWith('0')) d = '212' + d.slice(1);
    else if (d.length === 9) d = '212' + d;
    Linking.openURL(`https://wa.me/${d}`);
  };

  const addPrescriptionPhoto = async (fromCamera) => {
    if (fromCamera) {
      const p = await ImagePicker.requestCameraPermissionsAsync();
      if (!p.granted) { alert('Autorisation caméra requise'); return; }
    } else {
      const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!p.granted) { alert('Autorisation galerie requise'); return; }
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
      alert('Échec du téléversement');
    } finally {
      setUploading(false);
    }
  };

  const chooseSource = () => {
    Alert.alert('Ajouter une ordonnance', 'Choisir la source', [
      { text: 'Caméra', onPress: () => addPrescriptionPhoto(true) },
      { text: 'Galerie', onPress: () => addPrescriptionPhoto(false) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  if (loading || !client) return <Loader />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Hero card */}
      <View style={styles.heroCard}>
        <Avatar letter={client.firstName?.[0] || '?'} size={64} bg={colors.teal} />
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
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#25D366' }]} onPress={whatsapp} activeOpacity={0.8}>
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

      {/* Prescriptions */}
      <SectionCard title="Ordonnances" icon="document-text">
        <TouchableOpacity style={styles.addPhotoBtn} onPress={chooseSource} disabled={uploading}>
          <Ionicons name="camera" size={17} color={colors.teal} />
          <Text style={styles.addPhotoText}>{uploading ? 'Téléversement...' : '+ Photo ordonnance'}</Text>
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
                <View style={[styles.presThumb, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }]}>
                  <Ionicons name="document-text-outline" size={20} color={colors.muted} />
                </View>
              )}
              <View>
                <Text style={styles.rowText}>OD: {p.sphereOD ?? '-'} / OG: {p.sphereOS ?? '-'}</Text>
                <Text style={styles.muted}>{p.dateIssued ? new Date(p.dateIssued).toLocaleDateString('fr-FR') : ''}</Text>
              </View>
            </View>
          ))}
      </SectionCard>

      {/* Orders */}
      <SectionCard title="Commandes" icon="receipt">
        {(client.orders || []).length === 0
          ? <Text style={styles.muted}>Aucune commande</Text>
          : client.orders.map((o) => {
            const ss = statusStyle[o.status] || statusStyle.pending;
            return (
              <View key={o.id} style={styles.rowItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowText}>{o.orderNumber}</Text>
                  <Text style={styles.muted}>{o.totalPrice} MAD</Text>
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

      {/* Full-screen image viewer */}
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
  heroCard: {
    backgroundColor: colors.navy, alignItems: 'center',
    paddingTop: 28, paddingBottom: 20, paddingHorizontal: space.lg,
    marginHorizontal: space.md, marginTop: space.md, marginBottom: 12,
    borderRadius: radius.xl, ...shadow.header,
  },
  heroName: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 10 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  heroPillText: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.full },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sectionCard: { backgroundColor: '#fff', marginHorizontal: space.md, marginBottom: 10, padding: 14, borderRadius: radius.md, ...shadow.card },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.bg },
  rowText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  muted: { color: colors.muted, fontSize: 13, marginTop: 2 },
  addPhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, marginBottom: 6 },
  addPhotoText: { color: colors.teal, fontWeight: '600', fontSize: 14 },
  presRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.bg },
  presThumb: { width: 48, height: 48, borderRadius: radius.sm },
  imgOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  imgClose: { position: 'absolute', top: 50, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  imgFull: { width: '100%', height: '80%' },
});
