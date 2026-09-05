import { Suit, Rank, Card } from '../../../types';

export const getSuitSymbol = (suit: Suit) => {
  switch (suit) {
    case Suit.HEARTS: return '♥';
    case Suit.DIAMONDS: return '♦';
    case Suit.CLUBS: return '♣';
    case Suit.SPADES: return '♠';
  }
};

export const getRankChar = (rank: Rank) => {
  switch (rank) {
    case Rank.TWO: return '2';
    case Rank.THREE: return '3';
    case Rank.FOUR: return '4';
    case Rank.FIVE: return '5';
    case Rank.SIX: return '6';
    case Rank.SEVEN: return '7';
    case Rank.EIGHT: return '8';
    case Rank.NINE: return '9';
    case Rank.TEN: return '10';
    case Rank.JACK: return 'J';
    case Rank.QUEEN: return 'Q';
    case Rank.KING: return 'K';
    case Rank.ACE: return 'A';
  }
};

export const getRankString = (rank: Rank) => {
  switch (rank) {
    case Rank.JACK: return 'J';
    case Rank.QUEEN: return 'Q';
    case Rank.KING: return 'K';
    case Rank.ACE: return 'A';
    default: return rank.toString();
  }
};

export const getFullRankName = (rank: Rank, t: any) => {
  switch (rank) {
    case Rank.JACK: return t("Boer");
    case Rank.QUEEN: return t("Vrouw");
    case Rank.KING: return t("Koning");
    case Rank.ACE: return t("Aas");
    default: return rank.toString();
  }
};

export const ALL_SUITS: Suit[] = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];

export const PREVIEW_CARD: Card = { suit: Suit.HEARTS, rank: Rank.KING, id: 'preview-king' };

export const createDeck = (): Card[] => {
  const suits = ALL_SUITS;
  const ranks = [Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE];
  const deck: Card[] = [];
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({ suit, rank, id: `${suit}-${rank}-${Math.random()}` });
    });
  });
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};
