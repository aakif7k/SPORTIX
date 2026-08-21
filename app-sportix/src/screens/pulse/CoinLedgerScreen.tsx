/**
 * src/screens/pulse/CoinLedgerScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Coin Vault & Transaction Ledger — SPORTiX Mobile.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Coins, TrendingUp, Sparkles, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useGamificationStore } from '../../store/gamificationStore';
import { gamificationService } from '../../services/gamificationService';
import { EmptyState } from '../../components/ui/EmptyState';
import { CoinTransaction } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

const MOCK_TXNS: CoinTransaction[] = [
  {
    $id: 'tx1',
    user_id: 'u1',
    amount: 150,
    type: 'earn',
    description: 'Daily Mystery Loot Crate',
    $createdAt: '2026-08-18T10:00:00Z',
  },
  {
    $id: 'tx2',
    user_id: 'u1',
    amount: 100,
    type: 'earn',
    description: 'Match MVP Honor vs Shadow Apex',
    $createdAt: '2026-08-17T18:30:00Z',
  },
  {
    $id: 'tx3',
    user_id: 'u1',
    amount: 50,
    type: 'spend',
    description: 'AutoSquad AI Tactical Scouting Boost',
    $createdAt: '2026-08-16T14:00:00Z',
  },
  {
    $id: 'tx4',
    user_id: 'u1',
    amount: 200,
    type: 'earn',
    description: 'Tournament Semi-Finals Placement',
    $createdAt: '2026-08-15T21:00:00Z',
  },
];

export function CoinLedgerScreen({ navigation }: any) {
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);
  const { transactions, setTransactions, loading, setLoading, coinBalance } = useGamificationStore();
  const [filter, setFilter] = useState<'all' | 'earn' | 'spend'>('all');

  useEffect(() => {
    setLoading(true);
    gamificationService
      .getCoinTransactions()
      .then((tx) => setTransactions(tx.length > 0 ? tx : (MOCK_TXNS as any)))
      .finally(() => setLoading(false));
  }, []);

  const displayTxns = (transactions.length > 0 ? transactions : MOCK_TXNS).filter((t) =>
    filter === 'all' ? true : t.type === filter
  );

  const totalCoins = profile?.coins_balance ?? coinBalance ?? 1400;

  const renderTxn = ({ item, index }: { item: CoinTransaction; index: number }) => {
    const isEarn = item.type === 'earn';
    return (
      <Animated.View entering={FadeInDown.delay(Math.min(200, index * 40)).duration(300)}>
        <View style={styles.txnCard}>
          <View style={[styles.iconWrap, isEarn ? styles.iconEarn : styles.iconSpend]}>
            {isEarn ? (
              <ArrowDownLeft size={18} color="#00FF78" />
            ) : (
              <ArrowUpRight size={18} color="#FF3B00" />
            )}
          </View>

          <View style={styles.txnInfo}>
            <Text style={styles.txnDesc}>{item.description}</Text>
            <Text style={styles.txnDate}>
              {new Date(item.$createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.amountWrap}>
            <Text style={[styles.txnAmount, isEarn ? styles.amountEarn : styles.amountSpend]}>
              {isEarn ? '+' : '-'}{item.amount} 🪙
            </Text>
            <Text style={styles.balanceAfterText}>Verified Log</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Top App Bar */}
        <View style={styles.topAppBar}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              navigation.goBack();
            }}
            style={styles.backBtn}
          >
            <ArrowLeft size={18} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.topTitleWrap}>
            <Text style={styles.topTitleText}>COIN VAULT LEDGER</Text>
            <Text style={styles.topSubText}>WALLET AUDIT LOGS</Text>
          </View>

          <View style={styles.walletPill}>
            <Text style={styles.walletPillText}>🪙 {totalCoins}</Text>
          </View>
        </View>

        {/* ── 1. Hero Wallet Card ────────────────────────────────────── */}
        <View style={styles.heroWalletWrap}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.15)', 'rgba(12, 19, 26, 0.95)']}
            style={styles.heroWalletGradient}
          >
            <View style={styles.walletIconCircle}>
              <Coins size={28} color="#FFD700" />
            </View>

            <View style={styles.walletStats}>
              <Text style={styles.walletBalanceLabel}>ACTIVE COIN BALANCE</Text>
              <Text style={styles.walletBalanceNumber}>🪙 {totalCoins}</Text>
              <Text style={styles.walletSubText}>+20% Streak Multiplier Applied</Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── 2. Filter Pills ────────────────────────────────────────── */}
        <View style={styles.filterRow}>
          {[
            { id: 'all', label: 'ALL LOGS' },
            { id: 'earn', label: 'EARNED (+)' },
            { id: 'spend', label: 'SPENT (-)' },
          ].map((tab) => {
            const isSel = filter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterChip, isSel && styles.filterChipActive]}
                onPress={() => {
                  triggerHaptic('selection');
                  setFilter(tab.id as any);
                }}
              >
                <Text style={[styles.filterChipText, isSel && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 3. Transaction List ────────────────────────────────────── */}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#CCFF00" size="large" />
            <Text style={styles.loaderText}>FETCHING WALLET TELEMETRY...</Text>
          </View>
        ) : (
          <FlatList
            data={displayTxns}
            keyExtractor={(t) => t.$id}
            renderItem={renderTxn}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                icon="🪙"
                title="NO TRANSACTIONS FOUND"
                subtitle="Complete daily missions to earn more Pulse coins."
              />
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121820',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  topTitleWrap: {
    alignItems: 'center',
  },
  topTitleText: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#FFD700',
    letterSpacing: 0.8,
  },
  topSubText: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  walletPill: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  walletPillText: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#FFD700',
  },

  heroWalletWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroWalletGradient: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  walletIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  walletStats: {
    flex: 1,
    gap: 2,
  },
  walletBalanceLabel: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  walletBalanceNumber: {
    fontSize: 22,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  walletSubText: {
    fontSize: 10,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#FFD700',
  },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#0C131A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterChipActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  filterChipText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },

  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFD700',
    letterSpacing: 0.8,
  },

  list: {
    padding: 16,
    gap: 10,
    paddingBottom: 90,
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C131A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEarn: {
    backgroundColor: 'rgba(0, 255, 120, 0.12)',
  },
  iconSpend: {
    backgroundColor: 'rgba(255, 59, 0, 0.12)',
  },
  txnInfo: {
    flex: 1,
    gap: 2,
  },
  txnDesc: {
    fontSize: 12,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  txnDate: {
    fontSize: 9,
    fontFamily: 'Urbanist_500Medium',
    color: '#64748B',
  },
  amountWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  txnAmount: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
  },
  amountEarn: {
    color: '#00FF78',
  },
  amountSpend: {
    color: '#FF3B00',
  },
  balanceAfterText: {
    fontSize: 8,
    fontFamily: 'Urbanist_500Medium',
    color: '#64748B',
  },
});
