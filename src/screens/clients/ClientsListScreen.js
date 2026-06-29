import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { clientsAPI } from '../../api/client';
import { SearchBar, Fab, EmptyState, Loader } from '../../components/ui';
import { colors } from '../../theme';
import { ClientFormModal } from './ClientFormModal';

export function ClientsListScreen({ navigation }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await clientsAPI.getClients();
      setClients(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || (c.phone || '').includes(q);
  });

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Nom ou téléphone..." />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState icon="people-outline" text="Aucun client" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ClientDetail', { id: item.id })}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{(item.firstName?.[0] || '?').toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
              {!!item.phone && <Text style={styles.sub}>{item.phone}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 4, padding: 14, borderRadius: 12, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
