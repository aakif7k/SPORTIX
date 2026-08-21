/**
 * src/screens/profile/MediaVaultScreen.tsx
 */
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Video as VideoIcon, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { postService } from '../../services/postService';
import { reelService } from '../../services/reelService';
import { EmptyState } from '../../components/ui/EmptyState';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 40) / 3;

interface VaultItem {
  id: string;
  url: string;
  type: 'image' | 'video';
}

export function MediaVaultScreen({ navigation }: any) {
  const { colors } = useTheme();
  const profile = useAuthStore(state => state.profile);

  const [items,   setItems]   = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVault = async () => {
      try {
        const [posts, reels] = await Promise.all([
          postService.getFeed(0, 50),
          reelService.getReels(0, 50),
        ]);

        const myPosts = posts.filter(p => p.author_id === profile?.$id && p.media_urls && p.media_urls.length > 0);
        const myReels = reels.filter(r => r.author_id === profile?.$id);

        const vault: VaultItem[] = [];
        myPosts.forEach(p => {
          p.media_urls.forEach((url, idx) => {
            vault.push({ id: `${p.$id}_${idx}`, url, type: p.media_type || 'image' });
          });
        });
        myReels.forEach(r => {
          vault.push({ id: r.$id, url: r.thumbnail_url || r.video_url, type: 'video' });
        });

        setItems(vault);
      } catch (err) {
        console.warn('[MediaVault] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVault();
  }, [profile?.$id]);

  return (
    <LinearGradient colors={[colors.background, colors.background]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.textSecondary} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Media Vault</Text>
          <View style={{ width: 22 }} />
        </View>

        {loading ? (
          <View style={styles.loader}><ActivityIndicator color={colors.volt} size="large" /></View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            numColumns={3}
            contentContainerStyle={styles.list}
            columnWrapperStyle={{ gap: 4 }}
            ListEmptyComponent={
              <EmptyState icon="🎞️" title="Vault is Empty" subtitle="Your uploaded highlights, posts, and match photos will appear here." />
            }
            renderItem={({ item }) => (
              <View style={[styles.itemWrap, { backgroundColor: colors.surface }]}>
                {item.type === 'video' ? (
                  <View style={[styles.videoThumbnail, { backgroundColor: colors.elevated }]}>
                    <VideoIcon size={24} color={colors.volt} />
                  </View>
                ) : (
                  <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
                )}
                <View style={styles.typeBadge}>
                  {item.type === 'video' ? <VideoIcon size={12} color="#FFF" /> : <ImageIcon size={12} color="#FFF" />}
                </View>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1 },
  loader:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle:    { fontSize: 17 },
  list:           { padding: 16, gap: 4, paddingBottom: 40 },
  itemWrap:       { width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  image:          { width: '100%', height: '100%' },
  videoThumbnail: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  typeBadge:      { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 4 },
});
