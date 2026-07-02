import { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { lensesAPI } from '../api/client';
import { uploadToCloudinary } from '../api/upload';
import { SearchBar, Fab, EmptyState, Field, PrimaryButton, ButtonRow } from '../components/ui';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { useToast } from '../components/Toast';
import { SkeletonList } from '../components/Skeleton';
import { FilterSheet } from '../components/FilterSheet';
import { colors, radius, space, shadow } from '../theme';

export function LensesScreen() {
  const [lenses, setLenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanPrefill, setScanPrefill] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ stock: 'all', sort: 'name' });

  const filterGroups = [
    { key: 'stock', label: 'Stock', options: [
      { value: 'all', label: 'Tous' }, { value: 'low', label: 'Faible (≤2)' }, { value: 'in', label: 'En stock' }, { value: 'out', label: 'Rupture' },
    ]},
    { key: 'sort', label: 'Trier par', options: [
      { value: 'name', label: 'Type' }, { value: 'price_asc', label: 'Prix ↑' }, { value: 'price_desc', label: 'Prix ↓' }, { value: 'stock_desc', label: 'Stock ↓' },
    ]},
  ];

  const applyFilters = (list) => {
    let r = [...list];
    if (filters.stock === 'low') r = r.filter((l) => l.stock <= 2 && l.stock > 0);
    else if (filters.stock === 'in') r = r.filter((l) => l.stock > 0);
    else if (filters.stock === 'out') r = r.filter((l) => l.stock === 0);
    if (filters.sort === 'name') r.sort((a, b) => `${a.type}`.localeCompare(`${b.type}`));
    else if (filters.sort === 'price_asc') r.sort((a, b) => a.price - b.price);
    else if (filters.sort === 'price_desc') r.sort((a, b) => b.price - a.price);
    else if (filters.sort === 'stock_desc') r.sort((a, b) => b.stock - a.stock);
    return r;
  };

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

  const filtered = applyFilters(lenses.filter((l) => `${l.type} ${l.material}`.toLowerCase().includes(search.toLowerCase())));
  const filterActive = filters.stock !== 'all';

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg }}><SkeletonList /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Type ou matériau..." />
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setFilterOpen(true)}>
          <Ionicons name="options-outline" size={20} color={colors.navy} />
          {filterActive && <View style={styles.filterDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { marginRight: 16 }]} onPress={() => setScannerOpen(true)}>
          <Ionicons name="barcode-outline" size={20} color={colors.navy} />
        </TouchableOpacity>
      </View>
      <FilterSheet visible={filterOpen} onClose={() => setFilterOpen(false)} groups={filterGroups} value={filters}
        onChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))} onReset={() => setFilters({ stock: 'all', sort: 'name' })} />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState icon="eye-outline" title="Aucun verre" text="Ajoutez votre premier verre en stock" actionLabel="Ajouter" onAction={() => { setEditing({}); setScanPrefill(null); setModal(true); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => { setEditing(item); setScanPrefill(null); setModal(true); }}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
            ) : (
              <View style={styles.thumbChip}><Ionicons name="eye-outline" size={22} color={colors.navy} /></View>
            )}
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
  const [form, setForm] = useState({ type: '', material: '', coating: '', treatment: '', price: '', stock: '', barcode: '', imageUrl: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (!visible) return;
    if (lens) {
      setForm({ type: lens.type || '', material: lens.material || '', coating: lens.coating || '', treatment: lens.treatment || '', price: String(lens.price ?? ''), stock: String(lens.stock ?? ''), barcode: lens.barcode || '', imageUrl: lens.imageUrl || '' });
    } else {
      setForm({ type: '', material: '', coating: '', treatment: '', price: '', stock: '', barcode: prefillBarcode || '', imageUrl: '' });
    }
    setErrors({});
  }, [visible, lens, prefillBarcode]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: null }));
  };

  const pickPhoto = async (fromCamera) => {
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
      set('imageUrl', url);
    } catch (e) { showError("Échec de l'envoi de la photo"); }
    finally { setUploading(false); }
  };

  const choosePhotoSource = () => {
    Alert.alert('Photo du verre', 'Choisir la source', [
      { text: 'Caméra', onPress: () => pickPhoto(true) },
      { text: 'Galerie', onPress: () => pickPhoto(false) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const save = async () => {
    const e = {};
    if (!form.type.trim()) e.type = 'Le type est requis';
    if (!form.material.trim()) e.material = 'Le matériau est requis';
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      type: form.type, material: form.material, coating: form.coating, treatment: form.treatment,
      price: parseFloat(form.price) || 0, stock: parseInt(form.stock, 10) || 0,
      barcode: form.barcode || undefined,
      imageUrl: form.imageUrl || undefined,
    };
    try {
      if (isEdit) await lensesAPI.updateLens(lens.id, payload);
      else await lensesAPI.createLens(payload);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showSuccess(isEdit ? 'Verre mis à jour' : 'Verre créé');
      onSaved();
    } catch (e) { showError(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const remove = () => {
    Alert.alert('Supprimer', 'Supprimer ce verre ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await lensesAPI.deleteLens(lens.id); showSuccess('Verre supprimé'); onSaved(); }
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
              <Text style={m.title}>{isEdit ? 'Modifier le verre' : 'Nouveau verre'}</Text>
              <TouchableOpacity onPress={onClose} style={m.closeBtn}><Ionicons name="close" size={20} color={colors.muted} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={m.photoRow}>
                <TouchableOpacity onPress={choosePhotoSource} disabled={uploading}>
                  {form.imageUrl ? (
                    <Image source={{ uri: form.imageUrl }} style={m.photoThumb} />
                  ) : (
                    <View style={m.photoPlaceholder}>
                      {uploading ? <Text style={m.photoPlaceholderText}>...</Text> : <Ionicons name="camera-outline" size={26} color={colors.muted} />}
                    </View>
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <TouchableOpacity onPress={choosePhotoSource} disabled={uploading}>
                    <Text style={m.photoAction}>{form.imageUrl ? 'Changer la photo' : 'Ajouter une photo'}</Text>
                  </TouchableOpacity>
                  {!!form.imageUrl && (
                    <TouchableOpacity onPress={() => set('imageUrl', '')} disabled={uploading}>
                      <Text style={[m.photoAction, { color: colors.red, marginTop: 6 }]}>Retirer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Field label="Type *" value={form.type} onChangeText={(v) => set('type', v)} error={errors.type} />
              <Field label="Matériau *" value={form.material} onChangeText={(v) => set('material', v)} error={errors.material} />
              <Field label="Traitement" value={form.coating} onChangeText={(v) => set('coating', v)} />
              <Field label="Traitement spécial" value={form.treatment} onChangeText={(v) => set('treatment', v)} />
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
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  iconBtn: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  filterDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 16, borderWidth: 0.5, borderColor: colors.border, ...shadow.card },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 3 },
  barcode: { fontSize: 11, color: colors.mutedLight, marginTop: 2, fontFamily: 'monospace' },
  stockBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockBtn: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  stockNum: { fontSize: 15, fontWeight: '700', color: colors.text, minWidth: 24, textAlign: 'center' },
  thumb: { width: 48, height: 48, borderRadius: radius.sm, marginRight: 12, backgroundColor: colors.bg },
  thumbChip: { width: 48, height: 48, borderRadius: radius.sm, marginRight: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
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
  photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  photoThumb: { width: 80, height: 80, borderRadius: radius.md, backgroundColor: colors.bg },
  photoPlaceholder: { width: 80, height: 80, borderRadius: radius.md, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  photoPlaceholderText: { fontSize: 12, color: colors.muted },
  photoAction: { fontSize: 14, fontWeight: '600', color: colors.teal },
});
