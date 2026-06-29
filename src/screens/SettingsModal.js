import { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usersAPI } from '../api/client';
import { Field, PrimaryButton } from '../components/ui';
import { colors } from '../theme';

export function SettingsModal({ visible, onClose }) {
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', ice: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const res = await usersAPI.getMyShop();
        const sp = res.data;
        setForm({ name: sp.name || '', address: sp.address || '', city: sp.city || '', phone: sp.phone || '', ice: sp.ice || '' });
      } catch (e) { console.error(e); }
    })();
  }, [visible]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await usersAPI.updateMyShop(form); onClose(); }
    catch (e) { alert(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>Paramètres boutique</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></TouchableOpacity>
          </View>
          <ScrollView>
            <Field label="Nom de la boutique" value={form.name} onChangeText={(v) => set('name', v)} />
            <Field label="Adresse" value={form.address} onChangeText={(v) => set('address', v)} />
            <Field label="Ville" value={form.city} onChangeText={(v) => set('city', v)} />
            <Field label="Téléphone" value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
            <Field label="ICE" value={form.ice} onChangeText={(v) => set('ice', v)} />
            <PrimaryButton title="Enregistrer" onPress={save} loading={saving} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
});
