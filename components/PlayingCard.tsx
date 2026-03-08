import React, { useMemo } from 'react';
import { Card, Suit, Rank } from '../types';
import { Heart, Diamond, Club, Spade, Crown } from 'lucide-react';

const CARD_SIZES = {
  sm: { width: 'w-14', height: 'h-20', text: 'text-base', cornerIcon: 10, radius: 'rounded-[6px]', p: 'p-1' },
  base: { width: 'w-20', height: 'h-[112px]', text: 'text-lg', cornerIcon: 12, radius: 'rounded-[8px]', p: 'p-1.5' },
  md: { width: 'w-32', height: 'h-44', text: 'text-2xl', cornerIcon: 14, radius: 'rounded-[10px]', p: 'p-2.5' },
  lg: { width: 'w-48', height: 'h-64', text: 'text-4xl', cornerIcon: 20, radius: 'rounded-[14px]', p: 'p-4' },
  xl: { width: 'w-72', height: 'h-96', text: 'text-6xl', cornerIcon: 32, radius: 'rounded-[20px]', p: 'p-6' },
} as const;

const getRankString = (rank: Rank) => {
  switch (rank) {
    case Rank.JACK: return 'J';
    case Rank.QUEEN: return 'Q';
    case Rank.KING: return 'K';
    case Rank.ACE: return 'A';
    default: return rank.toString();
  }
};

const getSuitIcon = (suit: Suit, iconSize: number | string, fill: boolean = true) => {
  const props = {
    size: typeof iconSize === 'number' ? iconSize : undefined,
    className: typeof iconSize === 'string' ? iconSize : undefined,
    fill: fill ? "currentColor" : "none",
    strokeWidth: fill ? 0 : 2
  };

  switch (suit) {
    case Suit.HEARTS: return <Heart {...props} className={`${props.className || ''} text-[#e11d48]`} />;
    case Suit.DIAMONDS: return <Diamond {...props} className={`${props.className || ''} text-[#e11d48]`} />;
    case Suit.CLUBS: return <Club {...props} className={`${props.className || ''} text-[#1e293b]`} />;
    case Suit.SPADES: return <Spade {...props} className={`${props.className || ''} text-[#1e293b]`} />;
  }
};

const renderPips = (card: Card, size: 'sm' | 'base' | 'md' | 'lg' | 'xl') => {
  const isFaceCard = card.rank === Rank.JACK || card.rank === Rank.QUEEN || card.rank === Rank.KING;
  const isAce = card.rank === Rank.ACE;
  if (isFaceCard || isAce) return null;

  const pips = [];
  const rankVal = card.rank;

  const pipSize = size === 'sm' ? 10 : size === 'base' ? 14 : size === 'md' ? 18 : size === 'lg' ? 24 : 40;

  const Pip = () => getSuitIcon(card.suit, pipSize);
  const InvertedPip = () => <div className="rotate-180">{getSuitIcon(card.suit, pipSize)}</div>;

  if (rankVal === 2) {
    return <div className="flex justify-center flex-col items-center gap-10 h-full py-4"><Pip /><InvertedPip /></div>;
  }
  if (rankVal === 3) {
    return <div className="flex justify-center flex-col items-center gap-2 h-full py-4"><Pip /><Pip /><InvertedPip /></div>;
  }

  // General Grid for 4-10
  return (
    <div className="absolute inset-8 grid grid-cols-3 gap-1">
      {/* Left Col */}
      <div className="flex flex-col justify-between items-center">
        <Pip />
        {(rankVal >= 6) && <Pip />}
        {(rankVal >= 9) && <InvertedPip />}
        <InvertedPip />
      </div>

      {/* Center Col */}
      <div className="flex flex-col justify-around items-center py-2">
        {(rankVal === 5 || rankVal === 9) && <Pip />}
        {(rankVal === 7 || rankVal === 8 || rankVal === 10) && <Pip />}
        {(rankVal === 8 || rankVal === 10) && <InvertedPip />}
        {(rankVal === 7 && <div className="h-4"></div>)} {/* Spacer */}
      </div>

      {/* Right Col */}
      <div className="flex flex-col justify-between items-center">
        <Pip />
        {(rankVal >= 6) && <Pip />}
        {(rankVal >= 9) && <InvertedPip />}
        <InvertedPip />
      </div>
    </div>
  );
};

interface PlayingCardProps {
  card: Card | null;
  isFaceDown?: boolean;
  size?: 'sm' | 'base' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  highlight?: boolean;
  disabled?: boolean;
}

