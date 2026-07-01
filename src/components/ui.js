import { useState } from 'react';
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

export function Field({ label, value, onChangeText, keyboardType, secureTextEntry, placeholder, multiline, icon, error }) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={[
        fl.wrap,
        multiline && { height: 92, alignItems: 'flex-start', paddingTop: 14 },
        focused && fl.wrapActive,
        hasError && fl.wrapError,
      ]}>
        {label ? (
          <Text style={[fl.floatLabel, focused && fl.floatLabelActive, hasError && fl.floatLabelError]}>{label}</Text>
        ) : null}
        {icon ? <Ionicons name={icon} size={18} color={hasError ? colors.red : focused ? colors.primary : colors.muted} style={{ marginRight: 10, marginTop: multiline ? 2 : 0 }} /> : null}
        <TextInput
          style={[fl.input, multiline && { height: 64, textAlignVertical: 'top' }]}
          value={value != null ? String(value) : ''}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedLight}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {hasError && <Text style={fl.errorText}>{error}</Text>}
    </View>
  );
}

export function EmptyState({ icon = 'folder-open-outline', title, text, actionLabel, onAction }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}><Ionicons name={icon} size={36} color={colors.muted} /></View>
      {title ? <Text style={s.emptyTitle}>{title}</Text> : null}
      <Text style={s.emptyText}>{text}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={s.emptyAction} onPress={onAction} activeOpacity={0.85}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={s.emptyActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
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

export function ButtonRow({ cancelLabel = 'Annuler', onCancel, actionLabel, onAction, loading, actionIcon = 'checkmark', actionColor }) {
  const bg = actionColor || colors.teal;
  return (
    <View style={br.row}>
      <TouchableOpacity style={br.cancel} onPress={onCancel} activeOpacity={0.8}>
        <Text style={br.cancelText}>{cancelLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[br.action, { backgroundColor: bg }]} onPress={onAction} disabled={loading} activeOpacity={0.85}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <View style={br.inner}>
            <Ionicons name={actionIcon} size={17} color="#fff" />
            <Text style={br.actionText}>{actionLabel}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export function SectionLabel({ children }) {
  return (
    <Text style={s.sectionLabel}>{children}</Text>
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
  empty: { alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.teal, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  emptyActionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnInner: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontWeight: '700' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginHorizontal: 18, marginBottom: 10, marginTop: 6 },
});

const fl = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, backgroundColor: colors.card, height: 52,
  },
  wrapActive: { borderColor: colors.primary },
  wrapError: { borderColor: colors.red },
  floatLabel: {
    position: 'absolute', top: -8, left: 12,
    backgroundColor: colors.card, paddingHorizontal: 6,
    fontSize: 11, color: colors.textSec, fontWeight: '600',
  },
  floatLabelActive: { color: colors.primary },
  floatLabelError: { color: colors.red },
  errorText: { fontSize: 12, color: colors.red, marginTop: 4, marginLeft: 4 },
  input: { flex: 1, fontSize: 15, color: colors.text, height: '100%' },
});

const br = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancel: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: 14 },
  cancelText: { fontSize: 14, fontWeight: '600', color: colors.textSec },
  action: { flex: 2, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 14 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  actionText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
