import { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clientsAPI } from '../../api/client';
import { Field, ButtonRow } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { colors, radius, space, shadow } from '../../theme';

export function ClientFormModal({ visible, onClose, onSaved, client }) {
  const isEdit = !!client;
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', address: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (client) setForm({ firstName: client.firstName || '', lastName: client.lastName || '', phone: client.phone || '', email: client.email || '', address: client.address || '' });
    else setForm({ firstName: '', lastName: '', phone: '', email: '', address: '' });
    setErrors({});
  }, [client, visible]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Le prénom est requis';
    if (form.phone && !/^[0-9+\s\-()]{6,}$/.test(form.phone.trim())) e.phone = 'Numéro invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) await clientsAPI.updateClient(client.id, form);
      else await clientsAPI.createClient(form);
      showSuccess(isEdit ? 'Client mis à jour' : 'Client créé');
      onSaved();
    } catch (e) { showError(e.response?.data?.message || 'Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? 'Modifier le client' : 'Nouveau client'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Ionicons name="close" size={20} color={colors.muted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Field label="Prénom *" value={form.firstName} onChangeText={(v) => set('firstName', v)} icon="person-outline" error={errors.firstName} />
            <Field label="Nom" value={form.lastName} onChangeText={(v) => set('lastName', v)} icon="person-outline" />
            <Field label="Téléphone" value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" icon="call-outline" error={errors.phone} />
            <Field label="Email" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" icon="mail-outline" />
            <Field label="Adresse" value={form.address} onChangeText={(v) => set('address', v)} multiline icon="location-outline" />
            <ButtonRow
              cancelLabel="Annuler" onCancel={onClose}
              actionLabel={isEdit ? 'Enregistrer' : 'Créer'} onAction={save}
              loading={saving} actionIcon={isEdit ? 'checkmark' : 'add'}
            />
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(11,27,58,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.lg, maxHeight: '90%', ...shadow.header },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
