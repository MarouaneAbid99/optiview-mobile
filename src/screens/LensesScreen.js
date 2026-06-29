import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { lensesAPI } from '../api/client';
import { SearchBar, Fab, EmptyState, Loader, Field, PrimaryButton } from '../components/ui';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { colors } from '../theme';

export function LensesScreen() {
  const [lenses, setLenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanPrefill, setScanPrefill] = useState(null);

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

  const onScan = (code) => {
    setScannerOpen(false);
    const found = lenses.find((l) => l.barcode === code);
    if (found) { setEditing(found); setScanPrefill(null); setModal(true); }
    else { setEditing({}); setScanPrefill(code); setModal(true); }
  };

  const filtered = lenses.filter((l) => `${l.type} ${l.material}`.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Type ou matériau..." />
        </View>
        <TouchableOpacity style={styles.scanBtn} onPress={() => setScannerOpen(true)}>
          <Ionicons name="barcode-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState icon="eye-outline" text="Aucun verre" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => { setEditing(item); setScanPrefill(null); setModal(true); }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.type} {item.material}</Text>
              <Text style={styles.sub}>{item.coating ? `${item.coating} · ` : ''}{item.price} MAD</Text>
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
      <LensModal
        visible={modal}
        lens={editing?.id ? editing : null}
        prefillBarcode={scanPrefill}
        onClose={() => { setModal(false); setScanPrefill(null); }}
        onSaved={() => { setModal(false); setScanPrefill(null); load(); }}
      />
      <BarcodeScanner visible={scannerOpen} onClose={() => setScannerOpen(false)} onScanned={onScan} />
    </View>
  );
}

function LensModal({ visible, lens, prefillBarcode, onClose, onSaved }) {
  const isEdit = !!lens;
  const [form, setForm] = useState({ type: '', material: '', coating: '', treatment: '', price: '', stock: '', barcode: '' });
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (lens) {
      setForm({ type: lens.type || '', material: lens.material || '', coating: lens.coating || '', treatment: lens.treatment || '', price: String(lens.price ?? ''), stock: String(lens.stock ?? ''), barcode: lens.barcode || '' });
    } else {
      setForm({ type: '', material: '', coating: '', treatment: '', price: '', stock: '', barcode: prefillBarcode || '' });
    }
  }, [visible, lens, prefillBarcode]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.type.trim()) { Alert.alert('Champ requis', 'Le type est requis'); return; }
    if (!form.material.trim()) { Alert.alert('Champ requis', 'Le matériau est requis'); return; }
    setSaving(true);
    const payload = {
      type: form.type, material: form.material, coating: form.coating, treatment: form.treatment,
      price: parseFloat(form.price) || 0, stock: parseInt(form.stock, 10) || 0,
      barcode: form.barcode || undefined,
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
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.header}>
              <Text style={m.title}>{isEdit ? 'Modifier le verre' : 'Nouveau verre'}</Text>
              <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></TouchableOpacity>
            </View>
            <ScrollView>
              <Field label="Type *" value={form.type} onChangeText={(v) => set('type', v)} />
              <Field label="Matériau *" value={form.material} onChangeText={(v) => set('material', v)} />
              <Field label="Traitement" value={form.coating} onChangeText={(v) => set('coating', v)} />
              <Field label="Traitement spécial" value={form.treatment} onChangeText={(v) => set('treatment', v)} />
              <Field label="Prix (MAD)" value={form.price} onChangeText={(v) => set('price', v)} keyboardType="numeric" />
              <Field label="Stock" value={form.stock} onChangeText={(v) => set('stock', v)} keyboardType="numeric" />
              <View style={m.barcodeRow}>
                <View style={{ flex: 1 }}>
                  <Field label="Code-barres" value={form.barcode} onChangeText={(v) => set('barcode', v)} />
                </View>
                <TouchableOpacity style={m.scanIconBtn} onPress={() => setScannerOpen(true)}>
                  <Ionicons name="barcode-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <PrimaryButton title={isEdit ? 'Enregistrer' : 'Créer'} onPress={save} loading={saving} />
              {isEdit && <PrimaryButton title="Supprimer" onPress={remove} color={colors.red} />}
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
  scanBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 4, padding: 14, borderRadius: 12 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  barcode: { fontSize: 11, color: colors.muted, marginTop: 2, fontFamily: 'monospace' },
  stockBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  stockNum: { fontSize: 15, fontWeight: '700', color: colors.text, minWidth: 22, textAlign: 'center' },
});
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  barcodeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  scanIconBtn: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
});
