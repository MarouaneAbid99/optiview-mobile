import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, shadow } from '../theme';

export function SearchBar({ value, onChangeText, placeholder = 'Rechercher...' }) {
  return (
    <View style={s.searchWrap}>
      <Ionicons name="search" size={16} color={colors.muted} />
      <TextInput style={s.searchInput} value={value} onChangeText={onChangeText}
        placeholder={placeholder} placeholderTextColor={colors.mutedLight} />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={16} color={colors.muted} />
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

export function Field({ label, value, onChangeText, keyboardType, secureTextEntry, placeholder, multiline, icon }) {
  return (
    <View style={{ marginBottom: space.md }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={[s.inputWrap, multiline && { alignItems: 'flex-start' }]}>
        {icon ? <Ionicons name={icon} size={17} color={colors.muted} style={{ marginRight: 8, marginTop: multiline ? 2 : 0 }} /> : null}
        <TextInput
          style={[s.input, multiline && { height: 80, textAlignVertical: 'top' }]}
          value={value != null ? String(value) : ''}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedLight}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

export function EmptyState({ icon = 'folder-open-outline', text }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}><Ionicons name={icon} size={36} color={colors.muted} /></View>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

export function Loader() {
  return <View style={s.loader}><ActivityIndicator size="large" color={colors.teal} /></View>;
}

export function PrimaryButton({ title, onPress, loading, color, icon }) {
  const bg = color || colors.teal;
  return (
    <TouchableOpacity style={[s.btn, { backgroundColor: bg }]} onPress={onPress} disabled={loading} activeOpacity={0.85}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={s.btnInner}>
          {icon ? <Ionicons name={icon} size={18} color="#fff" style={{ marginRight: 6 }} /> : null}
          <Text style={s.btnText}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function Badge({ label, bg, textColor }) {
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

export function Avatar({ letter, size = 40, bg = colors.teal }) {
  const r = size / 2;
  const fs = size * 0.38;
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: r, backgroundColor: bg }]}>
      <Text style={[s.avatarText, { fontSize: fs }]}>{(letter || '?').toUpperCase()}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: radius.md,
    paddingHorizontal: space.md, paddingVertical: 10,
    margin: space.md, gap: 8,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.teal,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.teal, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: space.md, paddingVertical: 10,
    backgroundColor: '#fff',
  },
  input: { flex: 1, fontSize: 15, color: colors.text },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.muted, fontSize: 14 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btn: { borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnInner: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontWeight: '700' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
});
