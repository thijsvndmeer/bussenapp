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
    9: [{ x: 32, y: 18 }, { x: 68, y: 18 }, { x: 32, y: 39 }, { x: 68, y: 39 }, { x: 50, y: 50 }, { x: 32, y: 61, inv: true }, { x: 68, y: 61, inv: true }, { x: 32, y: 82, inv: true }, { x: 68, y: 82, inv: true }],
    10: [{ x: 32, y: 18 }, { x: 68, y: 18 }, { x: 32, y: 39 }, { x: 68, y: 39 }, { x: 50, y: 28.5 }, { x: 50, y: 71.5, inv: true }, { x: 32, y: 61, inv: true }, { x: 68, y: 61, inv: true }, { x: 32, y: 82, inv: true }, { x: 68, y: 82, inv: true }],
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
  const isGalaxy = style === CardStyle.GALAXY;

  const redColor = isGalaxy ? 'text-[#f43f5e]' : isNeon ? 'text-rose-400' : isDark ? 'text-red-500' : isClassic ? 'text-[#c21807]' : 'text-[#e11d48]';
  const blackColor = isGalaxy ? 'text-[#f1f5f9]' : isNeon ? 'text-cyan-400' : isDark ? 'text-slate-200' : isClassic ? 'text-[#000000]' : 'text-[#1e293b]';
  const textColor = isRed ? redColor : blackColor;

  const glowClass = isGalaxy
    ? (isRed ? 'drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]')
    : isNeon ? (isRed ? 'drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]' : 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]') : isDark ? (isRed ? 'drop-shadow-[0_0_4px_rgba(239,68,68,0.4)]' : 'drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]') : '';

  const pipContent = useMemo(() => card ? renderPips(card, size as 'sm' | 'base' | 'md' | 'lg' | 'xl', isRed ? redColor : blackColor) : null, [card, size, style, isRed, redColor, blackColor]);

  return (
    <div
      className={`perspective-1000 ${sizeConfig.width} aspect-[1/1.4] ${sizeConfig.radius} ${className} relative select-none group
        ${highlight ? 'shadow-[0_0_30px_rgba(250,204,21,0.8)] scale-105' : isGalaxy ? 'shadow-[0_0_25px_rgba(0,0,0,0.85)]' : 'shadow-[0_2px_15px_-3px_rgba(0,0,0,0.5)]'}
        ${isClassic ? 'font-serif' : isNeon ? 'font-mono' : 'font-sans'}
      `}
      onClick={!disabled ? onClick : undefined}
    >
      <div className={`
        w-full h-full relative preserve-3d transition-transform duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)
        ${isFaceDown ? 'rotate-y-180' : ''}
      `}>

        {/* --- FRONT --- */}
        <div className={`
          absolute inset-0 backface-hidden
          ${isGalaxy ? 'bg-[#010005] border-purple-500/25 shadow-[0_12px_36px_rgba(0,0,0,0.95)] ring-1 ring-white/5' : isDark ? 'bg-[#020617] border-slate-800' : isClassic ? 'bg-[#fffdf5] border-[#dcd0b9]' : isNeon ? 'bg-gradient-to-br from-[#0f172a]/40 to-[#1e293b]/40 backdrop-blur-xl border-white/20' : 'bg-gradient-to-br from-white to-slate-100 border-white/80'}
          ${sizeConfig.radius}
          border
          ${!isNeon && !isGalaxy ? 'ring-1 ring-black/5 shadow-[0_16px_40px_-14px_rgba(0,0,0,0.65)]' : isNeon ? 'shadow-[0_8px_32px_rgba(0,0,0,0.3)]' : ''}
          overflow-hidden
        `}>
          {/* Galaxy Nebula + Stardust Overlay */}
          {isGalaxy && (
            <>
              <div 
                className="absolute inset-0 pointer-events-none opacity-40" 
                style={{ 
                  background: 'radial-gradient(ellipse at 50% 15%, rgba(88, 28, 135, 0.25) 0%, transparent 65%), radial-gradient(ellipse at 50% 85%, rgba(24, 18, 55, 0.3) 0%, transparent 65%)' 
                }} 
              />
              <div className="absolute inset-0 pointer-events-none animate-cosmic-shimmer opacity-10" style={{ willChange: 'background-position', transform: 'translateZ(0)' }} />
            </>
          )}

          {/* Texture Overlay - Only for Dark now, modern is clean */}
          {isDark && (
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}></div>
          )}

          {/* Safe Area / Border Helper */}
          <div className={`absolute inset-0 rounded-[inherit] border ${isGalaxy ? 'border-white/5' : isDark ? 'border-white/5' : isNeon ? 'border-white/10' : 'border-slate-200/50'} pointer-events-none`}></div>

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
                  <div className={`w-[45%] aspect-square flex items-center justify-center relative ${!isClassic ? 'drop-shadow-md' : ''} ${glowClass} transition-transform`}>
                    {isGalaxy && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 via-transparent to-amber-500/15 blur-md pointer-events-none" />
                    )}
                    <div className="w-full h-full flex items-center justify-center relative z-10">
                      {getSuitIcon(card.suit, size === 'sm' ? 24 : size === 'base' ? 36 : size === 'md' ? 60 : 88, true, textColor)}
                    </div>
                  </div>
                )}

                {/* FACE CARDS */}
                {isFaceCard && (
                  <div className="w-[65%] h-[75%] relative flex items-center justify-center overflow-visible">
                    <div className={`w-full h-full rounded-lg flex flex-col justify-between relative overflow-hidden shadow-inner ${
                      isGalaxy 
                        ? 'border border-purple-400/25 bg-gradient-to-b from-[#0a0319]/95 via-[#020008]/98 to-[#070114]/95 shadow-[inset_0_0_20px_rgba(0,0,0,0.9),0_0_15px_rgba(168,85,247,0.1)]' 
                        : isDark 
                        ? 'border-2 border-slate-500/30 bg-[#1e293b]/40' 
                        : isClassic 
                        ? `border-2 ${isRed ? 'border-red-500/30' : 'border-slate-500/30'} bg-slate-50/50` 
                        : isNeon 
                        ? `border-2 ${isRed ? 'border-red-500/30' : 'border-slate-500/30'} bg-white/5` 
                        : `border-2 ${isRed ? 'border-red-500/30' : 'border-slate-500/30'} bg-gradient-to-br from-white via-white/80 to-slate-50`
                    }`}>
                      {/* Damask Royal Pattern */}
                      {!isClassic && !isNeon && !isGalaxy && (
                        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20L0 0h40L20 20zM0 40l20-20 20 20H0z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>
                      )}

                      {/* Galaxy delicate celestial inner hairline */}
                      {isGalaxy && (
                        <div className="absolute inset-1 rounded border border-white/5 pointer-events-none" />
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
                          <div className="flex justify-start relative z-10 transition-transform p-1">
                            <div>
                              {card.rank === Rank.KING && <Crown size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className={isGalaxy ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "text-amber-500"} />}
                              {card.rank === Rank.QUEEN && <Crown size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className={isGalaxy ? "text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]" : "text-pink-500"} />}
                              {card.rank === Rank.JACK && <FarmerIcon size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className={isGalaxy ? "text-purple-200 drop-shadow-[0_0_8px_rgba(216,180,254,0.6)]" : "text-emerald-600"} />}
                            </div>
                          </div>

                          {/* Background Letter */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform">
                            <span className={`font-serif font-black ${size === 'sm' ? 'text-4xl' : size === 'base' ? 'text-5xl' : 'text-8xl'} ${isGalaxy ? 'opacity-20 text-transparent bg-clip-text bg-gradient-to-b from-purple-100 via-white to-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]' : isDark || isNeon ? 'opacity-20' : 'opacity-10'} ${isGalaxy ? '' : isRed ? 'text-red-900' : 'text-slate-900'} leading-none`}>
                              {rankLabel}
                            </span>
                          </div>

                          {/* Bottom Elite Icon */}
                          <div className="flex justify-end rotate-180 relative z-10 transition-transform p-1">
                            <div>
                              {card.rank === Rank.KING && <Crown size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className={isGalaxy ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "text-amber-500"} />}
                              {card.rank === Rank.QUEEN && <Crown size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className={isGalaxy ? "text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]" : "text-pink-500"} />}
                              {card.rank === Rank.JACK && <FarmerIcon size={size === 'sm' ? 14 : size === 'base' ? 20 : 32} fill="currentColor" className={isGalaxy ? "text-purple-200 drop-shadow-[0_0_8px_rgba(216,180,254,0.6)]" : "text-emerald-600"} />}
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
                      <div className={`w-full h-full flex items-center justify-center ${glowClass}`}>
                        {getSuitIcon(card.suit, 20, true, textColor)}
                      </div>
                    ) : (
                      <div className="w-full h-full relative">
                        {pipContent}
                      </div>
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
          ${isGalaxy ? 'bg-[#000000] border-purple-500/25 shadow-[0_12px_40px_rgba(0,0,0,0.95)] ring-1 ring-white/5' : isDark ? 'bg-slate-900 border-slate-700' : isClassic ? 'bg-red-900 border-[#dcd0b9]' : isNeon ? 'bg-[#050508] border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.25)]' : 'bg-red-700 border-white'}
          ${sizeConfig.radius}
          border-2
          overflow-hidden
        `}>
          {/* Galaxy animated back visuals */}
          {isGalaxy && (
            <>
              {/* Deep obsidian base */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 50% 50%, #090317 0%, #020008 65%, #000000 100%)'
                }}
              />
              {/* Ultra-subtle deep violet cosmic vortex */}
              <div 
                className="absolute inset-[-20%] rounded-full opacity-20 animate-galaxy-spin pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, rgba(168,85,247,0.3) 90deg, transparent 180deg, rgba(216,180,254,0.2) 270deg, transparent 360deg)',
                  filter: 'blur(12px)',
                  willChange: 'transform',
                }}
              />
              {/* Concentric astronomical orbit rings (Luxury watch astrolabe aesthetic) */}
              <div className="absolute inset-2 rounded-[inherit] border border-purple-400/15 pointer-events-none" />
              <div className="absolute inset-4 rounded-[inherit] border border-white/5 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-purple-400/10 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-amber-300/15 pointer-events-none" />
              {/* Subtle starlight shimmer */}
              <div className="absolute inset-0 animate-cosmic-shimmer opacity-10 pointer-events-none" style={{ willChange: 'background-position', transform: 'translateZ(0)' }} />
            </>
          )}

          {/* specialized Neon back visuals */}
          {isNeon && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.05),_transparent_70%)]" />
              <div className="absolute inset-0 backdrop-blur-3xl opacity-50" />
            </>
          )}

          {/* Realistic Back Pattern (CSS Pattern) - For other styles */}
          {!isNeon && !isDark && !isGalaxy && (
            <div className={`w-full h-full ${isClassic ? 'opacity-60' : 'opacity-100'}`} style={{
              backgroundImage: isClassic 
                ? `linear-gradient(45deg, #ffffff 25%, transparent 25%), linear-gradient(-45deg, #ffffff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ffffff 75%), linear-gradient(-45deg, transparent 75%, #ffffff 75%)`
                : `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: isClassic ? '10px 10px' : '16px 16px',
              backgroundPosition: isClassic ? '0 0, 0 5px, 5px 5px, 5px 0' : 'center center'
            }}></div>
          )}

          {/* Center Logo/Graphic */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-1/2 h-1/3 border ${
              isGalaxy ? 'border-amber-300/30 bg-black/85 shadow-[0_0_25px_rgba(0,0,0,0.9),inset_0_0_12px_rgba(168,85,247,0.25)] backdrop-blur-md' :
              isNeon ? 'border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.2)] bg-white/5 backdrop-blur-md border-2' : 
              'border-white/30 backdrop-blur-[1px] border-2'
            } rounded-full flex items-center justify-center relative`}>
              {isGalaxy && (
                <div className="absolute -inset-1 rounded-full border border-purple-400/20 opacity-50 pointer-events-none" />
              )}
              <div className={`font-sans font-black tracking-[0.25em] text-xs ${
                isGalaxy ? 'bg-gradient-to-r from-amber-200 via-purple-100 to-slate-200 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]' :
                isNeon ? 'text-white italic -rotate-12 drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]' : 
                'text-white italic -rotate-12 drop-shadow-md'
              }`}>
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
