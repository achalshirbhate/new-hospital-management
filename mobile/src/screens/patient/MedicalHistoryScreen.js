import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function MedicalHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

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

  const prescriptions = profile?.prescriptions || [];
  const filtered = prescriptions.filter(rx =>
    rx.title?.toLowerCase().includes(search.toLowerCase()) ||
    rx.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Medical History</Text>
        <Text style={styles.headerSub}>Dr. Ravikant Patil Tele Patient System</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search prescriptions..."
          placeholderTextColor={colors.textLight}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Health Summary */}
        {profile && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryAvatar}>
              <Text style={styles.summaryAvatarText}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryName}>{user?.name}</Text>
              {profile.age ? <Text style={styles.summaryMeta}>🎂 Age {profile.age}</Text> : null}
              {profile.assignedDoctor && (
                <Text style={styles.summaryMeta}>👨‍⚕️ Dr. {profile.assignedDoctor?.name}</Text>
              )}
            </View>
          </View>
        )}

        {/* Medical History */}
        {profile?.medicalHistory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Medical Background</Text>
            <View style={styles.historyCard}>
              <Text style={styles.historyText}>{profile.medicalHistory}</Text>
            </View>
          </View>
        )}

        {/* Prescriptions Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>💊 Prescriptions</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filtered.length}</Text>
            </View>
          </View>

          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={styles.emptyText}>{search ? 'No results found' : 'No prescriptions yet'}</Text>
            </View>
          ) : (
            filtered.map((rx, i) => (
              <View key={i} style={styles.rxItem}>
                <View style={styles.rxLeft}>
                  <View style={styles.rxDot} />
                  {i < filtered.length - 1 && <View style={styles.rxLine} />}
                </View>
                <View style={styles.rxCard}>
                  <Text style={styles.rxTitle}>{rx.title}</Text>
                  {rx.description ? <Text style={styles.rxDesc}>{rx.description}</Text> : null}
                  <Text style={styles.rxDate}>
                    📅 {new Date(rx.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Reports */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>📄 Reports</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{reports.length}</Text>
            </View>
          </View>

          {reports.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyText}>No reports uploaded yet</Text>
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
                    {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                  {r.notes ? <Text style={styles.reportNotes} numberOfLines={1}>{r.notes}</Text> : null}
                </View>
                <View style={styles.reportBadge}>
                  <Text style={styles.reportBadgeText}>View</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.white, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, ...shadow.sm },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 11, color: colors.primary, marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 6 },
  summaryCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, ...shadow.sm },
  summaryAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  summaryAvatarText: { color: colors.white, fontSize: 22, fontWeight: '800' },
  summaryName: { fontSize: 16, fontWeight: '700', color: colors.text },
  summaryMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  section: { marginBottom: spacing.md },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  countBadge: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 2 },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  historyCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, ...shadow.sm, borderLeftWidth: 3, borderLeftColor: colors.primary },
  historyText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  rxItem: { flexDirection: 'row', marginBottom: spacing.sm },
  rxLeft: { width: 20, alignItems: 'center', marginRight: spacing.sm },
  rxDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, marginTop: 4 },
  rxLine: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2, marginBottom: -4 },
  rxCard: { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.sm, ...shadow.sm, borderLeftWidth: 3, borderLeftColor: colors.primary },
  rxTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rxDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  rxDate: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  reportCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', ...shadow.sm },
  reportIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  reportIconText: { fontSize: 22 },
  reportTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  reportDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  reportNotes: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  reportBadge: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  reportBadgeText: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  emptyCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', ...shadow.sm },
  emptyIcon: { fontSize: 36, marginBottom: spacing.sm },
  emptyText: { fontSize: 13, color: colors.textSecondary },
});
