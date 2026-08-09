import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { getEventById, getEventParticipants, joinEvent } from '../../services/eventService';
import { useAuthStore } from '../../store/authStore';
import { Event, EventParticipant } from '../../types';
import { Calendar, MapPin, Users, Zap, ChevronLeft, CheckCircle2 } from 'lucide-react-native';

export const EventDetailScreen = ({ route, navigation }: any) => {
  const { eventId } = route.params || {};
  const user = useAuthStore(state => state.user);

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    Promise.all([
      getEventById(eventId),
      getEventParticipants(eventId),
    ]).then(([evt, parts]) => {
      setEvent(evt);
      setParticipants(parts);
      setLoading(false);
    });
  }, [eventId]);

  const hasJoined = participants.some(p => p.user_id === user?.id);
  const currentCount = event?.current_participants ?? participants.length;
  const maxCount = event?.max_participants ?? 32;
  const capacityPct = Math.min(100, Math.round((currentCount / maxCount) * 100));

  const handleJoin = async () => {
    if (!user?.id || !event?.id) {
      Alert.alert('Sign In Required', 'Please sign in to join tournament clashes.');
      return;
    }

    setJoining(true);
    const success = await joinEvent(event.id, user.id, user.full_name, user.avatar_url || undefined);
    setJoining(false);

    if (success) {
      Alert.alert('Joined Clash!', 'You are registered in the Event Readiness Matrix.');
      const updatedParts = await getEventParticipants(event.id);
      setParticipants(updatedParts);
      const updatedEvt = await getEventById(event.id);
      if (updatedEvt) setEvent(updatedEvt);
    } else {
      Alert.alert('Registration Failed', 'Could not register for this event.');
    }
  };

  if (loading || !event) {
    return (
      <ScreenWrapper style={styles.center}>
        <ActivityIndicator color="#CCFF00" size="large" />
        <Text style={styles.loadingText}>Syncing Event Matrix from Appwrite...</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Nav Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color="#FFF" />
          <Text style={styles.backText}>Back to Clashes</Text>
        </TouchableOpacity>

        {/* Hero Banner */}
        <GlassCard style={styles.heroCard} borderColor="rgba(0, 212, 255, 0.3)">
          {event.banner_image_url ? (
            <Image source={{ uri: event.banner_image_url }} style={styles.heroImg} />
          ) : null}

          <View style={styles.badge}>
            <Zap size={12} color="#00D4FF" />
            <Text style={styles.badgeText}>{event.sport.toUpperCase()} CLASH · {event.format || '5v5'}</Text>
          </View>

          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.infoRow}>
            <Calendar size={14} color="#CCFF00" />
            <Text style={styles.infoText}>{new Date(event.date).toLocaleDateString()} @ {event.time || '18:00'}</Text>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={14} color="#00D4FF" />
            <Text style={styles.infoText}>{event.venue || event.location}</Text>
          </View>
        </GlassCard>

        {/* Event Readiness Matrix */}
        <Text style={styles.sectionTitle}>EVENT READINESS MATRIX</Text>
        <GlassCard style={styles.matrixCard} borderColor="rgba(204, 255, 0, 0.3)">
          <View style={styles.matrixHeader}>
            <Text style={styles.matrixTitle}>CURRENT CAPACITY</Text>
            <Text style={styles.matrixPct}>{capacityPct}% FILLED</Text>
          </View>

          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${capacityPct}%` }]} />
          </View>

          <View style={styles.matrixStats}>
            <View style={styles.mStatItem}>
              <Text style={styles.mStatVal}>{currentCount}</Text>
              <Text style={styles.mStatTag}>CONFIRMED</Text>
            </View>
            <View style={styles.mDivider} />
            <View style={styles.mStatItem}>
              <Text style={[styles.mStatVal, { color: '#00D4FF' }]}>{maxCount - currentCount}</Text>
              <Text style={styles.mStatTag}>SLOTS LEFT</Text>
            </View>
            <View style={styles.mDivider} />
            <View style={styles.mStatItem}>
              <Text style={[styles.mStatVal, { color: '#CCFF00' }]}>{maxCount}</Text>
              <Text style={styles.mStatTag}>MAX CAPACITY</Text>
            </View>
          </View>
        </GlassCard>

        {/* Join Action */}
        <TouchableOpacity
          style={[styles.joinBtn, hasJoined && styles.joinedBtn]}
          onPress={handleJoin}
          disabled={joining || hasJoined}
        >
          {joining ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={[styles.joinBtnText, hasJoined && styles.joinedBtnText]}>
              {hasJoined ? 'CONFIRMED IN MATRIX' : 'ENTER CLASH MATRIX'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Participants Roster */}
        <Text style={styles.sectionTitle}>CONFIRMED ATHLETES ({participants.length})</Text>
        <View style={styles.rosterGrid}>
          {participants.map((p, idx) => (
            <View key={p.$id || idx} style={styles.rosterItem}>
              <Image
                source={{ uri: p.user_avatar || `https://i.pravatar.cc/100?u=${p.user_id}` }}
                style={styles.rosterAvatar}
              />
              <Text style={styles.rosterName} numberOfLines={1}>{p.user_name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#888',
    fontSize: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    color: '#888',
    fontSize: 13,
  },
  heroCard: {
    gap: 10,
  },
  heroImg: {
    width: '100%',
    height: 140,
    borderRadius: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#00D4FF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#AAA',
    fontSize: 13,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  matrixCard: {
    gap: 10,
  },
  matrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matrixTitle: {
    color: '#CCFF00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  matrixPct: {
    color: '#00D4FF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#CCFF00',
    borderRadius: 4,
  },
  matrixStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  mStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  mStatVal: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  mStatTag: {
    color: '#666',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },
  mDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  joinBtn: {
    backgroundColor: '#CCFF00',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinedBtn: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#CCFF00',
  },
  joinBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  joinedBtnText: {
    color: '#CCFF00',
  },
  rosterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rosterItem: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  rosterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#00D4FF',
  },
  rosterName: {
    color: '#888',
    fontSize: 10,
  },
});
