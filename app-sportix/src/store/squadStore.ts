/**
 * src/store/squadStore.ts
 */
import { create } from 'zustand';
import { Squad, SquadMember } from '../types';

interface SquadState {
  mySquads:      Squad[];
  activeSquad:   Squad | null;
  members:       SquadMember[];
  loading:       boolean;

  setMySquads:    (squads: Squad[]) => void;
  setActiveSquad: (squad: Squad | null) => void;
  setMembers:     (members: SquadMember[]) => void;
  setLoading:     (loading: boolean) => void;
  addSquad:       (squad: Squad) => void;
}

export const useSquadStore = create<SquadState>((set, get) => ({
  mySquads:    [],
  activeSquad: null,
  members:     [],
  loading:     false,

  setMySquads:    (mySquads) => set({ mySquads }),
  setActiveSquad: (activeSquad) => set({ activeSquad }),
  setMembers:     (members) => set({ members }),
  setLoading:     (loading) => set({ loading }),
  addSquad:       (squad) => set({ mySquads: [squad, ...get().mySquads] }),
}));
