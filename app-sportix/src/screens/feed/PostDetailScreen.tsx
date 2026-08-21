/** src/screens/feed/PostDetailScreen.tsx */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Heart, Send } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { postService } from '../../services/postService';
import { Post, Comment } from '../../types';
import { useAuthStore } from '../../store/authStore';

export function PostDetailScreen({ route, navigation }: any) {
  const { postId } = route.params;
  const { colors } = useTheme();
  const profile = useAuthStore(state => state.profile);
  const [post,     setPost]     = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked,    setLiked]    = useState(false);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);

  useEffect(() => {
    const init = async () => {
      const [p, cms, l] = await Promise.all([
        postService.getPost(postId),
        postService.getComments(postId),
        postService.isLiked(postId),
      ]);
      setPost(p);
      setComments(cms);
      setLiked(l);
      setLoading(false);
    };
    init();
  }, [postId]);

  const handleLike = async () => {
    const newLiked = await postService.toggleLike(postId);
    setLiked(newLiked);
    setPost(p => p ? { ...p, likes_count: p.likes_count + (newLiked ? 1 : -1) } : p);
  };

  const handleComment = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const c = await postService.addComment(postId, text);
    setComments(prev => [...prev, c]);
    setPost(p => p ? { ...p, comments_count: p.comments_count + 1 } : p);
    setText('');
    setSending(false);
  };

  if (loading) return <View style={[styles.loader, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.volt} size="large" /></View>;
  if (!post)   return null;

  return (
    <LinearGradient colors={[colors.background, colors.background]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.textSecondary} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Post</Text>
          <View style={{ width: 22 }} />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex} keyboardVerticalOffset={0}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Post */}
            <View style={styles.postSection}>
              <View style={styles.authorRow}>
                {post.author_avatar_url
                  ? <Image source={{ uri: post.author_avatar_url }} style={styles.avatar} />
                  : <View style={[styles.avatar, { backgroundColor: colors.surface }]} />
                }
                <View>
                  <Text style={[styles.authorName, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>{post.author_full_name}</Text>
                  <Text style={[styles.authorMeta, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>@{post.author_username}</Text>
                </View>
              </View>
              <Text style={[styles.content, { color: colors.textPrimary, fontFamily: 'Urbanist_400Regular' }]}>{post.content}</Text>
              {post.media_urls?.[0] && <Image source={{ uri: post.media_urls[0] }} style={styles.media} resizeMode="cover" />}
              <TouchableOpacity onPress={handleLike} style={styles.likeRow}>
                <Heart size={20} color={liked ? colors.hot : colors.textMuted} fill={liked ? colors.hot : 'none'} />
                <Text style={[{ color: colors.textMuted, fontFamily: 'Urbanist_500Medium', fontSize: 14 }]}>{post.likes_count}</Text>
              </TouchableOpacity>
            </View>
            {/* Comments */}
            <Text style={[styles.commentsTitle, { color: colors.textSecondary, fontFamily: 'Urbanist_600SemiBold' }]}>
              Comments ({comments.length})
            </Text>
            {comments.map(c => (
              <View key={c.$id} style={[styles.commentRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.commentAuthor, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>{c.author_name}</Text>
                <Text style={[styles.commentText, { color: colors.textSecondary, fontFamily: 'Urbanist_400Regular' }]}>{c.content}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.elevated, color: colors.textPrimary, borderColor: colors.border, fontFamily: 'Urbanist_400Regular' }]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textMuted}
              value={text}
              onChangeText={setText}
            />
            <TouchableOpacity onPress={handleComment} disabled={!text.trim()} style={[styles.sendBtn, { backgroundColor: colors.volt, opacity: text.trim() ? 1 : 0.4 }]}>
              <Send size={16} color="#000" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex:          { flex: 1 },
  loader:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle:   { fontSize: 17 },
  scroll:        { padding: 16, paddingBottom: 16 },
  postSection:   { gap: 12, marginBottom: 16 },
  authorRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:        { width: 40, height: 40, borderRadius: 20 },
  authorName:    { fontSize: 15 },
  authorMeta:    { fontSize: 12 },
  content:       { fontSize: 16, lineHeight: 24 },
  media:         { width: '100%', height: 240, borderRadius: 12 },
  likeRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentsTitle: { fontSize: 13, letterSpacing: 0.3, marginBottom: 8 },
  commentRow:    { paddingVertical: 12, borderBottomWidth: 1, gap: 4 },
  commentAuthor: { fontSize: 13 },
  commentText:   { fontSize: 14 },
  inputRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: 1 },
  input:         { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  sendBtn:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
