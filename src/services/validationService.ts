export const validateTeammateStats = (
  votes: Record<string, 'confirm' | 'partial' | 'dispute'>
): { finalStatus: 'Accepted' | 'Weighted' | 'Flagged'; weight: number } => {
  const voteList = Object.values(votes);
  if (voteList.length === 0) return { finalStatus: 'Accepted', weight: 1.0 };

  const confirms = voteList.filter((v) => v === 'confirm').length;
  const partials = voteList.filter((v) => v === 'partial').length;

  const total = voteList.length;
  const score = (confirms * 1.0 + partials * 0.5) / total;

  if (score >= 0.8) {
    return { finalStatus: 'Accepted', weight: 1.0 };
  } else if (score >= 0.5) {
    return { finalStatus: 'Weighted', weight: 0.7 };
  } else {
    return { finalStatus: 'Flagged', weight: 0.3 };
  }
};
