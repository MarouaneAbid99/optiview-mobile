import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';

export function AppHeader({ title, subtitle, rightActions }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightActions && rightActions.length > 0 && (
        <View style={styles.actions}>
          {rightActions.map((a, i) => <HeaderIcon key={i} {...a} />)}
        </View>
      )}
    </View>
  );
}

export function HeaderIcon({ name, onPress, color = 'rgba(255,255,255,0.8)' }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.iconBtn} activeOpacity={0.7}>
      <Ionicons name={name} size={22} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 14,
    ...shadow.header,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
});
