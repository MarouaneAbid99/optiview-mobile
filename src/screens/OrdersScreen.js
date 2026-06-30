import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Linking, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { atelierAPI } from '../api/client';
import { SearchBar, Fab, EmptyState, Loader } from '../components/ui';
import { colors, radius, space, shadow, statusStyle } from '../theme';
import { OrderFormModal } from './orders/OrderFormModal';

const STATUSES = ['pending', 'in-progress', 'ready', 'delivered', 'cancelled'];
const STATUS_COLOR = { pending: '#f59e0b', 'in-progress': '#3b82f6', ready: '#22c55e', delivered: '#6b7280', cancelled: '#ef4444' };
const STATUS_LABEL = { pending: 'En attente', 'in-progress': 'En cours', ready: 'Prêt', delivered: 'Livré', cancelled: 'Annulé' };
const SS = statusStyle;
const TYPE_LABEL = { sale: 'Vente', montage: 'Montage', sale_montage: 'Vente + Montage' };

export function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try { const res = await atelierAPI.getOrders(); setOrders(res.data || []); }
    catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const changeStatus = async (order, status) => {
    try { await atelierAPI.updateStatus(order.id, status); load(); }
    catch (e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const whatsapp = (order) => {
    if (!order.client?.phone) { alert('Pas de numéro'); return; }
    let d = order.client.phone.replace(/\D/g, '');
    if (d.startsWith('0')) d = '212' + d.slice(1);
    const msg = `Bonjour ${order.client.firstName}, votre commande ${order.orderNumber} est prête.`;
    Linking.openURL(`https://wa.me/${d}?text=${encodeURIComponent(msg)}`);
  };

  const remove = (order) => Alert.alert('Supprimer', `Supprimer ${order.orderNumber} ?`, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Supprimer', style: 'destructive', onPress: async () => { try { await atelierAPI.deleteOrder(order.id); load(); } catch { alert('Erreur'); } } },
  ]);

  const filtered = orders.filter((o) => {
    const matchSearch = o.orderNumber?.toLowerCase().includes(search.toLowerCase())
      || `${o.client?.firstName || ''} ${o.client?.lastName || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="N° ou client..." />
      <FlatList
        horizontal showsHorizontalScrollIndicator={false}
        data={['all', ...STATUSES]}
        keyExtractor={(s) => s}
        style={{ maxHeight: 44 }}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8, alignItems: 'center' }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setStatusFilter(item)}
            style={[styles.chip, statusFilter === item && { backgroundColor: colors.navy, borderColor: colors.navy }]}>
            <Text style={[styles.chipText, statusFilter === item && { color: '#fff' }]}>
              {item === 'all' ? 'Tous' : STATUS_LABEL[item]}
            </Text>
          </TouchableOpacity>
        )}
      />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 90, paddingTop: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState icon="receipt-outline" text="Aucune commande" />}
        renderItem={({ item }) => {
          const open = expanded === item.id;
          return (
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardHead} onPress={() => setExpanded(open ? null : item.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNum}>{item.orderNumber}</Text>
                  <Text style={styles.sub}>{item.client ? `${item.client.firstName} ${item.client.lastName}` : 'Passage'} · {TYPE_LABEL[item.orderType] || item.orderType}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.price}>{item.totalPrice} MAD</Text>
                  <View style={[styles.badge, { backgroundColor: (SS[item.status] || SS.pending).bg }]}>
                    <Text style={[styles.badgeText, { color: (SS[item.status] || SS.pending).text }]}>{STATUS_LABEL[item.status]}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {open && (
                <View style={styles.detail}>
                  {item.frame && <Text style={styles.line}>Monture: {item.frame.brand} {item.frame.model}</Text>}
                  {(item.items || []).map((it) => <Text key={it.id} style={styles.line}>Verre: {it.lens?.type} {it.lens?.material} ×{it.quantity}</Text>)}
                  {!!item.laborPrice && <Text style={styles.line}>Montage: {item.laborPrice} MAD</Text>}

                  <Text style={styles.detailLabel}>Statut</Text>
                  <View style={styles.statusRow}>
                    {STATUSES.map((st) => {
                      const active = item.status === st;
                      const ss = SS[st] || SS.pending;
                      return (
                        <TouchableOpacity key={st} onPress={() => changeStatus(item, st)}
                          style={[styles.statusPill, { backgroundColor: active ? ss.bg : colors.bg, borderColor: active ? ss.dot : colors.border }]}>
                          <View style={[styles.statusDot, { backgroundColor: ss.dot }]} />
                          <Text style={[styles.statusPillText, { color: active ? ss.text : colors.muted }]}>{STATUS_LABEL[st]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity style={[styles.actBtn, { borderColor: colors.border }]} onPress={() => { setEditing(item); setModal(true); }}>
                      <Ionicons name="pencil" size={14} color={colors.text} /><Text style={styles.actText}>Modifier</Text>
                    </TouchableOpacity>
                    {!!item.client?.phone && (
                      <TouchableOpacity style={[styles.actBtn, { backgroundColor: '#25D366', borderColor: '#25D366' }]} onPress={() => whatsapp(item)}>
                        <Ionicons name="logo-whatsapp" size={14} color="#fff" /><Text style={[styles.actText, { color: '#fff' }]}>WhatsApp</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.actBtn, { borderColor: '#fecaca' }]} onPress={() => remove(item)}>
                      <Ionicons name="trash" size={14} color={colors.red} /><Text style={[styles.actText, { color: colors.red }]}>Suppr.</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
      <Fab onPress={() => { setEditing(null); setModal(true); }} />
      <OrderFormModal visible={modal} order={editing} onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  card: { backgroundColor: '#fff', marginHorizontal: space.md, marginVertical: 4, borderRadius: radius.md, overflow: 'hidden', ...shadow.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  orderNum: { fontSize: 15, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  price: { fontSize: 15, fontWeight: '700', color: colors.text },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.full, marginTop: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  detail: { padding: 14, borderTopWidth: 1, borderTopColor: colors.bg, gap: 4 },
  line: { color: colors.text, fontSize: 14 },
  detailLabel: { fontSize: 11, fontWeight: '600', color: colors.muted, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1 },
  actText: { fontSize: 12, color: colors.text, fontWeight: '600' },
});
