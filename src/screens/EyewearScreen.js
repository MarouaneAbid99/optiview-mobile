import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { eyewearAPI } from '../api/client';
import { SearchBar, Fab, EmptyState, Loader, Field, PrimaryButton } from '../components/ui';
import { colors } from '../theme';

export function EyewearScreen() {
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // frame object or {} for new
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    try { const res = await eyewearAPI.getFrames(); setFrames(res.data || []); }
    catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const changeStock = async (frame, delta) => {
    const next = Math.max(0, (frame.stock || 0) + delta);
    setFrames((p) => p.map((f) => f.id === frame.id ? { ...f, stock: next } : f));
    try { await eyewearAPI.updateStock(frame.id, next); } catch { load(); }
  };

  const filtered = frames.filter((f) => `${f.brand} ${f.model}`.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Marque ou modèle..." />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState icon="glasses-outline" text="Aucune monture" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => { setEditing(item); setModal(true); }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.brand} {item.model}</Text>
              <Text style={styles.sub}>{item.category}{item.color ? ` · ${item.color}` : ''} · {item.price} MAD</Text>
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
      <FrameModal visible={modal} frame={editing?.id ? editing : null} onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />
    </View>
  );
}

function FrameModal({ visible, frame, onClose, onSaved }) {
  const isEdit = !!frame;
  const [form, setForm] = useState({ brand: '', model: '', category: '', color: '', price: '', stock: '' });
  const [saving, setSaving] = useState(false);

  // Re-init the form whenever the modal opens (with or without a frame)
  useEffect(() => {
    if (!visible) return;
    if (frame) setForm({ brand: frame.brand || '', model: frame.model || '', category: frame.category || '', color: frame.color || '', price: String(frame.price ?? ''), stock: String(frame.stock ?? '') });
    else setForm({ brand: '', model: '', category: '', color: '', price: '', stock: '' });
  }, [visible, frame]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = async () => {
    if (!form.brand.trim()) { Alert.alert('Champ requis', 'La marque est requise'); return; }
    if (!form.model.trim()) { Alert.alert('Champ requis', 'Le modèle est requis'); return; }
    if (!form.category.trim()) { Alert.alert('Champ requis', 'La catégorie est requise'); return; }
    setSaving(true);
    const payload = {
      brand: form.brand, model: form.model, category: form.category, color: form.color,
      price: parseFloat(form.price) || 0, stock: parseInt(form.stock, 10) || 0,
    };
    try {
      if (isEdit) await eyewearAPI.updateFrame(frame.id, payload);
      else await eyewearAPI.createFrame(payload);
      onSaved();
    } catch (e) { Alert.alert('Erreur', e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };
  const remove = () => {
    Alert.alert('Supprimer', 'Supprimer cette monture ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await eyewearAPI.deleteFrame(frame.id); onSaved(); } catch (e) { Alert.alert('Erreur', e.response?.data?.message || 'Erreur'); }
      } },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.header}><Text style={m.title}>{isEdit ? 'Modifier la monture' : 'Nouvelle monture'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></TouchableOpacity></View>
          <ScrollView>
            <Field label="Marque *" value={form.brand} onChangeText={(v) => set('brand', v)} />
            <Field label="Modèle *" value={form.model} onChangeText={(v) => set('model', v)} />
            <Field label="Catégorie *" value={form.category} onChangeText={(v) => set('category', v)} />
            <Field label="Couleur" value={form.color} onChangeText={(v) => set('color', v)} />
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
