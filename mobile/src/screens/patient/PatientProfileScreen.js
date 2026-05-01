import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function PatientProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const callNumber = (num) => {
    Linking.openURL(`tel:${num}`).catch(() => Alert.alert('Error', 'Cannot make call'));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Profile</Text>
        <Text style={styles.headerSub}>Dr. Ravikant Patil Tele Patient System</Text>
      </View>

      <View style={styles.container}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>🫀 Patient</Text>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Emergency Contacts</Text>
          <TouchableOpacity style={styles.contactCard} onPress={() => callNumber('108')}>
            <Text style={styles.contactIcon}>🏥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>Hospital Emergency</Text>
              <Text style={styles.contactNum}>108</Text>
            </View>
            <Text style={styles.callBtn}>📞 Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard} onPress={() => callNumber('102')}>
            <Text style={styles.contactIcon}>🚑</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>Ambulance</Text>
              <Text style={styles.contactNum}>102</Text>
            </View>
            <Text style={styles.callBtn}>📞 Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard} onPress={() => callNumber('100')}>
            <Text style={styles.contactIcon}>👮</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>Police</Text>
              <Text style={styles.contactNum}>100</Text>
            </View>
            <Text style={styles.callBtn}>📞 Call</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.white, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, ...shadow.sm },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 11, color: colors.primary, marginTop: 2 },
  container: { flex: 1, padding: spacing.md },
  avatarSection: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md, ...shadow.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarText: { color: colors.white, fontSize: 36, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  roleBadge: { backgroundColor: '#FCE4EC', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginTop: spacing.sm },
  roleBadgeText: { fontSize: 12, color: '#C2185B', fontWeight: '700' },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  contactCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, ...shadow.sm },
  contactIcon: { fontSize: 24 },
  contactName: { fontSize: 14, fontWeight: '600', color: colors.text },
  contactNum: { fontSize: 18, fontWeight: '800', color: colors.primary, marginTop: 2 },
  callBtn: { fontSize: 13, color: colors.success, fontWeight: '700' },
  logoutBtn: { backgroundColor: colors.dangerLight, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: colors.danger },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: colors.danger },
});
