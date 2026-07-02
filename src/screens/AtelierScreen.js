import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { atelierAPI } from "../api/client";
import { Loader, EmptyState } from "../components/ui";
import { useToast } from "../components/Toast";
import { colors, radius, space, shadow } from "../theme";

const FLOW = ["pending", "in-progress", "ready", "delivered"];
const LABEL = { pending: "En attente", "in-progress": "En cours", ready: "Prêt", delivered: "Livré" };
const COLOR = { pending: "#f59e0b", "in-progress": "#3b82f6", ready: "#22c55e", delivered: "#94A3B8" };

function fmtMAD(n) {
  if (n == null) return "—";
  return n.toLocaleString("fr-FR") + " MAD";
}

export function AtelierScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await atelierAPI.getOrders();
      const prod = (res.data || []).filter((o) => (o.orderType === "montage" || o.orderType === "sale_montage") && o.status !== "cancelled");
      setOrders(prod);
    } catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const { showSuccess, showError } = useToast();

  const advance = async (order) => {
    const idx = FLOW.indexOf(order.status);
    if (idx < 0 || idx >= FLOW.length - 1) return;
    try {
      await atelierAPI.updateStatus(order.id, FLOW[idx + 1]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showSuccess(order.orderNumber + " → " + LABEL[FLOW[idx + 1]]);
      if (detail?.id === order.id) setDetail((p) => ({ ...p, status: FLOW[idx + 1] }));
      load();
    } catch { showError("Erreur"); }
  };

  const goBack = async (order) => {
    const idx = FLOW.indexOf(order.status);
    if (idx <= 0) return;
    try {
      await atelierAPI.updateStatus(order.id, FLOW[idx - 1]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showSuccess(order.orderNumber + " → " + LABEL[FLOW[idx - 1]]);
      if (detail?.id === order.id) setDetail((p) => ({ ...p, status: FLOW[idx - 1] }));
      load();
    } catch { showError("Erreur"); }
  };

  if (loading) return <Loader />;

  return (
    <>
      <ScrollView style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
        {FLOW.map((st) => {
          const list = orders.filter((o) => o.status === st);
          return (
            <View key={st} style={styles.column}>
              <View style={[styles.colHeader, { borderLeftColor: COLOR[st] }]}>
                <View style={[styles.dot, { backgroundColor: COLOR[st] }]} />
                <Text style={styles.colTitle}>{LABEL[st]}</Text>
                <View style={[styles.countBadge, { backgroundColor: COLOR[st] + "22" }]}>
                  <Text style={[styles.count, { color: COLOR[st] }]}>{list.length}</Text>
                </View>
              </View>
              {list.length === 0 ? <Text style={styles.muted}>—</Text> : list.map((o) => {
                const idx = FLOW.indexOf(o.status);
                return (
                  <TouchableOpacity key={o.id} style={styles.card} onPress={() => setDetail(o)} activeOpacity={0.75}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.num}>{o.orderNumber}</Text>
                      <Text style={styles.sub}>{o.client ? o.client.firstName + " " + o.client.lastName : "Passage"}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {idx > 0 && (
                        <TouchableOpacity style={[styles.advBtn, { backgroundColor: COLOR[FLOW[idx - 1]] + "33", borderWidth: 1, borderColor: COLOR[FLOW[idx - 1]] }]} onPress={(e) => { e.stopPropagation && e.stopPropagation(); goBack(o); }}>
                          <Text style={[styles.advText, { color: COLOR[FLOW[idx - 1]] }]}>← {LABEL[FLOW[idx - 1]].split(" ")[0]}</Text>
                        </TouchableOpacity>
                      )}
                      {idx < FLOW.length - 1 && (
                        <TouchableOpacity style={[styles.advBtn, { backgroundColor: COLOR[FLOW[idx + 1]] }]} onPress={(e) => { e.stopPropagation && e.stopPropagation(); advance(o); }}>
                          <Text style={styles.advText}>→ {LABEL[FLOW[idx + 1]].split(" ")[0]}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
        {orders.length === 0 && <EmptyState icon="construct-outline" text="Aucune production en cours" />}
      </ScrollView>

      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={dm.overlay}>
          <View style={dm.sheet}>
            <View style={dm.grabber} />
            <View style={dm.header}>
              <Text style={dm.orderNum}>{detail?.orderNumber}</Text>
              <TouchableOpacity onPress={() => setDetail(null)} style={dm.closeBtn}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
            {detail && (
              <>
                <View style={dm.statusRow}>
                  <View style={[dm.statusDot, { backgroundColor: COLOR[detail.status] }]} />
                  <Text style={[dm.statusText, { color: COLOR[detail.status] }]}>{LABEL[detail.status]}</Text>
                </View>
                <Text style={dm.label}>Client</Text>
                <Text style={dm.value}>{detail.client ? detail.client.firstName + " " + detail.client.lastName : "Passage"}</Text>
                {detail.frame && (
                  <>
                    <Text style={dm.label}>Monture</Text>
                    <Text style={dm.value}>{detail.frame.brand} {detail.frame.model}</Text>
                  </>
                )}
                {(detail.items || []).map((it) => (
                  <View key={it.id}>
                    <Text style={dm.label}>Verre</Text>
                    <Text style={dm.value}>{it.lens?.type} {it.lens?.material} x{it.quantity}</Text>
                  </View>
                ))}
                {!!detail.laborPrice && (
                  <>
                    <Text style={dm.label}>Montage</Text>
                    <Text style={dm.value}>{fmtMAD(detail.laborPrice)}</Text>
                  </>
                )}
                {!!detail.notes && (
                  <>
                    <Text style={dm.label}>Notes</Text>
                    <Text style={dm.value}>{detail.notes}</Text>
                  </>
                )}
                {!!detail.deliveryDate && (
                  <>
                    <Text style={dm.label}>Livraison prévue</Text>
                    <Text style={dm.value}>{new Date(detail.deliveryDate).toLocaleDateString("fr-FR")}</Text>
                  </>
                )}
                <Text style={dm.label}>Total</Text>
                <Text style={[dm.value, { fontSize: 18, fontWeight: "800", color: colors.teal }]}>{fmtMAD(detail.totalPrice)}</Text>

                <View style={dm.btnRow}>
                  {FLOW.indexOf(detail.status) > 0 && (
                    <TouchableOpacity style={[dm.btn, { borderColor: COLOR[FLOW[FLOW.indexOf(detail.status) - 1]], backgroundColor: COLOR[FLOW[FLOW.indexOf(detail.status) - 1]] + "22" }]} onPress={() => goBack(detail)}>
                      <Text style={[dm.btnText, { color: COLOR[FLOW[FLOW.indexOf(detail.status) - 1]] }]}>← {LABEL[FLOW[FLOW.indexOf(detail.status) - 1]]}</Text>
                    </TouchableOpacity>
                  )}
                  {FLOW.indexOf(detail.status) < FLOW.length - 1 && (
                    <TouchableOpacity style={[dm.btn, { backgroundColor: COLOR[FLOW[FLOW.indexOf(detail.status) + 1]], flex: 1 }]} onPress={() => advance(detail)}>
                      <Text style={dm.btnText}>→ {LABEL[FLOW[FLOW.indexOf(detail.status) + 1]]}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
            <View style={{ height: 24 }} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  column: { marginHorizontal: space.md, marginTop: space.md },
  colHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 10, borderLeftWidth: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  colTitle: { fontSize: 14, fontWeight: "700", color: colors.text, flex: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  count: { fontSize: 12, fontWeight: "700" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 6, borderWidth: 0.5, borderColor: colors.border, ...shadow.card },
  num: { fontWeight: "700", color: colors.text, fontSize: 14 },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  advBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.sm },
  advText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  muted: { color: colors.mutedLight, marginBottom: 8, fontSize: 13 },
});

const dm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(11,27,58,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "85%", ...shadow.header },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  orderNum: { fontSize: 18, fontWeight: "800", color: colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: "700" },
  label: { fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 10 },
  value: { fontSize: 15, color: colors.text, marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 8, marginTop: 20 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: "transparent" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
