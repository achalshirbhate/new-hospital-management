import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import api from '../../api/axios';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { colors } from '../../theme';

export default function ChatTokensScreen() {
  const [tokens, setTokens] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await api.get('/chat-token'); setTokens(data); } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handle = async (id, action) => {
    try { await api.put(`/chat-token/${id}/${action}`); load(); }
    catch { Alert.alert('Error', 'Action failed'); }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Chat Token Requests</Text>
      <Text style={styles.note}>Approved tokens are valid for 30 minutes.</Text>
      {tokens.map(t => (
        <Card key={t._id}>
          <View style={styles.row}>
            <Text style={styles.typeIcon}>{t.type === 'VIDEO' ? '📹' : '💬'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Patient: {t.patientId?.name}</Text>
              <Text style={styles.sub}>Doctor: Dr. {t.doctorId?.name}</Text>
              {t.status === 'ACTIVE' && (
                <Text style={styles.expiry}>Expires: {new Date(t.endTime).toLocaleTimeString()}</Text>
              )}
            </View>
          </View>
          <View style={styles.footer}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Badge label={t.status} />
              <Badge label={t.type || 'CHAT'} />
            </View>
            {t.status === 'PENDING' && (
              <View style={styles.actions}>
                <Button title="Approve" color="success" small onPress={() => handle(t._id, 'approve')} style={{ marginRight: 8 }} />
                <Button title="Reject" color="danger" small onPress={() => handle(t._id, 'reject')} />
              </View>
            )}
          </View>
        </Card>
      ))}
      {tokens.length === 0 && <Text style={styles.empty}>No chat requests.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.gray800, marginBottom: 4 },
  note: { fontSize: 12, color: colors.gray400, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  typeIcon: { fontSize: 24, marginTop: 2 },
  name: { fontSize: 15, fontWeight: '700', color: colors.gray800 },
  sub: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  expiry: { fontSize: 12, color: colors.success, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  actions: { flexDirection: 'row' },
  empty: { textAlign: 'center', color: colors.gray400, marginTop: 40 },
});
