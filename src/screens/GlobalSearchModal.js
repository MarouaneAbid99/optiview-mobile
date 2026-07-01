import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { clientsAPI, eyewearAPI, lensesAPI, atelierAPI } from '../api/client';
import { colors, radius, shadow } from '../theme';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const SECTIONS = [
  { key: 'clients', label: 'Clients', icon: 'people-outline', color: colors.blue },
  { key: 'frames',  label: 'Montures', icon: 'glasses-outline', color: colors.purple },
  { key: 'lenses',  label: 'Verres', icon: 'eye-outline', color: colors.orange },
  { key: 'orders',  label: 'Commandes', icon: 'receipt-outline', color: colors.pink },
];

function itemLabel(key, item) {
  if (key === 'clients') return `${item.firstName} ${item.lastName}`;
  if (key === 'frames')  return `${item.brand} ${item.model}`;
  if (key === 'lenses')  return `${item.type} ${item.material}`;
  if (key === 'orders')  return item.orderNumber || `Commande #${item.id?.slice(-6)}`;
  return '';
}
function itemSub(key, item) {
  if (key === 'clients') return item.phone || '';
  if (key === 'frames')  return `${item.category || ''} · ${item.price} MAD · stock ${item.stock}`;
  if (key === 'lenses')  return `${item.coating || ''} · ${item.price} MAD · stock ${item.stock}`;
  if (key === 'orders')  return item.client ? `${item.client.firstName} ${item.client.lastName}` : 'Passage';
  return '';
}

export function GlobalSearchModal({ visible, onClose, onNavigate }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounced = useDebounce(query, 300);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults({}); return; }
    setLoading(true);
    const lower = q.toLowerCase();
    try {
      const [c, f, l, o] = await Promise.all([
        clientsAPI.getClients().catch(() => ({ data: [] })),
        eyewearAPI.getFrames().catch(() => ({ data: [] })),
        lensesAPI.getLenses().catch(() => ({ data: [] })),
        atelierAPI.getOrders().catch(() => ({ data: [] })),
      ]);
      setResults({
        clients: (c.data || []).filter((i) => `${i.firstName} ${i.lastName} ${i.phone}`.toLowerCase().includes(lower)),
        frames:  (f.data || []).filter((i) => `${i.brand} ${i.model} ${i.category}`.toLowerCase().includes(lower)),
        lenses:  (l.data || []).filter((i) => `${i.type} ${i.material} ${i.coating}`.toLowerCase().includes(lower)),
        orders:  (o.data || []).filter((i) => `${i.orderNumber} ${i.client?.firstName} ${i.client?.lastName}`.toLowerCase().includes(lower)),
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { search(debounced); }, [debounced, search]);

  useEffect(() => {
    if (visible) { setQuery(''); setResults({}); }
  }, [visible]);

  const handleSelect = (key, item) => {
    onClose();
    onNavigate(key, item);
  };

  const flat = SECTIONS.flatMap((sec) => {
    const items = results[sec.key] || [];
    if (!items.length) return [];
    return [
      { type: 'header', ...sec },
      ...items.map((item) => ({ type: 'row', sectionKey: sec.key, sectionColor: sec.color, sectionIcon: sec.icon, item })),
    ];
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.container}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              ref={inputRef}
              autoFocus
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Clients, montures, verres, commandes..."
              placeholderTextColor={colors.mutedLight}
              returnKeyType="search"
            />
            {loading && <ActivityIndicator size="small" color={colors.teal} />}
            {!loading && query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Fermer</Text>
            </TouchableOpacity>
          </View>

          {flat.length === 0 && debounced.length > 0 && !loading ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={32} color={colors.mutedLight} />
              <Text style={styles.emptyText}>Aucun résultat pour « {debounced} »</Text>
            </View>
          ) : (
            <FlatList
              data={flat}
              keyExtractor={(item, i) => String(i)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                if (item.type === 'header') {
                  return (
                    <View style={styles.sectionHeader}>
                      <Ionicons name={item.icon} size={13} color={item.color} />
                      <Text style={[styles.sectionLabel, { color: item.color }]}>{item.label}</Text>
                    </View>
                  );
                }
                return (
                  <TouchableOpacity style={styles.row} onPress={() => handleSelect(item.sectionKey, item.item)} activeOpacity={0.7}>
                    <View style={[styles.rowIcon, { backgroundColor: item.sectionColor + '18' }]}>
                      <Ionicons name={item.sectionIcon} size={16} color={item.sectionColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowLabel}>{itemLabel(item.sectionKey, item.item)}</Text>
                      {!!itemSub(item.sectionKey, item.item) && (
                        <Text style={styles.rowSub}>{itemSub(item.sectionKey, item.item)}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.mutedLight} />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(11,27,58,0.6)' },
  container: { flex: 1, backgroundColor: colors.bg, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', margin: 12, marginTop: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  input: { flex: 1, fontSize: 15, color: colors.text },
  cancelBtn: { paddingHorizontal: 4 },
  cancelText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 4,
    borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.border,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: colors.muted, fontSize: 14 },
});
