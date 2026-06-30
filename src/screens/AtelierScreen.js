import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { atelierAPI } from '../api/client';
import { Loader, EmptyState } from '../components/ui';
import { colors, radius, space, shadow, statusStyle } from '../theme';

const FLOW = ['pending', 'in-progress', 'ready', 'delivered'];
const LABEL = { pending: 'En attente', 'in-progress': 'En cours', ready: 'Prêt', delivered: 'Livré' };
const COLOR = { pending: '#f59e0b', 'in-progress': '#3b82f6', ready: '#22c55e', delivered: '#94A3B8' };

export function AtelierScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await atelierAPI.getOrders();
      const prod = (res.data || []).filter((o) => (o.orderType === 'montage' || o.orderType === 'sale_montage') && o.status !== 'cancelled');
      setOrders(prod);
    } catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const advance = async (order) => {
    const idx = FLOW.indexOf(order.status);
    if (idx < 0 || idx >= FLOW.length - 1) return;
    try { await atelierAPI.updateStatus(order.id, FLOW[idx + 1]); load(); } catch { alert('Erreur'); }
  };

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      {FLOW.map((st) => {
        const list = orders.filter((o) => o.status === st);
        return (
          <View key={st} style={styles.column}>
            <View style={[styles.colHeader, { borderLeftColor: COLOR[st] }]}>
              <View style={[styles.dot, { backgroundColor: COLOR[st] }]} />
              <Text style={styles.colTitle}>{LABEL[st]}</Text>
              <View style={[styles.countBadge, { backgroundColor: COLOR[st] + '22' }]}>
                <Text style={[styles.count, { color: COLOR[st] }]}>{list.length}</Text>
              </View>
            </View>
            {list.length === 0 ? <Text style={styles.muted}>—</Text> : list.map((o) => (
              <View key={o.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.num}>{o.orderNumber}</Text>
                  <Text style={styles.sub}>{o.client ? `${o.client.firstName} ${o.client.lastName}` : 'Passage'}</Text>
                </View>
                {st !== 'delivered' && (
                  <TouchableOpacity style={[styles.advBtn, { backgroundColor: COLOR[FLOW[FLOW.indexOf(st) + 1]] }]} onPress={() => advance(o)}>
                    <Text style={styles.advText}>→ {LABEL[FLOW[FLOW.indexOf(st) + 1]]}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        );
      })}
      {orders.length === 0 && <EmptyState icon="construct-outline" text="Aucune production en cours" />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  column: { marginHorizontal: space.md, marginTop: space.md },
  colHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
    paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: colors.teal,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  colTitle: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  count: { fontSize: 12, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 13, borderRadius: radius.md, marginBottom: 6, ...shadow.card },
  num: { fontWeight: '700', color: colors.text, fontSize: 14 },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  advBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.sm },
  advText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  muted: { color: colors.mutedLight, marginBottom: 8, fontSize: 13 },
});
