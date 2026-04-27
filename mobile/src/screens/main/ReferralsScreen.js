import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import api from '../../api/axios';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { colors } from '../../theme';

export default function ReferralsScreen() {
  const [referrals, setReferrals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await api.get('/referrals'); setReferrals(data); } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handle = async (id, action) => {
    try {
      await api.put(`/referrals/${id}/${action}`);
      load();
    } catch { Alert.alert('Error', 'Action failed'); }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Referral Requests</Text>
      {referrals.map(r => (
        <Card key={r._id}>
          <Text style={styles.name}>{r.patientId?.name}</Text>
          <Text style={styles.sub}>From: Dr. {r.fromDoctor?.name}</Text>
          <Text style={styles.sub}>To: Dr. {r.toDoctor?.name}</Text>
          {r.reason ? <Text style={styles.reason}>{r.reason}</Text> : null}
          <View style={styles.row}>
            <Badge label={r.status} />
            {r.status === 'PENDING' && (
              <View style={styles.actions}>
                <Button title="Approve" color="success" small onPress={() => handle(r._id, 'approve')} style={{ marginRight: 8 }} />
                <Button title="Reject" color="danger" small onPress={() => handle(r._id, 'reject')} />
              </View>
            )}
          </View>
        </Card>
      ))}
      {referrals.length === 0 && <Text style={styles.empty}>No referrals found.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.gray800, marginBottom: 16 },
  name: { fontSize: 16, fontWeight: '700', color: colors.gray800 },
  sub: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  reason: { fontSize: 13, color: colors.gray700, marginTop: 6, fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  actions: { flexDirection: 'row' },
  empty: { textAlign: 'center', color: colors.gray400, marginTop: 40 },
});
