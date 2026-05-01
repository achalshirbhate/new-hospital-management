import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Alert, RefreshControl, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

// ─── Dr. Ravikant Patil Tele Patient System — Admin Overview Screen ───────────

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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const openDoctorDetail = async (doctor) => {
    setSelectedDoctor(doctor);
    setDoctorPatients([]);
    setShowDoctorModal(true);
    try {
      const { data } = await api.get('/patients');
      const filtered = data.filter(
        p => p.assignedDoctor?._id === doctor.userId?._id ||
             p.assignedDoctor?._id === doctor._id
      );
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
      Alert.alert('✅ Approved', 'Patient has been approved and can now log in.');
    } catch {}
  };

  const rejectPatient = async (id) => {
    Alert.alert('Reject Patient', 'Are you sure you want to reject this patient?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          try {
            await api.put(`/patients/${id}/reject`);
            load();
          } catch {}
        },
      },
    ]);
  };

  const activeEmergencies = emergencies.filter(e => e.status === 'ACTIVE');

  // Simple bar chart helper — returns width % for a value relative to max
  const barWidth = (val, max) => {
    if (!max || !val) return '4%';
    return `${Math.max(4, Math.round((val / max) * 100))}%`;
  };
  const statsMax = stats
    ? Math.max(stats.totalPatients || 0, stats.totalDoctors || 0, stats.totalAppointments || 0, stats.pendingChatTokens || 0, 1)
    : 1;

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</Text>
          </View>
          <View>
            <Text style={styles.appName}>Dr. Ravikant Patil Tele Patient System</Text>
            <Text style={styles.headerName}>Dr. Ravikant Patil</Text>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>🏥 Admin · Main Doctor</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          {/* Emergency bell with badge */}
          <TouchableOpacity
            style={[styles.iconCircle, { backgroundColor: colors.emergencyLight }]}
            onPress={() => setShowEmergencyModal(true)}
          >
            <Text style={styles.iconCircleText}>🚨</Text>
            {activeEmergencies.length > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{activeEmergencies.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          {/* Notifications */}
          <TouchableOpacity style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.iconCircleText}>🔔</Text>
            {pendingPatients.length > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{pendingPatients.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          {/* Logout */}
          <TouchableOpacity
            style={[styles.iconCircle, { backgroundColor: colors.gray100 }]}
            onPress={handleLogout}
          >
            <Text style={styles.iconCircleText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Active Emergency Banner ── */}
        {activeEmergencies.length > 0 && (
          <TouchableOpacity
            style={styles.emergencyBanner}
            onPress={() => setShowEmergencyModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.emergencyBannerPulse}>
              <Text style={styles.emergencyBannerIcon}>🚨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyBannerTitle}>
                {activeEmergencies.length} Active Emergency{activeEmergencies.length > 1 ? ' Alerts' : ''}
              </Text>
              <Text style={styles.emergencyBannerSub}>
                {activeEmergencies[0]?.requestedBy?.name} needs immediate help
              </Text>
            </View>
            <Text style={styles.emergencyBannerChevron}>›</Text>
          </TouchableOpacity>
        )}

        {/* ── Pending Patient Approvals ── */}
        {pendingPatients.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderIcon}>⏳</Text>
              <Text style={styles.sectionTitle}>Pending Approvals</Text>
              <View style={styles.warningCountBadge}>
                <Text style={styles.warningCountText}>{pendingPatients.length}</Text>
              </View>
            </View>
            {pendingPatients.map(p => (
              <View key={p._id} style={styles.pendingCard}>
                <View style={styles.pendingAvatar}>
                  <Text style={styles.pendingAvatarText}>
                    {p.userId?.name?.charAt(0)?.toUpperCase() || 'P'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingName}>{p.userId?.name}</Text>
                  <Text style={styles.pendingSub}>
                    Added by Dr. {p.addedBy?.name || 'Unknown'}
                  </Text>
                  <Text style={styles.pendingEmail}>{p.userId?.email}</Text>
                </View>
                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => approvePatient(p._id)}
                  >
                    <Text style={styles.approveBtnText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => rejectPatient(p._id)}
                  >
                    <Text style={styles.rejectBtnText}>✗</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Stats Grid ── */}
        {stats && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderIcon}>📊</Text>
              <Text style={styles.sectionTitle}>Overview</Text>
            </View>
            <View style={styles.statsGrid}>
              <StatCard
                icon="👥" label="Patients"
                value={stats.totalPatients || 0}
                color={colors.primary}
                bg={colors.primaryLight}
              />
              <StatCard
                icon="👨‍⚕️" label="Doctors"
                value={stats.totalDoctors || 0}
                color="#00897B"
                bg="#E0F2F1"
              />
              <StatCard
                icon="📅" label="Appointments"
                value={stats.totalAppointments || 0}
                color={colors.success}
                bg={colors.successLight}
              />
              <StatCard
                icon="💬" label="Pending Chats"
                value={stats.pendingChatTokens || 0}
                color={colors.warning}
                bg={colors.warningLight}
              />
            </View>
          </View>
        )}

        {/* ── Analytics Bar Chart ── */}
        {stats && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderIcon}>📈</Text>
              <Text style={styles.sectionTitle}>Analytics</Text>
            </View>
            <View style={styles.analyticsCard}>
              <BarRow
                label="Patients"
                value={stats.totalPatients || 0}
                width={barWidth(stats.totalPatients, statsMax)}
                color={colors.primary}
              />
              <BarRow
                label="Doctors"
                value={stats.totalDoctors || 0}
                width={barWidth(stats.totalDoctors, statsMax)}
                color="#00897B"
              />
              <BarRow
                label="Appointments"
                value={stats.totalAppointments || 0}
                width={barWidth(stats.totalAppointments, statsMax)}
                color={colors.success}
              />
              <BarRow
                label="Pending Chats"
                value={stats.pendingChatTokens || 0}
                width={barWidth(stats.pendingChatTokens, statsMax)}
                color={colors.warning}
                last
              />
            </View>
          </View>
        )}

        {/* ── Doctors List ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderIcon}>👨‍⚕️</Text>
            <Text style={styles.sectionTitle}>Doctors</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{doctors.length}</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>Tap a doctor to view their patients</Text>
          {doctors.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardIcon}>👨‍⚕️</Text>
              <Text style={styles.emptyCardText}>No doctors registered yet</Text>
            </View>
          ) : (
            doctors.map((doc, idx) => (
              <TouchableOpacity
                key={doc._id}
                style={styles.doctorCard}
                onPress={() => openDoctorDetail(doc)}
                activeOpacity={0.85}
              >
                <View style={[styles.doctorAvatar, { backgroundColor: DOC_COLORS[idx % DOC_COLORS.length] + '22' }]}>
                  <Text style={[styles.doctorAvatarText, { color: DOC_COLORS[idx % DOC_COLORS.length] }]}>
                    {doc.userId?.name?.charAt(0)?.toUpperCase() || 'D'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.doctorName}>{doc.userId?.name}</Text>
                  <Text style={styles.doctorSpec}>
                    {doc.specialization || 'Cardiology'}
                  </Text>
                  <Text style={styles.doctorEmail}>{doc.userId?.email}</Text>
                </View>
                <View style={styles.doctorRight}>
                  <View style={styles.doctorActiveBadge}>
                    <Text style={styles.doctorActiveBadgeText}>Active</Text>
                  </View>
                  <Text style={styles.doctorChevron}>›</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Doctor Detail Modal ── */}
      <Modal
        visible={showDoctorModal}
        animationType="slide"
        onRequestClose={() => setShowDoctorModal(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDoctorModal(false)} style={styles.modalHeaderBtn}>
              <Text style={styles.modalBackText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              Dr. {selectedDoctor?.userId?.name}
            </Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Doctor hero */}
            <View style={styles.doctorHeroCard}>
              <View style={styles.doctorHeroAvatar}>
                <Text style={styles.doctorHeroAvatarText}>
                  {selectedDoctor?.userId?.name?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.doctorHeroName}>Dr. {selectedDoctor?.userId?.name}</Text>
              <Text style={styles.doctorHeroSpec}>
                {selectedDoctor?.specialization || 'Cardiology'}
              </Text>
              <Text style={styles.doctorHeroEmail}>{selectedDoctor?.userId?.email}</Text>
            </View>

            {/* Patients under this doctor */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderIcon}>👥</Text>
              <Text style={styles.sectionTitle}>
                Patients ({doctorPatients.length})
              </Text>
            </View>
            {doctorPatients.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardIcon}>👥</Text>
                <Text style={styles.emptyCardText}>No patients assigned to this doctor</Text>
              </View>
            ) : (
              doctorPatients.map(p => (
                <View key={p._id} style={styles.patientCard}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>
                      {p.userId?.name?.charAt(0)?.toUpperCase() || 'P'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{p.userId?.name}</Text>
                    <Text style={styles.patientEmail}>{p.userId?.email}</Text>
                    {p.age ? <Text style={styles.patientMeta}>🎂 Age {p.age}</Text> : null}
                    {p.medicalHistory ? (
                      <Text style={styles.patientHistory} numberOfLines={1}>
                        📋 {p.medicalHistory}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[
                    styles.statusPill,
                    p.approvalStatus === 'APPROVED' ? styles.statusPillGreen : styles.statusPillYellow,
                  ]}>
                    <Text style={[
                      styles.statusPillText,
                      { color: p.approvalStatus === 'APPROVED' ? colors.success : colors.warning },
                    ]}>
                      {p.approvalStatus === 'APPROVED' ? '✓ Active' : '⏳ Pending'}
                    </Text>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Emergency Modal ── */}
      <Modal
        visible={showEmergencyModal}
        animationType="slide"
        onRequestClose={() => setShowEmergencyModal(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEmergencyModal(false)} style={styles.modalHeaderBtn}>
              <Text style={styles.modalBackText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>🚨 Emergencies</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {emergencies.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardIcon}>✅</Text>
                <Text style={styles.emptyCardText}>No emergencies — all clear!</Text>
              </View>
            ) : (
              emergencies.map(e => (
                <View
                  key={e._id}
                  style={[
                    styles.emergencyCard,
                    e.status === 'RESOLVED' && styles.emergencyCardResolved,
                  ]}
                >
                  <View style={styles.emergencyCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.emergencyCardName}>{e.requestedBy?.name}</Text>
                      <Text style={styles.emergencyCardMsg}>{e.message}</Text>
                      <Text style={styles.emergencyCardTime}>
                        🕐 {new Date(e.createdAt).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={[
                      styles.emergencyStatusBadge,
                      e.status === 'ACTIVE' ? styles.emergencyStatusActive : styles.emergencyStatusResolved,
                    ]}>
                      <Text style={[
                        styles.emergencyStatusText,
                        { color: e.status === 'ACTIVE' ? colors.emergency : colors.success },
                      ]}>
                        {e.status}
                      </Text>
                    </View>
                  </View>
                  {e.status === 'ACTIVE' && (
                    <TouchableOpacity
                      style={styles.resolveBtn}
                      onPress={() => resolveEmergency(e._id)}
                    >
                      <Text style={styles.resolveBtnText}>✓ Mark as Resolved</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, bg }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BarRow({ label, value, width, color, last }) {
  return (
    <View style={[styles.barRow, !last && styles.barRowBorder]}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barValue, { color }]}>{value}</Text>
    </View>
  );
}

// ─── Colour palette for doctor avatars ───────────────────────────────────────
const DOC_COLORS = [
  colors.primary, '#00897B', '#7B1FA2', '#F4511E', '#039BE5',
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
    ...shadow.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm },
  headerAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: colors.white, fontSize: 20, fontWeight: '800' },
  appName: { fontSize: 10, color: colors.primary, fontWeight: '600', letterSpacing: 0.3 },
  headerName: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 1 },
  adminBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.primaryLight,
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2,
  },
  adminBadgeText: { fontSize: 10, color: colors.primary, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  iconCircleText: { fontSize: 18 },
  notifBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: colors.danger, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.white,
  },
  notifBadgeText: { color: colors.white, fontSize: 9, fontWeight: '800' },

  // Emergency banner
  emergencyBanner: {
    margin: spacing.md,
    backgroundColor: colors.emergency,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row', alignItems: 'center',
    ...shadow.md,
  },
  emergencyBannerPulse: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  emergencyBannerIcon: { fontSize: 26 },
  emergencyBannerTitle: { fontSize: 15, fontWeight: '800', color: colors.white },
  emergencyBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  emergencyBannerChevron: { fontSize: 26, color: colors.white, fontWeight: '700' },

  // Section
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.sm, gap: spacing.xs,
  },
  sectionHeaderIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  sectionSubtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: -spacing.xs },
  countBadge: {
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 2,
  },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  warningCountBadge: {
    backgroundColor: colors.warningLight, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 2,
  },
  warningCountText: { fontSize: 12, fontWeight: '700', color: colors.warning },

  // Pending card
  pendingCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 4, borderLeftColor: colors.warning,
    ...shadow.sm,
  },
  pendingAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.warningLight, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
  },
  pendingAvatarText: { fontSize: 18, fontWeight: '700', color: colors.warning },
  pendingName: { fontSize: 14, fontWeight: '700', color: colors.text },
  pendingSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  pendingEmail: { fontSize: 11, color: colors.textLight, marginTop: 1 },
  pendingActions: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  approveBtn: {
    backgroundColor: colors.successLight, borderRadius: radius.md,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  approveBtnText: { color: colors.success, fontSize: 12, fontWeight: '700' },
  rejectBtn: {
    backgroundColor: colors.dangerLight, borderRadius: radius.md,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  rejectBtnText: { color: colors.danger, fontSize: 12, fontWeight: '700' },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: colors.white,
    borderRadius: radius.lg, padding: spacing.md,
    borderTopWidth: 3, ...shadow.sm,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // Analytics
  analyticsCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, ...shadow.sm,
  },
  barRow: { paddingVertical: 10 },
  barRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  barLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  barTrack: {
    height: 10, backgroundColor: colors.background,
    borderRadius: radius.full, overflow: 'hidden', marginBottom: 4,
  },
  barFill: { height: '100%', borderRadius: radius.full },
  barValue: { fontSize: 13, fontWeight: '700' },

  // Doctor card
  doctorCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center', ...shadow.sm,
  },
  doctorAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  doctorAvatarText: { fontSize: 20, fontWeight: '800' },
  doctorName: { fontSize: 15, fontWeight: '700', color: colors.text },
  doctorSpec: { fontSize: 12, color: colors.primary, marginTop: 2 },
  doctorEmail: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  doctorRight: { alignItems: 'flex-end', gap: 4 },
  doctorActiveBadge: {
    backgroundColor: colors.successLight, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  doctorActiveBadgeText: { fontSize: 10, fontWeight: '700', color: colors.success },
  doctorChevron: { fontSize: 22, color: colors.textLight },

  // Empty card
  emptyCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.xl, alignItems: 'center', ...shadow.sm,
  },
  emptyCardIcon: { fontSize: 40, marginBottom: spacing.sm },
  emptyCardText: { fontSize: 13, color: colors.textSecondary },

  // Modal shared
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 12,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
    ...shadow.sm,
  },
  modalHeaderBtn: { minWidth: 60 },
  modalBackText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1, textAlign: 'center' },
  modalBody: { flex: 1, padding: spacing.md },

  // Doctor hero
  doctorHeroCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md,
    ...shadow.md,
  },
  doctorHeroAvatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm, borderWidth: 3, borderColor: colors.primary,
  },
  doctorHeroAvatarText: { fontSize: 34, fontWeight: '800', color: colors.primary },
  doctorHeroName: { fontSize: 20, fontWeight: '800', color: colors.text },
  doctorHeroSpec: { fontSize: 13, color: colors.primary, marginTop: 4 },
  doctorHeroEmail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // Patient card (in modal)
  patientCard: {
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center', ...shadow.sm,
  },
  patientAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
  },
  patientAvatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  patientName: { fontSize: 14, fontWeight: '700', color: colors.text },
  patientEmail: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  patientMeta: { fontSize: 11, color: colors.textLight, marginTop: 1 },
  patientHistory: { fontSize: 11, color: colors.textLight, marginTop: 1 },
  statusPill: {
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3,
    marginLeft: spacing.xs,
  },
  statusPillGreen: { backgroundColor: colors.successLight },
  statusPillYellow: { backgroundColor: colors.warningLight },
  statusPillText: { fontSize: 10, fontWeight: '700' },

  // Emergency card (in modal)
  emergencyCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    borderLeftWidth: 4, borderLeftColor: colors.emergency, ...shadow.sm,
  },
  emergencyCardResolved: { borderLeftColor: colors.success, opacity: 0.75 },
  emergencyCardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  emergencyCardName: { fontSize: 15, fontWeight: '700', color: colors.text },
  emergencyCardMsg: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  emergencyCardTime: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  emergencyStatusBadge: {
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4,
    marginLeft: spacing.sm,
  },
  emergencyStatusActive: { backgroundColor: colors.emergencyLight },
  emergencyStatusResolved: { backgroundColor: colors.successLight },
  emergencyStatusText: { fontSize: 10, fontWeight: '800' },
  resolveBtn: {
    marginTop: spacing.sm, backgroundColor: colors.successLight,
    borderRadius: radius.md, padding: spacing.sm, alignItems: 'center',
  },
  resolveBtnText: { color: colors.success, fontSize: 13, fontWeight: '700' },
});
