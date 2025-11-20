import React from 'react';
import { Card, Suit, Rank } from '../types';
import { Heart, Diamond, Club, Spade } from 'lucide-react';

interface PlayingCardProps {
  card: Card | null;
  isFaceDown?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  highlight?: boolean;
  disabled?: boolean;
  showRankOnly?: boolean;
}

const PlayingCard: React.FC<PlayingCardProps> = ({ 
  card, 
  isFaceDown = false, 
  size = 'md', 
  className = '',
  onClick,
  highlight = false,
  disabled = false,
  showRankOnly = false
}) => {
  const getSuitIcon = (suit: Suit, iconSize: number) => {
    const props = { size: iconSize, fill: "currentColor" };
    switch (suit) {
      case Suit.HEARTS: return <Heart {...props} className="text-red-600 drop-shadow-sm" />;
      case Suit.DIAMONDS: return <Diamond {...props} className="text-red-600 drop-shadow-sm" />;
      case Suit.CLUBS: return <Club {...props} className="text-slate-900 drop-shadow-sm" />;
      case Suit.SPADES: return <Spade {...props} className="text-slate-900 drop-shadow-sm" />;
    }
  };

  const getRankString = (rank: Rank) => {
    switch (rank) {
      case Rank.JACK: return 'J';
      case Rank.QUEEN: return 'Q';
      case Rank.KING: return 'K';
      case Rank.ACE: return 'A';
      default: return rank.toString();
    }
  };

  const isRed = card && (card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS);
  
  const sizes = {
    sm: { width: 'w-12', height: 'h-16', text: 'text-sm', icon: 10, mainIcon: 14, radius: 'rounded-lg', p: 'p-1' },
    md: { width: 'w-28', height: 'h-40', text: 'text-2xl', icon: 16, mainIcon: 40, radius: 'rounded-xl', p: 'p-2' },
    lg: { width: 'w-40', height: 'h-56', text: 'text-3xl', icon: 20, mainIcon: 56, radius: 'rounded-2xl', p: 'p-3' },
    xl: { width: 'w-64', height: 'h-96', text: 'text-6xl', icon: 32, mainIcon: 96, radius: 'rounded-3xl', p: 'p-6' },
  };

  const s = sizes[size];

  // Determine visual state
  const isFlipped = isFaceDown;

  return (
    <div 
      className={`perspective-1000 ${s.width} ${s.height} ${className} relative select-none`}
      onClick={!disabled ? onClick : undefined}
    >
      <div className={`
        w-full h-full relative preserve-3d transition-transform duration-500 ease-out
        ${isFlipped ? 'rotate-y-180' : ''}
        ${onClick && !disabled ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]' : ''}
        ${highlight ? 'shadow-[0_0_30px_rgba(250,204,21,0.6)] scale-105' : 'shadow-2xl'}
      `}>
        
        {/* FRONT OF CARD */}
        <div className={`
          absolute inset-0 backface-hidden
          bg-gradient-to-br from-white to-slate-100 
          ${s.radius} border border-slate-300
          flex flex-col justify-between ${s.p}
          overflow-hidden
        `}>
           {/* Glossy Shine effect */}
           <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50 pointer-events-none" />

          {card && (
            <>
              {/* Top Left */}
              <div className={`flex flex-col items-center leading-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
                <span className={`${s.text} font-black tracking-tighter font-serif`}>{getRankString(card.rank)}</span>
                <div className="mt-0.5 drop-shadow-sm">{getSuitIcon(card.suit, s.icon)}</div>
              </div>

              {/* Center */}
              {!showRankOnly && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-90">
                  {getSuitIcon(card.suit, s.mainIcon)}
                </div>
              )}

              {/* Bottom Right */}
              <div className={`flex flex-col items-center leading-none transform rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
                <span className={`${s.text} font-black tracking-tighter font-serif`}>{getRankString(card.rank)}</span>
                <div className="mt-0.5 drop-shadow-sm">{getSuitIcon(card.suit, s.icon)}</div>
              </div>
            </>
          )}
        </div>

        {/* BACK OF CARD */}
        <div className={`
          absolute inset-0 backface-hidden rotate-y-180
          bg-gradient-to-br from-blue-900 to-indigo-950
          ${s.radius} border-2 border-white/20
          flex items-center justify-center
          shadow-inner
        `}>
           {/* Pattern */}
           <div className="absolute inset-1 border border-yellow-500/30 opacity-50 rounded-sm"></div>
           <div className="w-full h-full opacity-10" style={{
               backgroundImage: `repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 2px, transparent 2px, transparent 12px)`,
           }}></div>
           
           <div className="relative z-10 transform rotate-45 border-4 border-white/20 w-16 h-16 flex items-center justify-center bg-blue-950 shadow-lg">
               <span className="font-serif font-bold italic text-white/30 text-xl -rotate-45">Bus</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PlayingCard;