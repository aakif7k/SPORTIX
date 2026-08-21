/**
 * src/screens/events/EventDiscussionScreen.tsx
 */
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../../api/appwrite';
import { EmptyState } from '../../components/ui/EmptyState';

interface EventComment {
  $id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  $createdAt: string;
}

export function EventDiscussionScreen({ route, navigation }: any) {
  const { eventId } = route.params;
  const { colors } = useTheme();
  const profile = useAuthStore(state => state.profile);

  const [comments, setComments] = useState<EventComment[]>([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COMMENTS, [
          Query.equal('post_id', eventId),
          Query.orderAsc('$createdAt'),
          Query.limit(50),
        ]);
        setComments(res.documents.map((d: any) => ({
          $id: d.$id,
          author_name: d.author_name || 'Participant',
          content: d.content || '',
          $createdAt: d.$createdAt,
        })));
      } catch (err) {
        console.warn('[EventDiscussion] fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [eventId]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.COMMENTS, ID.unique(), {
        post_id: eventId,
        author_id: profile?.$id || 'anon',
        author_name: profile?.full_name || 'Athlete',
        content: text.trim(),
        created_at: new Date().toISOString(),
      });
      setComments(prev => [...prev, {
        $id: doc.$id,
        author_name: doc.author_name,
        content: doc.content,
        $createdAt: doc.$createdAt,
      }]);
      setText('');
    } catch (err: any) {
      console.warn('[EventDiscussion] send failed:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <LinearGradient colors={[colors.background, colors.background]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.textSecondary} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Clash Discussion</Text>
          <View style={{ width: 22 }} />
        </View>

        {loading ? (
          <View style={styles.loader}><ActivityIndicator color={colors.volt} size="large" /></View>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
            <FlatList
              data={comments}
              keyExtractor={c => c.$id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<EmptyState icon="💬" title="No Discussion Yet" subtitle="Be the first to post tactical plans or coordinate." />}
              renderItem={({ item }) => (
                <View style={[styles.commentBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.commentHeader}>
                    <Text style={[styles.authorName, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>{item.author_name}</Text>
                    <Text style={[styles.dateText, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>
                      {new Date(item.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={[styles.commentBody, { color: colors.textSecondary, fontFamily: 'Urbanist_400Regular' }]}>{item.content}</Text>
                </View>
              )}
            />

            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.elevated, color: colors.textPrimary, borderColor: colors.border, fontFamily: 'Urbanist_400Regular' }]}
                placeholder="Type your message..."
                placeholderTextColor={colors.textMuted}
                value={text}
                onChangeText={setText}
              />
              <TouchableOpacity onPress={handleSend} disabled={!text.trim() || sending} style={[styles.sendBtn, { backgroundColor: colors.volt, opacity: text.trim() ? 1 : 0.4 }]}>
                <Send size={18} color="#000" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
  list:           { padding: 16, gap: 12, paddingBottom: 16 },
  commentBubble:  { padding: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  commentHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorName:     { fontSize: 14 },
  dateText:       { fontSize: 11 },
  commentBody:    { fontSize: 14, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, gap: 10 },
  input:          { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, fontSize: 14 },
  sendBtn:        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
