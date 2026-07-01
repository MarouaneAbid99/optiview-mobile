import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';

export function FilterSheet({ visible, onClose, groups, value, onChange, onReset }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.grabber} />
          <View style={s.header}>
            <Text style={s.title}>Filtres & tri</Text>
            <TouchableOpacity onPress={onReset}><Text style={s.reset}>Réinitialiser</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {groups.map((g) => (
              <View key={g.key} style={{ marginBottom: 18 }}>
                <Text style={s.groupLabel}>{g.label}</Text>
                <View style={s.chips}>
                  {g.options.map((opt) => {
                    const active = value[g.key] === opt.value;
                    return (
                      <TouchableOpacity key={String(opt.value)} onPress={() => onChange(g.key, opt.value)}
                        style={[s.chip, active && s.chipActive]}>
                        <Text style={[s.chipText, active && s.chipTextActive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={s.apply} onPress={onClose}>
            <Text style={s.applyText}>Appliquer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(11,27,58,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 28, ...shadow.header },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  reset: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  groupLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 13, color: colors.textSec, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  apply: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
