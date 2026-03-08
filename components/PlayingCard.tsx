import React, { useMemo } from 'react';
import { Card, Suit, Rank } from '../types';
import { Heart, Diamond, Club, Spade, Crown, Shield, Sparkles } from 'lucide-react';

const CARD_SIZES = {
  sm: { width: 'w-14', text: 'text-base', cornerIcon: 10, radius: 'rounded-[6px]' },
  base: { width: 'w-20', text: 'text-lg', cornerIcon: 12, radius: 'rounded-[8px]' },
  md: { width: 'w-32', text: 'text-2xl', cornerIcon: 14, radius: 'rounded-[10px]' },
  lg: { width: 'w-48', text: 'text-4xl', cornerIcon: 20, radius: 'rounded-[14px]' },
  xl: { width: 'w-72', text: 'text-6xl', cornerIcon: 32, radius: 'rounded-[20px]' },
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

  const rankVal = card.rank;
  const pipSize = size === 'sm' ? 10 : size === 'base' ? 14 : size === 'md' ? 22 : size === 'lg' ? 36 : 60;

  const Pip = ({ x, y, inverted = false }: { x: number, y: number, inverted?: boolean }) => (
    <div
      className="absolute flex items-center justify-center"
      style={{ left: `${x}%`, top: `${y}%`, width: pipSize, height: pipSize, transform: 'translate(-50%, -50%)' }}
    >
      <div className={inverted ? 'rotate-180' : ''}>
        {getSuitIcon(card.suit, pipSize)}
      </div>
    </div>
  );

  // Absolute mapping for 100% card area (0-100%)
  // Accounting for index safe-zone (T0-18, B100-82, L0-25, R100-75)
  const coords: Record<number, { x: number, y: number, inv?: boolean }[]> = {
    2: [{ x: 50, y: 30 }, { x: 50, y: 70, inv: true }],
    3: [{ x: 50, y: 25 }, { x: 50, y: 50 }, { x: 50, y: 75, inv: true }],
    4: [{ x: 32, y: 25 }, { x: 68, y: 25 }, { x: 32, y: 75, inv: true }, { x: 68, y: 75, inv: true }],
    5: [{ x: 32, y: 25 }, { x: 68, y: 25 }, { x: 50, y: 50 }, { x: 32, y: 75, inv: true }, { x: 68, y: 75, inv: true }],
    6: [{ x: 32, y: 25 }, { x: 68, y: 25 }, { x: 32, y: 50 }, { x: 68, y: 50 }, { x: 32, y: 75, inv: true }, { x: 68, y: 75, inv: true }],
    7: [{ x: 32, y: 25 }, { x: 68, y: 25 }, { x: 32, y: 50 }, { x: 68, y: 50 }, { x: 50, y: 37.5 }, { x: 32, y: 75, inv: true }, { x: 68, y: 75, inv: true }],
    8: [{ x: 32, y: 25 }, { x: 68, y: 25 }, { x: 32, y: 50 }, { x: 68, y: 50 }, { x: 50, y: 37.5 }, { x: 50, y: 62.5, inv: true }, { x: 32, y: 75, inv: true }, { x: 68, y: 75, inv: true }],
    9: [{ x: 32, y: 20 }, { x: 68, y: 20 }, { x: 32, y: 40 }, { x: 68, y: 40 }, { x: 50, y: 50 }, { x: 32, y: 60, inv: true }, { x: 68, y: 60, inv: true }, { x: 32, y: 80, inv: true }, { x: 68, y: 80, inv: true }],
    10: [{ x: 32, y: 20 }, { x: 68, y: 20 }, { x: 32, y: 40 }, { x: 68, y: 40 }, { x: 50, y: 30 }, { x: 50, y: 70, inv: true }, { x: 32, y: 60, inv: true }, { x: 68, y: 60, inv: true }, { x: 32, y: 80, inv: true }, { x: 68, y: 80, inv: true }],
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {(coords[rankVal] || []).map((c, i) => (
        <Pip key={`${card.id}-pip-${i}`} x={c.x} y={c.y} inverted={c.inv} />
      ))}
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
      className={`perspective-1000 ${sizeConfig.width} aspect-[1/1.4] ${sizeConfig.radius} ${className} relative select-none group
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

          {/* --- FRONT UI --- */}
          {card && (
            <div className="absolute inset-0 pointer-events-none">

              {/* Corner Indices */}
              <div className={`absolute top-1 left-1 flex flex-col items-center leading-none ${isRed ? 'text-[#e11d48]' : 'text-[#1e293b]'}`}>
                <span className={`${sizeConfig.text} font-serif font-black tracking-tighter leading-none`}>{rankLabel}</span>
                <div className="mt-0.5">{getSuitIcon(card.suit, sizeConfig.cornerIcon)}</div>
              </div>

              <div className={`absolute bottom-1 right-1 flex flex-col items-center leading-none transform rotate-180 ${isRed ? 'text-[#e11d48]' : 'text-[#1e293b]'}`}>
                <span className={`${sizeConfig.text} font-serif font-black tracking-tighter leading-none`}>{rankLabel}</span>
                <div className="mt-0.5">{getSuitIcon(card.suit, sizeConfig.cornerIcon)}</div>
              </div>

              {/* --- Central Face Content --- */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">

                {/* ACE - Targeted centering with strict aspect-square */}
                {isAce && (
                  <div className="w-[45%] aspect-square flex items-center justify-center drop-shadow-md transition-transform group-hover:scale-110">
                    <div className="w-full h-full flex items-center justify-center">
                      {getSuitIcon(card.suit, size === 'sm' ? 24 : size === 'base' ? 36 : size === 'md' ? 60 : 88)}
                    </div>
                  </div>
                )}

                {/* FACE CARDS */}
                {isFaceCard && (
                  <div className="w-[65%] h-[75%] relative flex items-center justify-center overflow-visible">
                    <div className={`w-full h-full border-2 ${isRed ? 'border-[#e11d48]/30' : 'border-slate-800/30'} rounded-lg flex flex-col justify-between p-1.5 relative overflow-hidden bg-gradient-to-br from-white via-white/80 to-slate-50 shadow-inner`}>
                      {/* Damask Royal Pattern */}
                      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20L0 0h40L20 20zM0 40l20-20 20 20H0z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>

                      {/* Top Elite Icon */}
                      <div className="flex justify-start relative z-10 transition-transform group-hover:scale-110">
                        <div className={`${isRed ? 'text-[#e11d48]' : 'text-[#1e293b]'}`}>
                          {card.rank === Rank.KING && <Crown size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className="text-amber-500" />}
                          {card.rank === Rank.QUEEN && <Sparkles size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className="text-pink-500 animate-pulse" />}
                          {card.rank === Rank.JACK && <Shield size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className="text-blue-500" />}
                        </div>
                      </div>

                      {/* Background Letter */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:scale-105 transition-transform">
                        <span className={`font-serif font-black ${size === 'sm' ? 'text-4xl' : size === 'base' ? 'text-5xl' : 'text-8xl'} opacity-10 ${isRed ? 'text-red-900' : 'text-slate-900'} leading-none`}>
                          {rankLabel}
                        </span>
                      </div>

                      {/* Bottom Elite Icon */}
                      <div className="flex justify-end rotate-180 relative z-10 transition-transform group-hover:scale-110">
                        <div className={`${isRed ? 'text-[#e11d48]' : 'text-[#1e293b]'}`}>
                          {card.rank === Rank.KING && <Crown size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className="text-amber-500" />}
                          {card.rank === Rank.QUEEN && <Sparkles size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className="text-pink-500" />}
                          {card.rank === Rank.JACK && <Shield size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className="text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NUMBER CARDS */}
                {!isAce && !isFaceCard && (
                  <div className="w-[65%] h-[75%] relative pointer-events-none">
                    {size === 'sm' ? (
                      <div className="w-full h-full flex items-center justify-center font-serif font-black text-3xl opacity-20 tracking-tighter">
                        {rankLabel}
                      </div>
                    ) : (
                      pipContent
                    )}
                  </div>
                )}
              </div>
            </div>
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
