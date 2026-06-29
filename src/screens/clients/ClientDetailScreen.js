import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { clientsAPI } from '../../api/client';
import { Loader, PrimaryButton } from '../../components/ui';
import { colors } from '../../theme';
import { ClientFormModal } from './ClientFormModal';

export function ClientDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);

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

  if (loading || !client) return <Loader />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(client.firstName?.[0] || '?').toUpperCase()}</Text></View>
        <Text style={styles.name}>{client.firstName} {client.lastName}</Text>
        {!!client.phone && <Text style={styles.sub}>{client.phone}</Text>}
        {!!client.email && <Text style={styles.sub}>{client.email}</Text>}
        <View style={styles.actionRow}>
          {!!client.phone && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.green }]} onPress={whatsapp}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" /><Text style={styles.actionText}>WhatsApp</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => setEditModal(true)}>
            <Ionicons name="pencil" size={16} color="#fff" /><Text style={styles.actionText}>Modifier</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Prescriptions */}
      <Section title="Ordonnances">
        {(client.prescriptions || []).length === 0
          ? <Text style={styles.muted}>Aucune ordonnance</Text>
          : client.prescriptions.map((p) => (
            <View key={p.id} style={styles.rowItem}>
              <Text style={styles.rowText}>OD: {p.sphereOD ?? '-'} / OG: {p.sphereOS ?? '-'}</Text>
              <Text style={styles.muted}>{p.dateIssued ? new Date(p.dateIssued).toLocaleDateString('fr-FR') : ''}</Text>
            </View>
          ))}
      </Section>

      {/* Orders */}
      <Section title="Commandes">
        {(client.orders || []).length === 0
          ? <Text style={styles.muted}>Aucune commande</Text>
          : client.orders.map((o) => (
            <View key={o.id} style={styles.rowItem}>
              <Text style={styles.rowText}>{o.orderNumber}</Text>
              <Text style={styles.muted}>{o.totalPrice} MAD · {o.status}</Text>
            </View>
          ))}
      </Section>

      <View style={{ padding: 16 }}>
        <PrimaryButton title="Supprimer le client" onPress={remove} color={colors.red} />
      </View>

      <ClientFormModal visible={editModal} client={client} onClose={() => setEditModal(false)} onSaved={() => { setEditModal(false); load(); }} />
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerCard: { backgroundColor: '#fff', alignItems: 'center', padding: 20, margin: 12, borderRadius: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 24 },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  sub: { color: colors.muted, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  actionText: { color: '#fff', fontWeight: '600' },
  section: { backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 6, padding: 14, borderRadius: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.bg },
  rowText: { color: colors.text },
  muted: { color: colors.muted },
});
