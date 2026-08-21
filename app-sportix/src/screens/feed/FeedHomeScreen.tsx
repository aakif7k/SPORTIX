/**
 * src/screens/feed/FeedHomeScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Hypezone Home Feed — 100% Urbanist Typography & SportiX Cyber Design System.
 * Features:
 * - Top App Bar with SPORTIX Volt logo, notification badge, and profile avatar
 * - 24-Hour Stories horizontal rail with animated neon border rings
 * - Infinite scroll feed with rich media, sport tags, and interactive likes/comments
 * - Floating action button for Post Composer with glowing Volt aura
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Bell,
  Plus,
  Heart,
  MessageCircle,
  Share2,
  Zap,
  Settings,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { postService } from '../../services/postService';
import { storyService } from '../../services/storyService';
import { EmptyState } from '../../components/ui/EmptyState';
import { Post, Story } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

const PAGE_SIZE = 15;

export function FeedHomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offset = useRef(0);

  const loadFeed = useCallback(async (reset = false) => {
    if (reset) {
      offset.current = 0;
      setHasMore(true);
    }
    if (!reset && (!hasMore || loadingMore)) return;

    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const [newPosts, activeStories] = await Promise.all([
        postService.getFeed(offset.current, PAGE_SIZE),
        reset ? storyService.getActiveStories() : Promise.resolve(null),
      ]);

      if (activeStories) setStories(activeStories);

      if (newPosts.length < PAGE_SIZE) setHasMore(false);

      const postIds = newPosts.map((p) => p.$id);
      const liked = await postService.getLikedPostIds(postIds);
      setLikedPosts((prev) => new Set([...prev, ...liked]));

      setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
      offset.current += newPosts.length;
    } catch (e) {
      console.warn('Feed load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore]);

  useEffect(() => {
    loadFeed(true);
  }, []);

  const handleRefresh = () => {
    triggerHaptic('light');
    setRefreshing(true);
    loadFeed(true);
  };

  const handleToggleLike = async (post: Post) => {
    triggerHaptic('selection');
    const isLiked = likedPosts.has(post.$id);
    const newLiked = new Set(likedPosts);
    isLiked ? newLiked.delete(post.$id) : newLiked.add(post.$id);
    setLikedPosts(newLiked);

    setPosts((prev) =>
      prev.map((p) =>
        p.$id === post.$id
          ? { ...p, likes_count: (p.likes_count || 0) + (isLiked ? -1 : 1) }
          : p
      )
    );

    try {
      await postService.toggleLike(post.$id);
    } catch {
      // Revert on error
      setLikedPosts(likedPosts);
    }
  };

  const renderStory = ({ item }: { item: Story }) => (
    <TouchableOpacity
      onPress={() => {
        triggerHaptic('light');
        navigation.navigate('StoryViewer', { storyId: item.$id });
      }}
      style={styles.storyItem}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={['#CCFF00', '#00D4FF', '#BF5FFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.storyRing}
      >
        <Image
          source={{
            uri:
              item.author_avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
          }}
          style={styles.storyAvatar}
          resizeMode="cover"
        />
      </LinearGradient>
      <Text style={styles.storyName} numberOfLines={1}>
        {item.author_name?.split(' ')[0] || 'Athlete'}
      </Text>
    </TouchableOpacity>
  );

  const renderPost = ({ item, index }: { item: Post; index: number }) => {
    const isLiked = likedPosts.has(item.$id);
    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(250, index * 60)).duration(350)}
        style={styles.postCard}
      >
        {/* Author Header */}
        <View style={styles.authorRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AthleteProfile', { userId: item.author_id })}
            style={styles.authorTouch}
          >
            <Image
              source={{
                uri:
                  item.author_avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
              }}
              style={styles.authorAvatar}
              resizeMode="cover"
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{item.author_full_name || 'SPORTiX Athlete'}</Text>
              <Text style={styles.authorMeta}>
                @{item.author_username || 'athlete'} • {(item.author_sport || item.sport_tag || 'SPORTS').toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>

          {(item.sport_tag || item.author_sport) && (
            <View style={styles.sportTag}>
              <Text style={styles.sportTagText}>⚡ {(item.sport_tag || item.author_sport).toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Text Content */}
        {Boolean(item.content) && (
          <Text style={styles.postContent}>{item.content}</Text>
        )}

        {/* Media */}
        {Boolean(item.media_urls?.[0]) && (
          <Image
            source={{ uri: item.media_urls[0] }}
            style={styles.postMedia}
            resizeMode="cover"
          />
        )}

        {/* Actions Bar */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => handleToggleLike(item)}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <Heart
              size={18}
              color={isLiked ? '#FF3B30' : '#94A3B8'}
              fill={isLiked ? '#FF3B30' : 'transparent'}
            />
            <Text
              style={[
                styles.actionCount,
                isLiked ? { color: '#FF3B30', fontFamily: 'Urbanist_800ExtraBold' } : null,
              ]}
            >
              {item.likes_count || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('PostDetail', { postId: item.$id })}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <MessageCircle size={18} color="#94A3B8" />
            <Text style={styles.actionCount}>{item.comments_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => triggerHaptic('selection')}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <Share2 size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Top App Bar */}
        <View style={styles.header}>
          <View style={styles.topBrand}>
            <View style={styles.voltZapCircle}>
              <Zap size={14} color="#000" strokeWidth={3} fill="#000" />
            </View>
            <Text style={styles.brandTitle}>SPORTIX</Text>
            <View style={styles.hypeBadge}>
              <Text style={styles.hypeBadgeText}>HYPEZONE</Text>
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

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#CCFF00" size="large" />
            <Text style={styles.loaderText}>LOADING ARENA FEED...</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(p) => p.$id}
            renderItem={renderPost}
            ListEmptyComponent={
              <EmptyState
                icon="⚡"
                title="NO POSTS YET"
                subtitle="Be the first to share a highlight or match result in the arena!"
              />
            }
            ListHeaderComponent={
              stories.length > 0 ? (
                <View style={styles.storiesSection}>
                  <FlatList
                    data={stories}
                    keyExtractor={(s) => s.$id}
                    renderItem={renderStory}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.storiesList}
                  />
                </View>
              ) : null
            }
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator color="#CCFF00" style={{ margin: 20 }} />
              ) : null
            }
            onEndReached={() => loadFeed(false)}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#CCFF00"
              />
            }
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* FAB — Post Composer */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('heavy');
            navigation.navigate('PostComposer');
          }}
          style={styles.fab}
          activeOpacity={0.9}
        >
          <Plus size={24} color="#000" strokeWidth={3} />
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
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
  hypeBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hypeBadgeText: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
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
    padding: 14,
    gap: 14,
    paddingBottom: 90,
  },
  storiesSection: {
    marginBottom: 6,
  },
  storiesList: {
    paddingHorizontal: 2,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
    gap: 4,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  storyName: {
    fontSize: 10,
    fontFamily: 'Urbanist_700Bold',
    color: '#94A3B8',
    textAlign: 'center',
  },

  postCard: {
    backgroundColor: '#0C131A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    gap: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  authorMeta: {
    fontSize: 10,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#64748B',
    marginTop: 1,
  },
  sportTag: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  sportTagText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
  },
  postContent: {
    fontSize: 13,
    fontFamily: 'Urbanist_400Regular',
    color: '#E2E8F0',
    lineHeight: 19,
  },
  postMedia: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    backgroundColor: '#121A22',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 12,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#94A3B8',
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#CCFF00',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
