import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { searchProfiles } from '../../services/profileService';
import { UserProfile } from '../../types';
import { Search, MapPin, MessageCircle, Zap, SlidersHorizontal, CheckCircle2 } from 'lucide-react-native';

export const DiscoverTalentScreen = ({ navigation }: any) => {
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('all');

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const results = await searchProfiles(query, {
        sport: selectedSport === 'all' ? undefined : selectedSport,
      });
      setProfiles(results);
    } catch (err) {
      console.error('[DiscoverTalentScreen] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedSport]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfiles();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchProfiles]);

  const renderAthleteCard = ({ item }: { item: UserProfile }) => (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: item.avatar_url || `https://i.pravatar.cc/150?u=${item.id}` }}
            style={styles.avatar}
          />
          <View style={styles.checkBadge}>
            <CheckCircle2 size={10} color="#000" />
          </View>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.name}>{item.full_name}</Text>
          <Text style={styles.username}>@{item.username || 'athlete'} · <Text style={styles.sport}>{item.sport}</Text></Text>
        </View>

        <View style={styles.pulseContainer}>
          <Text style={styles.pulseLabel}>PULSE</Text>
          <Text style={styles.pulseScore}>{item.pulse_score ?? 100}</Text>
        </View>
      </View>

      {item.location ? (
        <View style={styles.locationContainer}>
          <MapPin size={12} color="#00D4FF" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>SPORT</Text>
          <Text style={styles.statValue}>{item.sport}</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>LEVEL</Text>
          <Text style={[styles.statValue, { color: '#00D4FF' }]}>{item.experience_level || `Lvl ${item.level}`}</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>RECRUIT</Text>
          <Text style={[styles.statValue, { color: '#CCFF00' }]}>{item.is_open_to_recruit ? 'YES' : 'NO'}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.dnaBtn}
          onPress={() => navigation.navigate('AthleteProfile', { uid: item.id })}
        >
          <Text style={styles.dnaBtnText}>VIEW PLAYER DNA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.msgBtn}
          onPress={() => navigation.navigate('DirectChat', { userId: item.id })}
        >
          <MessageCircle size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  return (
    <ScreenWrapper style={styles.container}>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.badge}>
          <Zap size={12} color="#00D4FF" />
          <Text style={styles.badgeText}>AI ATHLETE DISCOVERY</Text>
        </View>
        <Text style={styles.title}>DISCOVER <Text style={styles.highlight}>TALENT</Text></Text>
        <Text style={styles.subtitle}>Connect with verified athletes and scout competitive players.</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Search size={16} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, sport, city, level..."
          placeholderTextColor="#555"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#00D4FF" size="large" />
          <Text style={styles.loadingText}>Scouting athletes from Appwrite...</Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={item => item.id}
          renderItem={renderAthleteCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No athletes found matching "{query}"</Text>
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
  banner: {
    marginBottom: 16,
    paddingTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    marginBottom: 6,
  },
  badgeText: {
    color: '#00D4FF',
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
    color: '#CCFF00',
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A1118',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#FFF',
    fontSize: 13,
  },
  listContainer: {
    gap: 14,
    paddingBottom: 24,
  },
  card: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.4)',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#CCFF00',
    borderRadius: 6,
    padding: 2,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  username: {
    color: '#00D4FF',
    fontSize: 11,
  },
  sport: {
    color: '#AAA',
    textTransform: 'capitalize',
  },
  pulseContainer: {
    alignItems: 'flex-end',
  },
  pulseLabel: {
    color: '#666',
    fontSize: 9,
    fontWeight: 'bold',
  },
  pulseScore: {
    color: '#CCFF00',
    fontSize: 16,
    fontWeight: '900',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#888',
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 8,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#666',
    fontSize: 8,
    fontWeight: 'bold',
  },
  statValue: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dnaBtn: {
    flex: 1,
    backgroundColor: '#00D4FF',
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dnaBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  msgBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#14202C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
