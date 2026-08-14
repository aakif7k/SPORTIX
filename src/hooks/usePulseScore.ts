import { useEffect } from 'react';
import { usePulseStore } from '../store/pulseStore';
import { useAuthStore } from '../store/authStore';

export const usePulseScore = () => {
  const { pulseScore, addScoreDelta, loadUserPulse, isLoading } = usePulseStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.id && (!pulseScore.userId || pulseScore.userId !== user.id)) {
      loadUserPulse(user.id);
    }
  }, [user?.id, pulseScore.userId, loadUserPulse]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PULSE ELITE':
        return '#CCFF00';
      case 'ELITE':
        return '#CCFF00';
      default:
        return '#CCFF00';
    }
  };

  return {
    pulseScore,
    addScoreDelta,
    getTierColor,
    isLoading,
    score: pulseScore.score,
    tier: pulseScore.tier,
    breakdown: pulseScore.breakdown,
    history: pulseScore.history,
  };
};
