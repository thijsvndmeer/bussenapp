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

const loadInitialPlayers = (): NormalizedPlayers => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return normalizePlayers([]);
  }
  try {
    const saved = localStorage.getItem('bus-app-player-data-v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.players && Array.isArray(parsed.players)) {
        return normalizePlayers(parsed.players);
      }
    }
  } catch (e) {
    console.warn('Kon spelers niet synchroon laden', e);
  }
  return normalizePlayers([]);
};

export const usePlayerState = () => {
  const [playerState, setPlayerState] = useState<NormalizedPlayers>(loadInitialPlayers);

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
