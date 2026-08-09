import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Avatar } from '../../components/ui/Avatar';
import { getOrCreateConversation, getConversationMessages, sendMessage } from '../../services/messageService';
import { useAuthStore } from '../../store/authStore';
import { DbMessage } from '../../types';
import { ChevronLeft, Send, CheckCheck } from 'lucide-react-native';
import { client, DATABASE_ID, COLLECTIONS } from '../../api/appwrite';

export const DirectChatScreen = ({ route, navigation }: any) => {
  const { conversationId: initialConvId, userId: targetUserId, partner: passedPartner } = route.params || {};
  const user = useAuthStore(state => state.user);

  const [convId, setConvId] = useState<string | null>(initialConvId || null);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList>(null);

  // Initialize conversation
  useEffect(() => {
    let isMounted = true;
    if (initialConvId) {
      setConvId(initialConvId);
      setLoading(false);
      return;
    }

    if (user?.id && targetUserId) {
      getOrCreateConversation(user.id, targetUserId).then(cId => {
        if (isMounted) {
          setConvId(cId);
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }

    return () => { isMounted = false; };
  }, [initialConvId, user?.id, targetUserId]);

  // Load messages & subscribe to realtime
  useEffect(() => {
    if (!convId) return;

    getConversationMessages(convId).then(msgs => {
      setMessages(msgs);
    });

    const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents`;
    const unsubscribe = client.subscribe(channel, (response: any) => {
      if (response.payload && response.payload.conversation_id === convId) {
        getConversationMessages(convId).then(setMessages);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [convId]);

  const handleSend = async () => {
    if (!input.trim() || !convId || !user?.id) return;
    const text = input.trim();
    setInput('');

    const temp: DbMessage = {
      $id: `temp_${Date.now()}`,
      conversation_id: convId,
      sender_id: user.id,
      message: text,
      message_type: 'text',
      created_at: new Date().toISOString(),
      status: 'sending',
    };

    setMessages(prev => [...prev, temp]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    await sendMessage(convId, user.id, text);
    getConversationMessages(convId).then(setMessages);
  };

  const renderBubble = ({ item }: { item: DbMessage }) => {
    const isOwn = item.sender_id === user?.id;

    return (
      <View style={[styles.bubbleWrapper, isOwn ? styles.ownWrapper : styles.partnerWrapper]}>
        <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.partnerBubble]}>
          <Text style={[styles.msgText, isOwn ? styles.ownText : styles.partnerText]}>
            {item.message}
          </Text>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, isOwn ? styles.ownTime : styles.partnerTime]}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isOwn && <CheckCheck size={12} color="#000" />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper bg="#050A0E">
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header (No phone/video calls) */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={20} color="#FFF" />
          </TouchableOpacity>

          <Avatar
            uri={passedPartner?.avatar}
            name={passedPartner?.name || 'Athlete'}
            size={36}
            isOnline={passedPartner?.isOnline}
          />

          <View style={styles.headerInfo}>
            <Text style={styles.partnerTitle}>{passedPartner?.name || 'Athlete Chat'}</Text>
            <Text style={styles.statusText}>Active Now</Text>
          </View>
        </View>

        {/* Chat Body */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#CCFF00" size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.$id}
            renderItem={renderBubble}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#555"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Send size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  partnerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#CCFF00',
    fontSize: 10,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  bubbleWrapper: {
    flexDirection: 'row',
  },
  ownWrapper: {
    justifyContent: 'flex-end',
  },
  partnerWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#CCFF00',
    borderBottomRightRadius: 2,
  },
  partnerBubble: {
    backgroundColor: '#121A22',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  ownText: {
    color: '#000',
    fontWeight: '500',
  },
  partnerText: {
    color: '#FFF',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 9,
  },
  ownTime: {
    color: 'rgba(0,0,0,0.6)',
  },
  partnerTime: {
    color: '#666',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0A1118',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 42,
    backgroundColor: '#121A22',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#FFF',
    fontSize: 13,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
