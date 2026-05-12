import React from 'react';
import { Suit, Rank } from '../types';

interface ClassicFaceCardProps {
  suit: Suit;
  rank: Rank;
  size: number;
  className?: string;
}

const ClassicFaceCard: React.FC<ClassicFaceCardProps> = ({ suit, rank, size, className }) => {
  const suitMap: Record<Suit, string> = {
    [Suit.HEARTS]: 'H',
    [Suit.DIAMONDS]: 'D',
    [Suit.CLUBS]: 'C',
    [Suit.SPADES]: 'S',
  };

  const rankMap: Record<Rank, string> = {
    [Rank.JACK]: 'J',
    [Rank.QUEEN]: 'Q',
    [Rank.KING]: 'K',
  };

  const s = suitMap[suit];
  const r = rankMap[rank as Rank];
  const localPath = `./assets/cards/klassiek/${r}${s}.svg`;

  return (
    <div 
      className={`absolute inset-0 overflow-hidden flex items-center justify-center ${className}`}
    >
      <img 
        src={localPath} 
        alt={`${rank} of ${suit}`}
        className="w-full h-full object-cover pointer-events-none mix-blend-multiply"
        loading="lazy"
        onError={(e) => {
          console.error(`Failed to load local asset: ${localPath}`);
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};

export default ClassicFaceCard;
