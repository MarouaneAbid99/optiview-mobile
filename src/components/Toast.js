import { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';

const ToastContext = createContext(null);

const CONFIGS = {
  success: { bg: '#0F7A58', icon: 'checkmark-circle', iconColor: '#6EE7C7' },
  error:   { bg: '#BE123C', icon: 'alert-circle',     iconColor: '#FCA5A5' },
  info:    { bg: colors.navy, icon: 'information-circle', iconColor: colors.teal },
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((message, type = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, type });
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => setToast(null));
    timer.current = setTimeout(() => setToast(null), 2700);
  }, [opacity]);

  const showSuccess = useCallback((msg) => show(msg, 'success'), [show]);
  const showError   = useCallback((msg) => show(msg, 'error'),   [show]);
  const showInfo    = useCallback((msg) => show(msg, 'info'),    [show]);

  const cfg = toast ? CONFIGS[toast.type] || CONFIGS.info : null;

  return (
    <ToastContext.Provider value={{ show, showSuccess, showError, showInfo }}>
      {children}
      {toast && cfg && (
        <Animated.View style={[
          styles.toast,
          { top: insets.top + 12, backgroundColor: cfg.bg, opacity },
        ]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.iconColor} />
          <Text style={styles.msg} numberOfLines={2}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: radius.lg, zIndex: 9999,
    ...shadow.header,
  },
  msg: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
});
