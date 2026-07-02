import { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { panoramaAPI } from "../api/client";
import { SkeletonCard } from "../components/Skeleton";
import { colors } from "../theme";

const MODULE_LABELS = {
  desk:    { title: "Desk",    subtitle: "Business Overview" },
  clients: { title: "Clients", subtitle: "Manage Customers" },
  eyewear: { title: "Eyewear", subtitle: "Manage Frames" },
  lenses:  { title: "Lenses",  subtitle: "Manage Lenses" },
  atelier: { title: "Atelier", subtitle: "Manage Production" },
  orders:  { title: "Orders",  subtitle: "Sales & Orders" },
};

const MODULE_TO_TAB = {
  desk: "Desk", clients: "Clients", eyewear: "Eyewear",
  lenses: "Lenses", atelier: "Atelier", orders: "Orders",
};

export function PanoramaScreen() {
  const navigation = useNavigation();
  const [store, setStore] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [stage, setStage] = useState({ w: Dimensions.get("window").width, h: 0 });

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  useEffect(() => {
    (async () => {
      try {
        const list = await panoramaAPI.getStores();
        const first = Array.isArray(list.data) ? list.data[0] : list.data;
        let full = first;
        if (first?.id) { const res = await panoramaAPI.getStore(first.id); full = res.data; }
        setStore(full);
        setHotspots(full?.hotspots || []);
        if (full?.imageUrl) Image.getSize(full.imageUrl, (w, h) => setNatural({ w, h }), () => {});
      } catch (e) { console.error("panorama load failed", e); }
      finally { setLoading(false); }
    })();
  }, []);

  const coverScale = (natural.w && natural.h && stage.w && stage.h)
    ? Math.max(stage.w / natural.w, stage.h / natural.h) : 1;
  const coverW = natural.w * coverScale;
  const coverH = natural.h * coverScale;

  const clampTranslations = () => {
    "worklet";
    const dispW = coverW * scale.value;
    const dispH = coverH * scale.value;
    const maxX = Math.max(0, (dispW - stage.w) / 2);
    const maxY = Math.max(0, (dispH - stage.h) / 2);
    tx.value = Math.min(Math.max(tx.value, -maxX), maxX);
    ty.value = Math.min(Math.max(ty.value, -maxY), maxY);
  };

  const panG = Gesture.Pan()
    .onUpdate((e) => { tx.value = savedTx.value + e.translationX; ty.value = savedTy.value + e.translationY; clampTranslations(); })
    .onEnd(() => { savedTx.value = tx.value; savedTy.value = ty.value; });

  const pinchG = Gesture.Pinch()
    .onUpdate((e) => { scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 4); clampTranslations(); })
    .onEnd(() => { savedScale.value = scale.value; clampTranslations(); });

  const doubleTapG = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      "worklet";
      if (scale.value > 1.5) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        tx.value = withSpring(0);
        ty.value = withSpring(0);
        savedTx.value = 0;
        savedTy.value = 0;
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  const composed = Gesture.Simultaneous(panG, pinchG, doubleTapG);

  const imgStyle = useAnimatedStyle(() => ({
    width: coverW, height: coverH,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const goToModule = (module) => { const tab = MODULE_TO_TAB[module]; if (tab) navigation.navigate(tab); };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: "#111827", padding: 24 }]}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }
  if (!store?.imageUrl) {
    return <View style={styles.center}><Text style={{ color: colors.muted }}>Aucune image de boutique.</Text></View>;
  }

  return (
    <View style={styles.stage} onLayout={(e) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.layer, imgStyle]}>
          <Image source={{ uri: store.imageUrl }} style={{ width: coverW, height: coverH }} resizeMode="stretch" />
          {coverW > 0 && hotspots.map((h) => {
            const left = h.x * coverW, top = h.y * coverH, w = h.w * coverW, hgt = h.h * coverH;
            const meta = MODULE_LABELS[h.module] || { title: h.label || "Open", subtitle: "" };
            return (
              <HotspotAnchor key={h.id} left={left} top={top} width={w} height={hgt} scaleShared={scale} meta={meta} onPress={() => goToModule(h.module)} />
            );
          })}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function HotspotAnchor({ left, top, width, height, scaleShared, meta, onPress }) {
  const inner = useAnimatedStyle(() => ({ transform: [{ scale: 1 / scaleShared.value }] }));
  return (
    <View style={{ position: "absolute", left, top, width, height, alignItems: "center", justifyContent: "center" }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.anchorWrap, inner]} pointerEvents="none">
        <View style={styles.dotOuter}><View style={styles.dotInner} /></View>
        <View style={styles.labelCard}>
          <Text style={styles.labelTitle}>{meta.title}</Text>
          {!!meta.subtitle && <Text style={styles.labelSub}>{meta.subtitle}</Text>}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  stage: { flex: 1, overflow: "hidden", backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  layer: { position: "absolute" },
  anchorWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  dotOuter: { width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(29,158,117,0.3)", alignItems: "center", justifyContent: "center" },
  dotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1D9E75", borderWidth: 2, borderColor: "#fff" },
  labelCard: { backgroundColor: "rgba(11,27,58,0.88)", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  labelTitle: { fontSize: 12, fontWeight: "700", color: "#fff" },
  labelSub: { fontSize: 10, color: "rgba(255,255,255,0.65)" },
});
