import { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clientsAPI } from '../../api/client';
import { Field, PrimaryButton } from '../../components/ui';
import { colors } from '../../theme';

export function ClientFormModal({ visible, onClose, onSaved, client }) {
  const isEdit = !!client;
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) setForm({ firstName: client.firstName || '', lastName: client.lastName || '', phone: client.phone || '', email: client.email || '', address: client.address || '' });
    else setForm({ firstName: '', lastName: '', phone: '', email: '', address: '' });
  }, [client, visible]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.firstName.trim()) { Alert.alert('Champ requis', 'Le prénom est requis'); return; }
    setSaving(true);
    try {
      if (isEdit) await clientsAPI.updateClient(client.id, form);
      else await clientsAPI.createClient(form);
      onSaved();
    } catch (e) { Alert.alert('Erreur', e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? 'Modifier le client' : 'Nouveau client'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></TouchableOpacity>
          </View>
          <ScrollView>
            <Field label="Prénom *" value={form.firstName} onChangeText={(v) => set('firstName', v)} />
            <Field label="Nom" value={form.lastName} onChangeText={(v) => set('lastName', v)} />
            <Field label="Téléphone" value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
            <Field label="Email" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" />
            <Field label="Adresse" value={form.address} onChangeText={(v) => set('address', v)} multiline />
            <PrimaryButton title={isEdit ? 'Enregistrer' : 'Créer'} onPress={save} loading={saving} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
});
