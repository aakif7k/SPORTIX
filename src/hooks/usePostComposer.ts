import { useState, useCallback } from 'react';
import type { PostComposerState, SocialPost } from '../types/social.types';

const SPORTS = ['Football', 'Basketball', 'Cricket', 'Athletics', 'Tennis', 'Swimming', 'Boxing', 'Rugby', 'Volleyball', 'Cycling'];

const MAX_IMAGES = 4;

const initialState: PostComposerState = {
  content: '',
  media_files: [],
  media_previews: [],
  media_type: null,
  location_tag: '',
  sport_tag: '',
  is_submitting: false,
};

export function usePostComposer(
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar: string,
  currentUserSport?: string
) {
  const [state, setState] = useState<PostComposerState>(initialState);

  const setContent = useCallback((content: string) => {
    setState(prev => ({ ...prev, content }));
  }, []);

  const setLocationTag = useCallback((tag: string) => {
    setState(prev => ({ ...prev, location_tag: tag }));
  }, []);

  const setSportTag = useCallback((tag: string) => {
    setState(prev => ({ ...prev, sport_tag: tag }));
  }, []);

  const addMedia = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    setState(prev => {
      const file = files[0];
      const isVideo = file.type.startsWith('video/');

      if (isVideo) {
        // Only 1 video allowed
        const preview = URL.createObjectURL(file);
        return {
          ...prev,
          media_files: [file],
          media_previews: [preview],
          media_type: 'video',
        };
      }

      // Images — up to MAX_IMAGES
      const remaining = MAX_IMAGES - prev.media_files.length;
      if (remaining <= 0) return prev;

      const newFiles = Array.from(files).slice(0, remaining).filter(f => f.type.startsWith('image/'));
      const newPreviews = newFiles.map(f => URL.createObjectURL(f));

      return {
        ...prev,
        media_files: [...prev.media_files, ...newFiles],
        media_previews: [...prev.media_previews, ...newPreviews],
        media_type: 'image',
      };
    });
  }, []);

  const removeMedia = useCallback((index: number) => {
    setState(prev => {
      const newFiles = prev.media_files.filter((_, i) => i !== index);
      const newPreviews = prev.media_previews.filter((_, i) => i !== index);
      // Revoke old object URL
      URL.revokeObjectURL(prev.media_previews[index]);
      return {
        ...prev,
        media_files: newFiles,
        media_previews: newPreviews,
        media_type: newFiles.length === 0 ? null : prev.media_type,
      };
    });
  }, []);

  const submit = useCallback(async (): Promise<SocialPost | null> => {
    if (!state.content.trim() && state.media_files.length === 0) return null;

    setState(prev => ({ ...prev, is_submitting: true }));

    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    const post: SocialPost = {
      id: `post-${Date.now()}`,
      author_id: currentUserId,   // Always scoped to current user
      author_name: currentUserName,
      author_avatar: currentUserAvatar,
      author_sport: currentUserSport,
      author_verified: false,
      content: state.content,
      media_urls: state.media_previews,
      media_type: state.media_type ?? undefined,
      location_tag: state.location_tag || undefined,
      sport_tag: state.sport_tag || undefined,
      liked_by: [],
      comment_count: 0,
      share_count: 0,
      created_at: new Date().toISOString(),
    };

    // Clean up object URLs to prevent memory leaks
    state.media_previews.forEach(url => URL.revokeObjectURL(url));

    setState(initialState);
    return post;
  }, [state, currentUserId, currentUserName, currentUserAvatar, currentUserSport]);

  const reset = useCallback(() => {
    state.media_previews.forEach(url => URL.revokeObjectURL(url));
    setState(initialState);
  }, [state.media_previews]);

  return {
    ...state,
    sports: SPORTS,
    maxImages: MAX_IMAGES,
    setContent,
    setLocationTag,
    setSportTag,
    addMedia,
    removeMedia,
    submit,
    reset,
  };
}
