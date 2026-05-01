import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function PatientHomeScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

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
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const triggerEmergency = () => {
    Alert.alert('🚨 Emergency', 'Send emergency alert to your doctor and admin?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Emergency', style: 'destructive', onPress: async () => {
          setEmergencyLoading(true);
          try {
            await api.post('/emergency', { message: 'Patient needs emergency assistance!' });
            Alert.alert('🚨 Sent', 'Emergency alert sent. Help is on the way.');
          } catch {
            Alert.alert('Error', 'Failed to send emergency');
          } finally { setEmergencyLoading(false); }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'P'}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.role}>🫀 Patient</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout }
          ])}>
            <Text style={styles.logoutText}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Button */}
        <TouchableOpacity style={styles.emergencyBtn} onPress={triggerEmergency} disabled={emergencyLoading}>
          <Text style={styles.emergencyBtnIcon}>🚨</Text>
          <View>
            <Text style={styles.emergencyBtnTitle}>{emergencyLoading ? 'Sending...' : 'Emergency'}</Text>
            <Text style={styles.emergencyBtnSub}>Tap to alert your doctor & admin</Text>
          </View>
        </TouchableOpacity>

        {/* Doctor Info */}
        {profile?.assignedDoctor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👨‍⚕️ Your Doctor</Text>
            <View style={styles.doctorCard}>
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorAvatarText}>{profile.assignedDoctor?.name?.charAt(0) || 'D'}</Text>
              </View>
              <View>
                <Text style={styles.doctorName}>Dr. {profile.assignedDoctor?.name}</Text>
                <Text style={styles.doctorSpec}>Cardiologist</Text>
              </View>
            </View>
          </View>
        )}

        {/* Medical Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 My Health Info</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="👤" label="Name" value={user?.name} />
            <InfoRow icon="📧" label="Email" value={user?.email} />
            {profile?.age ? <InfoRow icon="🎂" label="Age" value={`${profile.age} years`} /> : null}
            {profile?.medicalHistory ? <InfoRow icon="📝" label="Medical History" value={profile.medicalHistory} /> : null}
          </View>
        </View>

        {/* Prescriptions */}
        {profile?.prescriptions?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💊 Prescriptions</Text>
            {profile.prescriptions.map((rx, i) => (
              <View key={i} style={styles.rxCard}>
                <Text style={styles.rxTitle}>{rx.title}</Text>
                {rx.description ? <Text style={styles.rxDesc}>{rx.description}</Text> : null}
                <Text style={styles.rxDate}>{new Date(rx.addedAt).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Reports */}
        {reports.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 My Reports</Text>
            {reports.map(r => (
              <View key={r._id} style={styles.reportCard}>
                <Text style={styles.reportIcon}>📄</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reportTitle}>{r.title || r.fileName || 'Report'}</Text>
                  <Text style={styles.reportDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: colors.white, ...shadow.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  greeting: { fontSize: 12, color: colors.textSecondary },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  role: { fontSize: 11, color: colors.primary },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 18 },
  emergencyBtn: { margin: spacing.md, backgroundColor: colors.emergencyLight, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1.5, borderColor: colors.emergency },
  emergencyBtnIcon: { fontSize: 32 },
  emergencyBtnTitle: { fontSize: 16, fontWeight: '800', color: colors.emergency },
  emergencyBtnSub: { fontSize: 12, color: colors.textSecondary },
  section: { padding: spacing.md, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  doctorCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, ...shadow.sm },
  doctorAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  doctorAvatarText: { fontSize: 20, fontWeight: '700', color: colors.white },
  doctorName: { fontSize: 16, fontWeight: '700', color: colors.text },
  doctorSpec: { fontSize: 12, color: colors.primary },
  infoCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, ...shadow.sm },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoIcon: { fontSize: 18, marginRight: spacing.sm, marginTop: 2 },
  infoLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 2 },
  rxCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.primary, ...shadow.sm },
  rxTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rxDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  rxDate: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  reportCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', ...shadow.sm },
  reportIcon: { fontSize: 24, marginRight: spacing.sm },
  reportTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  reportDate: { fontSize: 12, color: colors.textSecondary },
});
