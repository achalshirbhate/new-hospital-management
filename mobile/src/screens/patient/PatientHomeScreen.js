import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Alert, RefreshControl, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

// ─── Dr. Ravikant Patil Tele Patient System — Patient Home Screen ─────────────

export default function PatientHomeScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [symptom, setSymptom] = useState('');
  const [symptomResult, setSymptomResult] = useState('');
  const [showSymptomModal, setShowSymptomModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profileRes, reportsRes] = await Promise.all([
        api.get('/patients/me'),
        api.get('/reports'),
      ]);
      setProfile(profileRes.data);
      setReports(reportsRes.data || []);
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

  const triggerEmergency = () => {
    Alert.alert(
      '🚨 Emergency Alert',
      'This will immediately alert your doctor and the admin. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Emergency', style: 'destructive', onPress: async () => {
            setEmergencyLoading(true);
            try {
              await api.post('/emergency', { message: 'Patient needs emergency assistance!' });
              Alert.alert('🚨 Alert Sent', 'Your doctor and admin have been notified. Help is on the way.');
            } catch {
              Alert.alert('Error', 'Failed to send emergency alert. Please call emergency services.');
            } finally { setEmergencyLoading(false); }
          },
        },
      ]
    );
  };

  const checkSymptom = () => {
    if (!symptom.trim()) return;
    setSymptomResult('⚠️ Please consult your doctor immediately. Do not self-medicate.');
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>Dr. Ravikant Patil Tele Patient System</Text>
            <Text style={styles.greeting}>Hello, {user?.name} 👋</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>🫀 Patient</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Emergency Card ── */}
        <TouchableOpacity
          style={[styles.emergencyCard, emergencyLoading && { opacity: 0.7 }]}
          onPress={triggerEmergency}
          disabled={emergencyLoading}
          activeOpacity={0.85}
        >
          <View style={styles.emergencyCardLeft}>
            <Text style={styles.emergencyCardIcon}>🚨</Text>
          </View>
          <View style={styles.emergencyCardBody}>
            <Text style={styles.emergencyCardTitle}>
              {emergencyLoading ? 'Sending Alert…' : 'Emergency'}
            </Text>
            <Text style={styles.emergencyCardSub}>
              Tap to alert your doctor &amp; admin immediately
            </Text>
          </View>
          <View style={styles.emergencyCardArrow}>
            <Text style={styles.emergencyCardArrowText}>›</Text>
          </View>
        </TouchableOpacity>

        {/* ── Your Doctor ── */}
        {profile?.assignedDoctor && (
          <View style={styles.section}>
            <SectionHeader icon="👨‍⚕️" title="Your Doctor" />
            <View style={styles.doctorCard}>
              <View style={styles.doctorAvatarWrap}>
                <Text style={styles.doctorAvatarText}>
                  {profile.assignedDoctor?.name?.charAt(0)?.toUpperCase() || 'D'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorName}>Dr. {profile.assignedDoctor?.name}</Text>
                <Text style={styles.doctorSpec}>
                  {profile.assignedDoctor?.specialization || 'Cardiologist'}
                </Text>
                <Text style={styles.doctorContact}>
                  ✉️ {profile.assignedDoctor?.email || 'Contact via clinic'}
                </Text>
              </View>
              <View style={styles.doctorOnlineDot} />
            </View>
          </View>
        )}

        {/* ── My Health Info ── */}
        <View style={styles.section}>
          <SectionHeader icon="📋" title="My Health Info" />
          <View style={styles.healthCard}>
            <HealthRow icon="👤" label="Full Name" value={user?.name} />
            <HealthRow icon="✉️" label="Email" value={user?.email} />
            {profile?.age ? (
              <HealthRow icon="🎂" label="Age" value={`${profile.age} years old`} />
            ) : null}
            {profile?.medicalHistory ? (
              <HealthRow icon="📝" label="Medical History" value={profile.medicalHistory} last />
            ) : (
              <HealthRow icon="📝" label="Medical History" value="Not recorded yet" last />
            )}
          </View>
        </View>

        {/* ── Prescriptions ── */}
        <View style={styles.section}>
          <SectionHeader icon="💊" title="My Prescriptions" count={profile?.prescriptions?.length || 0} />
          {!profile?.prescriptions?.length ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardIcon}>💊</Text>
              <Text style={styles.emptyCardText}>No prescriptions yet</Text>
            </View>
          ) : (
            profile.prescriptions.map((rx, i) => (
              <View key={i} style={styles.rxCard}>
                <View style={styles.rxCardLeft}>
                  <View style={styles.rxDot} />
                  {i < profile.prescriptions.length - 1 && <View style={styles.rxLine} />}
                </View>
                <View style={styles.rxCardBody}>
                  <Text style={styles.rxTitle}>{rx.title}</Text>
                  {rx.description ? (
                    <Text style={styles.rxDesc}>{rx.description}</Text>
                  ) : null}
                  <Text style={styles.rxDate}>
                    📅 {new Date(rx.addedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Reports ── */}
        <View style={styles.section}>
          <SectionHeader icon="📄" title="My Reports" count={reports.length} />
          {reports.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardIcon}>📄</Text>
              <Text style={styles.emptyCardText}>No reports uploaded yet</Text>
            </View>
          ) : (
            reports.map(r => (
              <View key={r._id} style={styles.reportCard}>
                <View style={styles.reportIconWrap}>
                  <Text style={styles.reportIconText}>📄</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reportTitle}>{r.title || r.fileName || 'Medical Report'}</Text>
                  <Text style={styles.reportDate}>
                    {new Date(r.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.reportBadge}>
                  <Text style={styles.reportBadgeText}>View</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Symptom Checker ── */}
        <View style={styles.section}>
          <SectionHeader icon="🔬" title="Symptom Checker" />
          <View style={styles.symptomCard}>
            <Text style={styles.symptomCardDesc}>
              Describe your symptoms below. This is not a diagnosis — always consult your doctor.
            </Text>
            <View style={styles.symptomInputRow}>
              <TextInput
                style={styles.symptomInput}
                value={symptom}
                onChangeText={setSymptom}
                placeholder="e.g. chest pain, headache, fever…"
                placeholderTextColor={colors.textLight}
                onSubmitEditing={checkSymptom}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.symptomBtn} onPress={checkSymptom}>
                <Text style={styles.symptomBtnText}>Check</Text>
              </TouchableOpacity>
            </View>
            {symptomResult ? (
              <View style={styles.symptomResult}>
                <Text style={styles.symptomResultText}>{symptomResult}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeaderIcon}>{icon}</Text>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      {count !== undefined && count > 0 && (
        <View style={styles.sectionCountBadge}>
          <Text style={styles.sectionCountText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

function HealthRow({ icon, label, value, last }) {
  return (
    <View style={[styles.healthRow, !last && styles.healthRowBorder]}>
      <Text style={styles.healthRowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.healthRowLabel}>{label}</Text>
        <Text style={styles.healthRowValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

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
  greeting: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 1 },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: '#FCE4EC',
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2,
  },
  roleBadgeText: { fontSize: 10, color: '#C2185B', fontWeight: '700' },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center',
  },
  logoutIcon: { fontSize: 18 },

  // Emergency card
  emergencyCard: {
    margin: spacing.md,
    backgroundColor: colors.emergency,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.md,
  },
  emergencyCardLeft: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  emergencyCardIcon: { fontSize: 28 },
  emergencyCardBody: { flex: 1 },
  emergencyCardTitle: { fontSize: 18, fontWeight: '800', color: colors.white },
  emergencyCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  emergencyCardArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  emergencyCardArrowText: { fontSize: 22, color: colors.white, fontWeight: '700' },

  // Section
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.sm, gap: spacing.xs,
  },
  sectionHeaderIcon: { fontSize: 18 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  sectionCountBadge: {
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 2,
  },
  sectionCountText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  // Doctor card
  doctorCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    ...shadow.sm,
  },
  doctorAvatarWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
  },
  doctorAvatarText: { color: colors.white, fontSize: 22, fontWeight: '800' },
  doctorName: { fontSize: 16, fontWeight: '700', color: colors.text },
  doctorSpec: { fontSize: 12, color: colors.primary, marginTop: 2 },
  doctorContact: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  doctorOnlineDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.success, marginLeft: spacing.sm,
  },

  // Health card
  healthCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    overflow: 'hidden', ...shadow.sm,
  },
  healthRow: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md },
  healthRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  healthRowIcon: { fontSize: 18, marginRight: spacing.sm, marginTop: 2 },
  healthRowLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  healthRowValue: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 2 },

  // Rx timeline
  rxCard: { flexDirection: 'row', marginBottom: spacing.sm },
  rxCardLeft: { width: 20, alignItems: 'center', marginRight: spacing.sm },
  rxDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.primary, marginTop: 4,
  },
  rxLine: {
    flex: 1, width: 2, backgroundColor: colors.border,
    marginTop: 2, marginBottom: -4,
  },
  rxCardBody: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.sm, ...shadow.sm,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  rxTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rxDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  rxDate: { fontSize: 11, color: colors.textLight, marginTop: 4 },

  // Reports
  reportCard: {
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center', ...shadow.sm,
  },
  reportIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
  },
  reportIconText: { fontSize: 22 },
  reportTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  reportDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  reportBadge: {
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  reportBadgeText: { fontSize: 11, color: colors.primary, fontWeight: '700' },

  // Symptom checker
  symptomCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, ...shadow.sm,
  },
  symptomCardDesc: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 18 },
  symptomInputRow: { flexDirection: 'row', gap: spacing.sm },
  symptomInput: {
    flex: 1, backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: 13, color: colors.text, borderWidth: 1.5, borderColor: colors.border,
  },
  symptomBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.md, justifyContent: 'center',
  },
  symptomBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  symptomResult: {
    marginTop: spacing.sm, backgroundColor: colors.warningLight,
    borderRadius: radius.md, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.warning,
  },
  symptomResultText: { fontSize: 13, color: colors.text, lineHeight: 20, fontWeight: '500' },

  // Empty card
  emptyCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center', ...shadow.sm,
  },
  emptyCardIcon: { fontSize: 36, marginBottom: spacing.sm },
  emptyCardText: { fontSize: 13, color: colors.textSecondary },
});
