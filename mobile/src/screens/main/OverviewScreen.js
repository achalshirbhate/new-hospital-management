import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, Modal, FlatList, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function OverviewScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [pendingPatients, setPendingPatients] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const load = async () => {
    try {
      const [statsRes, doctorsRes, emergencyRes, pendingRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/doctors'),
        api.get('/emergency'),
        api.get('/patients/pending'),
      ]);
      setStats(statsRes.data);
      setDoctors(doctorsRes.data);
      setEmergencies(emergencyRes.data);
      setPendingPatients(pendingRes.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, []);

  const openDoctorDetail = async (doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(true);
    try {
      const { data } = await api.get('/patients');
      const filtered = data.filter(p => p.assignedDoctor?._id === doctor.userId?._id || p.assignedDoctor?._id === doctor._id);
      setDoctorPatients(filtered);
    } catch {}
  };

  const resolveEmergency = async (id) => {
    try {
      await api.put(`/emergency/${id}/resolve`);
      load();
    } catch {}
  };

  const approvePatient = async (id) => {
    try {
      await api.put(`/patients/${id}/approve`);
      load();
      Alert.alert('✅ Approved', 'Patient has been approved.');
    } catch {}
  };

  const rejectPatient = async (id) => {
    try {
      await api.put(`/patients/${id}/reject`);
      load();
    } catch {}
  };

  const activeEmergencies = emergencies.filter(e => e.status === 'ACTIVE');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.role}>🏥 Admin · Main Doctor</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowEmergencyModal(true)}>
              <Text style={styles.iconBtnText}>🚨</Text>
              {activeEmergencies.length > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{activeEmergencies.length}</Text></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: logout }
            ])}>
              <Text style={styles.iconBtnText}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Emergencies Banner */}
        {activeEmergencies.length > 0 && (
          <TouchableOpacity style={styles.emergencyBanner} onPress={() => setShowEmergencyModal(true)}>
            <Text style={styles.emergencyBannerIcon}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyBannerTitle}>{activeEmergencies.length} Active Emergency{activeEmergencies.length > 1 ? 'ies' : ''}</Text>
              <Text style={styles.emergencyBannerSub}>{activeEmergencies[0]?.requestedBy?.name} needs help</Text>
            </View>
            <Text style={styles.emergencyBannerArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Pending Patient Approvals */}
        {pendingPatients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏳ Pending Patient Approvals</Text>
            {pendingPatients.map(p => (
              <View key={p._id} style={styles.pendingCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingName}>{p.userId?.name}</Text>
                  <Text style={styles.pendingSub}>Added by Dr. {p.addedBy?.name}</Text>
                </View>
                <TouchableOpacity style={styles.approveBtn} onPress={() => approvePatient(p._id)}>
                  <Text style={styles.approveBtnText}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectPatient(p._id)}>
                  <Text style={styles.rejectBtnText}>✗</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Stats */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard icon="👥" label="Patients" value={stats.totalPatients || 0} color={colors.primary} />
              <StatCard icon="👨‍⚕️" label="Doctors" value={stats.totalDoctors || 0} color={colors.secondary} />
              <StatCard icon="📅" label="Appointments" value={stats.totalAppointments || 0} color={colors.success} />
              <StatCard icon="💬" label="Pending Chats" value={stats.pendingChatTokens || 0} color={colors.warning} />
            </View>
          </View>
        )}

        {/* Doctors List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍⚕️ Doctors</Text>
          <Text style={styles.sectionSub}>Tap a doctor to view their patients</Text>
          {doctors.map(doc => (
            <TouchableOpacity key={doc._id} style={styles.doctorCard} onPress={() => openDoctorDetail(doc)}>
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorAvatarText}>{doc.userId?.name?.charAt(0) || 'D'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorName}>{doc.userId?.name}</Text>
                <Text style={styles.doctorSpec}>{doc.specialization || 'Cardiology'}</Text>
              </View>
              <Text style={styles.doctorArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Doctor Detail Modal */}
      <Modal visible={showDoctorModal} animationType="slide" onRequestClose={() => setShowDoctorModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
              <Text style={styles.modalBack}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Dr. {selectedDoctor?.userId?.name}</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={{ padding: spacing.md }}>
            <Text style={styles.modalSubtitle}>{selectedDoctor?.specialization || 'Cardiology'}</Text>
            <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Patients ({doctorPatients.length})</Text>
            {doctorPatients.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>No patients assigned</Text>
              </View>
            ) : (
              doctorPatients.map(p => (
                <View key={p._id} style={styles.patientCard}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>{p.userId?.name?.charAt(0) || 'P'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{p.userId?.name}</Text>
                    <Text style={styles.patientEmail}>{p.userId?.email}</Text>
                    {p.medicalHistory ? <Text style={styles.patientHistory} numberOfLines={1}>{p.medicalHistory}</Text> : null}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Emergency Modal */}
      <Modal visible={showEmergencyModal} animationType="slide" onRequestClose={() => setShowEmergencyModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEmergencyModal(false)}>
              <Text style={styles.modalBack}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>🚨 Emergencies</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={{ padding: spacing.md }}>
            {emergencies.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>No emergencies</Text>
              </View>
            ) : (
              emergencies.map(e => (
                <View key={e._id} style={[styles.emergencyCard, e.status === 'RESOLVED' && styles.emergencyResolved]}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.emergencyRow}>
                      <Text style={styles.emergencyName}>{e.requestedBy?.name}</Text>
                      <View style={[styles.statusBadge, e.status === 'ACTIVE' ? styles.statusActive : styles.statusResolved]}>
                        <Text style={styles.statusText}>{e.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.emergencyMsg}>{e.message}</Text>
                    <Text style={styles.emergencyTime}>{new Date(e.createdAt).toLocaleString()}</Text>
                  </View>
                  {e.status === 'ACTIVE' && (
                    <TouchableOpacity style={styles.resolveBtn} onPress={() => resolveEmergency(e._id)}>
                      <Text style={styles.resolveBtnText}>Resolve</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingTop: spacing.sm, backgroundColor: colors.white, ...shadow.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 20, fontWeight: '700' },
  greeting: { fontSize: 12, color: colors.textSecondary },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  role: { fontSize: 11, color: colors.primary },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { fontSize: 18 },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: colors.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  emergencyBanner: { margin: spacing.md, backgroundColor: colors.emergencyLight, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: colors.emergency },
  emergencyBannerIcon: { fontSize: 24, marginRight: spacing.sm },
  emergencyBannerTitle: { fontSize: 14, fontWeight: '700', color: colors.emergency },
  emergencyBannerSub: { fontSize: 12, color: colors.textSecondary },
  emergencyBannerArrow: { fontSize: 24, color: colors.emergency },
  section: { padding: spacing.md, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  sectionSub: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: -spacing.xs },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, borderLeftWidth: 4, ...shadow.sm },
  statIcon: { fontSize: 24, marginBottom: spacing.xs },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  doctorCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', ...shadow.sm },
  doctorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  doctorAvatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  doctorName: { fontSize: 15, fontWeight: '600', color: colors.text },
  doctorSpec: { fontSize: 12, color: colors.primary, marginTop: 2 },
  doctorArrow: { fontSize: 24, color: colors.textLight },
  pendingCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', ...shadow.sm, borderLeftWidth: 3, borderLeftColor: colors.warning },
  pendingName: { fontSize: 14, fontWeight: '600', color: colors.text },
  pendingSub: { fontSize: 12, color: colors.textSecondary },
  approveBtn: { backgroundColor: colors.successLight, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6, marginLeft: spacing.sm },
  approveBtnText: { color: colors.success, fontSize: 12, fontWeight: '600' },
  rejectBtn: { backgroundColor: colors.dangerLight, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6, marginLeft: spacing.xs },
  rejectBtnText: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalBack: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  modalSubtitle: { fontSize: 14, color: colors.primary, marginBottom: spacing.sm },
  patientCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', ...shadow.sm },
  patientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  patientAvatarText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  patientName: { fontSize: 14, fontWeight: '600', color: colors.text },
  patientEmail: { fontSize: 12, color: colors.textSecondary },
  patientHistory: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  emergencyCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', ...shadow.sm, borderLeftWidth: 3, borderLeftColor: colors.emergency },
  emergencyResolved: { borderLeftColor: colors.success, opacity: 0.7 },
  emergencyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  emergencyName: { fontSize: 14, fontWeight: '700', color: colors.text },
  emergencyMsg: { fontSize: 13, color: colors.textSecondary },
  emergencyTime: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusActive: { backgroundColor: colors.emergencyLight },
  statusResolved: { backgroundColor: colors.successLight },
  statusText: { fontSize: 10, fontWeight: '700' },
  resolveBtn: { backgroundColor: colors.successLight, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6, marginLeft: spacing.sm },
  resolveBtnText: { color: colors.success, fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: { fontSize: 14, color: colors.textSecondary },
});
