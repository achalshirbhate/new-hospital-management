import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors } from '../theme';

export default function LoginScreen({ navigation }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!form.email || !form.password) return Alert.alert('Error', 'Fill in all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      await login(data.user, data.token);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.emoji}>🏥</Text>
          <Text style={styles.title}>Hospital Management</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={v => setForm({ ...form, email: v })}
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            value={form.password}
            onChangeText={v => setForm({ ...form, password: v })}
          />
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotLink}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
          <Button title="Sign In" onPress={handleLogin} loading={loading} style={{ marginTop: 4 }} />

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
            <Text style={styles.linkText}>Don't have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Register</Text></Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demo}>
          <Text style={styles.demoTitle}>Demo Accounts</Text>
          {[
            { role: 'Main Doctor', email: 'admin@hospital.com' },
            { role: 'Doctor', email: 'sarah@hospital.com' },
            { role: 'Patient', email: 'john@patient.com' },
          ].map(d => (
            <TouchableOpacity key={d.email} onPress={() => setForm({ email: d.email, password: 'password123' })} style={styles.demoItem}>
              <Text style={styles.demoRole}>{d.role}</Text>
              <Text style={styles.demoEmail}>{d.email}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.gray50, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.gray800 },
  subtitle: { fontSize: 14, color: colors.gray500, marginTop: 4 },
  form: { backgroundColor: colors.white, borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  link: { alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 13, color: colors.gray500 },
  forgotLink: { alignItems: 'flex-end', marginBottom: 4 },
  forgotText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  demo: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  demoTitle: { fontSize: 12, fontWeight: '700', color: colors.gray500, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  demoItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  demoRole: { fontSize: 13, fontWeight: '600', color: colors.gray700 },
  demoEmail: { fontSize: 12, color: colors.primary },
});
