import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import api from '../api/axios';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors } from '../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) return Alert.alert('Error', 'Enter your email address');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>
        </View>

        {!sent ? (
          <View style={styles.card}>
            <Input
              label="Email Address"
              placeholder="Enter your registered email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Button title="Send Reset Code" onPress={handleSend} loading={loading} />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>📧</Text>
              <Text style={styles.successTitle}>Email Sent!</Text>
              <Text style={styles.successText}>
                Check your inbox at{'\n'}<Text style={styles.emailHighlight}>{email}</Text>
              </Text>
              <Text style={styles.successNote}>The OTP code is valid for 15 minutes.</Text>
            </View>
            <Button
              title="Enter OTP & Reset Password"
              onPress={() => navigation.navigate('ResetPassword', { email })}
            />
            <TouchableOpacity onPress={() => setSent(false)} style={styles.resendBtn}>
              <Text style={styles.resendText}>Didn't receive it? Try again</Text>
            </TouchableOpacity>
          </View>
        )}
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
  successBox: { alignItems: 'center', marginBottom: 20 },
  successIcon: { fontSize: 48, marginBottom: 10 },
  successTitle: { fontSize: 18, fontWeight: '800', color: colors.gray800 },
  successText: { fontSize: 14, color: colors.gray500, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  emailHighlight: { color: colors.primary, fontWeight: '700' },
  successNote: { fontSize: 12, color: colors.gray400, marginTop: 8 },
  resendBtn: { alignItems: 'center', marginTop: 14 },
  resendText: { fontSize: 13, color: colors.primary },
});
