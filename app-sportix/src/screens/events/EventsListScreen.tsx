import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { getEvents } from '../../services/eventService';
import { Event } from '../../types';
import { Calendar, MapPin, Users, Zap, ShieldAlert } from 'lucide-react-native';

export const EventsListScreen = ({ navigation }: any) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents().then(res => {
      setEvents(res);
      setLoading(false);
    });
  }, []);

  const renderEventCard = ({ item }: { item: Event }) => {
    const capacityPct = Math.min(100, Math.round((item.current_participants / item.max_participants) * 100));

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}>
        <GlassCard style={styles.card} borderColor="rgba(204, 255, 0, 0.2)">
          {item.banner_image_url ? (
            <Image source={{ uri: item.banner_image_url }} style={styles.bannerImg} />
          ) : null}

          <View style={styles.sportBadge}>
            <Text style={styles.sportBadgeText}>{item.sport.toUpperCase()} · {item.format || '5v5'}</Text>
          </View>

          <Text style={styles.eventTitle}>{item.title}</Text>

          <View style={styles.infoRow}>
            <Calendar size={13} color="#CCFF00" />
            <Text style={styles.infoText}>{new Date(item.date).toLocaleDateString()} @ {item.time || '18:00'}</Text>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={13} color="#00D4FF" />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>

          {/* Matrix Progress */}
          <View style={styles.matrixContainer}>
            <View style={styles.matrixHeader}>
              <Text style={styles.matrixLabel}>EVENT READINESS MATRIX</Text>
              <Text style={styles.matrixCapacity}>{item.current_participants}/{item.max_participants} ({capacityPct}%)</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${capacityPct}%` }]} />
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.entryFee}>{item.entry_fee ? `₹${item.entry_fee} Entry` : 'FREE ENTRY'}</Text>
            <TouchableOpacity
              style={styles.joinBtn}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
            >
              <Text style={styles.joinBtnText}>VIEW READINESS</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Zap size={12} color="#CCFF00" />
          <Text style={styles.badgeText}>CLASH ARENA EVENTS</Text>
        </View>
        <Text style={styles.title}>MATCH <Text style={styles.highlight}>CLASHES</Text></Text>
        <Text style={styles.subtitle}>Explore live tournament brackets, register squad players, and track event capacity.</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#CCFF00" size="large" />
          <Text style={styles.loadingText}>Syncing events from Appwrite...</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={renderEventCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <ShieldAlert size={32} color="#666" />
              <Text style={styles.emptyText}>No tournament clashes active right now.</Text>
            </View>
          }
        />
      )}
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
  subtitle: {
    color: '#888',
    fontSize: 12,
  },
  listContainer: {
    gap: 14,
    paddingBottom: 24,
  },
  card: {
    gap: 10,
  },
  bannerImg: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 4,
  },
  sportBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sportBadgeText: {
    color: '#00D4FF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  eventTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#AAA',
    fontSize: 12,
  },
  matrixContainer: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    marginTop: 4,
  },
  matrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matrixLabel: {
    color: '#CCFF00',
    fontSize: 9,
    fontWeight: 'bold',
  },
  matrixCapacity: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00D4FF',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  entryFee: {
    color: '#CCFF00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  joinBtn: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  joinBtnText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    color: '#888',
    fontSize: 12,
  },
  emptyText: {
    color: '#888',
    fontSize: 13,
  },
});
