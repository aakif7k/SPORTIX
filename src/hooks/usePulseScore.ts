import { usePulseStore } from '../store/pulseStore';

export const usePulseScore = () => {
  const { pulseScore, addScoreDelta } = usePulseStore();

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
    score: pulseScore.score,
    tier: pulseScore.tier,
    breakdown: pulseScore.breakdown,
    history: pulseScore.history,
  };
};
