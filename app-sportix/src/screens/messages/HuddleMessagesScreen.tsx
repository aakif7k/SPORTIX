/**
 * src/screens/messages/HuddleMessagesScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Huddle Chat & Squad Communications — SPORTiX Design System & Urbanist Typography.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  MessageCircle,
  Search,
  Zap,
  Bell,
  Settings,
  Users,
  ShieldCheck,
  Plus,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { messageService } from '../../services/messageService';
import { Conversation } from '../../types';
import { EmptyState } from '../../components/ui/EmptyState';
import { triggerHaptic } from '../../utils/haptics';

export function HuddleMessagesScreen({ navigation }: any) {
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chatType, setChatType] = useState<'all' | 'direct' | 'squads'>('all');

  useEffect(() => {
    messageService
      .getMyConversations()
      .then(setConversations)
      .finally(() => setLoading(false));
  }, []);

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderConv = ({ item, index }: { item: Conversation; index: number }) => {
    const time = item.last_message_at
      ? new Date(item.last_message_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Just now';

    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(200, index * 50)).duration(300)}
      >
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            navigation.navigate('DirectChat', {
              conversationId: item.$id,
              title: item.name,
            });
          }}
          style={styles.convCard}
          activeOpacity={0.85}
        >
          <View style={styles.avatarWrap}>
            {item.avatar_url ? (
              <Image
                source={{ uri: item.avatar_url }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.convInfo}>
            <View style={styles.convNameRow}>
              <Text style={styles.convName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.timeText}>{time}</Text>
            </View>
            <Text style={styles.lastMsg} numberOfLines={1}>
              {item.last_message || 'Tap to begin tactical communication'}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Top App Bar */}
        <View style={styles.topAppBar}>
          <View style={styles.topBrand}>
            <View style={styles.voltZapCircle}>
              <Zap size={14} color="#000" strokeWidth={3} fill="#000" />
            </View>
            <Text style={styles.brandTitle}>SPORTIX</Text>
            <View style={styles.huddleBadge}>
              <Text style={styles.huddleBadgeText}>HUDDLE</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                navigation.navigate('Notifications');
              }}
              style={styles.iconCircleBtn}
            >
              <Bell size={18} color="#FFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={() => {
                triggerHaptic('selection');
                navigation.navigate('Settings');
              }}
            >
              <Settings size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => {
                triggerHaptic('selection');
                navigation.navigate('ProfileDNATab');
              }}
            >
              <Image
                source={{
                  uri:
                    profile?.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
                }}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={16} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search teammates, squads, channels..."
              placeholderTextColor="#64748B"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {[
              { id: 'all', label: 'ALL CHATS' },
              { id: 'direct', label: 'DIRECT' },
              { id: 'squads', label: 'SQUAD HUDDLES' },
            ].map((tab) => {
              const isSel = chatType === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.filterChip, isSel && styles.filterChipActive]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setChatType(tab.id as any);
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSel && styles.filterChipTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#CCFF00" size="large" />
            <Text style={styles.loaderText}>SYNCING HUDDLE MESSAGES...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(c) => c.$id}
            renderItem={renderConv}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <EmptyState
                icon="💬"
                title="NO HUDDLES YET"
                subtitle="Start a direct chat with any athlete or form an AI AutoSquad!"
              />
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topAppBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  topBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voltZapCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 1,
  },
  huddleBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  huddleBadgeText: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#00D4FF',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121820',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#CCFF00',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },

  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C131A',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Urbanist_500Medium',
    color: '#FFF',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#0C131A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterChipActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  filterChipText: {
    fontSize: 10,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
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
  list: {
    padding: 16,
    gap: 10,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0C131A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#18202A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarInitial: {
    color: '#CCFF00',
    fontSize: 16,
    fontFamily: 'Urbanist_900Black',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF78',
    borderWidth: 1.5,
    borderColor: '#0C131A',
  },
  convInfo: {
    flex: 1,
    gap: 3,
  },
  convNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convName: {
    fontSize: 13,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
    flex: 1,
    marginRight: 6,
  },
  timeText: {
    fontSize: 9,
    fontFamily: 'Urbanist_500Medium',
    color: '#64748B',
  },
  lastMsg: {
    fontSize: 11,
    fontFamily: 'Urbanist_400Regular',
    color: '#94A3B8',
  },
});
