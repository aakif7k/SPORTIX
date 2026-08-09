import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuthStore } from '../../store/authStore';
import { account } from '../../api/appwrite';
import { Zap, MapPin, Edit, LogOut, ShieldCheck, Trophy, Flame } from 'lucide-react-native';

export const MyPlayerDNAScreen = ({ navigation }: any) => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
    } catch { /* ignore */ }
    logout();
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Banner Card */}
        <GlassCard style={styles.profileHeaderCard} borderColor="rgba(0, 212, 255, 0.3)">
          <View style={styles.topRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: user?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id || 'me'}` }}
                style={styles.avatar}
              />
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={12} color="#000" />
              </View>
            </View>

            <View style={styles.nameContainer}>
              <Text style={styles.fullName}>{user?.full_name || 'SportiX Athlete'}</Text>
              <Text style={styles.username}>@{user?.username || 'athlete'} · <Text style={styles.sport}>{user?.sport || 'Multi-Sport'}</Text></Text>
              {user?.location ? (
                <View style={styles.locRow}>
                  <MapPin size={12} color="#00D4FF" />
                  <Text style={styles.locText}>{user.location}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.pulseBox}>
            <View style={styles.pulseItem}>
              <Text style={styles.pulseValue}>{user?.pulse_score ?? 100}</Text>
              <Text style={styles.pulseTag}>PULSE RATING</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.pulseItem}>
              <Text style={[styles.pulseValue, { color: '#00D4FF' }]}>Lvl {user?.level ?? 1}</Text>
              <Text style={styles.pulseTag}>TIER RANK</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.pulseItem}>
              <Text style={[styles.pulseValue, { color: '#CCFF00' }]}>{user?.is_open_to_recruit ? 'ACTIVE' : 'OFF'}</Text>
              <Text style={styles.pulseTag}>RECRUITMENT</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut size={16} color="#FF4D4D" />
              <Text style={styles.logoutText}>SIGN OUT</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* PlayerDNA Matrix Grid */}
        <Text style={styles.sectionTitle}>PLAYER DNA MATRIX</Text>
        <View style={styles.matrixGrid}>
          <GlassCard style={styles.matrixCard}>
            <Trophy size={20} color="#CCFF00" />
            <Text style={styles.matrixScore}>12</Text>
            <Text style={styles.matrixName}>Matches Won</Text>
          </GlassCard>
          <GlassCard style={styles.matrixCard}>
            <Flame size={20} color="#00D4FF" />
            <Text style={styles.matrixScore}>84%</Text>
            <Text style={styles.matrixName}>Consistency</Text>
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
            {user?.bio || 'Competitive athlete actively scouting tournament clashes and open squad recruitment offers.'}
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  logoutText: {
    color: '#FF4D4D',
    fontSize: 10,
    fontWeight: 'bold',
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
