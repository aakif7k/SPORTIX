// Unused import removed

export interface PulseBreakdown {
  matchPerf: number;
  consistency: number;
  chemistry: number;
  reliability: number;
  activity: number;
  leadership: number;
}

/**
 * PLACEHOLDER — returns random deltas and ignores its input entirely.
 *
 * The real per-sport Pulse formula is a product decision and belongs on the
 * server (see performanceService.calculatePulse for the coefficients that are
 * being ported to pulse_service). Callers must not treat this as accurate.
 * The parameter is prefixed to record that it is deliberately unread.
 */
export const calculateScoreDelta = (
  _breakdown: PulseBreakdown
): { deltas: PulseBreakdown; totalDelta: number } => {
  const deltas = {
    matchPerf: Math.floor(Math.random() * 8) + 2, // +2 to +9
    consistency: Math.floor(Math.random() * 5) - 2, // -2 to +2
    chemistry: Math.floor(Math.random() * 6) + 1, // +1 to +6
    reliability: Math.floor(Math.random() * 4) + 1, // +1 to +4
    activity: Math.floor(Math.random() * 3) + 1, // +1 to +3
    leadership: Math.floor(Math.random() * 4), // 0 to +3
  };

  const totalDelta = Object.values(deltas).reduce((sum, val) => sum + val, 0);

  return { deltas, totalDelta };
};

export const getRecommendedEvents = () => {
  return [
    {
      id: 'e_rec_1',
      title: 'City Football League Semis',
      sport: 'football',
      date: 'May 25, 2026',
      time: '18:00',
      venue: 'Metropolitan Arena',
      slots: '3 slots open',
      pulseMatched: true,
      chemistryBonus: '+15% Chemistry'
    },
    {
      id: 'e_rec_2',
      title: 'Midnight 3v3 Tournament',
      sport: 'basketball',
      date: 'May 28, 2026',
      time: '21:30',
      venue: 'Neon Street Court',
      slots: '1 slot open',
      pulseMatched: true,
      chemistryBonus: '+10% Chemistry'
    },
    {
      id: 'e_rec_3',
      title: 'Sunset Cricket Clash',
      sport: 'cricket',
      date: 'June 02, 2026',
      time: '15:00',
      venue: 'Heritage Oval',
      slots: '4 slots open',
      pulseMatched: true,
      chemistryBonus: '+8% Chemistry'
    }
  ];
};
