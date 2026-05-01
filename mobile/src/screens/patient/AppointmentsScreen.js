import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, FlatList, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io } from 'socket.io-client';
import api, { BASE_URL } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function AppointmentsScreen({ navigation }) {
  const { user } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/chat-token');
      setTokens(data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const requestToken = async (type) => {
    setRequesting(true);
    try {
      await api.post('/chat-token/request', { type });
      load();
      Alert.alert('✅ Request Sent', 'Your request has been sent to Admin for approval.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally { setRequesting(false); }
  };

  const openChat = async (token) => {
    setActiveChat(token);
    setMessages([]);
    try {
      const { data } = await api.get(`/messages/${token.token}`);
      setMessages(data);
    } catch {}
    socketRef.current?.disconnect();
    socketRef.current = io(BASE_URL);
    socketRef.current.emit('join-room', token.token);
    socketRef.current.on('receive-message', (msg) => {
      setMessages(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    socketRef.current.on('session-terminated', () => {
      Alert.alert('Session Ended', 'The doctor has ended this session.', [
        { text: 'OK', onPress: () => { socketRef.current?.disconnect(); setActiveChat(null); setMessages([]); load(); } }
      ]);
    });
  };

  const closeChat = () => {
    socketRef.current?.disconnect();
    setActiveChat(null);
    setMessages([]);
  };

  const sendMessage = () => {
    if (!input.trim() || !activeChat) return;
    const data = { roomId: activeChat.token, senderId: user.id, senderName: user.name, senderRole: 'PATIENT', text: input.trim() };
    socketRef.current?.emit('send-message', data);
    setMessages(prev => [...prev, { ...data, _id: Date.now().toString(), createdAt: new Date() }]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ── Active Chat View ──────────────────────────────────────────────────────
  if (activeChat) {
    const timeLeft = activeChat.endTime ? Math.max(0, Math.floor((new Date(activeChat.endTime) - new Date()) / 60000)) : 0;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={closeChat} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.chatAvatar}>
            <Text style={styles.chatAvatarText}>{activeChat.doctorId?.name?.charAt(0) || 'D'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatHeaderName}>Dr. {activeChat.doctorId?.name || 'Doctor'}</Text>
            <Text style={styles.chatHeaderSub}>⏱ {timeLeft} min remaining · {activeChat.type}</Text>
          </View>
        </View>
        <FlatList
          ref={scrollRef}
          data={messages}
          keyExtractor={(item, i) => item._id?.toString() || i.toString()}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMe = item.senderId === user.id || item.senderName === user.name;
            return (
              <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
                {!isMe && <View style={styles.msgAvatar}><Text style={styles.msgAvatarText}>{item.senderName?.charAt(0)}</Text></View>}
                <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                  {!isMe && <Text style={styles.msgSender}>{item.senderName}</Text>}
                  {item.fileUrl ? (
                    <Text style={styles.msgFile}>📎 {item.fileName || 'Attachment'}</Text>
                  ) : (
                    <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
                  )}
                  <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const activeTokens = tokens.filter(t => t.status === 'ACTIVE');
  const pendingTokens = tokens.filter(t => t.status === 'PENDING');
  const pastTokens = tokens.filter(t => t.status === 'EXPIRED' || t.status === 'REJECTED');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Appointments</Text>
        <Text style={styles.headerSub}>Dr. Ravikant Patil Tele Patient System</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Request Buttons */}
        <View style={styles.requestCard}>
          <Text style={styles.requestTitle}>Request New Session</Text>
          <Text style={styles.requestSub}>Sessions require Admin approval before they become active</Text>
          <View style={styles.requestBtns}>
            <TouchableOpacity style={styles.chatReqBtn} onPress={() => requestToken('CHAT')} disabled={requesting}>
              <Text style={styles.reqBtnIcon}>💬</Text>
              <Text style={styles.chatReqBtnText}>Request Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.videoReqBtn} onPress={() => requestToken('VIDEO')} disabled={requesting}>
              <Text style={styles.reqBtnIcon}>📹</Text>
              <Text style={styles.videoReqBtnText}>Request Video</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Sessions */}
        {activeTokens.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={styles.activeDot} />
              <Text style={styles.sectionTitle}>Active Sessions</Text>
            </View>
            {activeTokens.map(t => (
              <View key={t._id} style={styles.activeCard}>
                <View style={styles.activeCardInfo}>
                  <Text style={styles.activeCardType}>{t.type === 'VIDEO' ? '📹' : '💬'} {t.type}</Text>
                  <Text style={styles.activeCardDoctor}>Dr. {t.doctorId?.name || 'Doctor'}</Text>
                  {t.endTime && (
                    <Text style={styles.activeCardTime}>
                      ⏱ Ends {new Date(t.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={t.type === 'VIDEO' ? styles.joinVideoBtn : styles.joinChatBtn}
                  onPress={() => openChat(t)}
                >
                  <Text style={styles.joinBtnText}>{t.type === 'VIDEO' ? '📹 Join' : '💬 Chat'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Pending */}
        {pendingTokens.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏳ Pending Requests</Text>
            {pendingTokens.map(t => (
              <View key={t._id} style={styles.tokenCard}>
                <View style={styles.tokenIcon}>
                  <Text style={styles.tokenIconText}>{t.type === 'VIDEO' ? '📹' : '💬'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tokenType}>{t.type} Request</Text>
                  <Text style={styles.tokenStatus}>⏳ Waiting for Admin approval</Text>
                  <Text style={styles.tokenDate}>{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <View style={styles.pendingPill}><Text style={styles.pendingPillText}>PENDING</Text></View>
              </View>
            ))}
          </View>
        )}

        {/* Past */}
        {pastTokens.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📜 Past Sessions</Text>
            {pastTokens.map(t => (
              <View key={t._id} style={[styles.tokenCard, { opacity: 0.7 }]}>
                <View style={[styles.tokenIcon, { backgroundColor: t.status === 'REJECTED' ? colors.dangerLight : colors.successLight }]}>
                  <Text style={styles.tokenIconText}>{t.status === 'REJECTED' ? '❌' : '✅'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tokenType}>{t.type} · {t.status}</Text>
                  {t.doctorId && <Text style={styles.tokenStatus}>Dr. {t.doctorId?.name}</Text>}
                  <Text style={styles.tokenDate}>{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {tokens.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No appointments yet</Text>
            <Text style={styles.emptyText}>Request a chat or video session above</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.white, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, ...shadow.sm },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 11, color: colors.primary, marginTop: 2 },
  requestCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadow.sm },
  requestTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  requestSub: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md },
  requestBtns: { flexDirection: 'row', gap: spacing.sm },
  chatReqBtn: { flex: 1, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary },
  videoReqBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  reqBtnIcon: { fontSize: 24, marginBottom: 4 },
  chatReqBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  videoReqBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
  section: { marginBottom: spacing.md },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  activeCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: colors.success, ...shadow.sm },
  activeCardInfo: { flex: 1 },
  activeCardType: { fontSize: 14, fontWeight: '700', color: colors.text },
  activeCardDoctor: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  activeCardTime: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  joinChatBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  joinVideoBtn: { backgroundColor: '#7B1FA2', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  joinBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  tokenCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, ...shadow.sm },
  tokenIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  tokenIconText: { fontSize: 20 },
  tokenType: { fontSize: 14, fontWeight: '600', color: colors.text },
  tokenStatus: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  tokenDate: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  pendingPill: { backgroundColor: colors.warningLight, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  pendingPillText: { fontSize: 9, fontWeight: '800', color: colors.warning },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  emptyText: { fontSize: 13, color: colors.textSecondary },
  // Chat view
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.primary, gap: spacing.sm },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 28, color: colors.white, fontWeight: '300' },
  chatAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  chatAvatarText: { fontSize: 16, fontWeight: '700', color: colors.white },
  chatHeaderName: { fontSize: 15, fontWeight: '700', color: colors.white },
  chatHeaderSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  msgRow: { flexDirection: 'row', marginBottom: spacing.sm, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.xs },
  msgAvatarText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  msgBubble: { maxWidth: '75%', borderRadius: radius.md, padding: spacing.sm, paddingHorizontal: spacing.md },
  msgBubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: colors.white, borderBottomLeftRadius: 4, ...shadow.sm },
  msgSender: { fontSize: 11, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  msgText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  msgTextMe: { color: colors.white },
  msgFile: { fontSize: 13, color: colors.primary },
  msgTime: { fontSize: 10, color: colors.textLight, marginTop: 4, textAlign: 'right' },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  chatInput: { flex: 1, backgroundColor: colors.background, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.text, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: colors.white, fontSize: 18 },
});
