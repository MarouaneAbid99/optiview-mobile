import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { clientsAPI, eyewearAPI, lensesAPI, atelierAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/ui';
import { colors } from '../theme';
import { OrderFormModal } from './orders/OrderFormModal';
import { SettingsModal } from './SettingsModal';

export function DeskScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ clients: 0, frames: 0, lenses: 0, activeOrders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [settings, setSettings] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, f, l, o] = await Promise.all([
        clientsAPI.getClients().catch(() => ({ data: [] })),
        eyewearAPI.getFrames().catch(() => ({ data: [] })),
        lensesAPI.getLenses().catch(() => ({ data: [] })),
        atelierAPI.getOrders().catch(() => ({ data: [] })),
      ]);
      const orders = o.data || [];
      const active = orders.filter((x) => !['delivered', 'cancelled'].includes(x.status)).length;
      const revenue = orders.filter((x) => x.status === 'delivered').reduce((sum, x) => sum + (x.totalPrice || 0), 0);
      setStats({ clients: (c.data || []).length, frames: (f.data || []).length, lenses: (l.data || []).length, activeOrders: active, revenue });
    } catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loader />;

  const Card = ({ icon, label, value, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.iconCircle, { backgroundColor: color + '22' }]}><Ionicons name={icon} size={22} color={color} /></View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={styles.greeting}>
        <View>
          <Text style={styles.hello}>Bonjour, {user?.name}</Text>
          <Text style={styles.shop}>{user?.shop?.name || ''}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {user?.role === 'OPTICIAN' && (
            <TouchableOpacity onPress={() => setSettings(true)}>
              <Ionicons name="settings-outline" size={24} color={colors.muted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={logout}><Ionicons name="log-out-outline" size={24} color={colors.red} /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.grid}>
        <Card icon="people" label="Clients" value={stats.clients} color={colors.green} />
        <Card icon="glasses" label="Montures" value={stats.frames} color={colors.blue} />
        <Card icon="eye" label="Verres" value={stats.lenses} color={colors.purple} />
        <Card icon="construct" label="Cmd actives" value={stats.activeOrders} color={colors.orange} />
        <Card icon="cash" label="CA livré (MAD)" value={Math.round(stats.revenue)} color={colors.teal} />
      </View>

      <TouchableOpacity style={styles.newOrderBtn} onPress={() => setModal(true)}>
        <Ionicons name="add-circle" size={22} color="#fff" />
        <Text style={styles.newOrderText}>Nouvelle commande</Text>
      </TouchableOpacity>

      <OrderFormModal visible={modal} order={null} onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />
      <SettingsModal visible={settings} onClose={() => setSettings(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  hello: { fontSize: 20, fontWeight: '700', color: colors.text },
  shop: { color: colors.muted, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, gap: 8 },
  statCard: { width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 16, margin: '1.5%', alignItems: 'flex-start' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { color: colors.muted, fontSize: 13, marginTop: 2 },
  newOrderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, margin: 16, paddingVertical: 14, borderRadius: 12 },
  newOrderText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
