import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { Heart, MessageCircle, Share2, Zap } from 'lucide-react-native';

const MOCK_POSTS = [
  {
    id: 'post_1',
    author: 'Alex Rivera',
    handle: '@alex_rivera',
    avatar: 'https://images.pexels.com/photos/1486064/pexels-photo-1486064.jpeg?auto=compress&cs=tinysrgb&w=150',
    sport: 'Football',
    content: 'Unbelievable 3-1 comeback victory in the ClashHub 5v5 finals tonight! Chemistry was on point. ⚽🔥',
    likes: 42,
    comments: 8,
    time: '2h ago',
  },
  {
    id: 'post_2',
    author: 'Marcus Reid',
    handle: '@marcus_reid',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    sport: 'Basketball',
    content: 'Just dropped 28 points in tonight\'s Pickup Clash. Looking for a pro guard to complete our tournament squad!',
    likes: 29,
    comments: 5,
    time: '4h ago',
  },
];

export const FeedHomeScreen = ({ navigation }: any) => {
  const renderPost = ({ item }: { item: typeof MOCK_POSTS[0] }) => (
    <GlassCard style={styles.postCard}>
      <View style={styles.authorRow}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.author}</Text>
          <Text style={styles.authorHandle}>{item.handle} · <Text style={styles.sport}>{item.sport}</Text></Text>
        </View>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>

      <Text style={styles.content}>{item.content}</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Heart size={16} color="#FF4D4D" />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <MessageCircle size={16} color="#00D4FF" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Share2 size={16} color="#888" />
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Zap size={12} color="#CCFF00" />
          <Text style={styles.badgeText}>SPORTIX COMMUNITY</Text>
        </View>
        <Text style={styles.title}>ATHLETE <Text style={styles.highlight}>FEED</Text></Text>
      </View>

      <FlatList
        data={MOCK_POSTS}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 16,
    paddingTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    marginBottom: 6,
  },
  badgeText: {
    color: '#CCFF00',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
  },
  highlight: {
    color: '#00D4FF',
  },
  listContainer: {
    gap: 14,
    paddingBottom: 24,
  },
  postCard: {
    gap: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00D4FF',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  authorHandle: {
    color: '#00D4FF',
    fontSize: 11,
  },
  sport: {
    color: '#AAA',
  },
  timeText: {
    color: '#666',
    fontSize: 10,
  },
  content: {
    color: '#DDD',
    fontSize: 13,
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#AAA',
    fontSize: 12,
  },
});
