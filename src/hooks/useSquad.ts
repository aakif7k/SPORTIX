import { useSquadStore } from '../store/squadStore';

export const useSquad = (squadId?: string) => {
  const { squads, activeSquadId, chats, tournaments, setActiveSquadId, updateTacticalBoard, sendChatMessage, updateSquadSettings } = useSquadStore();

  const idToUse = squadId || activeSquadId;
  const squad = squads.find((s) => s.squadId === idToUse) || null;
  const squadChats = idToUse ? chats[idToUse] || [] : [];

  const isCaptain = squad?.captainId === 'u6'; // Zach Miller is u6 (the simulated current user)

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
