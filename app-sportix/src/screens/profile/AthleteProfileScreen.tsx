import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { getProfile } from '../../services/profileService';
import { UserProfile } from '../../types';
import { ChevronLeft, MapPin, MessageCircle, ShieldCheck, Trophy, Flame, Zap } from 'lucide-react-native';

export const AthleteProfileScreen = ({ route, navigation }: any) => {
  const { uid } = route.params || {};
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uid) {
      getProfile(uid).then(res => {
        setProfile(res);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [uid]);

  if (loading) {
    return (
      <ScreenWrapper style={styles.center}>
        <ActivityIndicator color="#00D4FF" size="large" />
        <Text style={styles.loadingText}>Fetching PlayerDNA Profile...</Text>
      </ScreenWrapper>
    );
  }

  if (!profile) {
    return (
      <ScreenWrapper style={styles.center}>
        <Text style={styles.errorText}>Athlete profile not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Nav Header */}
        <TouchableOpacity style={styles.topBackBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color="#FFF" />
          <Text style={styles.topBackText}>Back</Text>
        </TouchableOpacity>

        {/* Hero Profile Card */}
        <GlassCard style={styles.profileHeaderCard} borderColor="rgba(0, 212, 255, 0.3)">
          <View style={styles.topRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}` }}
                style={styles.avatar}
              />
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={12} color="#000" />
              </View>
            </View>

            <View style={styles.nameContainer}>
              <Text style={styles.fullName}>{profile.full_name}</Text>
              <Text style={styles.username}>@{profile.username || 'athlete'} · <Text style={styles.sport}>{profile.sport}</Text></Text>
              {profile.location ? (
                <View style={styles.locRow}>
                  <MapPin size={12} color="#00D4FF" />
                  <Text style={styles.locText}>{profile.location}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.pulseBox}>
            <View style={styles.pulseItem}>
              <Text style={styles.pulseValue}>{profile.pulse_score ?? 100}</Text>
              <Text style={styles.pulseTag}>PULSE RATING</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.pulseItem}>
              <Text style={[styles.pulseValue, { color: '#00D4FF' }]}>{profile.experience_level || `Lvl ${profile.level}`}</Text>
              <Text style={styles.pulseTag}>EXPERIENCE</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.pulseItem}>
              <Text style={[styles.pulseValue, { color: '#CCFF00' }]}>{profile.is_open_to_recruit ? 'YES' : 'NO'}</Text>
              <Text style={styles.pulseTag}>RECRUITMENT</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.msgBtn}
            onPress={() => navigation.navigate('DirectChat', { userId: profile.id })}
          >
            <MessageCircle size={16} color="#000" />
            <Text style={styles.msgBtnText}>MESSAGE ATHLETE</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* PlayerDNA Matrix Grid */}
        <Text style={styles.sectionTitle}>PLAYER DNA MATRIX</Text>
        <View style={styles.matrixGrid}>
          <GlassCard style={styles.matrixCard}>
            <Trophy size={20} color="#CCFF00" />
            <Text style={styles.matrixScore}>15</Text>
            <Text style={styles.matrixName}>Clashes Played</Text>
          </GlassCard>
          <GlassCard style={styles.matrixCard}>
            <Flame size={20} color="#00D4FF" />
            <Text style={styles.matrixScore}>88%</Text>
            <Text style={styles.matrixName}>Win Rate</Text>
          </GlassCard>
          <GlassCard style={styles.matrixCard}>
            <Zap size={20} color="#A855F7" />
            <Text style={styles.matrixScore}>PRO</Text>
            <Text style={styles.matrixName}>Tier Level</Text>
          </GlassCard>
        </View>

        {/* Bio Card */}
        <GlassCard style={styles.bioCard}>
          <Text style={styles.bioTitle}>ATHLETE BIO</Text>
          <Text style={styles.bioText}>
            {profile.bio || 'Competitive athlete actively scouting tournament clashes and open squad recruitment offers.'}
          </Text>
        </GlassCard>
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
  errorText: {
    color: '#FF4D4D',
    fontSize: 14,
  },
  topBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topBackText: {
    color: '#888',
    fontSize: 13,
  },
  backBtn: {
    backgroundColor: '#121A22',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 12,
  },
  profileHeaderCard: {
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00D4FF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#CCFF00',
    borderRadius: 8,
    padding: 3,
  },
  nameContainer: {
    flex: 1,
    gap: 2,
  },
  fullName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    color: '#00D4FF',
    fontSize: 12,
  },
  sport: {
    color: '#AAA',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locText: {
    color: '#888',
    fontSize: 11,
  },
  pulseBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pulseItem: {
    flex: 1,
    alignItems: 'center',
  },
  pulseValue: {
    color: '#CCFF00',
    fontSize: 18,
    fontWeight: '900',
  },
  pulseTag: {
    color: '#666',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  msgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00D4FF',
    height: 44,
    borderRadius: 12,
  },
  msgBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 4,
  },
  matrixGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  matrixCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  matrixScore: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  matrixName: {
    color: '#888',
    fontSize: 9,
  },
  bioCard: {
    gap: 8,
  },
  bioTitle: {
    color: '#00D4FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bioText: {
    color: '#AAA',
    fontSize: 12,
    lineHeight: 18,
  },
});
