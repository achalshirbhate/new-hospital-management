import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Alert, RefreshControl, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

// ─── Dr. Ravikant Patil Tele Patient System — Doctor Patients Screen ───────────

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
  const [symptom, setSymptom] = useState('');
  const [symptomResult, setSymptomResult] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/patients');
      setPatients(data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password)
      return Alert.alert('Missing Fields', 'Name, email and password are required');
    setLoading(true);
    try {
      await api.post('/patients', form);
      setShowAddModal(false);
      setForm({ name: '', email: '', password: '', age: '', medicalHistory: '' });
      load();
      Alert.alert('✅ Submitted', 'Patient addition request sent to Admin for approval.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add patient');
    } finally { setLoading(false); }
  };

  const handleAddPrescription = async () => {
    if (!prescription.title) return Alert.alert('Missing Fields', 'Title is required');
    setLoading(true);
    try {
      await api.post(`/patients/${selectedPatient._id}/prescription`, prescription);
      setPrescription({ title: '', description: '' });
      setShowPrescriptionModal(false);
      const { data } = await api.get(`/patients/${selectedPatient._id}`);
      setSelectedPatient(data);
      Alert.alert('✅ Added', 'Prescription added successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const triggerEmergency = () => {
    Alert.alert('🚨 Emergency Alert', 'Send emergency alert to Admin?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Emergency', style: 'destructive', onPress: async () => {
          setEmergencyLoading(true);
          try {
            await api.post('/emergency', { message: 'Doctor needs emergency assistance!' });
            Alert.alert('🚨 Alert Sent', 'Emergency alert sent to Admin.');
          } catch {
            Alert.alert('Error', 'Failed to send emergency alert');
          } finally { setEmergencyLoading(false); }
        },
      },
    ]);
  };

  const checkSymptom = () => {
    if (!symptom.trim()) return;
    const s = symptom.toLowerCase();
    let result = 'Possible: General illness — monitor and follow up.';
    if (s.includes('chest') || s.includes('heart') || s.includes('palpitation'))
      result = '⚠️ Possible: Cardiac issue — consult immediately.';
    else if (s.includes('breath') || s.includes('oxygen') || s.includes('wheez'))
      result = '⚠️ Possible: Respiratory distress — urgent evaluation needed.';
    else if (s.includes('head') || s.includes('dizz') || s.includes('migraine'))
      result = 'Possible: Neurological — recommend imaging if persistent.';
    else if (s.includes('fever') || s.includes('chill') || s.includes('sweat'))
      result = 'Possible: Infection / Viral — check CBC and vitals.';
    else if (s.includes('stomach') || s.includes('nausea') || s.includes('vomit'))
      result = 'Possible: GI issue — dietary review and antacids.';
    setSymptomResult(result);
  };

  const filtered = patients.filter(p =>
    p.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.userId?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{user?.name?.charAt(0) || 'D'}</Text>
          </View>
          <View>
            <Text style={styles.appName}>Dr. Ravikant Patil Tele Patient System</Text>
            <Text style={styles.greeting}>Hello, Dr. {user?.name} 👋</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>🩺 Doctor</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconCircle, { backgroundColor: colors.emergencyLight }]}
            onPress={triggerEmergency}
            disabled={emergencyLoading}
          >
            <Text style={styles.iconCircleText}>🚨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconCircle, { backgroundColor: colors.gray100 }]}
            onPress={handleLogout}
          >
            <Text style={styles.iconCircleText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search + Add ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search patients by name or email..."
            placeholderTextColor={colors.textLight}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ fontSize: 16, color: colors.textLight }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.addPatientBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addPatientBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* ── Patient List ── */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Section header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Patients</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filtered.length}</Text>
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No patients found</Text>
            <Text style={styles.emptyText}>
              {search ? 'Try a different search term' : 'Tap ＋ to add your first patient'}
            </Text>
          </View>
        ) : (
          filtered.map((p, idx) => (
            <TouchableOpacity
              key={p._id}
              style={styles.patientCard}
              onPress={() => { setSelectedPatient(p); setShowPatientDetail(true); }}
              activeOpacity={0.85}
            >
              <View style={[styles.patientAvatar, { backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] + '22' }]}>
                <Text style={[styles.patientAvatarText, { color: AVATAR_COLORS[idx % AVATAR_COLORS.length] }]}>
                  {p.userId?.name?.charAt(0)?.toUpperCase() || 'P'}
                </Text>
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{p.userId?.name}</Text>
                <Text style={styles.patientEmail}>✉️ {p.userId?.email}</Text>
                {p.age ? (
                  <Text style={styles.patientMeta}>🎂 Age {p.age}</Text>
                ) : null}
                {p.medicalHistory ? (
                  <Text style={styles.patientHistory} numberOfLines={1}>
                    📋 {p.medicalHistory}
                  </Text>
                ) : null}
              </View>
              <View style={styles.patientCardRight}>
                {p.approvalStatus === 'PENDING' && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>⏳ Pending</Text>
                  </View>
                )}
                {p.approvalStatus === 'APPROVED' && (
                  <View style={styles.approvedBadge}>
                    <Text style={styles.approvedBadgeText}>✓ Active</Text>
                  </View>
                )}
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Add Patient Modal ── */}
      <Modal visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalHeaderBtn}>
              <Text style={styles.modalCancelText}>✕ Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>➕ Add Patient</Text>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={loading}
              style={[styles.modalHeaderBtn, styles.modalSaveBtn, loading && { opacity: 0.5 }]}
            >
              <Text style={styles.modalSaveText}>{loading ? 'Saving…' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.infoNotice}>
                <Text style={styles.infoNoticeText}>
                  ℹ️  Patient registration requires Admin approval before the patient can log in.
                </Text>
              </View>
              <FormField label="Full Name *" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Patient's full name" />
              <FormField label="Email Address *" value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} placeholder="patient@example.com" keyboardType="email-address" />
              <FormField label="Temporary Password *" value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} placeholder="Set a temporary password" secureTextEntry />
              <FormField label="Age" value={form.age} onChangeText={v => setForm(f => ({ ...f, age: v }))} placeholder="e.g. 45" keyboardType="numeric" />
              <FormField label="Medical History" value={form.medicalHistory} onChangeText={v => setForm(f => ({ ...f, medicalHistory: v }))} placeholder="Existing conditions, allergies, past surgeries…" multiline />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── Patient Detail Modal ── */}
      <Modal visible={showPatientDetail} animationType="slide" onRequestClose={() => setShowPatientDetail(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPatientDetail(false)} style={styles.modalHeaderBtn}>
              <Text style={styles.modalCancelText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Patient Details</Text>
            <TouchableOpacity
              onPress={() => setShowPrescriptionModal(true)}
              style={[styles.modalHeaderBtn, styles.modalSaveBtn]}
            >
              <Text style={styles.modalSaveText}>＋ Rx</Text>
            </TouchableOpacity>
          </View>

          {selectedPatient && (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>

              {/* Patient Hero Card */}
              <View style={styles.detailHeroCard}>
                <View style={styles.detailHeroAvatar}>
                  <Text style={styles.detailHeroAvatarText}>
                    {selectedPatient.userId?.name?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.detailHeroName}>{selectedPatient.userId?.name}</Text>
                <Text style={styles.detailHeroEmail}>{selectedPatient.userId?.email}</Text>
                <View style={styles.detailHeroMeta}>
                  {selectedPatient.age ? (
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>🎂 Age {selectedPatient.age}</Text>
                    </View>
                  ) : null}
                  <View style={[styles.metaChip, {
                    backgroundColor: selectedPatient.approvalStatus === 'APPROVED'
                      ? colors.successLight : colors.warningLight,
                  }]}>
                    <Text style={[styles.metaChipText, {
                      color: selectedPatient.approvalStatus === 'APPROVED'
                        ? colors.success : colors.warning,
                    }]}>
                      {selectedPatient.approvalStatus === 'APPROVED' ? '✓ Active' : '⏳ Pending'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Medical History */}
              {selectedPatient.medicalHistory ? (
                <View style={styles.detailSection}>
                  <View style={styles.detailSectionHeader}>
                    <Text style={styles.detailSectionIcon}>📋</Text>
                    <Text style={styles.detailSectionTitle}>Medical History</Text>
                  </View>
                  <Text style={styles.detailSectionBody}>{selectedPatient.medicalHistory}</Text>
                </View>
              ) : null}

              {/* Prescriptions Timeline */}
              <View style={styles.detailSection}>
                <View style={styles.detailSectionHeader}>
                  <Text style={styles.detailSectionIcon}>💊</Text>
                  <Text style={styles.detailSectionTitle}>
                    Prescriptions ({selectedPatient.prescriptions?.length || 0})
                  </Text>
                </View>
                {!selectedPatient.prescriptions?.length ? (
                  <View style={styles.emptyInline}>
                    <Text style={styles.emptyInlineText}>No prescriptions yet. Tap ＋ Rx to add one.</Text>
                  </View>
                ) : (
                  selectedPatient.prescriptions.map((rx, i) => (
                    <View key={i} style={styles.rxTimelineItem}>
                      <View style={styles.rxTimelineDot} />
                      {i < selectedPatient.prescriptions.length - 1 && (
                        <View style={styles.rxTimelineLine} />
                      )}
                      <View style={styles.rxTimelineCard}>
                        <Text style={styles.rxTimelineTitle}>{rx.title}</Text>
                        {rx.description ? (
                          <Text style={styles.rxTimelineDesc}>{rx.description}</Text>
                        ) : null}
                        <Text style={styles.rxTimelineDate}>
                          📅 {new Date(rx.addedAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Reports */}
              {selectedPatient.reports?.length > 0 && (
                <View style={styles.detailSection}>
                  <View style={styles.detailSectionHeader}>
                    <Text style={styles.detailSectionIcon}>📄</Text>
                    <Text style={styles.detailSectionTitle}>
                      Reports ({selectedPatient.reports.length})
                    </Text>
                  </View>
                  {selectedPatient.reports.map((r, i) => (
                    <View key={i} style={styles.reportRow}>
                      <Text style={styles.reportRowIcon}>📄</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reportRowTitle}>{r.title || r.fileName || 'Report'}</Text>
                        <Text style={styles.reportRowDate}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Symptom Checker */}
              <View style={styles.detailSection}>
                <View style={styles.detailSectionHeader}>
                  <Text style={styles.detailSectionIcon}>🔬</Text>
                  <Text style={styles.detailSectionTitle}>Symptom Checker</Text>
                </View>
                <Text style={styles.symptomHint}>
                  Enter patient's reported symptoms for a quick assessment.
                </Text>
                <View style={styles.symptomInputRow}>
                  <TextInput
                    style={styles.symptomInput}
                    value={symptom}
                    onChangeText={setSymptom}
                    placeholder="e.g. chest pain, shortness of breath…"
                    placeholderTextColor={colors.textLight}
                  />
                  <TouchableOpacity style={styles.symptomCheckBtn} onPress={checkSymptom}>
                    <Text style={styles.symptomCheckBtnText}>Check</Text>
                  </TouchableOpacity>
                </View>
                {symptomResult ? (
                  <View style={styles.symptomResult}>
                    <Text style={styles.symptomResultText}>{symptomResult}</Text>
                  </View>
                ) : null}
              </View>

              <View style={{ height: 60 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ── Add Prescription Bottom Sheet ── */}
      <Modal
        visible={showPrescriptionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPrescriptionModal(false)}
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>💊 Add Prescription</Text>
              <Text style={styles.bottomSheetSubtitle}>
                For {selectedPatient?.userId?.name}
              </Text>
              <FormField
                label="Medication / Title *"
                value={prescription.title}
                onChangeText={v => setPrescription(p => ({ ...p, title: v }))}
                placeholder="e.g. Aspirin 75mg once daily"
              />
              <FormField
                label="Instructions / Description"
                value={prescription.description}
                onChangeText={v => setPrescription(p => ({ ...p, description: v }))}
                placeholder="Dosage, timing, special instructions…"
                multiline
              />
              <View style={styles.sheetBtnRow}>
                <TouchableOpacity
                  style={styles.sheetCancelBtn}
                  onPress={() => setShowPrescriptionModal(false)}
                >
                  <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sheetSaveBtn, loading && { opacity: 0.6 }]}
                  onPress={handleAddPrescription}
                  disabled={loading}
                >
                  <Text style={styles.sheetSaveText}>
                    {loading ? 'Saving…' : '✓ Add Prescription'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function FormField({ label, value, onChangeText, placeholder, multiline, keyboardType, secureTextEntry }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        multiline={multiline}
        keyboardType={keyboardType || 'default'}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

// ─── Avatar colour palette ────────────────────────────────────────────────────
const AVATAR_COLORS = [
  colors.primary, '#9C27B0', '#00897B', '#F4511E', '#039BE5', '#7CB342',
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
    ...shadow.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm },
  headerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  appName: { fontSize: 10, color: colors.primary, fontWeight: '600', letterSpacing: 0.3 },
  greeting: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 1 },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.primaryLight,
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2,
  },
  roleBadgeText: { fontSize: 10, color: colors.primary, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  iconCircleText: { fontSize: 18 },

  // Search row
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: radius.full,
    paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 15, marginRight: spacing.xs },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: colors.text },
  addPatientBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    ...shadow.sm,
  },
  addPatientBtnText: { color: colors.white, fontSize: 22, fontWeight: '300', lineHeight: 26 },

  // List
  listContainer: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  countBadge: {
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 2,
  },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  // Patient card
  patientCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center',
    ...shadow.sm,
  },
  patientAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  patientAvatarText: { fontSize: 20, fontWeight: '800' },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 15, fontWeight: '700', color: colors.text },
  patientEmail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  patientMeta: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  patientHistory: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  patientCardRight: { alignItems: 'flex-end', gap: 4 },
  pendingBadge: {
    backgroundColor: colors.warningLight, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pendingBadgeText: { fontSize: 10, fontWeight: '700', color: colors.warning },
  approvedBadge: {
    backgroundColor: colors.successLight, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  approvedBadgeText: { fontSize: 10, fontWeight: '700', color: colors.success },
  chevron: { fontSize: 22, color: colors.textLight, marginTop: 2 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  emptyIcon: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

  // Modal shared
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 12,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
    ...shadow.sm,
  },
  modalHeaderBtn: { minWidth: 70 },
  modalCancelText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  modalSaveBtn: { alignItems: 'flex-end' },
  modalSaveText: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  modalBody: { flex: 1, padding: spacing.md },

  // Info notice
  infoNotice: {
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  infoNoticeText: { fontSize: 13, color: colors.primary, lineHeight: 18 },

  // Form fields
  fieldWrap: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: {
    backgroundColor: colors.white, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: 14, color: colors.text,
    borderWidth: 1.5, borderColor: colors.border,
  },
  fieldInputMulti: { height: 90, textAlignVertical: 'top' },

  // Detail hero card
  detailHeroCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md,
    ...shadow.md,
  },
  detailHeroAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm, borderWidth: 3, borderColor: colors.primary,
  },
  detailHeroAvatarText: { fontSize: 36, fontWeight: '800', color: colors.primary },
  detailHeroName: { fontSize: 22, fontWeight: '800', color: colors.text },
  detailHeroEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  detailHeroMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  metaChip: {
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  metaChipText: { fontSize: 12, fontWeight: '600', color: colors.primary },

  // Detail sections
  detailSection: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md, ...shadow.sm,
  },
  detailSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.xs },
  detailSectionIcon: { fontSize: 18 },
  detailSectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  detailSectionBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },

  // Rx timeline
  rxTimelineItem: { flexDirection: 'row', marginBottom: spacing.sm },
  rxTimelineDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.primary, marginTop: 4, marginRight: spacing.sm,
  },
  rxTimelineLine: {
    position: 'absolute', left: 5, top: 16,
    width: 2, height: '100%', backgroundColor: colors.border,
  },
  rxTimelineCard: {
    flex: 1, backgroundColor: colors.primaryLight,
    borderRadius: radius.md, padding: spacing.sm,
  },
  rxTimelineTitle: { fontSize: 14, fontWeight: '700', color: colors.primary },
  rxTimelineDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  rxTimelineDate: { fontSize: 11, color: colors.textLight, marginTop: 4 },

  // Reports
  reportRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  reportRowIcon: { fontSize: 22, marginRight: spacing.sm },
  reportRowTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  reportRowDate: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  // Symptom checker
  symptomHint: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm },
  symptomInputRow: { flexDirection: 'row', gap: spacing.sm },
  symptomInput: {
    flex: 1, backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: 13, color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  symptomCheckBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.md, justifyContent: 'center',
  },
  symptomCheckBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  symptomResult: {
    marginTop: spacing.sm, backgroundColor: colors.warningLight,
    borderRadius: radius.md, padding: spacing.sm,
    borderLeftWidth: 3, borderLeftColor: colors.warning,
  },
  symptomResultText: { fontSize: 13, color: colors.text, lineHeight: 18 },

  // Empty inline
  emptyInline: {
    backgroundColor: colors.background, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
  },
  emptyInlineText: { fontSize: 13, color: colors.textSecondary },

  // Bottom sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xl,
  },
  bottomSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md,
  },
  bottomSheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  bottomSheetSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md, marginTop: 2 },
  sheetBtnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  sheetCancelBtn: {
    flex: 1, backgroundColor: colors.gray100, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
  },
  sheetCancelText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  sheetSaveBtn: {
    flex: 2, backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', ...shadow.sm,
  },
  sheetSaveText: { fontSize: 14, fontWeight: '700', color: colors.white },
});
