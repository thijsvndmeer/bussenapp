
export enum Suit {
  HEARTS = 'HEARTS',
  DIAMONDS = 'DIAMONDS',
  CLUBS = 'CLUBS',
  SPADES = 'SPADES',
}

export enum Rank {
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  TEN = 10,
  JACK = 11,
  QUEEN = 12,
  KING = 13,
  ACE = 14,
}

export enum GameMode {
  DIGITAL = 'DIGITAL',
  PHYSICAL = 'PHYSICAL',
}

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[]; 
  drinksTaken: number;
  drinksDistributed: number;
  adtjes: number; // Tracker for 'Adtjes' (chugging)
  isDealer: boolean;
  isImmune?: boolean; // Immunity from the bus for the next game
  image?: string; // Base64 image string
}

export enum GamePhase {
  SETUP = 'SETUP',
  MODE_SELECTION = 'MODE_SELECTION',
  ROUNDS_1_4 = 'ROUNDS_1_4',
  PYRAMID = 'PYRAMID',
  BUS_MODE_SELECTION = 'BUS_MODE_SELECTION',
  BUS_TEAM_SELECTION = 'BUS_TEAM_SELECTION', // New phase for shared bus
  THE_BUS = 'THE_BUS',
  GAME_OVER = 'GAME_OVER',
}

export enum RoundStep {
  RED_BLACK = 1,
  HIGH_LOW = 2,
  IN_OUT = 3,
  SUIT = 4,
}

export enum UITheme {
  CLASSIC = 'classic',
  METRO = 'metro',
  CALM = 'calm',
  BEER = 'beer',
}

export enum CardStyle {
  MODERN = 'MODERN',
  DARK = 'DARK',
  CLASSIC = 'CLASSIC',
  NEON = 'NEON',
  BEER = 'BEER',
}

export interface GameSettings {
  mode: GameMode;
  physicalMode: boolean; // Whether to use physical cards instead of digital
  pyramidRows: number; // 3 to 7
  sharedBus: boolean; // Allow selecting a partner for the bus
  busLength: number; // Number of cards to guess (usually 5)
  busDecks: number; // Max number of decks for the bus ride
  cardStyle: CardStyle;
  doublePyramidCards: boolean; // Enable double sip cards in pyramid phase
  theme: UITheme;
}

