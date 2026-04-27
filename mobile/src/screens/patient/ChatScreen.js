import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, RefreshControl, KeyboardAvoidingView, Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { io } from 'socket.io-client';
import api, { BASE_URL } from '../../api/axios';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { colors } from '../../theme';

export default function ChatScreen() {
  const [tokens, setTokens] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [requestType, setRequestType] = useState('CHAT');
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  const load = async () => {
    try { const { data } = await api.get('/chat-token'); setTokens(data); } catch {}
  };

  useEffect(() => {
    load();
    api.get('/doctors').then(r => setDoctors(r.data)).catch(() => {});
  }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const sendRequest = async () => {
    if (!selectedDoctor) return Alert.alert('Error', 'Select a doctor first');
    try {
      await api.post('/chat-token/request', { doctorId: selectedDoctor, type: requestType });
      setSelectedDoctor('');
      load();
      Alert.alert('Sent!', 'Your request has been sent to the Main Doctor for approval.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    }
  };

  const joinSession = (token) => {
    setActiveSession(token);
    setMessages([]);
    socketRef.current = io(BASE_URL);
    socketRef.current.emit('join-room', token.token);
    socketRef.current.on('receive-message', (data) => {
      setMessages(prev => [...prev, data]);
    });
  };

  const leaveSession = () => {
    socketRef.current?.disconnect();
    setActiveSession(null);
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const data = { roomId: activeSession.token, text: chatInput, sender: 'Patient' };
    socketRef.current.emit('send-message', data);
    setMessages(prev => [...prev, data]);
    setChatInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Active chat/video session view
  if (activeSession) {
    if (activeSession.type === 'VIDEO') {
      return (
        <View style={styles.videoContainer}>
          <Text style={styles.videoIcon}>📹</Text>
          <Text style={styles.videoTitle}>Video Call</Text>
          <Text style={styles.videoSub}>Dr. {activeSession.doctorId?.name}</Text>
          <Text style={styles.videoExpiry}>Expires: {new Date(activeSession.endTime).toLocaleTimeString()}</Text>
          <View style={styles.videoControls}>
            <TouchableOpacity style={styles.videoBtn}><Text style={styles.videoBtnText}>🎤</Text></TouchableOpacity>
            <TouchableOpacity style={styles.videoBtn}><Text style={styles.videoBtnText}>📷</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.videoBtn, styles.endBtn]} onPress={leaveSession}>
              <Text style={styles.videoBtnText}>📵</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.chatHeader}>
          <View>
            <Text style={styles.chatHeaderName}>Dr. {activeSession.doctorId?.name}</Text>
            <Text style={styles.chatHeaderExpiry}>⏱ Expires {new Date(activeSession.endTime).toLocaleTimeString()}</Text>
          </View>
          <TouchableOpacity onPress={leaveSession} style={styles.leaveBtn}>
            <Text style={styles.leaveBtnText}>Leave</Text>
          </TouchableOpacity>
        </View>
        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={{ padding: 16 }}>
          {messages.length === 0 && <Text style={styles.chatEmpty}>Session started. Say hello 👋</Text>}
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubble, m.sender === 'Patient' ? styles.bubbleRight : styles.bubbleLeft]}>
              <Text style={[styles.bubbleText, m.sender === 'Patient' ? styles.bubbleTextRight : styles.bubbleTextLeft]}>
                {m.text}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.gray400}
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Chat / Video</Text>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerTitle}>📋 How it works</Text>
        <Text style={styles.infoBannerText}>1. Select a doctor and request type</Text>
        <Text style={styles.infoBannerText}>2. Request goes to Main Doctor for approval</Text>
        <Text style={styles.infoBannerText}>3. Once approved, join your 30-min session</Text>
      </View>

      {/* Type selector */}
      <View style={styles.typeRow}>
        <TouchableOpacity
          onPress={() => setRequestType('CHAT')}
          style={[styles.typeBtn, requestType === 'CHAT' && styles.typeBtnActive]}
        >
          <Text style={styles.typeIcon}>💬</Text>
          <Text style={[styles.typeLabel, requestType === 'CHAT' && styles.typeLabelActive]}>Text Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRequestType('VIDEO')}
          style={[styles.typeBtn, requestType === 'VIDEO' && styles.typeBtnVideo]}
        >
          <Text style={styles.typeIcon}>📹</Text>
          <Text style={[styles.typeLabel, requestType === 'VIDEO' && styles.typeLabelVideo]}>Video Call</Text>
        </TouchableOpacity>
      </View>

      {/* Doctor picker */}
      <Card>
        <Text style={styles.pickerLabel}>Select Doctor</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={selectedDoctor} onValueChange={setSelectedDoctor}>
            <Picker.Item label="-- Select a Doctor --" value="" />
            {doctors.map(d => (
              <Picker.Item key={d._id} label={`Dr. ${d.userId?.name} — ${d.specialization}`} value={d.userId?._id} />
            ))}
          </Picker>
        </View>
        <Button title="Send Request to Main Doctor" onPress={sendRequest} />
        <Text style={styles.hint}>ℹ️ Main Doctor must approve before session opens</Text>
      </Card>

      {/* Requests list */}
      <Text style={styles.sectionLabel}>My Requests</Text>
      {tokens.map(t => (
        <Card key={t._id}>
          <View style={styles.tokenRow}>
            <Text style={styles.tokenIcon}>{t.type === 'VIDEO' ? '📹' : '💬'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tokenDoctor}>Dr. {t.doctorId?.name}</Text>
              {t.status === 'PENDING' && <Text style={styles.tokenPending}>⏳ Waiting for approval</Text>}
              {t.status === 'ACTIVE' && <Text style={styles.tokenActive}>⏱ Expires: {new Date(t.endTime).toLocaleTimeString()}</Text>}
              {t.status === 'REJECTED' && <Text style={styles.tokenRejected}>❌ Rejected by Main Doctor</Text>}
              <View style={{ marginTop: 6, flexDirection: 'row', gap: 6 }}>
                <Badge label={t.status} />
                <Badge label={t.type || 'CHAT'} />
              </View>
            </View>
            {t.status === 'ACTIVE' && (
              <TouchableOpacity
                onPress={() => joinSession(t)}
                style={[styles.joinBtn, t.type === 'VIDEO' && styles.joinBtnVideo]}
              >
                <Text style={styles.joinBtnText}>{t.type === 'VIDEO' ? '📹 Join' : '💬 Join'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      ))}
      {tokens.length === 0 && <Text style={styles.empty}>No requests yet.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.gray800, marginBottom: 12 },
  infoBanner: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE' },
  infoBannerTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 6 },
  infoBannerText: { fontSize: 12, color: '#1D4ED8', marginBottom: 2 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typeBtn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 2, borderColor: colors.gray200, backgroundColor: colors.white },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: '#EFF6FF' },
  typeBtnVideo: { borderColor: colors.secondary, backgroundColor: '#F5F3FF' },
  typeIcon: { fontSize: 24, marginBottom: 4 },
  typeLabel: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  typeLabelActive: { color: colors.primary },
  typeLabelVideo: { color: colors.secondary },
  pickerLabel: { fontSize: 13, fontWeight: '600', color: colors.gray700, marginBottom: 6 },
  pickerWrap: { borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  hint: { fontSize: 11, color: colors.gray400, textAlign: 'center', marginTop: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.gray500, marginBottom: 8, textTransform: 'uppercase' },
  tokenRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tokenIcon: { fontSize: 24, marginTop: 2 },
  tokenDoctor: { fontSize: 15, fontWeight: '700', color: colors.gray800 },
  tokenPending: { fontSize: 12, color: colors.warning, marginTop: 2 },
  tokenActive: { fontSize: 12, color: colors.success, marginTop: 2 },
  tokenRejected: { fontSize: 12, color: colors.danger, marginTop: 2 },
  joinBtn: { backgroundColor: colors.success, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  joinBtnVideo: { backgroundColor: colors.secondary },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', color: colors.gray400, marginTop: 30 },
  // Chat UI
  chatHeader: { backgroundColor: colors.primary, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatHeaderName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  chatHeaderExpiry: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  leaveBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  leaveBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  messages: { flex: 1, backgroundColor: colors.gray50 },
  chatEmpty: { textAlign: 'center', color: colors.gray400, marginTop: 40 },
  bubble: { maxWidth: '75%', marginBottom: 8, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleRight: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleLeft: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14 },
  bubbleTextRight: { color: '#fff' },
  bubbleTextLeft: { color: colors.gray800 },
  inputRow: { flexDirection: 'row', padding: 12, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray200, gap: 10 },
  chatInput: { flex: 1, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: colors.gray800 },
  sendBtn: { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontSize: 18 },
  // Video UI
  videoContainer: { flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  videoIcon: { fontSize: 72, marginBottom: 16 },
  videoTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  videoSub: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  videoExpiry: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
  videoControls: { flexDirection: 'row', gap: 16, marginTop: 40 },
  videoBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  endBtn: { backgroundColor: '#DC2626' },
  videoBtnText: { fontSize: 24 },
});
