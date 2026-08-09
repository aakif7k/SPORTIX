import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { Avatar } from '../../components/ui/Avatar';
import { getUserConversations } from '../../services/messageService';
import { useAuthStore } from '../../store/authStore';
import { ConversationSummary } from '../../types';
import { Search, Plus, MessageSquare, UserX } from 'lucide-react-native';

export const HuddleMessagesScreen = ({ navigation }: any) => {
  const user = useAuthStore(state => state.user);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    if (user?.id) {
      getUserConversations(user.id).then(res => {
        setConversations(res);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const filtered = conversations.filter(c =>
    c.partner.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    c.partner.username.toLowerCase().includes(searchQ.toLowerCase())
  );

  const renderConversationItem = ({ item }: { item: ConversationSummary }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('DirectChat', { conversationId: item.id, partner: item.partner })}
    >
      <GlassCard style={styles.convCard}>
        <Avatar uri={item.partner.avatar} name={item.partner.name} size={44} isOnline={item.partner.isOnline} />

        <View style={styles.convInfo}>
          <View style={styles.convHeader}>
            <Text style={styles.partnerName}>{item.partner.name}</Text>
            <Text style={styles.timeText}>
              {item.lastMessage ? new Date(item.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
          </View>
          <Text style={styles.lastMsgText} numberOfLines={1}>
            {item.lastMessage?.content || 'No messages yet'}
          </Text>
        </View>

        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HUDDLE <Text style={styles.highlight}>MESSAGES</Text></Text>
        <TouchableOpacity style={styles.plusBtn} onPress={() => navigation.navigate('DiscoverTab')}>
          <Plus size={18} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={16} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search real athletes to chat..."
          placeholderTextColor="#555"
          value={searchQ}
          onChangeText={setSearchQ}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#00D4FF" size="large" />
          <Text style={styles.loadingText}>Syncing chats from Appwrite...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <UserX size={36} color="#555" />
              <Text style={styles.emptyTitle}>No active conversations yet.</Text>
              <Text style={styles.emptySub}>Explore Discover to scout athletes and start chatting!</Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
  },
  highlight: {
    color: '#CCFF00',
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A1118',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#FFF',
    fontSize: 13,
  },
  listContainer: {
    gap: 10,
    paddingBottom: 24,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  convInfo: {
    flex: 1,
    gap: 4,
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeText: {
    color: '#666',
    fontSize: 10,
  },
  lastMsgText: {
    color: '#888',
    fontSize: 12,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    color: '#888',
    fontSize: 12,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptySub: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
});
