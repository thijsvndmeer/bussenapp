import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerState } from '../hooks/usePlayerState';
import { Player, Suit, Rank, GamePhase } from '../types';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    length: 0,
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('Player State & Game Engine Logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty players list when storage is empty', () => {
    const { result } = renderHook(() => usePlayerState());
    expect(result.current.players).toEqual([]);
  });

  it('adds and removes players correctly', () => {
    const { result } = renderHook(() => usePlayerState());

    const player1: Player = {
      id: 'p1',
      name: 'Alice',
      hand: [],
      drinksTaken: 0,
      drinksDistributed: 0,
      adtjes: 0,
      isDealer: false,
    };

    const player2: Player = {
      id: 'p2',
      name: 'Bob',
      hand: [],
      drinksTaken: 0,
      drinksDistributed: 0,
      adtjes: 0,
      isDealer: false,
    };

    act(() => {
      result.current.addPlayer(player1);
      result.current.addPlayer(player2);
    });

    expect(result.current.players.length).toBe(2);
    expect(result.current.players[0].name).toBe('Alice');
    expect(result.current.players[1].name).toBe('Bob');

    act(() => {
      result.current.removePlayer('p1');
    });

    expect(result.current.players.length).toBe(1);
    expect(result.current.players[0].name).toBe('Bob');
  });

  it('updates a specific player correctly', () => {
    const { result } = renderHook(() => usePlayerState());

    const player: Player = {
      id: 'p1',
      name: 'Charlie',
      hand: [],
      drinksTaken: 0,
      drinksDistributed: 0,
      adtjes: 0,
      isDealer: false,
    };

    act(() => {
      result.current.addPlayer(player);
    });

    act(() => {
      result.current.updatePlayer('p1', (p) => ({
        ...p,
        drinksTaken: p.drinksTaken + 2,
        isDealer: true,
      }));
    });

    expect(result.current.players[0].drinksTaken).toBe(2);
    expect(result.current.players[0].isDealer).toBe(true);
  });

  it('reorders players correctly', () => {
    const { result } = renderHook(() => usePlayerState());

    const players: Player[] = [
      { id: '1', name: 'P1', hand: [], drinksTaken: 0, drinksDistributed: 0, adtjes: 0, isDealer: false },
      { id: '2', name: 'P2', hand: [], drinksTaken: 0, drinksDistributed: 0, adtjes: 0, isDealer: false },
      { id: '3', name: 'P3', hand: [], drinksTaken: 0, drinksDistributed: 0, adtjes: 0, isDealer: false },
    ];

    act(() => {
      result.current.setPlayers(players);
    });

    expect(result.current.players.map((p) => p.id)).toEqual(['1', '2', '3']);

    act(() => {
      result.current.reorderPlayers(0, 2);
    });

    expect(result.current.players.map((p) => p.id)).toEqual(['2', '3', '1']);
  });

  it('validates Suit and Rank enums', () => {
    expect(Suit.HEARTS).toBe('HEARTS');
    expect(Suit.DIAMONDS).toBe('DIAMONDS');
    expect(Suit.CLUBS).toBe('CLUBS');
    expect(Suit.SPADES).toBe('SPADES');

    expect(Rank.TWO).toBe(2);
    expect(Rank.ACE).toBe(14);
    expect(Rank.KING).toBe(13);
  });

  describe('Round 3 (Inside / Outside / On It) boundary rules', () => {
    const evaluateRound3Guess = (
      c1Rank: number,
      c2Rank: number,
      drawnRank: number,
      guess: 'BETWEEN' | 'OUTSIDE' | 'ON_IT'
    ): boolean => {
      const low = Math.min(c1Rank, c2Rank);
      const high = Math.max(c1Rank, c2Rank);
      if (guess === 'BETWEEN') return drawnRank > low && drawnRank < high;
      if (guess === 'OUTSIDE') return drawnRank < low || drawnRank > high;
      if (guess === 'ON_IT') return drawnRank === low || drawnRank === high;
      return false;
    };

    it('rejects BETWEEN and OUTSIDE when drawn rank matches either boundary (e.g. 3 or 9 with hand 3+9)', () => {
      // Hand: 3 and 9. Drawn: 3
      expect(evaluateRound3Guess(3, 9, 3, 'BETWEEN')).toBe(false);
      expect(evaluateRound3Guess(3, 9, 3, 'OUTSIDE')).toBe(false);
      expect(evaluateRound3Guess(3, 9, 3, 'ON_IT')).toBe(true);

      // Hand: 3 and 9. Drawn: 9
      expect(evaluateRound3Guess(3, 9, 9, 'BETWEEN')).toBe(false);
      expect(evaluateRound3Guess(3, 9, 9, 'OUTSIDE')).toBe(false);
      expect(evaluateRound3Guess(3, 9, 9, 'ON_IT')).toBe(true);
    });

    it('handles strictly inside guesses correctly', () => {
      // Hand: 3 and 9. Drawn: 5
      expect(evaluateRound3Guess(3, 9, 5, 'BETWEEN')).toBe(true);
      expect(evaluateRound3Guess(3, 9, 5, 'OUTSIDE')).toBe(false);
      expect(evaluateRound3Guess(3, 9, 5, 'ON_IT')).toBe(false);
    });

    it('handles strictly outside guesses correctly', () => {
      // Hand: 3 and 9. Drawn: 2 (below)
      expect(evaluateRound3Guess(3, 9, 2, 'BETWEEN')).toBe(false);
      expect(evaluateRound3Guess(3, 9, 2, 'OUTSIDE')).toBe(true);
      expect(evaluateRound3Guess(3, 9, 2, 'ON_IT')).toBe(false);

      // Hand: 3 and 9. Drawn: 10 (above)
      expect(evaluateRound3Guess(3, 9, 10, 'BETWEEN')).toBe(false);
      expect(evaluateRound3Guess(3, 9, 10, 'OUTSIDE')).toBe(true);
      expect(evaluateRound3Guess(3, 9, 10, 'ON_IT')).toBe(false);
    });
  });
});
