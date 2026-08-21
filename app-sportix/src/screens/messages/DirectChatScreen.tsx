/**
 * src/screens/messages/DirectChatScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Tactical In-Game Direct Chat — SPORTiX Mobile.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Send, Zap, Shield, Sparkles } from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { messageService } from '../../services/messageService';
import { subscribeToConversation } from '../../utils/realtimeManager';
import { Message } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

const QUICK_REACTIONS = ['⚡', '🔥', '🏆', '⚽', '🎯', '💪'];

export function DirectChatScreen({ route, navigation }: any) {
  const { conversationId, title } = route.params;
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    messageService.getMessages(conversationId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    const unsub = subscribeToConversation(conversationId, (payload: any) => {
      const newMsg: Message = {
        $id: payload.$id,
        conversation_id: payload.conversation_id,
        sender_id: payload.sender_id,
        content: payload.content ?? '',
        $createdAt: payload.$createdAt,
      };
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      try {
        unsub();
      } catch {
        // Ignored
      }
    };
  }, [conversationId]);

  const handleSend = useCallback(
    async (contentToSend?: string) => {
      const trimmed = (contentToSend || text).trim();
      if (!trimmed || sending) return;
      triggerHaptic('light');
      setSending(true);
      if (!contentToSend) setText('');

      try {
        const sent = await messageService.sendMessage(conversationId, trimmed);
        setMessages((prev) => [...prev, { ...sent, sender: profile ?? undefined }]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      } catch (e) {
        if (!contentToSend) setText(trimmed);
      } finally {
        setSending(false);
      }
    },
    [text, sending, conversationId, profile]
  );

  const renderMsg = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === profile?.$id;
    return (
      <View style={[styles.msgWrapper, isMe ? styles.msgRight : styles.msgLeft]}>
        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleThem,
          ]}
        >
          <Text
            style={[
              styles.msgText,
              isMe ? styles.msgTextMe : styles.msgTextThem,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.msgTime,
              isMe ? styles.msgTimeMe : styles.msgTimeThem,
            ]}
          >
            {item.$createdAt
              ? new Date(item.$createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Just now'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        {/* Top Chat Bar */}
        <View style={styles.topAppBar}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              navigation.goBack();
            }}
            style={styles.backBtn}
          >
            <ArrowLeft size={18} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.chatHeaderCenter}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {title || 'Athlete Huddle'}
            </Text>
            <View style={styles.onlineStatusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineStatusText}>TACTICAL ENCRYPTED CHANNEL</Text>
            </View>
          </View>

          <View style={styles.zapWrap}>
            <Zap size={16} color="#CCFF00" />
          </View>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#CCFF00" size="large" />
            <Text style={styles.loaderText}>CONNECTING TO HUDDLE...</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.$id}
            renderItem={renderMsg}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Quick Reaction Bar */}
        <View style={styles.reactionBar}>
          {QUICK_REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionChip}
              onPress={() => handleSend(emoji)}
            >
              <Text style={styles.reactionText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message Input Box */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Send tactical message or tactic..."
              placeholderTextColor="#64748B"
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
              disabled={!text.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Send size={16} color="#000" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121820',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chatHeaderCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  chatTitle: {
    fontSize: 14,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF78',
  },
  onlineStatusText: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  zapWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
    letterSpacing: 0.8,
  },

  messageList: {
    padding: 16,
    gap: 10,
  },
  msgWrapper: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  msgRight: {
    justifyContent: 'flex-end',
  },
  msgLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 4,
  },
  bubbleMe: {
    backgroundColor: '#CCFF00',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#121A22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgTextMe: {
    fontFamily: 'Urbanist_700Bold',
    color: '#000',
  },
  msgTextThem: {
    fontFamily: 'Urbanist_500Medium',
    color: '#FFF',
  },
  msgTime: {
    fontSize: 8,
    alignSelf: 'flex-end',
  },
  msgTimeMe: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontFamily: 'Urbanist_700Bold',
  },
  msgTimeThem: {
    color: '#64748B',
    fontFamily: 'Urbanist_500Medium',
  },

  reactionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  reactionChip: {
    backgroundColor: '#121A22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  reactionText: {
    fontSize: 14,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0C131A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#121A22',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Urbanist_500Medium',
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
