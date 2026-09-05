import { create } from 'zustand';
import { GamePhase } from '../../types';

interface GameState {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: GamePhase.SETUP,
  setPhase: (phase) => set({ phase }),
}));