const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  isFaceDown = false,
  size = 'md',
  className = '',
  onClick,
  highlight = false,
  disabled = false,
}) => {

  const sizeConfig = CARD_SIZES[size];
  const isRed = !!card && (card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS);
  const isFaceCard = !!card && (card.rank === Rank.JACK || card.rank === Rank.QUEEN || card.rank === Rank.KING);
  const isAce = !!card && card.rank === Rank.ACE;
  const rankLabel = card ? getRankString(card.rank) : '';
  const pipContent = useMemo(() => card ? renderPips(card, size as 'sm' | 'base' | 'md' | 'lg' | 'xl') : null, [card, size]);

  return (
    <div
      className={`perspective-1000 ${sizeConfig.width} ${sizeConfig.height} ${sizeConfig.radius} ${className} relative select-none group overflow-hidden
        ${highlight ? 'shadow-[0_0_30px_rgba(250,204,21,0.8)] scale-105' : 'shadow-[0_2px_15px_-3px_rgba(0,0,0,0.5)]'}
      `}
      onClick={!disabled ? onClick : undefined}
    >
      <div className={`
        w-full h-full relative preserve-3d transition-transform duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)
        ${isFaceDown ? 'rotate-y-180' : ''}
        ${onClick && !disabled ? 'cursor-pointer' : ''}
      `}>

        {/* --- FRONT --- */}
        <div className={`
          absolute inset-0 backface-hidden
          bg-gradient-to-b from-[#fdfdfd] to-[#f3f4f6] /* Paper White */
          ${sizeConfig.radius}
          border border-white/80
          ring-1 ring-black/5
          shadow-[0_16px_40px_-14px_rgba(0,0,0,0.65)]
          overflow-hidden
        `}>
          {/* Texture Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}></div>

          {/* Safe Area / Border Helper */}
          <div className="absolute inset-0 rounded-[inherit] border border-slate-200/50 pointer-events-none"></div>

          {card && (
            <>
              {/* --- Top Left Corner --- */}
              <div className={`absolute top-1 left-1.5 flex flex-col items-center leading-none ${isRed ? 'text-[#e11d48]' : 'text-[#1e293b]'}`}>
                <span className={`${sizeConfig.text} font-serif font-bold tracking-tighter`}>{rankLabel}</span>
                <div className="mt-0">{getSuitIcon(card.suit, sizeConfig.cornerIcon)}</div>
              </div>

              {/* --- Bottom Right Corner (Inverted) --- */}
              <div className={`absolute bottom-1 right-1.5 flex flex-col items-center leading-none transform rotate-180 ${isRed ? 'text-[#e11d48]' : 'text-[#1e293b]'}`}>
                <span className={`${sizeConfig.text} font-serif font-bold tracking-tighter`}>{rankLabel}</span>
                <div className="mt-0">{getSuitIcon(card.suit, sizeConfig.cornerIcon)}</div>
              </div>

              {/* --- Center Content --- */}
              <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">

                {/* ACE */}
                {isAce && (
                  <div className="transform scale-150 drop-shadow-sm">
                    {getSuitIcon(card.suit, size === 'sm' ? 24 : size === 'md' ? 60 : 100)}
                  </div>
                )}

                {/* FACE CARDS (J, Q, K) */}
                {isFaceCard && (
                  <div className={`w-full h-3/4 border-2 ${isRed ? 'border-[#e11d48]/30' : 'border-slate-800/30'} rounded-lg flex flex-col justify-between p-2 relative overflow-hidden bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent`}>
                    {/* Decorative inner lines */}
                    <div className="absolute inset-0.5 border border-yellow-600/20 rounded opacity-50"></div>

                    {/* Top Icon */}
                    <div className="flex justify-start">
                      <div className={`${isRed ? 'text-[#e11d48]' : 'text-[#1e293b]'} opacity-80`}>
                        <Crown size={size === 'sm' ? 16 : 32} strokeWidth={1.5} fill="currentColor" className="text-yellow-600" />
                        <div className="-mt-1 ml-2">{getSuitIcon(card.suit, size === 'sm' ? 12 : 24)}</div>
                      </div>
                    </div>

                    {/* Large Letter Background */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif font-black ${size === 'sm' ? 'text-4xl' : 'text-8xl'} opacity-10 ${isRed ? 'text-red-900' : 'text-slate-900'}`}>
                      {rankLabel}
                    </div>

                    {/* Bottom Icon (Inverted) */}
                    <div className="flex justify-end transform rotate-180">
                      <div className={`${isRed ? 'text-[#e11d48]' : 'text-[#1e293b]'} opacity-80`}>
                        <Crown size={size === 'sm' ? 16 : 32} strokeWidth={1.5} fill="currentColor" className="text-yellow-600" />
                        <div className="-mt-1 ml-2">{getSuitIcon(card.suit, size === 'sm' ? 12 : 24)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NUMBER CARDS (Pips) */}
                {!isAce && !isFaceCard && size !== 'sm' && pipContent}

                {/* Fallback for small number cards */}
                {!isAce && !isFaceCard && size === 'sm' && (
                  <div className="font-serif font-bold text-2xl opacity-20 tracking-tighter">{rankLabel}</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* --- BACK --- */}
        <div className={`
          absolute inset-0 backface-hidden rotate-y-180
          bg-[#1e40af] /* Classic Blue Deck */
          ${sizeConfig.radius}
          border-[6px] border-white
          ring-1 ring-black/10
          shadow-[0_16px_40px_-14px_rgba(0,0,0,0.65)]
          overflow-hidden
        `}>
          {/* Realistic Back Pattern (CSS Pattern) */}
          <div className="w-full h-full opacity-60" style={{
            backgroundImage: `radial-gradient(#fff 15%, transparent 16%), radial-gradient(#fff 15%, transparent 16%)`,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 4px 4px'
          }}></div>

          {/* Center Logo/Graphic */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1/2 h-1/3 border-2 border-white/30 rounded-full flex items-center justify-center backdrop-blur-[1px]">
              <div className="text-white/50 font-serif font-bold italic tracking-widest transform -rotate-12 text-sm">
                BUSSEN
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default React.memo(PlayingCard);
