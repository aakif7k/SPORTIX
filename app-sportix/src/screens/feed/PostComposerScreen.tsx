/** src/screens/feed/PostComposerScreen.tsx */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { postService } from '../../services/postService';
import { NeonButton } from '../../components/ui/NeonButton';

export function PostComposerScreen({ navigation }: any) {
  const { colors } = useTheme();
  const profile  = useAuthStore(state => state.profile);
  const [content, setContent]   = useState('');
  const [mediaUri,setMediaUri]  = useState<string | null>(null);
  const [mimeType,setMimeType]  = useState<string>('image/jpeg');
  const [sport_tag, setSportTag]= useState(profile?.sport ?? '');
  const [posting, setPosting]   = useState(false);

  const pickMedia = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setMediaUri(res.assets[0].uri);
      setMimeType(res.assets[0].mimeType ?? 'image/jpeg');
    }
  };

  const handlePost = useCallback(async () => {
    if (!content.trim()) { Alert.alert('Write something first!'); return; }
    setPosting(true);
    try {
      await postService.createPost({
        content,
        sport_tag,
        mediaUri:  mediaUri ?? undefined,
        mimeType:  mediaUri ? mimeType : undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not create post.');
    } finally {
      setPosting(false);
    }
  }, [content, sport_tag, mediaUri, mimeType]);

  return (
    <LinearGradient colors={[colors.background, colors.background]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.textSecondary} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>New Post</Text>
          <NeonButton label="Post" onPress={handlePost} loading={posting} size="sm" />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <View style={styles.content}>
            <TextInput
              style={[styles.textArea, { color: colors.textPrimary, fontFamily: 'Urbanist_400Regular' }]}
              placeholder="What's happening in the arena?"
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              autoFocus
            />
            <TextInput
              style={[styles.tagInput, { color: colors.textMuted, borderColor: colors.border, fontFamily: 'Urbanist_400Regular' }]}
              placeholder="#sport"
              placeholderTextColor={colors.textMuted}
              value={sport_tag}
              onChangeText={setSportTag}
            />
            {mediaUri && <Image source={{ uri: mediaUri }} style={styles.preview} resizeMode="cover" />}
            <TouchableOpacity onPress={pickMedia} style={[styles.mediaBtn, { borderColor: colors.border }]}>
              <ImageIcon size={18} color={colors.textMuted} />
              <Text style={[styles.mediaBtnText, { color: colors.textMuted, fontFamily: 'Urbanist_500Medium' }]}>Add photo/video</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title:       { fontSize: 17 },
  content:     { flex: 1, padding: 16, gap: 12 },
  textArea:    { flex: 1, fontSize: 17, lineHeight: 26, textAlignVertical: 'top' },
  tagInput:    { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 },
  preview:     { width: '100%', height: 200, borderRadius: 12 },
  mediaBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1 },
  mediaBtnText:{ fontSize: 14 },
});
