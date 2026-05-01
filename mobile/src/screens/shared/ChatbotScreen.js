import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

const QUICK_QUESTIONS = [
  '💓 Chest pain symptoms',
  '💊 My medications',
  '🥗 Cardiac diet tips',
  '📅 Book appointment',
  '🚨 Emergency help',
  '🏃 Exercise advice',
];

const WELCOME_MSG = {
  _id: 'welcome',
  isBot: true,
  text: `👋 Hello! I'm your **Cardiac Health Assistant** for Dr. Ravikant Patil's Tele Patient System.\n\nI can help you with:\n• 🫀 Cardiac symptoms & advice\n• 💊 Medication information\n• 🥗 Diet & lifestyle tips\n• 📅 App navigation help\n• 🚨 Emergency guidance\n\nHow can I help you today?`,
  timestamp: new Date(),
};

export default function ChatbotScreen({ navigation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const sendMessage = useCallback(async (text) => {
    const msgText = (text || input).trim();
    if (!msgText) return;

    const userMsg = {
      _id: Date.now().toString(),
      isBot: false,
      text: msgText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const { data } = await api.post('/chatbot/message', { message: msgText });
      const botMsg = {
        _id: (Date.now() + 1).toString(),
        isBot: true,
        text: data.response,
        timestamp: new Date(data.timestamp),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        _id: (Date.now() + 1).toString(),
        isBot: true,
        text: '⚠️ Sorry, I\'m having trouble connecting. Please try again or contact your doctor directly.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [input]);

  const clearChat = () => {
    setMessages([WELCOME_MSG]);
  };

  const renderMessage = ({ item }) => {
    const isBot = item.isBot;
    return (
      <View style={[styles.msgRow, isBot ? styles.msgRowBot : styles.msgRowUser]}>
        {isBot && (
          <View style={styles.botAvatar}>
            <Text style={styles.botAvatarText}>🤖</Text>
          </View>
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
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerBotIcon}>
            <Text style={styles.headerBotIconText}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Health Assistant</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online · Cardiac AI</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={clearChat}>
          <Text style={styles.clearBtnText}>🗑 Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚕️ For informational purposes only. Always consult Dr. Ravikant Patil for medical decisions.
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
              <View style={styles.botAvatar}>
                <Text style={styles.botAvatarText}>🤖</Text>
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typingText}>Thinking...</Text>
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
          contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quickChip}
              onPress={() => sendMessage(item.replace(/^[^\s]+\s/, ''))}
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
            placeholder="Ask about symptoms, medications, diet..."
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            blurOnSubmit={false}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, backgroundColor: colors.primary, ...shadow.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerBotIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBotIconText: { fontSize: 22 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.white },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#69F0AE' },
  onlineText: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  clearBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  clearBtnText: { fontSize: 12, color: colors.white, fontWeight: '600' },

  // Disclaimer
  disclaimer: {
    backgroundColor: '#FFF8E1', paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: '#FFE082',
  },
  disclaimerText: { fontSize: 11, color: '#F57F17', lineHeight: 16 },

  // Messages
  messageList: { padding: spacing.md, paddingBottom: spacing.sm },
  msgRow: { flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },

  botAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.xs, flexShrink: 0,
  },
  botAvatarText: { fontSize: 18 },
  userAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginLeft: spacing.xs, flexShrink: 0,
  },
  userAvatarText: { fontSize: 15, fontWeight: '800', color: colors.white },

  bubble: { maxWidth: '78%', borderRadius: radius.lg, padding: spacing.sm, paddingHorizontal: spacing.md },
  bubbleBot: {
    backgroundColor: colors.white, borderBottomLeftRadius: 4,
    ...shadow.sm, borderWidth: 1, borderColor: colors.border,
  },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },

  botLabel: { fontSize: 10, fontWeight: '700', color: colors.primary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  bubbleTextBot: { color: colors.text },
  bubbleTextUser: { color: colors.white },
  bubbleTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  bubbleTimeBot: { color: colors.textLight },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.7)' },

  // Typing
  typingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.sm,
    paddingHorizontal: spacing.md, ...shadow.sm, borderWidth: 1, borderColor: colors.border,
  },
  typingText: { fontSize: 13, color: colors.textSecondary },

  // Quick questions
  quickSection: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white },
  quickChip: {
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  quickChipText: { fontSize: 12, color: colors.primary, fontWeight: '600' },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: spacing.sm, backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm,
  },
  input: {
    flex: 1, backgroundColor: colors.background, borderRadius: radius.xl,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 14, color: colors.text, maxHeight: 100,
    borderWidth: 1.5, borderColor: colors.border,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    ...shadow.sm,
  },
  sendBtnDisabled: { backgroundColor: colors.gray400 },
  sendBtnText: { color: colors.white, fontSize: 18 },
});
