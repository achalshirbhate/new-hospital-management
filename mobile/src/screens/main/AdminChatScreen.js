import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert,
  FlatList, Modal, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io } from 'socket.io-client';
import api, { BASE_URL } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function AdminChatScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState('doctors'); // 'doctors' | 'patients'
  const [doctors, setDoctors] = useState([]);
  const [chatTokens, setChatTokens] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { roomId, name, type }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [docRes, tokenRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/chat-token'),
      ]);
      setDoctors(docRes.data);
      setChatTokens(tokenRes.data.filter(t => t.status === 'ACTIVE' || t.status === 'PENDING'));
    } catch {}
  }, []);

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const openChat = async (roomId, name, type = 'doctor') => {
    setActiveChat({ roomId, name, type });
    setMessages([]);
    try {
      const { data } = await api.get(`/messages/${roomId}`);
      setMessages(data);
    } catch {}
    socketRef.current?.disconnect();
    socketRef.current = io(BASE_URL);
    socketRef.current.emit('join-room', roomId);
    socketRef.current.on('receive-message', (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
  };

  const closeChat = () => {
    socketRef.current?.disconnect();
    setActiveChat(null);
    setMessages([]);
  };

  const sendMessage = () => {
    if (!input.trim() || !activeChat) return;
    const data = {
      roomId: activeChat.roomId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text: input.trim(),
    };
    socketRef.current?.emit('send-message', data);
    setMessages(prev => [...prev, { ...data, _id: Date.now().toString(), createdAt: new Date() }]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const approveToken = async (tokenId, doctorId) => {
    if (!doctorId) return Alert.alert('Error', 'Select a doctor first');
    try {
      await api.put(`/chat-token/${tokenId}/approve`, { doctorId });
      load();
      Alert.alert('✅ Approved', 'Chat session started for 30 minutes.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    }
  };

  const rejectToken = async (tokenId) => {
    try {
      await api.put(`/chat-token/${tokenId}/reject`);
      load();
    } catch {}
  };

  // Active chat view
  if (activeChat) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={closeChat} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <View style={styles.chatAvatar}>
              <Text style={styles.chatAvatarText}>{activeChat.name?.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.chatHeaderName}>{activeChat.name}</Text>
              <Text style={styles.chatHeaderSub}>{activeChat.type === 'doctor' ? '👨‍⚕️ Doctor' : '🏥 Patient Chat'}</Text>
            </View>
          </View>
        </View>

        <FlatList
          ref={scrollRef}
          data={messages}
          keyExtractor={(item, i) => item._id?.toString() || i.toString()}
          contentContainerStyle={{ padding: spacing.md }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMe = item.senderId === user.id || item.senderName === user.name;
            return (
              <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
                {!isMe && (
                  <View style={styles.msgAvatar}>
                    <Text style={styles.msgAvatarText}>{item.senderName?.charAt(0)}</Text>
                  </View>
                )}
                <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                  {!isMe && <Text style={styles.msgSender}>{item.senderName}</Text>}
                  {item.messageType === 'IMAGE' ? (
                    <Text style={styles.msgFile}>🖼 {item.fileName}</Text>
                  ) : item.messageType === 'FILE' ? (
                    <Text style={styles.msgFile}>📎 {item.fileName}</Text>
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Chats</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'doctors' && styles.tabActive]} onPress={() => setTab('doctors')}>
          <Text style={[styles.tabText, tab === 'doctors' && styles.tabTextActive]}>👨‍⚕️ Doctors</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'patients' && styles.tabActive]} onPress={() => setTab('patients')}>
          <Text style={[styles.tabText, tab === 'patients' && styles.tabTextActive]}>
            🏥 Patients {chatTokens.filter(t => t.status === 'PENDING').length > 0 ? `(${chatTokens.filter(t => t.status === 'PENDING').length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {tab === 'doctors' ? (
          <View style={{ padding: spacing.md }}>
            {doctors.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👨‍⚕️</Text>
                <Text style={styles.emptyText}>No doctors yet</Text>
              </View>
            ) : (
              doctors.map(doc => {
                const roomId = `admin-doctor-${doc.userId?._id || doc._id}`;
                return (
                  <TouchableOpacity key={doc._id} style={styles.chatItem} onPress={() => openChat(roomId, `Dr. ${doc.userId?.name}`, 'doctor')}>
                    <View style={styles.chatItemAvatar}>
                      <Text style={styles.chatItemAvatarText}>{doc.userId?.name?.charAt(0) || 'D'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.chatItemName}>Dr. {doc.userId?.name}</Text>
                      <Text style={styles.chatItemSub}>{doc.specialization || 'Cardiology'}</Text>
                    </View>
                    <Text style={styles.chatItemArrow}>›</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        ) : (
          <View style={{ padding: spacing.md }}>
            {chatTokens.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>No patient chat requests</Text>
              </View>
            ) : (
              chatTokens.map(token => (
                <View key={token._id} style={styles.tokenCard}>
                  <View style={styles.tokenHeader}>
                    <View style={styles.chatItemAvatar}>
                      <Text style={styles.chatItemAvatarText}>{token.patientId?.name?.charAt(0) || 'P'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.chatItemName}>{token.patientId?.name || 'Patient'}</Text>
                      <Text style={styles.chatItemSub}>{token.type} · {token.status}</Text>
                    </View>
                    <View style={[styles.statusPill, token.status === 'ACTIVE' ? styles.pillActive : styles.pillPending]}>
                      <Text style={styles.pillText}>{token.status}</Text>
                    </View>
                  </View>
                  {token.status === 'PENDING' && (
                    <View style={styles.tokenActions}>
                      <DoctorPicker doctors={doctors} onApprove={(doctorId) => approveToken(token._id, doctorId)} />
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectToken(token._id)}>
                        <Text style={styles.rejectBtnText}>✗ Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {token.status === 'ACTIVE' && (
                    <TouchableOpacity style={styles.openChatBtn} onPress={() => openChat(token.token, token.patientId?.name, 'patient')}>
                      <Text style={styles.openChatBtnText}>Open Chat ›</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DoctorPicker({ doctors, onApprove }) {
  const [selected, setSelected] = useState('');
  return (
    <View style={styles.pickerRow}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
        {doctors.map(d => (
          <TouchableOpacity
            key={d._id}
            style={[styles.doctorChip, selected === (d.userId?._id || d._id) && styles.doctorChipSelected]}
            onPress={() => setSelected(d.userId?._id || d._id)}
          >
            <Text style={[styles.doctorChipText, selected === (d.userId?._id || d._id) && styles.doctorChipTextSelected]}>
              Dr. {d.userId?.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(selected)}>
        <Text style={styles.approveBtnText}>✓ Approve</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.white, padding: spacing.md, ...shadow.sm },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  tabs: { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  chatItem: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', ...shadow.sm },
  chatItemAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  chatItemAvatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  chatItemName: { fontSize: 15, fontWeight: '600', color: colors.text },
  chatItemSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  chatItemArrow: { fontSize: 24, color: colors.textLight },
  tokenCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadow.sm },
  tokenHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  statusPill: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  pillActive: { backgroundColor: colors.successLight },
  pillPending: { backgroundColor: colors.warningLight },
  pillText: { fontSize: 10, fontWeight: '700', color: colors.text },
  tokenActions: { gap: spacing.sm },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  doctorChip: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 6, marginRight: spacing.xs },
  doctorChipSelected: { backgroundColor: colors.primary },
  doctorChipText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  doctorChipTextSelected: { color: colors.white },
  approveBtn: { backgroundColor: colors.successLight, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8 },
  approveBtnText: { color: colors.success, fontSize: 12, fontWeight: '700' },
  rejectBtn: { backgroundColor: colors.dangerLight, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, marginTop: spacing.xs },
  rejectBtnText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  openChatBtn: { backgroundColor: colors.primaryLight, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center', marginTop: spacing.xs },
  openChatBtnText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  // Chat view
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.primary, gap: spacing.sm },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 28, color: colors.white, fontWeight: '300' },
  chatHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  chatAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  chatAvatarText: { fontSize: 16, fontWeight: '700', color: colors.white },
  chatHeaderName: { fontSize: 16, fontWeight: '700', color: colors.white },
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
