import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { clientsAPI } from '../../api/client';
import { SearchBar, Fab, EmptyState, Avatar } from '../../components/ui';
import { SkeletonList } from '../../components/Skeleton';
import { FilterSheet } from '../../components/FilterSheet';
import { colors, radius, space, shadow } from '../../theme';
import { ClientFormModal } from './ClientFormModal';

const AVATAR_COLORS = [colors.teal, colors.blue, colors.purple, colors.orange, colors.pink];

export function ClientsListScreen({ navigation }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ sort: 'name' });

  const filterGroups = [
    { key: 'sort', label: 'Trier par', options: [
      { value: 'name', label: 'Nom' }, { value: 'recent', label: 'Récent' }, { value: 'orders', label: 'Nb commandes' },
    ]},
  ];

  const load = useCallback(async () => {
    try {
      const res = await clientsAPI.getClients();
      setClients(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = (() => {
    let r = clients.filter((c) => {
      const q = search.toLowerCase();
      return `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || (c.phone || '').includes(q);
    });
    if (filters.sort === 'name') r.sort((a, b) => `${a.firstName}`.localeCompare(`${b.firstName}`));
    else if (filters.sort === 'recent') r.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    else if (filters.sort === 'orders') r.sort((a, b) => (b.orders?.length || 0) - (a.orders?.length || 0));
    return r;
  })();

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg }}><SkeletonList /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Nom ou téléphone..." />
        </View>
        <TouchableOpacity style={[styles.iconBtn, { marginRight: 16 }]} onPress={() => setFilterOpen(true)}>
          <Ionicons name="options-outline" size={20} color={colors.navy} />
        </TouchableOpacity>
      </View>
      <FilterSheet visible={filterOpen} onClose={() => setFilterOpen(false)} groups={filterGroups} value={filters}
        onChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))} onReset={() => setFilters({ sort: 'name' })} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.teal} />}
        ListEmptyComponent={<EmptyState icon="people-outline" title="Aucun client" text="Ajoutez votre premier client" actionLabel="Nouveau client" onAction={() => setModal(true)} />}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ClientDetail', { id: item.id })} activeOpacity={0.75}>
            <Avatar letter={item.firstName?.[0] || '?'} size={44} bg={AVATAR_COLORS[index % AVATAR_COLORS.length]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
              {!!item.phone && <Text style={styles.sub}>{item.phone}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedLight} />
          </TouchableOpacity>
        )}
      />
      <Fab onPress={() => setModal(true)} />
      <ClientFormModal visible={modal} onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 6,
    padding: 16, borderRadius: 16, gap: 14,
    borderWidth: 0.5, borderColor: colors.border,
    ...shadow.card,
  },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 3 },
});
