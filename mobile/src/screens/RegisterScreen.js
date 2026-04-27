import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors } from '../theme';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'PATIENT', specialization: '', age: '' });
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
        </View>

        <View style={styles.form}>
          <Input label="Full Name" placeholder="Your full name" value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
          <Input label="Email" placeholder="Email address" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={v => setForm({ ...form, email: v })} />
          <Input label="Password" placeholder="Password" secureTextEntry value={form.password} onChangeText={v => setForm({ ...form, password: v })} />

          <Text style={styles.pickerLabel}>Role</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.role} onValueChange={v => setForm({ ...form, role: v })}>
              <Picker.Item label="Patient" value="PATIENT" />
              <Picker.Item label="Doctor" value="DOCTOR" />
              <Picker.Item label="Main Doctor (Admin)" value="MAIN_DOCTOR" />
            </Picker>
          </View>

          {form.role === 'DOCTOR' && (
            <Input label="Specialization" placeholder="e.g. Cardiology" value={form.specialization} onChangeText={v => setForm({ ...form, specialization: v })} />
          )}
          {form.role === 'PATIENT' && (
            <Input label="Age" placeholder="Your age" keyboardType="numeric" value={form.age} onChangeText={v => setForm({ ...form, age: v })} />
          )}

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
  form: { backgroundColor: colors.white, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  pickerLabel: { fontSize: 13, fontWeight: '600', color: colors.gray700, marginBottom: 6 },
  pickerWrap: { borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 12, marginBottom: 14, overflow: 'hidden' },
  link: { alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 13, color: colors.gray500 },
});
