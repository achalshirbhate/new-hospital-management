import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, Image, Animated, Dimensions,
} from 'react-native';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, shadow } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Nurse avatar — uses emoji fallback (no local file dependency)
function NurseAvatar({ style }) {
  return (
    <View style={[style, { backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
      <Text style={{ fontSize: (style?.width || 32) * 0.55 }}>👩‍⚕️</Text>
    </View>
  );
}

const QUICK_QUESTIONS = [
  'Chest pain help',
  'My medications',
  'Diet tips',
  'Book appointment',
  'Emergency help',
  'Exercise advice',
];

const WELCOME_MSG = {
  _id: 'welcome',
  isBot: true,
  text: `Hi! 👋 I'm your Health Assistant.\n\nI can help with:\n• 🫀 Symptoms & health advice\n• 💊 Medication info\n• 🥗 Diet & lifestyle tips\n• 📅 App navigation\n• 🚨 Emergency guidance\n\nHow can I help you today?`,
  timestamp: new Date(),
};

export default function FloatingChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const openChat = () => {
    setOpen(true);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start();
  };

  const closeChat = () => {
    Animated.timing(scaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setOpen(false));
  };

  const sendMessage = useCallback(async (text) => {
    const msgText = (text || input).trim();
    if (!msgText) return;

    const userMsg = { _id: Date.now().toString(), isBot: false, text: msgText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const { data } = await api.post('/chatbot/message', { message: msgText });
      setMessages(prev => [...prev, {
        _id: (Date.now() + 1).toString(),
        isBot: true,
        text: data.response,
        timestamp: new Date(data.timestamp),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        _id: (Date.now() + 1).toString(),
        isBot: true,
        text: '⚠️ Connection issue. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [input]);

  const renderMessage = ({ item }) => {
    const isBot = item.isBot;
    return (
      <View style={[styles.msgRow, isBot ? styles.msgRowBot : styles.msgRowUser]}>
        {isBot && (
          <NurseAvatar style={styles.botAvatar} />
        )}
        <View style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
          {isBot && <Text style={styles.botLabel}>Health Assistant</Text>}
          <Text style={[styles.bubbleText, isBot ? styles.bubbleTextBot : styles.bubbleTextUser]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, isBot ? styles.bubbleTimeBot : styles.bubbleTimeUser]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!isBot && (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <TouchableOpacity style={styles.fab} onPress={openChat} activeOpacity={0.9}>
          <View style={styles.fabInner}>
            <Text style={styles.fabEmoji}>👩‍⚕️</Text>
          </View>
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>AI</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Chat Modal */}
      <Modal visible={open} transparent animationType="none" onRequestClose={closeChat}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={closeChat} activeOpacity={1} />
          <Animated.View style={[styles.chatContainer, { transform: [{ scale: scaleAnim }] }]}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <NurseAvatar style={styles.headerAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Health Assistant</Text>
                <View style={styles.onlineRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Online · Always available</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={closeChat}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                ⚕️ For informational purposes only. Always consult your doctor.
              </Text>
            </View>

            {/* Messages */}
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              renderItem={renderMessage}
              ListFooterComponent={
                loading ? (
                  <View style={styles.typingRow}>
                    <NurseAvatar style={styles.botAvatar} />
                    <View style={styles.typingBubble}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.typingText}>Typing...</Text>
                    </View>
                  </View>
                ) : null
              }
            />

            {/* Quick Questions */}
            <View style={styles.quickSection}>
              <FlatList
                data={QUICK_QUESTIONS}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item}
                contentContainerStyle={{ paddingHorizontal: spacing.sm, gap: spacing.xs }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.quickChip}
                    onPress={() => sendMessage(item)}
                    disabled={loading}
                  >
                    <Text style={styles.quickChipText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* Input */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask about symptoms, medications..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  onSubmitEditing={() => sendMessage()}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                  onPress={() => sendMessage()}
                  disabled={!input.trim() || loading}
                >
                  {loading
                    ? <ActivityIndicator size="small" color={colors.white} />
                    : <Text style={styles.sendBtnText}>➤</Text>
                  }
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Floating button
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    borderWidth: 2.5,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabEmoji: { fontSize: 30 },
  fabImage: { width: '100%', height: '100%' },
  fabBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  fabBadgeText: { color: colors.white, fontSize: 8, fontWeight: '800' },

  // Modal overlay
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },

  // Chat container
  chatContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.78,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },

  // Header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.primary,
    gap: spacing.sm,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.white },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#69F0AE' },
  onlineText: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },

  // Disclaimer
  disclaimer: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE082',
  },
  disclaimerText: { fontSize: 10, color: '#F57F17', lineHeight: 14 },

  // Messages
  messageList: { padding: spacing.md, paddingBottom: spacing.sm },
  msgRow: { flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.xs,
    backgroundColor: colors.primaryLight,
    flexShrink: 0,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
    flexShrink: 0,
  },
  userAvatarText: { fontSize: 13, fontWeight: '800', color: colors.white },
  bubble: { maxWidth: '75%', borderRadius: radius.lg, padding: spacing.sm, paddingHorizontal: spacing.md },
  bubbleBot: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  botLabel: { fontSize: 9, fontWeight: '700', color: colors.primary, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  bubbleText: { fontSize: 13, lineHeight: 19 },
  bubbleTextBot: { color: colors.text },
  bubbleTextUser: { color: colors.white },
  bubbleTime: { fontSize: 9, marginTop: 3, textAlign: 'right' },
  bubbleTimeBot: { color: colors.textLight },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.7)' },

  // Typing
  typingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  typingText: { fontSize: 12, color: colors.textSecondary },

  // Quick questions
  quickSection: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  quickChip: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipText: { fontSize: 11, color: colors.primary, fontWeight: '600' },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.text,
    maxHeight: 80,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  sendBtnDisabled: { backgroundColor: colors.gray400 },
  sendBtnText: { color: colors.white, fontSize: 16 },
});
