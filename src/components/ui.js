import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export function SearchBar({ value, onChangeText, placeholder = 'Rechercher...' }) {
  return (
    <View style={s.searchWrap}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput style={s.searchInput} value={value} onChangeText={onChangeText}
        placeholder={placeholder} placeholderTextColor={colors.muted} />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={colors.muted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Fab({ onPress }) {
  return (
    <TouchableOpacity style={s.fab} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name="add" size={28} color="#fff" />
    </TouchableOpacity>
  );
}

export function Field({ label, value, onChangeText, keyboardType, secureTextEntry, placeholder, multiline }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value != null ? String(value) : ''}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
      />
    </View>
  );
}

export function EmptyState({ icon = 'folder-open-outline', text }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={48} color={colors.border} />
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

export function Loader() {
  return <View style={s.loader}><ActivityIndicator size="large" color={colors.primary} /></View>;
}

export function PrimaryButton({ title, onPress, loading, color = colors.primary }) {
  return (
    <TouchableOpacity style={[s.btn, { backgroundColor: color }]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{title}</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, margin: 12, gap: 8, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff', color: colors.text },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 },
  emptyText: { color: colors.muted, fontSize: 14 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btn: { borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
