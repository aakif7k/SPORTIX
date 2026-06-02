import { useMatchStore } from '../store/matchStore';

export const useMatchValidation = () => {
  const { currentMatch, validationVotes, validationReasons, submitValidation } = useMatchStore();

  const getValidationSummary = () => {
    const list = Object.values(validationVotes);
    const confirms = list.filter(v => v === 'confirm').length;
    const partials = list.filter(v => v === 'partial').length;
    const disputes = list.filter(v => v === 'dispute').length;

    return { confirms, partials, disputes, total: list.length };
  };

  return {
    currentMatch,
    validationVotes,
    validationReasons,
    submitValidation,
    getValidationSummary,
  };
};
