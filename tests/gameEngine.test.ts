import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerState } from '../hooks/usePlayerState';
import { Player, Suit, Rank, GamePhase } from '../types';

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
});
