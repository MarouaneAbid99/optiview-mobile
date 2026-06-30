import { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { atelierAPI, clientsAPI, eyewearAPI, lensesAPI } from '../../api/client';
import { Field, PrimaryButton } from '../../components/ui';
import { colors, radius, space, shadow } from '../../theme';

const TYPES = [
  { key: 'sale', label: 'Vente' },
  { key: 'montage', label: 'Montage' },
  { key: 'sale_montage', label: 'Vente+Montage' },
];

export function OrderFormModal({ visible, order, onClose, onSaved }) {
  const isEdit = !!order;
  const [type, setType] = useState('sale_montage');
  const [clientId, setClientId] = useState(null);
  const [frameId, setFrameId] = useState(null);
  const [lensId, setLensId] = useState(null);
  const [labor, setLabor] = useState('');
  const [clients, setClients] = useState([]);
  const [frames, setFrames] = useState([]);
  const [lenses, setLenses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const [c, f, l] = await Promise.all([clientsAPI.getClients(), eyewearAPI.getFrames(), lensesAPI.getLenses()]);
        setClients(c.data || []); setFrames(f.data || []); setLenses(l.data || []);
      } catch (e) { console.error(e); }
    })();
    if (order) {
      setType(order.orderType || 'sale_montage');
      setClientId(order.clientId || null);
      setFrameId(order.frameId || null);
      setLensId(order.items?.[0]?.lensId || null);
      setLabor(String(order.laborPrice ?? ''));
    } else {
      setType('sale_montage'); setClientId(null); setFrameId(null); setLensId(null); setLabor('');
    }
  }, [visible, order]);

  const involvesStock = type === 'sale' || type === 'sale_montage';
  const involvesMontage = type === 'montage' || type === 'sale_montage';

  const save = async () => {
    const payload = {
      orderType: type,
      clientId: clientId || null,
      frameId: involvesStock ? frameId : null,
      items: involvesStock && lensId ? [{ lensId, quantity: 1 }] : [],
      laborPrice: involvesMontage ? (parseFloat(labor) || 0) : null,
    };
    if (involvesStock && !frameId) { alert('Sélectionnez une monture'); return; }
    if (involvesStock && !lensId) { alert('Sélectionnez un verre'); return; }
    setSaving(true);
    try {
      if (isEdit) await atelierAPI.updateOrder(order.id, payload);
      else await atelierAPI.createOrder(payload);
      onSaved();
    } catch (e) { alert(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.grabber} />
          <View style={s.header}>
            <Text style={s.title}>{isEdit ? 'Modifier la commande' : 'Nouvelle commande'}</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}><Ionicons name="close" size={20} color={colors.muted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={s.label}>Type</Text>
            <View style={s.typeRow}>
              {TYPES.map((t) => (
                <TouchableOpacity key={t.key} onPress={() => setType(t.key)}
                  style={[s.typeBtn, type === t.key && { backgroundColor: colors.teal, borderColor: colors.teal }]}>
                  <Text style={[s.typeText, type === t.key && { color: '#fff' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Picker label="Client (optionnel)" items={clients.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName}` }))} value={clientId} onSelect={setClientId} allowNone />

            {involvesStock && (
              <>
                <Picker label="Monture" items={frames.map((f) => ({ id: f.id, label: `${f.brand} ${f.model} (${f.stock})` }))} value={frameId} onSelect={setFrameId} />
                <Picker label="Verre" items={lenses.map((l) => ({ id: l.id, label: `${l.type} ${l.material} (${l.stock})` }))} value={lensId} onSelect={setLensId} />
              </>
            )}

            {involvesMontage && <Field label="Prix montage (MAD)" value={labor} onChangeText={setLabor} keyboardType="numeric" />}

            <PrimaryButton title={isEdit ? 'Enregistrer' : 'Créer la commande'} onPress={save} loading={saving} icon={isEdit ? 'checkmark' : 'add-circle-outline'} />
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Picker({ label, items, value, onSelect, allowNone }) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.id === value);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity style={s.pickerBox} onPress={() => setOpen((o) => !o)}>
        <Text style={{ color: selected ? colors.text : colors.mutedLight, fontSize: 14 }}>{selected ? selected.label : 'Sélectionner...'}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </TouchableOpacity>
      {open && (
        <View style={s.pickerList}>
          {allowNone && (
            <TouchableOpacity style={s.pickerItem} onPress={() => { onSelect(null); setOpen(false); }}><Text style={{ color: colors.muted }}>Aucun</Text></TouchableOpacity>
          )}
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {items.map((i) => (
              <TouchableOpacity key={i.id} style={s.pickerItem} onPress={() => { onSelect(i.id); setOpen(false); }}>
                <Text style={{ color: value === i.id ? colors.teal : colors.text, fontWeight: value === i.id ? '700' : '400', fontSize: 14 }}>{i.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(11,27,58,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.lg, maxHeight: '92%', ...shadow.header },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: '#fff' },
  typeText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  pickerBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, backgroundColor: colors.bg },
  pickerList: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginTop: 4, ...shadow.card },
  pickerItem: { padding: 13, borderBottomWidth: 1, borderBottomColor: colors.bg },
});
