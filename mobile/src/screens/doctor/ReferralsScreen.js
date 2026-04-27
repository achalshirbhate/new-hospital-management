import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Alert, RefreshControl, KeyboardAvoidingView, Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../../api/axios';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

export default function ReferralsScreen() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patientId: '', toDoctor: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await api.get('/referrals'); setReferrals(data); } catch {}
  };

  useEffect(() => {
    load();
    api.get('/patients').then(r => setPatients(r.data)).catch(() => {});
    api.get('/doctors').then(r => setDoctors(r.data.filter(d => d.userId?._id !== user?.id))).catch(() => {});
  }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSubmit = async () => {
    if (!form.patientId || !form.toDoctor) return Alert.alert('Error', 'Select patient and doctor');
    setLoading(true);
    try {
      await api.post('/referrals', form);
      setShowModal(false);
      setForm({ patientId: '', toDoctor: '', reason: '' });
      load();
      Alert.alert('Submitted', 'Referral sent to Main Doctor for approval');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Referrals</Text>
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Request</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>⚠️ All referrals go through Main Doctor for approval</Text>
        </View>

        {referrals.map(r => (
          <Card key={r._id}>
            <Text style={styles.name}>Patient: {r.patientId?.name}</Text>
            <Text style={styles.sub}>To: Dr. {r.toDoctor?.name}</Text>
            {r.reason ? <Text style={styles.reason}>{r.reason}</Text> : null}
            <View style={{ marginTop: 8 }}><Badge label={r.status} /></View>
          </Card>
        ))}
        {referrals.length === 0 && <Text style={styles.empty}>No referrals yet.</Text>}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Referral</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.pickerLabel}>Patient</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={form.patientId} onValueChange={v => setForm({ ...form, patientId: v })}>
                <Picker.Item label="-- Select Patient --" value="" />
                {patients.map(p => <Picker.Item key={p._id} label={p.userId?.name} value={p.userId?._id} />)}
              </Picker>
            </View>

            <Text style={styles.pickerLabel}>Refer To Doctor</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={form.toDoctor} onValueChange={v => setForm({ ...form, toDoctor: v })}>
                <Picker.Item label="-- Select Doctor --" value="" />
                {doctors.map(d => <Picker.Item key={d._id} label={`Dr. ${d.userId?.name} — ${d.specialization}`} value={d.userId?._id} />)}
              </Picker>
            </View>

            <Input label="Reason" placeholder="Reason for referral..." value={form.reason} onChangeText={v => setForm({ ...form, reason: v })} multiline />
            <Button title="Submit Referral" onPress={handleSubmit} loading={loading} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100, padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.gray800 },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  notice: { backgroundColor: '#FFFBEB', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: '#FDE68A' },
  noticeText: { fontSize: 12, color: '#B45309' },
  name: { fontSize: 15, fontWeight: '700', color: colors.gray800 },
  sub: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  reason: { fontSize: 13, color: colors.gray700, marginTop: 4, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: colors.gray400, marginTop: 40 },
  modal: { flex: 1, backgroundColor: colors.white, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.gray800 },
  closeBtn: { fontSize: 20, color: colors.gray400 },
  pickerLabel: { fontSize: 13, fontWeight: '600', color: colors.gray700, marginBottom: 6 },
  pickerWrap: { borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 12, marginBottom: 14, overflow: 'hidden' },
});
