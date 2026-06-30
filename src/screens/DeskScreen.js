import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { clientsAPI, eyewearAPI, lensesAPI, atelierAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { colors, radius, space, shadow, moduleColor } from '../theme';
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

  const STAT_CARDS = [
    { key: 'clients',     icon: 'people',    label: 'Clients',       value: stats.clients,               mc: moduleColor.clients },
    { key: 'frames',      icon: 'glasses',   label: 'Montures',      value: stats.frames,                mc: moduleColor.eyewear },
    { key: 'lenses',      icon: 'eye',       label: 'Verres',        value: stats.lenses,                mc: moduleColor.lenses },
    { key: 'orders',      icon: 'construct', label: 'Cmd actives',   value: stats.activeOrders,          mc: moduleColor.atelier },
    { key: 'revenue',     icon: 'cash',      label: 'CA livré (MAD)',value: Math.round(stats.revenue),   mc: moduleColor.orders },
  ];

  const rightActions = [
    ...(user?.role === 'OPTICIAN' ? [{ name: 'settings', onPress: () => setSettings(true) }] : []),
    { name: 'log-out', onPress: logout, color: 'rgba(239,68,68,0.9)' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader
        title={`Bonjour, ${user?.name || ''}`}
        subtitle={user?.shop?.name || ''}
        rightActions={rightActions}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.teal} />}
      >
        <View style={styles.grid}>
          {STAT_CARDS.map(({ key, icon, label, value, mc }) => (
            <View key={key} style={styles.statCard}>
              <View style={[styles.iconChip, { backgroundColor: mc.bg }]}>
                <Ionicons name={icon} size={20} color={mc.fg} />
              </View>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.newOrderBtn} onPress={() => setModal(true)} activeOpacity={0.85}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.newOrderText}>Nouvelle commande</Text>
        </TouchableOpacity>
      </ScrollView>

      <OrderFormModal visible={modal} order={null} onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />
      <SettingsModal visible={settings} onClose={() => setSettings(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    width: '47%',
    backgroundColor: '#fff', borderRadius: radius.lg, padding: 16,
    ...shadow.card,
  },
  iconChip: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 2, fontWeight: '500' },
  newOrderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.teal, paddingVertical: 15, borderRadius: radius.lg,
    shadowColor: colors.teal, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  newOrderText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
