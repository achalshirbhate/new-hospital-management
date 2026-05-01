import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Alert, RefreshControl, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function PatientsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPatientDetail, setShowPatientDetail] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', medicalHistory: '' });
  const [prescription, setPrescription] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/patients');
      setPatients(data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) return Alert.alert('Error', 'Name, email and password are required');
    setLoading(true);
    try {
      await api.post('/patients', form);
      setShowAddModal(false);
      setForm({ name: '', email: '', password: '', age: '', medicalHistory: '' });
      load();
      Alert.alert('✅ Submitted', 'Patient addition request sent to Admin for approval.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const handleAddPrescription = async () => {
    if (!prescription.title) return Alert.alert('Error', 'Title is required');
    setLoading(true);
    try {
      await api.post(`/patients/${selectedPatient._id}/prescription`, prescription);
      setPrescription({ title: '', description: '' });
      setShowPrescriptionModal(false);
      // Refresh patient detail
      const { data } = await api.get(`/patients/${selectedPatient._id}`);
      setSelectedPatient(data);
      Alert.alert('✅ Added', 'Prescription added successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const triggerEmergency = async () => {
    Alert.alert('🚨 Emergency', 'Send emergency alert to Admin?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Emergency', style: 'destructive', onPress: async () => {
          setEmergencyLoading(true);
          try {
            await api.post('/emergency', { message: 'Doctor needs emergency assistance!' });
            Alert.alert('🚨 Sent', 'Emergency alert sent to Admin.');
          } catch {
            Alert.alert('Error', 'Failed to send emergency');
          } finally { setEmergencyLoading(false); }
        }
      }
    ]);
  };

  const filtered = patients.filter(p =>
    p.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.userId?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>Dr. {user?.name}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.emergencyBtn} onPress={triggerEmergency}>
            <Text style={styles.emergencyBtnText}>🚨</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addBtnText}>+ Add Patient</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search patients..."
          placeholderTextColor={colors.textLight}
        />
      </View>

      <ScrollView
        style={{ flex: 1, padding: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>My Patients ({filtered.length})</Text>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No patients yet</Text>
            <Text style={styles.emptyText}>Add a patient to get started</Text>
          </View>
        ) : (
          filtered.map(p => (
            <TouchableOpacity key={p._id} style={styles.patientCard} onPress={() => { setSelectedPatient(p); setShowPatientDetail(true); }}>
              <View style={styles.patientAvatar}>
                <Text style={styles.patientAvatarText}>{p.userId?.name?.charAt(0) || 'P'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{p.userId?.name}</Text>
                <Text style={styles.patientEmail}>{p.userId?.email}</Text>
                {p.age ? <Text style={styles.patientAge}>Age: {p.age}</Text> : null}
              </View>
              <View style={styles.patientRight}>
                {p.approvalStatus === 'PENDING' && (
                  <View style={styles.pendingBadge}><Text style={styles.pendingBadgeText}>Pending</Text></View>
                )}
                <Text style={styles.patientArrow}>›</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Patient Modal */}
      <Modal visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Patient</Text>
            <TouchableOpacity onPress={handleAdd} disabled={loading}>
              <Text style={[styles.modalSave, loading && { opacity: 0.5 }]}>Submit</Text>
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView style={{ padding: spacing.md }}>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>ℹ️ Patient addition requires Admin approval before they can access the app.</Text>
              </View>
              <FormField label="Full Name *" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Patient's full name" />
              <FormField label="Email *" value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} placeholder="patient@email.com" keyboardType="email-address" />
              <FormField label="Password *" value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} placeholder="Temporary password" secureTextEntry />
              <FormField label="Age" value={form.age} onChangeText={v => setForm(f => ({ ...f, age: v }))} placeholder="Age" keyboardType="numeric" />
              <FormField label="Medical History" value={form.medicalHistory} onChangeText={v => setForm(f => ({ ...f, medicalHistory: v }))} placeholder="Brief medical history..." multiline />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Patient Detail Modal */}
      <Modal visible={showPatientDetail} animationType="slide" onRequestClose={() => setShowPatientDetail(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPatientDetail(false)}>
              <Text style={styles.modalCancel}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Patient Details</Text>
            <TouchableOpacity onPress={() => setShowPrescriptionModal(true)}>
              <Text style={styles.modalSave}>+ Rx</Text>
            </TouchableOpacity>
          </View>
          {selectedPatient && (
            <ScrollView style={{ padding: spacing.md }}>
              {/* Patient Info */}
              <View style={styles.detailCard}>
                <View style={styles.detailAvatar}>
                  <Text style={styles.detailAvatarText}>{selectedPatient.userId?.name?.charAt(0)}</Text>
                </View>
                <Text style={styles.detailName}>{selectedPatient.userId?.name}</Text>
                <Text style={styles.detailEmail}>{selectedPatient.userId?.email}</Text>
                {selectedPatient.age ? <Text style={styles.detailInfo}>Age: {selectedPatient.age}</Text> : null}
              </View>

              {/* Medical History */}
              {selectedPatient.medicalHistory ? (
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>📋 Medical History</Text>
                  <Text style={styles.infoSectionText}>{selectedPatient.medicalHistory}</Text>
                </View>
              ) : null}

              {/* Prescriptions */}
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>💊 Prescriptions ({selectedPatient.prescriptions?.length || 0})</Text>
                {selectedPatient.prescriptions?.length === 0 || !selectedPatient.prescriptions ? (
                  <Text style={styles.emptyText}>No prescriptions yet</Text>
                ) : (
                  selectedPatient.prescriptions.map((rx, i) => (
                    <View key={i} style={styles.rxCard}>
                      <Text style={styles.rxTitle}>{rx.title}</Text>
                      {rx.description ? <Text style={styles.rxDesc}>{rx.description}</Text> : null}
                      <Text style={styles.rxDate}>{new Date(rx.addedAt).toLocaleDateString()}</Text>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Add Prescription Modal */}
      <Modal visible={showPrescriptionModal} animationType="slide" transparent onRequestClose={() => setShowPrescriptionModal(false)}>
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetContent}>
            <Text style={styles.bottomSheetTitle}>💊 Add Prescription</Text>
            <FormField label="Title *" value={prescription.title} onChangeText={v => setPrescription(p => ({ ...p, title: v }))} placeholder="e.g. Aspirin 75mg" />
            <FormField label="Description" value={prescription.description} onChangeText={v => setPrescription(p => ({ ...p, description: v }))} placeholder="Dosage, instructions..." multiline />
            <View style={styles.bottomSheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPrescriptionModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddPrescription} disabled={loading}>
                <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Add Prescription'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FormField({ label, value, onChangeText, placeholder, multiline, keyboardType, secureTextEntry }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        multiline={multiline}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: colors.white, ...shadow.sm },
  greeting: { fontSize: 12, color: colors.textSecondary },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  headerRight: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  emergencyBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.emergencyLight, alignItems: 'center', justifyContent: 'center' },
  emergencyBtnText: { fontSize: 18 },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  addBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, margin: spacing.md, borderRadius: radius.full, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 14, color: colors.text },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  patientCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', ...shadow.sm },
  patientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  patientAvatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  patientName: { fontSize: 15, fontWeight: '600', color: colors.text },
  patientEmail: { fontSize: 12, color: colors.textSecondary },
  patientAge: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  patientRight: { alignItems: 'flex-end', gap: 4 },
  pendingBadge: { backgroundColor: colors.warningLight, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  pendingBadgeText: { fontSize: 10, fontWeight: '700', color: colors.warning },
  patientArrow: { fontSize: 24, color: colors.textLight },
  emptyState: { alignItems: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 56, marginBottom: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  emptyText: { fontSize: 13, color: colors.textSecondary },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalCancel: { fontSize: 15, color: colors.textSecondary },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  modalSave: { fontSize: 15, color: colors.primary, fontWeight: '700' },
  infoBox: { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  infoText: { fontSize: 13, color: colors.primary },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  fieldInput: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border },
  detailCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md, ...shadow.md },
  detailAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  detailAvatarText: { fontSize: 32, fontWeight: '700', color: colors.primary },
  detailName: { fontSize: 20, fontWeight: '800', color: colors.text },
  detailEmail: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  detailInfo: { fontSize: 13, color: colors.textLight, marginTop: 4 },
  infoSection: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, ...shadow.sm },
  infoSectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  infoSectionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  rxCard: { backgroundColor: colors.primaryLight, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm },
  rxTitle: { fontSize: 14, fontWeight: '700', color: colors.primary },
  rxDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  rxDate: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  bottomSheet: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheetContent: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  bottomSheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  bottomSheetBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: { flex: 1, backgroundColor: colors.gray200, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  saveBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
});
