import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const palette = {
  PENDING:  { bg: '#FFFBEB', text: '#B45309' },
  ACTIVE:   { bg: '#F0FDF4', text: '#15803D' },
  APPROVED: { bg: '#F0FDF4', text: '#15803D' },
  REJECTED: { bg: '#FEF2F2', text: '#B91C1C' },
  EXPIRED:  { bg: '#F1F5F9', text: '#64748B' },
  DOCTOR:   { bg: '#EFF6FF', text: '#1D4ED8' },
  PATIENT:  { bg: '#F0FDF4', text: '#15803D' },
  CHAT:     { bg: '#EFF6FF', text: '#1D4ED8' },
  VIDEO:    { bg: '#F5F3FF', text: '#6D28D9' },
};

export default function Badge({ label }) {
  const c = palette[label] || { bg: '#F1F5F9', text: '#64748B' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '600' },
});
