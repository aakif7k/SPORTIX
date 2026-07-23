// ─── SOCIAL TYPES ─────────────────────────────────────────────────────────────
// All social content is scoped by author_id = currentUser.uid.
// Stories expire after 24 hours.

export interface Story {
  id: string;
  author_id: string; // Always = currentUser.uid who created it
  author_name: string;
  author_avatar: string;
  author_sport?: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  sport_tag?: string;
  text_overlay?: string;
  created_at: string; // ISO string — expires 24h after
  viewed_by: string[]; // array of viewer user IDs
}

export interface StoryGroup {
  author_id: string;
  author_name: string;
  author_avatar: string;
  stories: Story[];
  all_seen: boolean;
}

export interface Reel {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  author_sport?: string;
  video_url: string;
  thumbnail_url?: string;
  caption: string;
  sport_tag?: string;
  music_label?: string;
  liked_by: string[]; // array of user IDs who liked
  view_count: number;
  comment_count: number;
  created_at: string;
}

export interface SocialPost {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  author_sport?: string;
  author_verified?: boolean;
  content: string;
  media_urls: string[]; // up to 4 images or 1 video
  media_type?: 'image' | 'video';
  location_tag?: string;
  sport_tag?: string;
  liked_by: string[];
  comment_count: number;
  share_count: number;
  created_at: string;
}

export interface PostComposerState {
  content: string;
  media_files: File[];
  media_previews: string[];
  media_type: 'image' | 'video' | null;
  location_tag: string;
  sport_tag: string;
  is_submitting: boolean;
}
