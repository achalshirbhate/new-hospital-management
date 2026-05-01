import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { colors, spacing, radius, shadow } from '../theme';

export default function LoginScreen({ navigation }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!form.email || !form.password) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      await login(data.user, data.token);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hero Header */}
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🫀</Text>
            </View>
            <Text style={styles.appName}>Dr. Ravikant Patil</Text>
            <Text style={styles.appSub}>Tele Patient System</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSub}>Sign in to your account</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>📧 Email Address</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={v => setForm(f => ({ ...f, email: v }))}
                placeholder="Enter your email"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>🔒 Password</Text>
              <View style={styles.passWrap}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={form.password}
                  onChangeText={v => setForm(f => ({ ...f, password: v }))}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(s => !s)}>
                  <Text style={styles.eyeText}>{showPass ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={styles.loginBtnText}>Sign In →</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.md, paddingTop: spacing.lg },
  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadow.md,
  },
  logoEmoji: { fontSize: 44 },
  appName: { fontSize: 26, fontWeight: '900', color: colors.text, textAlign: 'center', letterSpacing: -0.5 },
  appSub: { fontSize: 15, color: colors.primary, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, ...shadow.md, marginBottom: spacing.md },
  cardTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  cardSub: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },
  fieldWrap: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 13,
    fontSize: 14, color: colors.text,
    borderWidth: 1.5, borderColor: colors.border,
  },
  passWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  eyeBtn: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  eyeText: { fontSize: 18 },
  forgotRow: { alignItems: 'flex-end', marginBottom: spacing.md },
  forgotText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  loginBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 15, alignItems: 'center',
    ...shadow.sm,
  },
  loginBtnText: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
