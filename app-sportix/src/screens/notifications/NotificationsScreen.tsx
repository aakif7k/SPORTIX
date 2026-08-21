/**
 * src/screens/notifications/NotificationsScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * SPORTiX Buzz Notification Center — 1:1 Parity with Web App & Mobile Screenshot 3.
 * Features:
 * - Live Activity Feed Hero Header with Flame Glow
 * - "READ ALL" & "CLEAR ALL" action buttons
 * - "UPCOMING SCHEDULED DROPS" horizontal pulse carousel
 * - Filter switch: [ALL ACTIVITY (6)] & [UNREAD (3)]
 * - Grouped activity list: TODAY, YESTERDAY, EARLIER
 * - Rich notification items with actor avatars, dynamic icons, timestamps & unread dots
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Zap,
  Heart,
  User2,
  Clock,
  Trophy,
  Brain,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';

const UPCOMING_DROPS = [
  { id: 1, title: 'Summer Championship Bracket', time: '14:00', type: 'Tournament' },
  { id: 2, title: 'Pro Scouting Live Stream', time: '16:30', type: 'Event' },
  { id: 3, title: 'Pulse Level 50 Rewards Drop', time: '18:00', type: 'Reward' },
];

interface NotificationItem {
  id: string;
  type: 'event_invite' | 'ai_match' | 'like' | 'connection_request' | 'match_reminder' | 'achievement';
  title: string;
  message: string;
  timeAgo: string;
  group: 'TODAY' | 'YESTERDAY' | 'EARLIER';
  read: boolean;
  avatar?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'event_invite',
    title: 'Event Invitation',
    message: 'Marcus Thielemann invited you to join Pro Football 5v5 Championship',
    timeAgo: '30m ago',
    group: 'TODAY',
    read: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
  },
  {
    id: 'n2',
    type: 'ai_match',
    title: 'AI Team Match',
    message: 'SportiX AI found you 3 compatible teammates for Asia Pacific Basketball Open',
    timeAgo: '1h ago',
    group: 'TODAY',
    read: false,
  },
  {
    id: 'n3',
    type: 'like',
    title: 'New Like',
    message: 'Isabela Moraes liked your training post',
    timeAgo: '2h ago',
    group: 'TODAY',
    read: false,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
  },
  {
    id: 'n4',
    type: 'connection_request',
    title: 'Connection Request',
    message: 'Yuki Tanaka wants to connect with you',
    timeAgo: '1d ago',
    group: 'YESTERDAY',
    read: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
  },
  {
    id: 'n5',
    type: 'match_reminder',
    title: 'Match Reminder',
    message: 'Pro Football 5v5 Championship starts in 48 hours',
    timeAgo: '2d ago',
    group: 'EARLIER',
    read: true,
  },
  {
    id: 'n6',
    type: 'achievement',
    title: 'New Achievement',
    message: 'You unlocked "Early Adopter" — joined SportiX in the first wave',
    timeAgo: '3d ago',
    group: 'EARLIER',
    read: true,
  },
];

export function NotificationsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    triggerHaptic('medium');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    triggerHaptic('heavy');
    Alert.alert('Clear All Notifications', 'Are you sure you want to clear your notification history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => setNotifications([]),
      },
    ]);
  };

  const handleToggleRead = (id: string) => {
    triggerHaptic('selection');
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const todayList = filteredNotifications.filter((n) => n.group === 'TODAY');
  const yesterdayList = filteredNotifications.filter((n) => n.group === 'YESTERDAY');
  const earlierList = filteredNotifications.filter((n) => n.group === 'EARLIER');

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'event_invite':
        return <Calendar size={16} color="#CCFF00" />;
      case 'ai_match':
        return <Brain size={16} color="#00D4FF" />;
      case 'like':
        return <Heart size={16} color="#FF4D4D" />;
      case 'connection_request':
        return <User2 size={16} color="#BF5FFF" />;
      case 'match_reminder':
        return <Clock size={16} color="#FF6B00" />;
      case 'achievement':
        return <Trophy size={16} color="#FFD700" />;
      default:
        return <Bell size={16} color="#CCFF00" />;
    }
  };

  const renderNotificationCard = (item: NotificationItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.notifCard, item.read && styles.notifCardRead]}
      onPress={() => handleToggleRead(item.id)}
      activeOpacity={0.85}
    >
      {item.avatar ? (
        <View style={styles.avatarWrap}>
          <Image source={{ uri: item.avatar }} style={styles.notifAvatar} />
          <View style={styles.miniIconBadge}>
            {renderIcon(item.type)}
          </View>
        </View>
      ) : (
        <View style={styles.typeIconSquare}>
          {renderIcon(item.type)}
        </View>
      )}

      <View style={{ flex: 1, gap: 3 }}>
        <View style={styles.notifHeaderRow}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifTime}>{item.timeAgo}</Text>
        </View>
        <Text style={styles.notifMessage}>{item.message}</Text>
      </View>

      {!item.read && <View style={styles.unreadGreenDot} />}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Top Back Nav */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              triggerHaptic('selection');
              navigation.goBack();
            }}
          >
            <ArrowLeft size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── 1. Hero Header Banner (Matches Screenshot 3) ────────────── */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.heroBanner}>
            <View style={styles.liveTag}>
              <Bell size={12} color="#FF6B00" />
              <Text style={styles.liveTagText}>LIVE ACTIVITY FEED</Text>
            </View>

            <Text style={styles.heroTitle}>
              BUZZ <Text style={styles.orangeTitle}>NOTIFICATIONS</Text>
            </Text>
            <Text style={styles.heroSub}>
              {unreadCount > 0 ? `${unreadCount} unread activity updates` : 'All caught up!'}
            </Text>

            {/* Read All & Trash Buttons */}
            <View style={styles.bannerActionsRow}>
              <TouchableOpacity style={styles.readAllBtn} onPress={handleMarkAllRead}>
                <CheckCheck size={14} color="#CCFF00" />
                <Text style={styles.readAllBtnText}>READ ALL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.trashBtn} onPress={handleClearAll}>
                <Trash2 size={14} color="#FF4D4D" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── 2. Upcoming Scheduled Drops ─────────────────────────────── */}
          <View style={styles.dropsSection}>
            <View style={styles.dropsHeaderRow}>
              <View style={styles.redPulseDot} />
              <Text style={styles.dropsHeading}>UPCOMING SCHEDULED DROPS</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dropsScroll}
            >
              {UPCOMING_DROPS.map((drop) => (
                <View key={drop.id} style={styles.dropCard}>
                  <View style={styles.dropTimeCol}>
                    <Text style={styles.dropHour}>{drop.time.split(':')[0]}</Text>
                    <Text style={styles.dropMinute}>{drop.time.split(':')[1]}</Text>
                  </View>
                  <View style={styles.dropDivider} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropTitle} numberOfLines={1}>
                      {drop.title}
                    </Text>
                    <Text style={styles.dropType}>{drop.type}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ── 3. Filter Switcher (ALL vs UNREAD) ───────────────────────── */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
              onPress={() => {
                triggerHaptic('selection');
                setFilter('all');
              }}
            >
              <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>
                ALL ACTIVITY ({notifications.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterBtn, filter === 'unread' && styles.filterBtnActive]}
              onPress={() => {
                triggerHaptic('selection');
                setFilter('unread');
              }}
            >
              <Text style={[styles.filterBtnText, filter === 'unread' && styles.filterBtnTextActive]}>
                UNREAD ({unreadCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 4. Grouped Notification List ─────────────────────────────── */}
          {todayList.length > 0 && (
            <View style={styles.groupBlock}>
              <Text style={styles.groupLabel}>TODAY</Text>
              <View style={styles.groupCardsList}>
                {todayList.map(renderNotificationCard)}
              </View>
            </View>
          )}

          {yesterdayList.length > 0 && (
            <View style={styles.groupBlock}>
              <Text style={styles.groupLabel}>YESTERDAY</Text>
              <View style={styles.groupCardsList}>
                {yesterdayList.map(renderNotificationCard)}
              </View>
            </View>
          )}

          {earlierList.length > 0 && (
            <View style={styles.groupBlock}>
              <Text style={styles.groupLabel}>EARLIER</Text>
              <View style={styles.groupCardsList}>
                {earlierList.map(renderNotificationCard)}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topNavRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },

  /* Hero Banner */
  heroBanner: {
    backgroundColor: '#0A0605',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.25)',
    gap: 8,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveTagText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#FF6B00',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  orangeTitle: {
    color: '#FF6B00',
  },
  heroSub: {
    fontSize: 10,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
  },
  bannerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  readAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  readAllBtnText: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.6,
  },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Drops Section */
  dropsSection: {
    gap: 8,
  },
  dropsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  redPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
  dropsHeading: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  dropsScroll: {
    gap: 10,
  },
  dropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080808',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
    minWidth: 200,
  },
  dropTimeCol: {
    alignItems: 'center',
  },
  dropHour: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#FF6B00',
    lineHeight: 14,
  },
  dropMinute: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
  },
  dropDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dropTitle: {
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  dropType: {
    fontSize: 8,
    fontFamily: 'Urbanist_500Medium',
    color: '#64748B',
  },

  /* Filter Row */
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    backgroundColor: '#080808',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterBtnActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  filterBtnText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  filterBtnTextActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },

  /* Group Block */
  groupBlock: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#64748B',
    letterSpacing: 1,
    textAlign: 'center',
    marginVertical: 4,
  },
  groupCardsList: {
    gap: 8,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080808',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
    gap: 12,
  },
  notifCardRead: {
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#050505',
    opacity: 0.7,
  },
  avatarWrap: {
    position: 'relative',
    width: 38,
    height: 38,
  },
  notifAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  miniIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0E0E0E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 12,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  notifTime: {
    fontSize: 8,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#64748B',
  },
  notifMessage: {
    fontSize: 10,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
    lineHeight: 14,
  },
  unreadGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCFF00',
    shadowColor: '#CCFF00',
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});
