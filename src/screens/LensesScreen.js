import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { lensesAPI } from '../api/client';
import { SearchBar, Fab, EmptyState, Loader, Field, PrimaryButton } from '../components/ui';
import { colors } from '../theme';

export function LensesScreen() {
  const [lenses, setLenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    try { const res = await lensesAPI.getLenses(); setLenses(res.data || []); }
    catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const changeStock = async (lens, delta) => {
    const next = Math.max(0, (lens.stock || 0) + delta);
    setLenses((p) => p.map((l) => l.id === lens.id ? { ...l, stock: next } : l));
    try { await lensesAPI.updateStock(lens.id, next); } catch { load(); }
  };

  const filtered = lenses.filter((l) => `${l.type} ${l.material}`.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Type ou matériau..." />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState icon="eye-outline" text="Aucun verre" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => { setEditing(item); setModal(true); }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.type} {item.material}</Text>
              <Text style={styles.sub}>{item.coating ? `${item.coating} · ` : ''}{item.price} MAD</Text>
            </View>
            <View style={styles.stockBox}>
              <TouchableOpacity onPress={() => changeStock(item, -1)} style={styles.stockBtn}><Ionicons name="remove" size={16} color={colors.text} /></TouchableOpacity>
              <Text style={[styles.stockNum, item.stock <= 2 && { color: colors.red }]}>{item.stock}</Text>
              <TouchableOpacity onPress={() => changeStock(item, 1)} style={styles.stockBtn}><Ionicons name="add" size={16} color={colors.text} /></TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
      <Fab onPress={() => { setEditing({}); setModal(true); }} />
      <LensModal visible={modal} lens={editing?.id ? editing : null} onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />
    </View>
  );
}

function LensModal({ visible, lens, onClose, onSaved }) {
  const isEdit = !!lens;
  const [form, setForm] = useState({ type: '', material: '', coating: '', treatment: '', price: '', stock: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (lens) setForm({ type: lens.type || '', material: lens.material || '', coating: lens.coating || '', treatment: lens.treatment || '', price: String(lens.price ?? ''), stock: String(lens.stock ?? '') });
    else setForm({ type: '', material: '', coating: '', treatment: '', price: '', stock: '' });
  }, [visible, lens]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = async () => {
    if (!form.type.trim()) { Alert.alert('Champ requis', 'Le type est requis'); return; }
    if (!form.material.trim()) { Alert.alert('Champ requis', 'Le matériau est requis'); return; }
    setSaving(true);
    const payload = {
      type: form.type, material: form.material, coating: form.coating, treatment: form.treatment,
      price: parseFloat(form.price) || 0, stock: parseInt(form.stock, 10) || 0,
    };
    try {
      if (isEdit) await lensesAPI.updateLens(lens.id, payload);
      else await lensesAPI.createLens(payload);
      onSaved();
    } catch (e) { Alert.alert('Erreur', e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };
  const remove = () => {
    Alert.alert('Supprimer', 'Supprimer ce verre ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await lensesAPI.deleteLens(lens.id); onSaved(); } catch (e) { Alert.alert('Erreur', e.response?.data?.message || 'Erreur'); }
      } },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.header}><Text style={m.title}>{isEdit ? 'Modifier le verre' : 'Nouveau verre'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></TouchableOpacity></View>
          <ScrollView>
            <Field label="Type *" value={form.type} onChangeText={(v) => set('type', v)} />
            <Field label="Matériau *" value={form.material} onChangeText={(v) => set('material', v)} />
            <Field label="Traitement" value={form.coating} onChangeText={(v) => set('coating', v)} />
            <Field label="Traitement spécial" value={form.treatment} onChangeText={(v) => set('treatment', v)} />
            <Field label="Prix (MAD)" value={form.price} onChangeText={(v) => set('price', v)} keyboardType="numeric" />
            <Field label="Stock" value={form.stock} onChangeText={(v) => set('stock', v)} keyboardType="numeric" />
            <PrimaryButton title={isEdit ? 'Enregistrer' : 'Créer'} onPress={save} loading={saving} />
            {isEdit && <PrimaryButton title="Supprimer" onPress={remove} color={colors.red} />}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 4, padding: 14, borderRadius: 12 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  stockBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  stockNum: { fontSize: 15, fontWeight: '700', color: colors.text, minWidth: 22, textAlign: 'center' },
});
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
});
