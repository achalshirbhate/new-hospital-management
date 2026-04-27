import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

export default function OverviewScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/dashboard');
      setStats(data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day 👋</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>Main Doctor · Admin</Text>
        </View>
      </View>

      {stats ? (
        <>
          <Text style={styles.section}>Finance</Text>
          <View style={styles.row}>
            <StatCard icon="💰" label="Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} color="green" />
            <StatCard icon="💸" label="Expenses" value={`$${stats.totalExpense.toLocaleString()}`} color="red" />
          </View>
          <View style={styles.row}>
            <StatCard icon="📈" label="Profit/Loss" value={`$${stats.profit.toLocaleString()}`} color={stats.profit >= 0 ? 'green' : 'red'} />
          </View>

          <Text style={styles.section}>Hospital</Text>
          <View style={styles.row}>
            <StatCard icon="👥" label="Patients" value={stats.totalPatients} color="blue" />
            <StatCard icon="👨‍⚕️" label="Doctors" value={stats.totalDoctors} color="indigo" />
          </View>
          <View style={styles.row}>
            <StatCard icon="📅" label="Appointments" value={stats.totalAppointments} color="purple" />
            <StatCard icon="🔄" label="Pending Referrals" value={stats.pendingReferrals} color="yellow" />
          </View>
          <View style={styles.row}>
            <StatCard icon="💬" label="Pending Chats" value={stats.pendingTokens} color="yellow" />
          </View>
        </>
      ) : (
        <Text style={styles.loading}>Loading dashboard...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  header: { backgroundColor: colors.primary, padding: 24, paddingTop: 16 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  role: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  section: { fontSize: 13, fontWeight: '700', color: colors.gray500, marginHorizontal: 16, marginTop: 20, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', paddingHorizontal: 12 },
  loading: { textAlign: 'center', color: colors.gray400, marginTop: 40 },
});
