import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import api from '../../api/axios';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { colors } from '../../theme';

export default function LaunchPadScreen() {
  const [ideas, setIdeas] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await api.get('/launchpad'); setIdeas(data); } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = (id) => {
    Alert.alert('Delete Idea', 'Remove this idea?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.delete(`/launchpad/${id}`); load(); } }
    ]);
  };

  const filtered = filter === 'ALL' ? ideas : ideas.filter(i => i.submittedBy?.role === filter);
  const counts = { DOCTOR: ideas.filter(i => i.submittedBy?.role === 'DOCTOR').length, PATIENT: ideas.filter(i => i.submittedBy?.role === 'PATIENT').length };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>LaunchPad Ideas</Text>

      <View style={styles.filters}>
        {[['ALL', `All (${ideas.length})`], ['DOCTOR', `Doctors (${counts.DOCTOR})`], ['PATIENT', `Patients (${counts.PATIENT})`]].map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setFilter(key)} style={[styles.filterBtn, filter === key && styles.filterActive]}>
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.map(idea => (
        <Card key={idea._id}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ideaTitle}>{idea.title}</Text>
              <Text style={styles.ideaDesc}>{idea.description}</Text>
              <View style={styles.meta}>
                {idea.domain ? <Text style={styles.metaText}>🌐 {idea.domain}</Text> : null}
                {idea.contact ? <Text style={styles.metaText}>📧 {idea.contact}</Text> : null}
              </View>
              <View style={styles.footer}>
                <Badge label={idea.submittedBy?.role || 'PATIENT'} />
                <Text style={styles.submitter}>👤 {idea.submittedBy?.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDelete(idea._id)} style={styles.deleteBtn}>
              <Text style={{ fontSize: 18 }}>🗑</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}
      {filtered.length === 0 && <Text style={styles.empty}>No ideas found.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.gray800, marginBottom: 12 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200 },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: colors.gray600 },
  filterTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 8 },
  ideaTitle: { fontSize: 15, fontWeight: '700', color: colors.gray800 },
  ideaDesc: { fontSize: 13, color: colors.gray600, marginTop: 4, lineHeight: 18 },
  meta: { flexDirection: 'row', gap: 12, marginTop: 6 },
  metaText: { fontSize: 11, color: colors.gray400 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  submitter: { fontSize: 12, color: colors.gray500 },
  deleteBtn: { padding: 4 },
  empty: { textAlign: 'center', color: colors.gray400, marginTop: 40 },
});
