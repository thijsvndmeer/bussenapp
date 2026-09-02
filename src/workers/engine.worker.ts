import { Card } from '../types';

self.onmessage = (e) => {
  const { type, payload } = e.data;
  
  if (type === 'SHUFFLE_DECK') {
    const deck = payload as Card[];
    // Standard Fisher-Yates shuffle
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    self.postMessage({ type: 'DECK_SHUFFLED', payload: newDeck });
  }
};
