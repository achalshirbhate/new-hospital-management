import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { shadow } from '../theme';

const palette = {
  blue:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  green:  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  red:    { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  yellow: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  purple: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  indigo: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
};

export default function StatCard({ icon, label, value, color = 'blue' }) {
  const c = palette[color];
  return (
    <View style={[styles.card, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color: c.text }]}>{value}</Text>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    margin: 4,
    alignItems: 'center',
    ...shadow,
  },
  icon: { fontSize: 24, marginBottom: 4 },
  value: { fontSize: 22, fontWeight: '700' },
  label: { fontSize: 11, marginTop: 2, textAlign: 'center', opacity: 0.8 },
});
