import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../../api/axios';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors } from '../../theme';

export default function LaunchPadSubmitScreen() {
  const [form, setForm] = useState({ title: '', description: '', domain: '', contact: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.description) return Alert.alert('Error', 'Title and description are required');
    setLoading(true);
    try {
      await api.post('/launchpad', form);
      Alert.alert('Submitted! 🚀', 'Your idea has been sent to the Main Doctor.');
      setForm({ title: '', description: '', domain: '', contact: '' });
    } catch {
      Alert.alert('Error', 'Submission failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>LaunchPad</Text>
        <Text style={styles.sub}>Submit your ideas or suggestions to the Main Doctor.</Text>

        <View style={styles.form}>
          <Input label="Idea Title *" placeholder="e.g. Telemedicine Integration" value={form.title} onChangeText={v => setForm({ ...form, title: v })} />
          <Input
            label="Description *"
            placeholder="Describe your idea in detail..."
            value={form.description}
            onChangeText={v => setForm({ ...form, description: v })}
            multiline
            style={{ height: 100, textAlignVertical: 'top' }}
          />
          <Input label="Domain" placeholder="e.g. Technology, Healthcare" value={form.domain} onChangeText={v => setForm({ ...form, domain: v })} />
          <Input label="Contact" placeholder="Your email or phone" value={form.contact} onChangeText={v => setForm({ ...form, contact: v })} />
          <Button title="🚀 Submit Idea" onPress={handleSubmit} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.gray800 },
  sub: { fontSize: 13, color: colors.gray400, marginBottom: 20, marginTop: 4 },
  form: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
});
