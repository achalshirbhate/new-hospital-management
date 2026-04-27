import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import api from '../api/axios';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors } from '../theme';

export default function ResetPasswordScreen({ navigation, route }) {
  const prefillEmail = route?.params?.email || '';
  const [form, setForm] = useState({ email: prefillEmail, otp: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!form.email || !form.otp || !form.newPassword)
      return Alert.alert('Error', 'Fill in all fields');
    if (form.newPassword !== form.confirmPassword)
      return Alert.alert('Error', 'Passwords do not match');
    if (form.newPassword.length < 6)
      return Alert.alert('Error', 'Password must be at least 6 characters');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword,
      });
      setSuccess(true);
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.message || 'Invalid OTP or expired');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={styles.successTitle}>Password Reset!</Text>
        <Text style={styles.successSub}>Your password has been updated successfully.</Text>
        <Button
          title="Go to Login"
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: 24, width: 200 }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.emoji}>🔑</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter the 6-digit OTP from your email</Text>
        </View>

        <View style={styles.card}>
          <Input
            label="Email Address"
            placeholder="Your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={v => setForm({ ...form, email: v })}
          />

          <View style={styles.otpWrapper}>
            <Text style={styles.otpLabel}>OTP Code</Text>
            <Input
              placeholder="• • • • • •"
              keyboardType="numeric"
              maxLength={6}
              value={form.otp}
              onChangeText={v => setForm({ ...form, otp: v.replace(/\D/g, '') })}
              style={{ marginBottom: 0 }}
            />
            <Text style={styles.otpHint}>Check your email inbox for the 6-digit code</Text>
          </View>

          <Input
            label="New Password"
            placeholder="Minimum 6 characters"
            secureTextEntry
            value={form.newPassword}
            onChangeText={v => setForm({ ...form, newPassword: v })}
          />
          <Input
            label="Confirm New Password"
            placeholder="Repeat new password"
            secureTextEntry
            value={form.confirmPassword}
            onChangeText={v => setForm({ ...form, confirmPassword: v })}
          />

          <Button title="Reset Password" onPress={handleReset} loading={loading} />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.resendBtn}
          >
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.gray50, padding: 24 },
  back: { marginBottom: 8 },
  backText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 28 },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: colors.gray800 },
  subtitle: { fontSize: 14, color: colors.gray500, marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  otpWrapper: { marginBottom: 14 },
  otpLabel: { fontSize: 13, fontWeight: '600', color: colors.gray700, marginBottom: 6 },
  otpHint: { fontSize: 11, color: colors.gray400, marginTop: 4 },
  resendBtn: { alignItems: 'center', marginTop: 14 },
  resendText: { fontSize: 13, color: colors.primary },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray50, padding: 24 },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: '800', color: colors.gray800 },
  successSub: { fontSize: 14, color: colors.gray500, marginTop: 8, textAlign: 'center' },
});
