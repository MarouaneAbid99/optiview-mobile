import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clientsAPI, eyewearAPI, lensesAPI, atelierAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Loader, SectionLabel, PrimaryButton } from '../components/ui';
import { colors, moduleColor, shadow } from '../theme';
import { OrderFormModal } from './orders/OrderFormModal';
import { OrdersContent } from './OrdersScreen';
import { SettingsModal } from './SettingsModal';
import { GlobalSearchModal } from './GlobalSearchModal';

export function DeskScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({ clients: 0, frames: 0, lenses: 0, activeOrders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newOrder, setNewOrder] = useState(false);
  const [settings, setSettings] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
      const revenue = orders.filter((x) => x.status === 'delivered').reduce((s, x) => s + (x.totalPrice || 0), 0);
      setStats({ clients: (c.data || []).length, frames: (f.data || []).length, lenses: (l.data || []).length, activeOrders: active, revenue });
    } catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const fmtK = (n) => n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'K' : String(n);

  const handleNavigate = (key, item) => {
    if (key === 'clients') {
      navigation.navigate('Clients', { screen: 'ClientDetail', params: { id: item.id } });
    } else if (key === 'orders') {
      setTab('orders');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Navy header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View>
          <Text style={styles.hello}>Bonjour</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.hIcon} onPress={() => setSearchOpen(true)}>
            <Ionicons name="search-outline" size={18} color={colors.navyText} />
          </TouchableOpacity>
          {user?.role === 'OPTICIAN' && (
            <TouchableOpacity style={styles.hIcon} onPress={() => setSettings(true)}>
              <Ionicons name="settings-outline" size={18} color={colors.navyText} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.hIcon} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color={colors.navyText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented control */}
      <View style={styles.segment}>
        <TouchableOpacity style={[styles.segBtn, tab === 'overview' && styles.segActive]} onPress={() => setTab('overview')}>
          <Text style={[styles.segText, tab === 'overview' && styles.segTextActive]}>Vue d'ensemble</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.segBtn, tab === 'orders' && styles.segActive]} onPress={() => setTab('orders')}>
          <Text style={[styles.segText, tab === 'orders' && styles.segTextActive]}>Commandes</Text>
        </TouchableOpacity>
      </View>

      {tab === 'overview' ? (
        loading ? <Loader /> : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 32 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.teal} />}
          >
            <SectionLabel>Statistiques</SectionLabel>
            <View style={styles.grid}>
              <StatCard icon="people" label="Clients" value={stats.clients} soft={moduleColor.clients.soft} fg={moduleColor.clients.fg} trend />
              <StatCard icon="cash" label="CA livré · MAD" value={fmtK(Math.round(stats.revenue))} soft={moduleColor.desk.soft} fg={moduleColor.desk.fg} />
              <StatCard icon="glasses" label="Montures" value={stats.frames} soft={moduleColor.eyewear.soft} fg={moduleColor.eyewear.fg} />
              <StatCard icon="eye" label="Verres" value={stats.lenses} soft={moduleColor.lenses.soft} fg={moduleColor.lenses.fg} />
            </View>

            <SectionLabel>Actions</SectionLabel>
            <View style={{ paddingHorizontal: 16 }}>
              <PrimaryButton title="Nouvelle commande" icon="add" onPress={() => setNewOrder(true)} />
            </View>

            <View style={{ marginTop: 12, paddingHorizontal: 16 }}>
              <View style={styles.activeRow}>
                <View>
                  <Text style={styles.activeLabel}>Commandes actives</Text>
                  <Text style={styles.activeHint}>En attente · En cours · Prêt</Text>
                </View>
                <Text style={styles.activeValue}>{stats.activeOrders}</Text>
              </View>
            </View>
          </ScrollView>
        )
      ) : (
        <OrdersContent />
      )}

      <OrderFormModal visible={newOrder} order={null} onClose={() => setNewOrder(false)} onSaved={() => { setNewOrder(false); load(); }} />
      <SettingsModal visible={settings} onClose={() => setSettings(false)} />
      <GlobalSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={handleNavigate} />
    </View>
  );
}

function StatCard({ icon, label, value, soft, fg, trend }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statHead}>
        <View style={[styles.iconChip, { backgroundColor: soft }]}>
          <Ionicons name={icon} size={20} color={fg} />
        </View>
        {trend ? <Ionicons name="trending-up" size={16} color={colors.teal} /> : null}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    ...shadow.header,
  },
  hello: { color: colors.navyText, fontSize: 13 },
  name: { color: '#fff', fontSize: 21, fontWeight: '700', marginTop: 2 },
  hIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.navy2, alignItems: 'center', justifyContent: 'center' },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderWidth: 0.5, borderColor: colors.border,
    borderRadius: 13, padding: 4, margin: 16,
    ...shadow.card,
  },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
  segActive: { backgroundColor: colors.navy },
  segText: { fontSize: 13, color: colors.textSec, fontWeight: '600' },
  segTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, marginBottom: 8 },
  stat: {
    width: '47%',
    backgroundColor: colors.card,
    borderWidth: 0.5, borderColor: colors.border,
    borderRadius: 16, padding: 16,
    ...shadow.card,
  },
  statHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  iconChip: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 26, fontWeight: '700', color: colors.text, lineHeight: 28 },
  statLabel: { fontSize: 13, color: colors.textSec, marginTop: 5 },
  activeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.border,
    borderRadius: 14, padding: 16,
    ...shadow.card,
  },
  activeLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  activeHint: { fontSize: 12, color: colors.textSec, marginTop: 2 },
  activeValue: { fontSize: 28, fontWeight: '700', color: colors.primary },
});
