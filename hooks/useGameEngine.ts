import { useCallback, useEffect, useMemo, useRef } from 'react';
import { create } from 'zustand';
import { GamePhase, Player } from '../types';

type NormalizedPlayers = {
  byId: Record<string, Player>;
  order: string[];
};

type PlayerUpdater = (player: Player) => Player;
type PlayerListUpdater = Player[] | ((players: Player[]) => Player[]);

const normalizePlayers = (players: Player[]): NormalizedPlayers => ({
  byId: players.reduce<Record<string, Player>>((byId, player) => {
    byId[player.id] = player;
    return byId;
  }, {}),
  order: players.map(player => player.id),
});

const denormalizePlayers = ({ byId, order }: NormalizedPlayers): Player[] =>
  order.map(id => byId[id]).filter((player): player is Player => Boolean(player));

interface PlayerStore {
  playerState: NormalizedPlayers;
  setPlayers: (nextPlayers: PlayerListUpdater) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updater: PlayerUpdater) => void;
  updatePlayers: (updates: Record<string, PlayerUpdater>) => void;
  reorderPlayers: (fromIndex: number, toIndex: number) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  playerState: normalizePlayers([]),
  
  setPlayers: (nextPlayers) => set(state => {
    const currentPlayers = denormalizePlayers(state.playerState);
    const resolvedPlayers = typeof nextPlayers === 'function' ? nextPlayers(currentPlayers) : nextPlayers;
    return { playerState: normalizePlayers(resolvedPlayers) };
  }),

  addPlayer: (player) => set(state => ({
    playerState: {
      byId: { ...state.playerState.byId, [player.id]: player },
      order: [...state.playerState.order, player.id],
    }
  })),

  removePlayer: (playerId) => set(state => {
    if (!state.playerState.byId[playerId]) return state;
    const { [playerId]: _removed, ...byId } = state.playerState.byId;
    return {
      playerState: {
        byId,
        order: state.playerState.order.filter(id => id !== playerId),
      }
    };
  }),

  updatePlayer: (playerId, updater) => set(state => {
    const currentPlayer = state.playerState.byId[playerId];
    if (!currentPlayer) return state;
    const nextPlayer = updater(currentPlayer);
    if (nextPlayer === currentPlayer) return state;
    return {
      playerState: {
        ...state.playerState,
        byId: { ...state.playerState.byId, [playerId]: nextPlayer },
      }
    };
  }),

  updatePlayers: (updates) => set(state => {
    let changed = false;
    const byId = { ...state.playerState.byId };
    Object.entries(updates).forEach(([playerId, updater]) => {
      const currentPlayer = byId[playerId];
      if (!currentPlayer) return;
      const nextPlayer = updater(currentPlayer);
      if (nextPlayer !== currentPlayer) {
        byId[playerId] = nextPlayer;
        changed = true;
      }
    });
    return changed ? { playerState: { ...state.playerState, byId } } : state;
  }),

  reorderPlayers: (fromIndex, toIndex) => set(state => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= state.playerState.order.length || toIndex >= state.playerState.order.length) {
      return state;
    }
    const order = [...state.playerState.order];
    const [movedPlayerId] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, movedPlayerId);
    return { playerState: { ...state.playerState, order } };
  }),
}));

export const usePlayerState = () => {
  const store = usePlayerStore();
  const players = useMemo(() => denormalizePlayers(store.playerState), [store.playerState]);
  return {
    players,
    setPlayers: store.setPlayers,
    addPlayer: store.addPlayer,
    removePlayer: store.removePlayer,
    updatePlayer: store.updatePlayer,
    updatePlayers: store.updatePlayers,
    reorderPlayers: store.reorderPlayers,
  };
};

export type GameEngineEvent =
  | { type: 'START_BUS'; passengers: Player[]; showEntrance?: boolean }
  | { type: 'BUS_FAIL' }
  | { type: 'RESHUFFLE_DONE' }
  | { type: 'PYRAMID_REVEAL'; rowIndex: number; cardIndex: number }
  | { type: 'NEXT_PLAYER' }
  | { type: 'LOSER_REVEAL_DONE' }
  | { type: 'BUS_ENTRANCE_DONE'; passengers: Player[]; mode: 'physical' | 'digital' }
  | { type: 'SCREEN_SHAKE_DONE' }
  | { type: 'BUS_WIN_BURST_DONE' }
  | { type: 'PYRAMID_WARNING_FEEDBACK_DONE' }
  | { type: 'PYRAMID_WARNING_COOLDOWN_DONE' };

type EventHandler = (event: GameEngineEvent) => void;

type ScheduledTimerKey =
  | 'bus-fail-restart'
  | 'bus-entrance'
  | 'loser-reveal'
  | 'reshuffle-banner'
  | 'screen-shake'
  | 'bus-win-burst'
  | 'pyramid-warning-feedback'
  | 'pyramid-warning-cooldown'
  | string;

interface EngineStore {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
}

export const useEngineStore = create<EngineStore>((set) => ({
  phase: GamePhase.SETUP,
  setPhase: (phase) => set({ phase }),
}));

export function useGameEngine(initialPhase: GamePhase) {
  const phase = useEngineStore(s => s.phase);
  const setPhaseState = useEngineStore(s => s.setPhase);
  
  const timersRef = useRef<Map<ScheduledTimerKey, ReturnType<typeof setTimeout>>>(new Map());
  const handlerRef = useRef<EventHandler | null>(null);

  // Initialize phase once if needed
  useEffect(() => {
     setPhaseState(initialPhase);
  }, []);

  const clearScheduled = useCallback((key?: ScheduledTimerKey) => {
    if (key) {
      const timer = timersRef.current.get(key);
      if (timer) clearTimeout(timer);
      timersRef.current.delete(key);
      return;
    }

    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const transitionToPhase = useCallback((nextPhase: GamePhase) => {
    clearScheduled();
    setPhaseState(nextPhase);
  }, [clearScheduled, setPhaseState]);

  const registerEventHandler = useCallback((handler: EventHandler) => {
    handlerRef.current = handler;
  }, []);

  const dispatch = useCallback((event: GameEngineEvent) => {
    handlerRef.current?.(event);
  }, []);

  const schedule = useCallback((key: ScheduledTimerKey, delay: number, event: GameEngineEvent) => {
    clearScheduled(key);
    const timer = setTimeout(() => {
      timersRef.current.delete(key);
      dispatch(event);
    }, delay);
    timersRef.current.set(key, timer);
  }, [clearScheduled, dispatch]);

  useEffect(() => () => clearScheduled(), [clearScheduled]);

  return { phase, transitionToPhase, dispatch, registerEventHandler, schedule, clearScheduled };
}
