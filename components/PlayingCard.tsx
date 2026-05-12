import React, { useMemo } from 'react';
import { Card, Suit, Rank, CardStyle } from '../types';
import { Heart, Diamond, Club, Spade, Crown, User } from 'lucide-react';
import ClassicFaceCard from './ClassicFaceCard';

const FarmerIcon = ({ size, className, fill }: { size: number, className?: string, fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 1a4 4 0 0 0-4 4v2a9 9 0 0 0 8 0V5a4 4 0 0 0-4-4z" fill={fill} stroke="none" /> {/* Hat Top */}
    <ellipse cx="12" cy="7" rx="10" ry="3" fill={fill} stroke="none" /> {/* Hat Brim */}
    <circle cx="12" cy="11" r="3" fill={fill} stroke="none" /> {/* Head */}
    <path d="M4 23v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2H4z" fill={fill} stroke="none" /> {/* Torso */}
    <rect x="10" y="15" width="4" height="4" fill="white" /> {/* Bib detail? */}
  </svg>
);

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

const getSuitIcon = (suit: Suit, iconSize: number | string, fill: boolean = true, customColor?: string) => {
  const props = {
    size: typeof iconSize === 'number' ? iconSize : undefined,
    className: typeof iconSize === 'string' ? iconSize : undefined,
    fill: fill ? "currentColor" : "none",
    strokeWidth: fill ? 0 : 2
  };

  switch (suit) {
    case Suit.HEARTS: return <Heart {...props} className={`${props.className || ''} ${customColor || 'text-[#e11d48]'}`} />;
    case Suit.DIAMONDS: return <Diamond {...props} className={`${props.className || ''} ${customColor || 'text-[#e11d48]'}`} />;
    case Suit.CLUBS: return <Club {...props} className={`${props.className || ''} ${customColor || 'text-[#1e293b]'}`} />;
    case Suit.SPADES: return <Spade {...props} className={`${props.className || ''} ${customColor || 'text-[#1e293b]'}`} />;
  }
};

const renderPips = (card: Card, size: 'sm' | 'base' | 'md' | 'lg' | 'xl', customColor?: string) => {
  const isFaceCard = card.rank === Rank.JACK || card.rank === Rank.QUEEN || card.rank === Rank.KING;
  const isAce = card.rank === Rank.ACE;
  if (isFaceCard || isAce) return null;

  const rankVal = card.rank;
  const pipSize = size === 'sm' ? 10 : size === 'base' ? 14 : size === 'md' ? 22 : size === 'lg' ? 36 : 60;

  const Pip: React.FC<{ x: number; y: number; inverted?: boolean }> = ({ x, y, inverted = false }) => (
    <div
      className="absolute flex items-center justify-center"
      style={{ left: `${x}%`, top: `${y}%`, width: pipSize, height: pipSize, transform: 'translate(-50%, -50%)' }}
    >
      <div className={inverted ? 'rotate-180' : ''}>
        {getSuitIcon(card.suit, pipSize, true, customColor)}
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
  style?: CardStyle;
}

const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  isFaceDown = false,
  size = 'md',
  className = '',
  onClick,
  highlight = false,
  disabled = false,
  style = CardStyle.MODERN,
}) => {

  const sizeConfig = CARD_SIZES[size];
  const isRed = !!card && (card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS);
  const isFaceCard = !!card && (card.rank === Rank.JACK || card.rank === Rank.QUEEN || card.rank === Rank.KING);
  const isAce = !!card && card.rank === Rank.ACE;
  const rankLabel = card ? getRankString(card.rank) : '';

  // Style configurations
  const isDark = style === CardStyle.DARK;
  const isClassic = style === CardStyle.CLASSIC;
  const isNeon = style === CardStyle.NEON;

  const redColor = isNeon ? 'text-rose-400' : isDark ? 'text-red-500' : isClassic ? 'text-[#c21807]' : 'text-[#e11d48]';
  const blackColor = isNeon ? 'text-cyan-400' : isDark ? 'text-slate-200' : isClassic ? 'text-[#000000]' : 'text-[#1e293b]';
  const textColor = isRed ? redColor : blackColor;

  const glowClass = isNeon ? (isRed ? 'drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]' : 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]') : isDark ? (isRed ? 'drop-shadow-[0_0_4px_rgba(239,68,68,0.4)]' : 'drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]') : '';

  const pipContent = useMemo(() => card ? renderPips(card, size as 'sm' | 'base' | 'md' | 'lg' | 'xl', isRed ? redColor : blackColor) : null, [card, size, style, isRed, redColor, blackColor]);

  return (
    <div
      className={`perspective-1000 ${sizeConfig.width} aspect-[1/1.4] ${sizeConfig.radius} ${className} relative select-none group
        ${highlight ? 'shadow-[0_0_30px_rgba(250,204,21,0.8)] scale-105' : 'shadow-[0_2px_15px_-3px_rgba(0,0,0,0.5)]'}
        ${isClassic ? 'font-serif' : isNeon ? 'font-mono' : 'font-sans'}
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
          ${isDark ? 'bg-slate-950 border-slate-800' : isClassic ? 'bg-[#fffdf5] border-[#dcd0b9]' : isNeon ? 'bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-xl border-white/20' : 'bg-gradient-to-b from-[#fdfdfd] to-[#f3f4f6] border-white/80'}
          ${sizeConfig.radius}
          border
          ${!isNeon ? 'ring-1 ring-black/5 shadow-[0_16px_40px_-14px_rgba(0,0,0,0.65)]' : 'shadow-[0_8px_32px_rgba(0,0,0,0.3)]'}
          overflow-hidden
        `}>
          {/* Texture Overlay */}
          {!isClassic && !isNeon && (
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}></div>
          )}

          {/* Safe Area / Border Helper */}
          <div className={`absolute inset-0 rounded-[inherit] border ${isDark ? 'border-white/5' : 'border-slate-200/50'} pointer-events-none`}></div>

          {/* --- FRONT UI --- */}
          {card && (
            <div className="absolute inset-0 pointer-events-none">

              {/* Corner Indices */}
              <div className={`absolute top-1 left-1 flex flex-col items-center leading-none ${textColor} ${glowClass}`}>
                <span className={`${sizeConfig.text} ${isClassic ? 'font-serif' : 'font-black'} tracking-tighter leading-none`}>{rankLabel}</span>
                <div className="mt-0.5">{getSuitIcon(card.suit, sizeConfig.cornerIcon, true, textColor)}</div>
              </div>

              <div className={`absolute bottom-1 right-1 flex flex-col items-center leading-none transform rotate-180 ${textColor} ${glowClass}`}>
                <span className={`${sizeConfig.text} ${isClassic ? 'font-serif' : 'font-black'} tracking-tighter leading-none`}>{rankLabel}</span>
                <div className="mt-0.5">{getSuitIcon(card.suit, sizeConfig.cornerIcon, true, textColor)}</div>
              </div>

              {/* --- Central Face Content --- */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">

                {/* ACE - Targeted centering with strict aspect-square */}
                {isAce && (
                  <div className={`w-[45%] aspect-square flex items-center justify-center ${!isClassic ? 'drop-shadow-md' : ''} ${glowClass} transition-transform`}>
                    <div className="w-full h-full flex items-center justify-center">
                      {getSuitIcon(card.suit, size === 'sm' ? 24 : size === 'base' ? 36 : size === 'md' ? 60 : 88, true, textColor)}
                    </div>
                  </div>
                )}

                {/* FACE CARDS */}
                {isFaceCard && (
                  <div className="w-[65%] h-[75%] relative flex items-center justify-center overflow-visible">
                    <div className={`w-full h-full border-2 ${isRed ? 'border-red-500/30' : 'border-slate-500/30'} rounded-lg flex flex-col justify-between relative overflow-hidden ${isDark ? 'bg-slate-800/40' : isClassic ? 'bg-slate-50/50' : isNeon ? 'bg-white/5' : 'bg-gradient-to-br from-white via-white/80 to-slate-50'} shadow-inner`}>
                      {/* Damask Royal Pattern */}
                      {!isClassic && !isNeon && (
                        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20L0 0h40L20 20zM0 40l20-20 20 20H0z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>
                      )}

                      {isClassic ? (
                        /* AUTHENTIC CLASSIC ILLUSTRATION */
                        <div className="absolute inset-0 flex items-center justify-center -z-0">
                          <ClassicFaceCard 
                            suit={card.suit} 
                            rank={card.rank} 
                            size={size === 'sm' ? 40 : size === 'base' ? 60 : size === 'md' ? 80 : 120} 
                          />
                        </div>
                      ) : (
                        <>
                          {/* Top Elite Icon */}
                          <div className="flex justify-start relative z-10 transition-transform">
                            <div className={textColor}>
                              {card.rank === Rank.KING && <Crown size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className="text-amber-500" />}
                              {card.rank === Rank.QUEEN && <Crown size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className="text-pink-500" />}
                              {card.rank === Rank.JACK && <FarmerIcon size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className="text-emerald-600" />}
                            </div>
                          </div>

                          {/* Background Letter */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform">
                            <span className={`font-serif font-black ${size === 'sm' ? 'text-4xl' : size === 'base' ? 'text-5xl' : 'text-8xl'} ${isDark || isNeon ? 'opacity-20' : 'opacity-10'} ${isRed ? 'text-red-900' : 'text-slate-900'} leading-none`}>
                              {rankLabel}
                            </span>
                          </div>

                          {/* Bottom Elite Icon */}
                          <div className="flex justify-end rotate-180 relative z-10 transition-transform">
                            <div className={textColor}>
                              {card.rank === Rank.KING && <Crown size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className="text-amber-500" />}
                              {card.rank === Rank.QUEEN && <Crown size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className="text-pink-500" />}
                              {card.rank === Rank.JACK && <FarmerIcon size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className="text-emerald-600" />}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* NUMBER CARDS */}
                {!isAce && !isFaceCard && (
                  <div className="w-[65%] h-[75%] relative pointer-events-none">
                    {size === 'sm' ? (
                      <div className={`w-full h-full flex items-center justify-center font-serif font-black text-3xl ${isDark || isNeon ? 'opacity-40' : 'opacity-20'} tracking-tighter ${textColor}`}>
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
          ${isDark ? 'bg-slate-950' : isClassic ? 'bg-red-700' : isNeon ? 'bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-xl' : 'bg-[#1e40af]'}
          ${sizeConfig.radius}
          ${(isNeon || isDark) ? 'border border-white/20' : (isClassic ? 'border-[4px]' : 'border-[6px]') + ' border-white'}
          ring-1 ring-black/10
          shadow-[0_16px_40px_-14px_rgba(0,0,0,0.65)]
          overflow-hidden
        `}>
          {/* Safe Area / Border Helper - match front */}
          <div className={`absolute inset-0 rounded-[inherit] border ${isDark ? 'border-white/5' : 'border-slate-200/50'} pointer-events-none z-10`}></div>

          {/* specialized Neon back visuals */}
          {isNeon && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.05),_transparent_70%)]" />
              <div className="absolute inset-0 backdrop-blur-3xl opacity-50" />
            </>
          )}

          {/* Realistic Back Pattern (CSS Pattern) - For other styles */}
          {!isNeon && !isDark && (
            <div className="w-full h-full opacity-60" style={{
              backgroundImage: isClassic 
                ? `linear-gradient(45deg, #ffffff 25%, transparent 25%), linear-gradient(-45deg, #ffffff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ffffff 75%), linear-gradient(-45deg, transparent 75%, #ffffff 75%)`
                : `radial-gradient(#fff 15%, transparent 16%), radial-gradient(#fff 15%, transparent 16%)`,
              backgroundSize: isClassic ? '10px 10px' : '8px 8px',
              backgroundPosition: isClassic ? '0 0, 0 5px, 5px 5px, 5px 0' : '0 0, 4px 4px'
            }}></div>
          )}

          {/* Center Logo/Graphic - Unified for all styles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-1/2 h-1/3 border-2 ${isNeon ? 'border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'border-white/30'} rounded-full flex items-center justify-center ${isNeon ? 'bg-white/5 backdrop-blur-md' : 'backdrop-blur-[1px]'}`}>
              <div className={`text-white font-sans font-black italic tracking-widest transform -rotate-12 text-sm ${isNeon ? 'drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]' : 'drop-shadow-md'}`}>
                BUSSEN
              </div>
            </div>
          </div>

          {/* Corner Decals for Neon */}
          {isNeon && (
            <>
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-rose-500/40 rounded-tl-sm" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/40 rounded-tr-sm" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/40 rounded-bl-sm" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-rose-500/40 rounded-br-sm" />
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default React.memo(PlayingCard);
