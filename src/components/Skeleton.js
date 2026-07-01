import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme';

export function Skeleton({ width = '100%', height = 14, radius = 8, style }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.border, opacity }, style]} />;
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width={44} height={44} radius={22} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={11} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 6 }) {
  return <View style={{ paddingTop: 8 }}>{Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}</View>;
}

export function SkeletonStats() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={styles.stat}>
          <Skeleton width={40} height={40} radius={12} />
          <Skeleton width="50%" height={22} style={{ marginTop: 14 }} />
          <Skeleton width="70%" height={12} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.border, borderRadius: 16, padding: 16, marginHorizontal: 16, marginVertical: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  stat: { width: '47%', backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.border, borderRadius: 16, padding: 16 },
});
