import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Alert, RefreshControl, KeyboardAvoidingView, Platform
} from 'react-native';
import api from '../../api/axios';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

export default function PatientsScreen() {
  const { logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', medicalHistory: '' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await api.get('/patients'); setPatients(data); } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) return Alert.alert('Error', 'Fill required fields');
    setLoading(true);
    try {
      await api.post('/patients', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', age: '', medicalHistory: '' });
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.topRow}>
          <Text style={styles.title}>My Patients</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>🚪</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {patients.map(p => (
          <TouchableOpacity key={p._id} onPress={() => setExpanded(expanded === p._id ? null : p._id)} activeOpacity={0.8}>
            <Card>
              <Text style={styles.name}>{p.userId?.name}</Text>
              <Text style={styles.sub}>{p.userId?.email} · Age: {p.age}</Text>
              {expanded === p._id && (
                <View style={styles.expanded}>
                  <Text style={styles.historyLabel}>Medical History</Text>
                  <Text style={styles.history}>{p.medicalHistory || 'No history recorded.'}</Text>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))}
        {patients.length === 0 && <Text style={styles.empty}>No patients yet.</Text>}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Patient</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <Input label="Full Name *" placeholder="Patient name" value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
            <Input label="Email *" placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={v => setForm({ ...form, email: v })} />
            <Input label="Password *" placeholder="Password" secureTextEntry value={form.password} onChangeText={v => setForm({ ...form, password: v })} />
            <Input label="Age" placeholder="Age" keyboardType="numeric" value={form.age} onChangeText={v => setForm({ ...form, age: v })} />
            <Input label="Medical History" placeholder="Describe medical history..." value={form.medicalHistory} onChangeText={v => setForm({ ...form, medicalHistory: v })} multiline style={{ height: 80 }} />
            <Button title="Add Patient" onPress={handleAdd} loading={loading} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100, padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.gray800 },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  logoutBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  logoutText: { fontSize: 16 },
  name: { fontSize: 16, fontWeight: '700', color: colors.gray800 },
  sub: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  expanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.gray100 },
  historyLabel: { fontSize: 12, fontWeight: '700', color: colors.gray500, marginBottom: 4 },
  history: { fontSize: 13, color: colors.gray700, lineHeight: 18 },
  empty: { textAlign: 'center', color: colors.gray400, marginTop: 40 },
  modal: { flex: 1, backgroundColor: colors.white, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.gray800 },
  closeBtn: { fontSize: 20, color: colors.gray400 },
});
