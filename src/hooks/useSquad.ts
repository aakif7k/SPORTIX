import { useSquadStore } from '../store/squadStore';
import { useAuthStore } from '../store/authStore';

export const useSquad = (squadId?: string) => {
  const { squads, activeSquadId, chats, tournaments, setActiveSquadId, updateTacticalBoard, sendChatMessage, updateSquadSettings } = useSquadStore();
  const user = useAuthStore(state => state.user);

  const idToUse = squadId || activeSquadId;
  const squad = squads.find((s) => s.squadId === idToUse) || null;
  const squadChats = idToUse ? chats[idToUse] || [] : [];

  const isCaptain = squad?.captainId === (user?.id || 'cu1');

  return {
    squad,
    squads,
    activeSquadId,
    squadChats,
    tournaments,
    isCaptain,
    setActiveSquadId,
    updateTacticalBoard,
    sendChatMessage,
    updateSquadSettings,
  };
};
