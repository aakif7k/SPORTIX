/**
 * src/screens/feed/ReelFeedScreen.tsx
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet, Dimensions, ActivityIndicator, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '../../theme/ThemeContext';
import { reelService } from '../../services/reelService';
import { Reel } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { triggerHaptic } from '../../utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ReelFeedScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [reels,      setReels]      = useState<Reel[]>([]);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [loading,    setLoading]    = useState(true);
  const [activeIdx,  setActiveIdx]  = useState(0);
  const offset = useRef(0);

  useEffect(() => {
    reelService.getReels(0, 10).then(data => {
      setReels(data);
      setLoading(false);
      offset.current = data.length;
    });
  }, []);

  const handleLike = useCallback(async (reelId: string) => {
    triggerHaptic('medium');
    const liked = await reelService.toggleLike(reelId);
    setLikedReels(prev => {
      const n = new Set(prev);
      liked ? n.add(reelId) : n.delete(reelId);
      return n;
    });
    setReels(prev => prev.map(r =>
      r.$id === reelId ? { ...r, likes_count: r.likes_count + (liked ? 1 : -1) } : r
    ));
  }, []);

  const renderReel = ({ item, index }: { item: Reel; index: number }) => (
    <View style={styles.reelContainer}>
      <Video
        source={{ uri: item.video_url }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={index === activeIdx}
        isMuted={false}
      />
      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleLike(item.$id)} style={styles.actionBtn}>
            <Heart size={28} color={likedReels.has(item.$id) ? colors.hot : '#FFF'} fill={likedReels.has(item.$id) ? colors.hot : 'none'} />
            <Text style={[styles.actionCount, { color: '#FFF', fontFamily: 'Urbanist_700Bold' }]}>{item.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AthleteProfile', { userId: item.author_id })} style={styles.actionBtn}>
            {item.author_avatar_url
              ? <Image source={{ uri: item.author_avatar_url }} style={styles.authorThumb} />
              : <View style={[styles.authorThumb, { backgroundColor: colors.surface }]} />
            }
          </TouchableOpacity>
        </View>
        <View style={styles.info}>
          <Text style={[styles.authorName, { fontFamily: 'Urbanist_700Bold', color: '#FFF' }]}>@{item.author_username}</Text>
          <Text style={[styles.caption, { fontFamily: 'Urbanist_400Regular', color: '#FFF' }]}>{item.caption}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) return (
    <View style={[styles.loader, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.volt} size="large" />
    </View>
  );

  return (
    <FlatList
      data={reels}
      keyExtractor={r => r.$id}
      renderItem={renderReel}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={({ viewableItems }) => {
        if (viewableItems[0]?.index !== undefined) setActiveIdx(viewableItems[0].index!);
      }}
      viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      getItemLayout={(_, i) => ({ length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * i, index: i })}
      onEndReached={async () => {
        const more = await reelService.getReels(offset.current, 5);
        setReels(prev => [...prev, ...more]);
        offset.current += more.length;
      }}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  reelContainer: { height: SCREEN_HEIGHT, position: 'relative', backgroundColor: '#000' },
  video:         { ...StyleSheet.absoluteFillObject },
  overlay:       { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 20 },
  actions:       { position: 'absolute', right: 16, bottom: 100, gap: 20 },
  actionBtn:     { alignItems: 'center', gap: 4 },
  actionCount:   { fontSize: 13 },
  authorThumb:   { width: 44, height: 44, borderRadius: 22 },
  info:          { gap: 4, paddingRight: 60 },
  authorName:    { fontSize: 15 },
  caption:       { fontSize: 14, lineHeight: 20 },
  loader:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
