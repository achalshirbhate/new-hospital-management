import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function DoctorProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Profile</Text>
        <Text style={styles.headerSub}>Dr. Ravikant Patil Tele Patient System</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'D'}</Text>
          </View>
          <Text style={styles.name}>Dr. {user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>🩺 Doctor</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <InfoRow icon="👤" label="Full Name" value={`Dr. ${user?.name}`} />
          <InfoRow icon="✉️" label="Email" value={user?.email} />
          <InfoRow icon="🏥" label="Hospital" value="Dr. Ravikant Patil Cardiac Centre" />
          <InfoRow icon="🩺" label="Role" value="Doctor" last />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>🚪 Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.white, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, ...shadow.sm },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 11, color: colors.primary, marginTop: 2 },
  avatarCard: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md, ...shadow.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarText: { color: colors.white, fontSize: 36, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  roleBadge: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginTop: spacing.sm },
  roleBadgeText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  infoCard: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md, ...shadow.sm },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoIcon: { fontSize: 18, marginRight: spacing.sm, marginTop: 2 },
  infoLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 2 },
  logoutBtn: { backgroundColor: colors.dangerLight, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: colors.danger },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: colors.danger },
});
