import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme';

export default function Button({ title, onPress, color = 'primary', loading, style, small }) {
  const bg = {
    primary: colors.primary,
    danger: colors.danger,
    success: colors.success,
    secondary: colors.secondary,
    gray: colors.gray500,
  }[color] || colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[styles.btn, { backgroundColor: bg }, small && styles.small, style]}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={[styles.text, small && styles.smallText]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: 12, paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center' },
  text: { color: '#fff', fontWeight: '700', fontSize: 15 },
  small: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  smallText: { fontSize: 13 },
});
