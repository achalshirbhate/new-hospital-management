import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io } from 'socket.io-client';
import api, { BASE_URL } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function DoctorChatScreen() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/patients');
      setPatients(data.filter(p => p.approvalStatus === 'APPROVED'));
    } catch {}
  }, []);

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const openChat = async (roomId, name, type) => {
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
              <Text style={styles.chatHeaderSub}>{activeChat.type === 'admin' ? '🏥 Admin' : '🫀 Patient'}</Text>
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
                  <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
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

      <ScrollView
        style={{ flex: 1, padding: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Admin Chat - always available */}
        <Text style={styles.sectionTitle}>Admin</Text>
        <TouchableOpacity
          style={[styles.chatItem, styles.adminChatItem]}
          onPress={() => openChat(`admin-doctor-${user.id}`, 'Dr. Ravikant Patil (Admin)', 'admin')}
        >
          <View style={[styles.chatItemAvatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.chatItemAvatarText, { color: colors.white }]}>R</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatItemName}>Dr. Ravikant Patil</Text>
            <Text style={styles.chatItemSub}>🏥 Admin · Always available</Text>
          </View>
          <Text style={styles.chatItemArrow}>›</Text>
        </TouchableOpacity>

        {/* Patient Chats */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>My Patients ({patients.length})</Text>
        {patients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No approved patients yet</Text>
          </View>
        ) : (
          patients.map(p => {
            const roomId = `doctor-patient-${user.id}-${p._id}`;
            return (
              <TouchableOpacity key={p._id} style={styles.chatItem} onPress={() => openChat(roomId, p.userId?.name, 'patient')}>
                <View style={styles.chatItemAvatar}>
                  <Text style={styles.chatItemAvatarText}>{p.userId?.name?.charAt(0) || 'P'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chatItemName}>{p.userId?.name}</Text>
                  <Text style={styles.chatItemSub}>🫀 Patient</Text>
                </View>
                <Text style={styles.chatItemArrow}>›</Text>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.white, padding: spacing.md, ...shadow.sm },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  chatItem: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', ...shadow.sm },
  adminChatItem: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  chatItemAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  chatItemAvatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  chatItemName: { fontSize: 15, fontWeight: '600', color: colors.text },
  chatItemSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  chatItemArrow: { fontSize: 24, color: colors.textLight },
  emptyState: { alignItems: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: { fontSize: 14, color: colors.textSecondary },
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
  msgTime: { fontSize: 10, color: colors.textLight, marginTop: 4, textAlign: 'right' },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  chatInput: { flex: 1, backgroundColor: colors.background, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.text, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: colors.white, fontSize: 18 },
});
