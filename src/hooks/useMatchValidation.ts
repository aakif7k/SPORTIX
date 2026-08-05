import { useMatchStore } from '../store/matchStore';

/**
 * A tally of the validation votes cast in this sitting.
 *
 * It used to also return `currentMatch` from the store, which was a fixture. The
 * match itself comes from the API; this only counts what the user has clicked so
 * the review screen can show progress.
 */
export const useMatchValidation = () => {
  const { validationVotes, validationReasons, recordVote } = useMatchStore();

  const getValidationSummary = () => {
    const list = Object.values(validationVotes);
    return {
      confirms: list.filter((v) => v === 'confirm').length,
      partials: list.filter((v) => v === 'partial').length,
      disputes: list.filter((v) => v === 'dispute').length,
      total: list.length,
    };
  };

  return { validationVotes, validationReasons, recordVote, getValidationSummary };
};
