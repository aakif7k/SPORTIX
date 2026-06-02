import { useSquad } from './useSquad';

export const useChemistry = (squadId?: string) => {
  const { squad } = useSquad(squadId);

  const getChemistryColor = (value: number) => {
    if (value >= 90) return '#CCFF00'; // Elite chemistry
    if (value >= 75) return '#4ADE80'; // Strong
    if (value >= 60) return '#FBBF24'; // Decent
    return '#F87171'; // Low
  };

  const getCompatibilityGrid = () => {
    if (!squad) return [];
    // Generates a mock symmetric matrix for compatibility between members
    const members = squad.members;
    return members.map((m1, idx1) => {
      return members.map((m2, idx2) => {
        if (idx1 === idx2) return 100;
        // Deterministic but random-looking compatibility based on name lengths
        const base = 70 + ((m1.name.length + m2.name.length) % 25);
        return base;
      });
    });
  };

  return {
    chemistry: squad?.chemistry || null,
    getChemistryColor,
    getCompatibilityGrid,
  };
};
