import { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { atelierAPI, clientsAPI, eyewearAPI, lensesAPI } from '../../api/client';
import { Field, PrimaryButton, ButtonRow } from '../../components/ui';
import { useToast } from '../../components/Toast';
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
  const [lensItems, setLensItems] = useState([{ lensId: null, quantity: '1' }]);
  const [labor, setLabor] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [clients, setClients] = useState([]);
  const [frames, setFrames] = useState([]);
  const [lenses, setLenses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [frameError, setFrameError] = useState(null);
  const [lensErrors, setLensErrors] = useState([]);
  const { showSuccess, showError } = useToast();

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
      const existingItems = (order.items || []).length > 0
        ? order.items.map((it) => ({ lensId: it.lensId, quantity: String(it.quantity || 1) }))
        : [{ lensId: null, quantity: '1' }];
      setLensItems(existingItems);
      setLabor(String(order.laborPrice ?? ''));
      setNotes(order.notes || '');
      setDeliveryDate(order.deliveryDate ? order.deliveryDate.split('T')[0] : '');
    } else {
      setType('sale_montage'); setClientId(null); setFrameId(null);
      setLensItems([{ lensId: null, quantity: '1' }]);
      setLabor(''); setNotes(''); setDeliveryDate('');
    }
    setFrameError(null); setLensErrors([]);
  }, [visible, order]);

  const involvesStock = type === 'sale' || type === 'sale_montage';
  const involvesMontage = type === 'montage' || type === 'sale_montage';

  const addLensRow = () => {
    setLensItems((p) => [...p, { lensId: null, quantity: '1' }]);
  };

  const removeLensRow = (idx) => {
    setLensItems((p) => p.filter((_, i) => i !== idx));
    setLensErrors((p) => p.filter((_, i) => i !== idx));
  };

  const updateLensRow = (idx, field, value) => {
    setLensItems((p) => p.map((it, i) => i === idx ? { ...it, [field]: value } : it));
    if (field === 'lensId') setLensErrors((p) => { const n = [...p]; n[idx] = null; return n; });
  };

  const save = async () => {
    let valid = true;
    if (involvesStock && !frameId) { setFrameError('Sélectionnez une monture'); valid = false; } else setFrameError(null);
    if (involvesStock) {
      const errs = lensItems.map((it) => (!it.lensId ? 'Sélectionnez un verre' : null));
      setLensErrors(errs);
      if (errs.some((e) => e)) valid = false;
    }
    if (!valid) return;

    const payload = {
      orderType: type,
      clientId: clientId || null,
      frameId: involvesStock ? frameId : null,
      items: involvesStock
        ? lensItems.filter((it) => it.lensId).map((it) => ({ lensId: it.lensId, quantity: parseInt(it.quantity, 10) || 1 }))
        : [],
      laborPrice: involvesMontage ? (parseFloat(labor) || 0) : null,
      notes: notes || null,
      deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
    };
    setSaving(true);
    try {
      if (isEdit) await atelierAPI.updateOrder(order.id, payload);
      else await atelierAPI.createOrder(payload);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showSuccess(isEdit ? 'Commande mise à jour' : 'Commande créée');
      onSaved();
    } catch (e) { showError(e.response?.data?.message || 'Erreur'); }
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
                <Picker label="Monture" items={frames.map((f) => ({ id: f.id, label: `${f.brand} ${f.model} (${f.stock})` }))} value={frameId} onSelect={(v) => { setFrameId(v); setFrameError(null); }} error={frameError} />

                <Text style={s.label}>Verres</Text>
                {lensItems.map((item, idx) => (
                  <View key={idx} style={s.lensRow}>
                    <View style={{ flex: 1 }}>
                      <Picker
                        label={`Verre ${idx + 1}`}
                        items={lenses.map((l) => ({ id: l.id, label: `${l.type} ${l.material} (${l.stock})` }))}
                        value={item.lensId}
                        onSelect={(v) => updateLensRow(idx, 'lensId', v)}
                        error={lensErrors[idx]}
                      />
                    </View>
                    <View style={s.qtyWrap}>
                      <Text style={s.qtyLabel}>Qté</Text>
                      <TouchableOpacity style={s.qtyBtn} onPress={() => updateLensRow(idx, 'quantity', String(Math.max(1, parseInt(item.quantity, 10) - 1)))}>
                        <Ionicons name="remove" size={14} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={s.qtyNum}>{item.quantity}</Text>
                      <TouchableOpacity style={s.qtyBtn} onPress={() => updateLensRow(idx, 'quantity', String(parseInt(item.quantity, 10) + 1))}>
                        <Ionicons name="add" size={14} color={colors.text} />
                      </TouchableOpacity>
                      {lensItems.length > 1 && (
                        <TouchableOpacity style={s.removeBtn} onPress={() => removeLensRow(idx)}>
                          <Ionicons name="trash-outline" size={14} color={colors.red} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={s.addLensBtn} onPress={addLensRow}>
                  <Ionicons name="add-circle-outline" size={16} color={colors.teal} />
                  <Text style={s.addLensText}>Ajouter un verre</Text>
                </TouchableOpacity>
              </>
            )}

            {involvesMontage && <Field label="Prix montage (MAD)" value={labor} onChangeText={setLabor} keyboardType="numeric" />}

            <Field label="Notes (optionnel)" value={notes} onChangeText={setNotes} multiline placeholder="Instructions, remarques..." />
            <Field label="Date de livraison (AAAA-MM-JJ)" value={deliveryDate} onChangeText={setDeliveryDate} placeholder="2026-07-15" keyboardType="numeric" />

            <ButtonRow
              cancelLabel="Annuler" onCancel={onClose}
              actionLabel={isEdit ? 'Enregistrer' : 'Créer'} onAction={save}
              loading={saving} actionIcon={isEdit ? 'checkmark' : 'add-circle-outline'}
            />
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Picker({ label, items, value, onSelect, allowNone, error }) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.id === value);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[s.label, error && { color: colors.red }]}>{label}</Text>
      <TouchableOpacity style={[s.pickerBox, error && { borderColor: colors.red }]} onPress={() => setOpen((o) => !o)}>
        <Text style={{ color: selected ? colors.text : colors.mutedLight, fontSize: 14 }}>{selected ? selected.label : 'Sélectionner...'}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </TouchableOpacity>
      {error && <Text style={{ fontSize: 12, color: colors.red, marginTop: 4, marginLeft: 2 }}>{error}</Text>}
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
  lensRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 24 },
  qtyLabel: { fontSize: 11, color: colors.muted, marginRight: 2 },
  qtyBtn: { width: 26, height: 26, borderRadius: radius.sm, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  qtyNum: { fontSize: 14, fontWeight: '700', color: colors.text, minWidth: 18, textAlign: 'center' },
  removeBtn: { width: 26, height: 26, borderRadius: radius.sm, backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  addLensBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, marginBottom: 8 },
  addLensText: { color: colors.teal, fontWeight: '600', fontSize: 14 },
});
