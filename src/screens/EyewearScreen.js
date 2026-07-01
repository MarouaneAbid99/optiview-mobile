import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { eyewearAPI } from '../api/client';
import { SearchBar, Fab, EmptyState, Loader, Field, PrimaryButton, ButtonRow } from '../components/ui';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { useToast } from '../components/Toast';
import { colors, radius, space, shadow } from '../theme';

export function EyewearScreen() {
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanPrefill, setScanPrefill] = useState(null);

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

  const onScan = (code) => {
    setScannerOpen(false);
    const found = frames.find((f) => f.barcode === code);
    if (found) { setEditing(found); setScanPrefill(null); setModal(true); }
    else { setEditing({}); setScanPrefill(code); setModal(true); }
  };

  const filtered = frames.filter((f) => `${f.brand} ${f.model}`.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Marque ou modèle..." />
        </View>
        <TouchableOpacity style={styles.scanBtn} onPress={() => setScannerOpen(true)}>
          <Ionicons name="barcode-outline" size={22} color={colors.teal} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState icon="glasses-outline" title="Aucune monture" text="Ajoutez votre premier article en stock" actionLabel="Ajouter" onAction={() => { setEditing({}); setScanPrefill(null); setModal(true); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => { setEditing(item); setScanPrefill(null); setModal(true); }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.brand} {item.model}</Text>
              <Text style={styles.sub}>{item.category}{item.color ? ` · ${item.color}` : ''} · {item.price} MAD</Text>
              {!!item.barcode && <Text style={styles.barcode}>{item.barcode}</Text>}
            </View>
            <View style={styles.stockBox}>
              <TouchableOpacity onPress={() => changeStock(item, -1)} style={styles.stockBtn}><Ionicons name="remove" size={16} color={colors.text} /></TouchableOpacity>
              <Text style={[styles.stockNum, item.stock <= 2 && { color: colors.red }]}>{item.stock}</Text>
              <TouchableOpacity onPress={() => changeStock(item, 1)} style={styles.stockBtn}><Ionicons name="add" size={16} color={colors.text} /></TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
      <Fab onPress={() => { setEditing({}); setScanPrefill(null); setModal(true); }} />
      <FrameModal
        visible={modal}
        frame={editing?.id ? editing : null}
        prefillBarcode={scanPrefill}
        onClose={() => { setModal(false); setScanPrefill(null); }}
        onSaved={() => { setModal(false); setScanPrefill(null); load(); }}
      />
      <BarcodeScanner visible={scannerOpen} onClose={() => setScannerOpen(false)} onScanned={onScan} />
    </View>
  );
}

function FrameModal({ visible, frame, prefillBarcode, onClose, onSaved }) {
  const isEdit = !!frame;
  const [form, setForm] = useState({ brand: '', model: '', category: '', color: '', price: '', stock: '', barcode: '' });
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (frame) {
      setForm({ brand: frame.brand || '', model: frame.model || '', category: frame.category || '', color: frame.color || '', price: String(frame.price ?? ''), stock: String(frame.stock ?? ''), barcode: frame.barcode || '' });
    } else {
      setForm({ brand: '', model: '', category: '', color: '', price: '', stock: '', barcode: prefillBarcode || '' });
    }
  }, [visible, frame, prefillBarcode]);

  const { showSuccess, showError } = useToast();
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: null }));
  };

  const save = async () => {
    const e = {};
    if (!form.brand.trim()) e.brand = 'La marque est requise';
    if (!form.model.trim()) e.model = 'Le modèle est requis';
    if (!form.category.trim()) e.category = 'La catégorie est requise';
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      brand: form.brand, model: form.model, category: form.category, color: form.color,
      price: parseFloat(form.price) || 0, stock: parseInt(form.stock, 10) || 0,
      barcode: form.barcode || undefined,
    };
    try {
      if (isEdit) await eyewearAPI.updateFrame(frame.id, payload);
      else await eyewearAPI.createFrame(payload);
      showSuccess(isEdit ? 'Monture mise à jour' : 'Monture créée');
      onSaved();
    } catch (e) { showError(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const remove = () => {
    Alert.alert('Supprimer', 'Supprimer cette monture ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await eyewearAPI.deleteFrame(frame.id); showSuccess('Monture supprimée'); onSaved(); }
        catch (e) { showError(e.response?.data?.message || 'Erreur'); }
      } },
    ]);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.grabber} />
            <View style={m.header}>
              <Text style={m.title}>{isEdit ? 'Modifier la monture' : 'Nouvelle monture'}</Text>
              <TouchableOpacity onPress={onClose} style={m.closeBtn}><Ionicons name="close" size={20} color={colors.muted} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Field label="Marque *" value={form.brand} onChangeText={(v) => set('brand', v)} error={errors.brand} />
              <Field label="Modèle *" value={form.model} onChangeText={(v) => set('model', v)} error={errors.model} />
              <Field label="Catégorie *" value={form.category} onChangeText={(v) => set('category', v)} error={errors.category} />
              <Field label="Couleur" value={form.color} onChangeText={(v) => set('color', v)} />
              <Field label="Prix (MAD)" value={form.price} onChangeText={(v) => set('price', v)} keyboardType="numeric" />
              <Field label="Stock" value={form.stock} onChangeText={(v) => set('stock', v)} keyboardType="numeric" />
              <View style={m.barcodeRow}>
                <View style={{ flex: 1 }}>
                  <Field label="Code-barres" value={form.barcode} onChangeText={(v) => set('barcode', v)} />
                </View>
                <TouchableOpacity style={m.scanIconBtn} onPress={() => setScannerOpen(true)}>
                  <Ionicons name="barcode-outline" size={22} color={colors.teal} />
                </TouchableOpacity>
              </View>
              <ButtonRow
                cancelLabel="Annuler" onCancel={onClose}
                actionLabel={isEdit ? 'Enregistrer' : 'Créer'} onAction={save}
                loading={saving} actionIcon={isEdit ? 'checkmark' : 'add'}
              />
              {isEdit && <PrimaryButton title="Supprimer" onPress={remove} color={colors.red} icon="trash-outline" />}
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <BarcodeScanner visible={scannerOpen} onClose={() => setScannerOpen(false)} onScanned={(code) => { set('barcode', code); setScannerOpen(false); }} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  scanBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 16, borderWidth: 0.5, borderColor: colors.border, ...shadow.card },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 3 },
  barcode: { fontSize: 11, color: colors.mutedLight, marginTop: 2, fontFamily: 'monospace' },
  stockBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockBtn: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  stockNum: { fontSize: 15, fontWeight: '700', color: colors.text, minWidth: 24, textAlign: 'center' },
});
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(11,27,58,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.lg, maxHeight: '90%', ...shadow.header },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  barcodeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  scanIconBtn: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tealFaint, borderRadius: radius.md, marginBottom: 12 },
});
