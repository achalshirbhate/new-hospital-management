import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import api from '../../api/axios';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await api.get('/patients/me'); setProfile(data); } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.hero}>
        <View style={styles.avatar}><Text style={styles.avatarText}>👤</Text></View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>

      {profile && (
        <>
          <Card>
            <View style={styles.row}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{profile.age || 'N/A'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Assigned Doctor</Text>
                <Text style={styles.infoValue}>{profile.assignedDoctor?.name ? `Dr. ${profile.assignedDoctor.name}` : 'Not assigned'}</Text>
              </View>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionLabel}>Medical History</Text>
            <Text style={styles.history}>{profile.medicalHistory || 'No medical history recorded.'}</Text>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  hero: { backgroundColor: colors.primary, padding: 32, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32 },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  logoutBtn: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 16 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 12, color: colors.gray400, fontWeight: '600', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '700', color: colors.gray800 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.gray500, marginBottom: 8, textTransform: 'uppercase' },
  history: { fontSize: 14, color: colors.gray700, lineHeight: 20 },
});
