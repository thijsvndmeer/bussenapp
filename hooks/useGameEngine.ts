import { useCallback, useMemo, useState } from 'react';
import { Player } from '../types';

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

export const useGameEngine = () => {
  const [playerState, setPlayerState] = useState<NormalizedPlayers>(() => normalizePlayers([]));

  const players = useMemo(() => denormalizePlayers(playerState), [playerState]);

  const setPlayers = useCallback((nextPlayers: PlayerListUpdater) => {
    setPlayerState(currentState => {
      const currentPlayers = denormalizePlayers(currentState);
      const resolvedPlayers = typeof nextPlayers === 'function' ? nextPlayers(currentPlayers) : nextPlayers;
      return normalizePlayers(resolvedPlayers);
    });
  }, []);

  const addPlayer = useCallback((player: Player) => {
    setPlayerState(currentState => ({
      byId: { ...currentState.byId, [player.id]: player },
      order: [...currentState.order, player.id],
    }));
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setPlayerState(currentState => {
      if (!currentState.byId[playerId]) return currentState;
      const { [playerId]: _removed, ...byId } = currentState.byId;
      return {
        byId,
        order: currentState.order.filter(id => id !== playerId),
      };
    });
  }, []);

  const updatePlayer = useCallback((playerId: string, updater: PlayerUpdater) => {
    setPlayerState(currentState => {
      const currentPlayer = currentState.byId[playerId];
      if (!currentPlayer) return currentState;
      const nextPlayer = updater(currentPlayer);
      if (nextPlayer === currentPlayer) return currentState;
      return {
        ...currentState,
        byId: { ...currentState.byId, [playerId]: nextPlayer },
      };
    });
  }, []);

  const updatePlayers = useCallback((updates: Record<string, PlayerUpdater>) => {
    setPlayerState(currentState => {
      let changed = false;
      const byId = { ...currentState.byId };

      Object.entries(updates).forEach(([playerId, updater]) => {
        const currentPlayer = byId[playerId];
        if (!currentPlayer) return;
        const nextPlayer = updater(currentPlayer);
        if (nextPlayer !== currentPlayer) {
          byId[playerId] = nextPlayer;
          changed = true;
        }
      });

      return changed ? { ...currentState, byId } : currentState;
    });
  }, []);

  const reorderPlayers = useCallback((fromIndex: number, toIndex: number) => {
    setPlayerState(currentState => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= currentState.order.length || toIndex >= currentState.order.length) {
        return currentState;
      }
      const order = [...currentState.order];
      const [movedPlayerId] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, movedPlayerId);
      return { ...currentState, order };
    });
  }, []);

  return {
    players,
    setPlayers,
    addPlayer,
    removePlayer,
    updatePlayer,
    updatePlayers,
    reorderPlayers,
  };
};
import { useCallback, useEffect, useRef, useState } from 'react';
import { GamePhase, Player } from '../types';

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

export function useGameEngine(initialPhase: GamePhase) {
  const [phase, setPhaseState] = useState<GamePhase>(initialPhase);
  const timersRef = useRef<Map<ScheduledTimerKey, ReturnType<typeof setTimeout>>>(new Map());
  const handlerRef = useRef<EventHandler | null>(null);

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
  }, [clearScheduled]);

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
