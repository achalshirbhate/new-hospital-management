import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors } from '../theme';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return Alert.alert('Error', 'Fill in all required fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      await login(data.user, data.token);
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.emoji}>🏥</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register as a patient</Text>
        </View>
        <View style={styles.form}>
          <Input label="Full Name" placeholder="Your full name" value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
          <Input label="Email" placeholder="Email address" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={v => setForm({ ...form, email: v })} />
          <Input label="Password" placeholder="Password" secureTextEntry value={form.password} onChangeText={v => setForm({ ...form, password: v })} />
          <Input label="Age" placeholder="Your age" keyboardType="numeric" value={form.age} onChangeText={v => setForm({ ...form, age: v })} />
          <Button title="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: 4 }} />
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
            <Text style={styles.linkText}>Already have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.gray50, padding: 24 },
  header: { alignItems: 'center', marginVertical: 28 },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: colors.gray800 },
  subtitle: { fontSize: 14, color: colors.gray500, marginTop: 4 },
  form: { backgroundColor: colors.white, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  link: { alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 13, color: colors.gray500 },
});
