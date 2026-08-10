export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email?: string;
  avatar_url?: string | null;
  profile_image_file_id?: string | null;
  profile_image_url?: string | null;
  sport: string;
  sports?: string[];
  role?: string;
  location?: string;
  experience_level?: string;
  is_open_to_recruit?: boolean;
  pulse_score?: number;
  level?: number;
  bio?: string;
  created_at?: string;
}

export interface Event {
  id: string;
  title: string;
  sport: string;
  date: string;
  time?: string;
  starts_at?: string;
  ends_at?: string;
  location: string;
  venue?: string;
  description?: string;
  format?: '5v5' | '7v7' | '11v11' | '1v1' | '2v2' | 'Tournament' | 'Pickup';
  skill_level?: string;
  max_participants: number;
  current_participants: number;
  entry_fee?: number;
  organizer_id: string;
  organizer_name?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  banner_file_id?: string | null;
  banner_url?: string | null;
  banner_image_file_id?: string | null;
  banner_image_url?: string | null;
  created_at?: string;
}

export interface EventParticipant {
  $id?: string;
  event_id: string;
  user_id: string;
  user_name?: string;
  username?: string;
  user_avatar?: string;
  status: 'confirmed' | 'pending' | 'waitlist';
  joined_at: string;
}

export interface DbConversation {
  $id: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_time?: string;
  is_group?: boolean;
}

export interface DbConversationMember {
  $id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  unread_count: number;
  last_read_at?: string;
}

export interface DbMessage {
  $id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'image';
  created_at: string;
  edited_at?: string;
  read_at?: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface ConversationSummary {
  id: string;
  partner: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  updatedAt: string;
  isEventChat?: boolean;
  eventName?: string;
}

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_liked?: boolean;
}

export interface Squad {
  id: string;
  name: string;
  sport: string;
  captain_id: string;
  members_count: number;
  pulse_score: number;
  formation: string;
  created_at: string;
}
