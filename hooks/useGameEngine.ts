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
