import { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'storefront-outline',
    title: 'Bienvenue sur Optiview',
    desc: 'Gérez votre boutique d\'optique depuis votre téléphone — clients, commandes, stock et atelier.',
  },
  {
    icon: 'people-outline',
    title: 'Vos clients au centre',
    desc: 'Fiches clients complètes avec ordonnances, historique de commandes et contact WhatsApp en un tap.',
  },
  {
    icon: 'construct-outline',
    title: 'Atelier & production',
    desc: 'Suivez chaque commande en temps réel de la réception jusqu\'à la livraison, colonne par colonne.',
  },
];

export function OnboardingScreen({ onDone }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const ref = useRef(null);

  const next = async () => {
    if (index < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      await AsyncStorage.setItem('optiview_onboarded', '1');
      onDone();
    }
  };

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 24, paddingTop: insets.top + 16 }]}>
      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={52} color={colors.teal} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={next} activeOpacity={0.85}>
        <Text style={styles.btnText}>{isLast ? 'Commencer' : 'Continuer'}</Text>
        <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'space-between' },
  slide: { width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingTop: 60 },
  iconWrap: {
    width: 108, height: 108, borderRadius: 54,
    backgroundColor: 'rgba(29,158,117,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 36,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 16, lineHeight: 33 },
  desc: { fontSize: 15, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 23 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 24, backgroundColor: colors.teal },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.teal,
    paddingHorizontal: 36, paddingVertical: 16,
    borderRadius: 16, alignSelf: 'stretch', marginHorizontal: 24,
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
