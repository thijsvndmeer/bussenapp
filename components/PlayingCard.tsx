import React, { useMemo } from 'react';
import { Card, Suit, Rank, CardStyle } from '../types';
import { Heart, Diamond, Club, Spade, Crown, User } from 'lucide-react';
import ClassicFaceCard from './ClassicFaceCard';

const FarmerIcon = ({ size, className, fill }: { size: number, className?: string, fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${className || ''} w-[25cqw] h-[25cqw]`}>
    <path d="M12 1a4 4 0 0 0-4 4v2a9 9 0 0 0 8 0V5a4 4 0 0 0-4-4z" fill={fill} stroke="none" /> {/* Hat Top */}
    <ellipse cx="12" cy="7" rx="10" ry="3" fill={fill} stroke="none" /> {/* Hat Brim */}
    <circle cx="12" cy="11" r="3" fill={fill} stroke="none" /> {/* Head */}
    <path d="M4 23v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2H4z" fill={fill} stroke="none" /> {/* Torso */}
    <rect x="10" y="15" width="4" height="4" fill="white" /> {/* Bib detail? */}
  </svg>
);

const CARD_SIZES = {
  sm: {
    width: 'w-14',
    text: 'text-[10.5px] text-[18.75cqw]',
    cornerIcon: 6,
    radius: 'rounded-[4px]',
    bussenText: 'text-[6.5px] text-[11.5cqw]',
    giantLetter: 'text-[42px] text-[75cqw]',
    royalIcon: 14,
    centerIcon: 26,
    classicSize: 35,
    pipSize: 10,
  },
  base: {
    width: 'w-20',
    text: 'text-[15px] text-[18.75cqw]',
    cornerIcon: 9,
    radius: 'rounded-[6px]',
    bussenText: 'text-[9.2px] text-[11.5cqw]',
    giantLetter: 'text-[60px] text-[75cqw]',
    royalIcon: 20,
    centerIcon: 38,
    classicSize: 50,
    pipSize: 14,
  },
  md: {
    width: 'w-32',
    text: 'text-2xl text-[18.75cqw]',
    cornerIcon: 14,
    radius: 'rounded-[10px]',
    bussenText: 'text-[15px] text-[11.5cqw]',
    giantLetter: 'text-8xl text-[75cqw]',
    royalIcon: 32,
    centerIcon: 60,
    classicSize: 80,
    pipSize: 22,
  },
  lg: {
    width: 'w-48',
    text: 'text-4xl text-[18.75cqw]',
    cornerIcon: 21,
    radius: 'rounded-[15px]',
    bussenText: 'text-[22px] text-[11.5cqw]',
    giantLetter: 'text-[144px] text-[75cqw]',
    royalIcon: 48,
    centerIcon: 90,
    classicSize: 120,
    pipSize: 33,
  },
  xl: {
    width: 'w-72',
    text: 'text-[54px] text-[18.75cqw]',
    cornerIcon: 32,
    radius: 'rounded-[22px]',
    bussenText: 'text-[33px] text-[11.5cqw]',
    giantLetter: 'text-[216px] text-[75cqw]',
    royalIcon: 72,
    centerIcon: 135,
    classicSize: 180,
    pipSize: 50,
  },
} as const;

type GalaxyNebulaLayer = React.CSSProperties & { key: string };

const createGalaxyNebulaLayers = (): GalaxyNebulaLayer[] => {
  const random = (min: number, max: number) => Math.random() * (max - min) + min;

  return Array.from({ length: Math.floor(random(3, 6)) }, (_, index) => {
    const hue = Math.round(random(185, 335));
    const saturation = Math.round(random(45, 72));
    const lightness = Math.round(random(34, 57));

    return {
      key: `galaxy-nebula-${index}-${Math.random().toString(36).slice(2, 8)}`,
      width: `${random(80, 165)}%`,
      height: `${random(110, 235)}%`,
      left: `${random(-75, 45)}%`,
      top: `${random(-80, 55)}%`,
      opacity: random(0.45, 0.8),
      background: `radial-gradient(ellipse, hsla(${hue}, ${saturation}%, ${lightness}%, ${random(0.28, 0.5)}) 0%, hsla(${hue}, ${saturation}%, ${lightness - 12}%, ${random(0.12, 0.28)}) 43%, transparent 74%)`,
      '--nebula-duration': `${random(16, 34).toFixed(1)}s`,
      '--nebula-x-start': `${random(-18, 18).toFixed(0)}%`,
      '--nebula-y-start': `${random(-18, 18).toFixed(0)}%`,
      '--nebula-x-end': `${random(-45, 45).toFixed(0)}%`,
      '--nebula-y-end': `${random(-45, 45).toFixed(0)}%`,
      '--nebula-rotate-start': `${random(-55, 55).toFixed(0)}deg`,
      '--nebula-rotate-end': `${random(-55, 55).toFixed(0)}deg`,
      '--nebula-scale-start': random(0.72, 1.12).toFixed(2),
      '--nebula-scale-end': random(0.82, 1.36).toFixed(2),
    } as GalaxyNebulaLayer;
  });
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

const getSuitIcon = (suit: Suit, iconSize: number | string, fill: boolean = true, customColor?: string, extraClass?: string) => {
  const props = {
    size: typeof iconSize === 'number' ? iconSize : undefined,
    className: `${typeof iconSize === 'string' ? iconSize : ''} ${extraClass || ''}`.trim(),
    fill: fill ? "currentColor" : "none",
    strokeWidth: fill ? 0 : 2
  };

  switch (suit) {
    case Suit.HEARTS: return <Heart {...props} className={`${props.className} ${customColor || 'text-[#e11d48]'}`} />;
    case Suit.DIAMONDS: return <Diamond {...props} className={`${props.className} ${customColor || 'text-[#e11d48]'}`} />;
    case Suit.CLUBS: return <Club {...props} className={`${props.className} ${customColor || 'text-[#1e293b]'}`} />;
    case Suit.SPADES: return <Spade {...props} className={`${props.className} ${customColor || 'text-[#1e293b]'}`} />;
  }
};

const renderPips = (card: Card, size: 'sm' | 'base' | 'md' | 'lg' | 'xl', customColor?: string) => {
  const isFaceCard = card.rank === Rank.JACK || card.rank === Rank.QUEEN || card.rank === Rank.KING;
  const isAce = card.rank === Rank.ACE;
  if (isFaceCard || isAce) return null;

  const rankVal = card.rank;
  const pipSize = CARD_SIZES[size].pipSize;

  const Pip: React.FC<{ x: number; y: number; inverted?: boolean }> = ({ x, y, inverted = false }) => (
    <div
      className="absolute flex items-center justify-center w-[17.1875cqw] h-[17.1875cqw]"
      style={{ left: `${x}%`, top: `${y}%`, width: pipSize, height: pipSize, transform: 'translate(-50%, -50%)' }}
    >
      <div className={inverted ? 'rotate-180' : ''}>
        {getSuitIcon(card.suit, pipSize, true, customColor, 'w-[17.1875cqw] h-[17.1875cqw]')}
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
  const galaxyNebulaLayers = useMemo(() => createGalaxyNebulaLayers(), []);

  return (
    <div
      className={`@container perspective-1000 ${sizeConfig.width} aspect-[1/1.4] ${sizeConfig.radius} ${className} relative select-none group
        ${highlight ? 'shadow-[0_0_30px_rgba(250,204,21,0.8)] scale-105' : 'shadow-[0_2px_15px_-3px_rgba(0,0,0,0.5)]'}
        ${isClassic ? 'font-serif' : isNeon ? 'font-mono' : 'font-sans'}
      `}
      style={{ containerType: 'inline-size' }}
      onClick={!disabled ? onClick : undefined}
    >
      <div className={`
        w-full h-full relative preserve-3d transition-transform duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)
        ${isFaceDown ? 'rotate-y-180' : ''}
      `}>

        {/* --- FRONT --- */}
        <div className={`
          absolute inset-0 backface-hidden
          ${isGalaxy ? 'bg-[#010005] border-white/20 border-t-[rgba(255,255,255,0.4)] ring-1 ring-white/10' : isDark ? 'bg-[#020617] border-slate-800' : isClassic ? 'bg-[#fffdf5] border-[#dcd0b9]' : isNeon ? 'bg-gradient-to-br from-[#0f172a]/40 to-[#1e293b]/40 backdrop-blur-xl border-white/20' : 'bg-gradient-to-br from-white to-slate-100 border-white/80'}
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
                  background: 'radial-gradient(ellipse at 50% 15%, rgba(226, 232, 240, 0.08) 0%, transparent 65%), radial-gradient(ellipse at 50% 85%, rgba(14, 18, 30, 0.4) 0%, transparent 65%)' 
                }} 
              />
              <div className="absolute inset-[-60%] w-[220%] h-[220%] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-card-starlight-sweep pointer-events-none" />
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
              <div className={`absolute top-[3.125cqw] left-[3.125cqw] top-1 left-1 flex flex-col items-center leading-none ${textColor} ${glowClass}`}>
                <span className={`${sizeConfig.text} ${isClassic ? 'font-serif' : isGalaxy ? 'font-sans font-bold' : 'font-black'} tracking-tighter leading-none`}>{rankLabel}</span>
                <div className="mt-[1.5625cqw] mt-0.5">{getSuitIcon(card.suit, sizeConfig.cornerIcon, true, textColor, 'w-[10.9375cqw] h-[10.9375cqw]')}</div>
              </div>

              <div className={`absolute bottom-[3.125cqw] right-[3.125cqw] bottom-1 right-1 flex flex-col items-center leading-none transform rotate-180 ${textColor} ${glowClass}`}>
                <span className={`${sizeConfig.text} ${isClassic ? 'font-serif' : isGalaxy ? 'font-sans font-bold' : 'font-black'} tracking-tighter leading-none`}>{rankLabel}</span>
                <div className="mt-[1.5625cqw] mt-0.5">{getSuitIcon(card.suit, sizeConfig.cornerIcon, true, textColor, 'w-[10.9375cqw] h-[10.9375cqw]')}</div>
              </div>

              {/* --- Central Face Content --- */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">

                {/* ACE - Refined minimal celestial orbit */}
                {isAce && (
                  <div className={`w-[45%] aspect-square flex items-center justify-center relative ${!isClassic ? 'drop-shadow-md' : ''} ${glowClass} transition-transform`}>
                    {isGalaxy && (
                      <div className="absolute -inset-2 rounded-full border border-white/15 animate-card-celestial-cw pointer-events-none" />
                    )}
                    <div className="w-full h-full flex items-center justify-center relative z-10">
                      {getSuitIcon(card.suit, sizeConfig.centerIcon, true, textColor, 'w-[46.875cqw] h-[46.875cqw]')}
                    </div>
                  </div>
                )}

                {/* FACE CARDS - Pure royal insignia without extra text or busy rings */}
                {isFaceCard && (
                  <div className="w-[70%] h-[78%] relative flex items-center justify-center overflow-visible">
                    {isGalaxy ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="absolute w-[68%] aspect-square rounded-full border border-white/15 animate-card-celestial-cw pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-center">
                          {card.rank === Rank.KING && (
                            <Crown 
                              size={sizeConfig.royalIcon} 
                              fill="currentColor" 
                              className="w-[25cqw] h-[25cqw] text-amber-200/95 drop-shadow-[0_0_12px_rgba(254,240,138,0.6)]" 
                            />
                          )}
                          {card.rank === Rank.QUEEN && (
                            <Crown 
                              size={sizeConfig.royalIcon} 
                              fill="currentColor" 
                              className="w-[25cqw] h-[25cqw] text-slate-100 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]" 
                            />
                          )}
                          {card.rank === Rank.JACK && (
                            <FarmerIcon 
                              size={sizeConfig.royalIcon} 
                              fill="currentColor" 
                              className="w-[25cqw] h-[25cqw] text-slate-200 drop-shadow-[0_0_10px_rgba(226,232,240,0.5)]" 
                            />
                          )}
                        </div>
                      </div>
                    ) : isClassic ? (
                      /* AUTHENTIC CLASSIC ILLUSTRATION */
                      <div className="absolute inset-0 flex items-center justify-center -z-0">
                        <ClassicFaceCard 
                          suit={card.suit} 
                          rank={card.rank} 
                          size={sizeConfig.classicSize} 
                        />
                      </div>
                    ) : (
                      <div className={`w-full h-full rounded-lg flex flex-col justify-between relative overflow-hidden shadow-inner ${
                        isDark 
                          ? 'border-2 border-slate-500/30 bg-[#1e293b]/40' 
                          : isNeon 
                          ? `border-2 ${isRed ? 'border-red-500/30' : 'border-slate-500/30'} bg-white/5` 
                          : `border-2 ${isRed ? 'border-red-500/30' : 'border-slate-500/30'} bg-gradient-to-br from-white via-white/80 to-slate-50`
                      }`}>
                        {/* Damask Royal Pattern */}
                        {!isClassic && !isNeon && (
                          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20L0 0h40L20 20zM0 40l20-20 20 20H0z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>
                        )}
                        {/* Top Elite Icon */}
                        <div className="flex justify-start relative z-10 transition-transform p-1">
                          <div>
                            {card.rank === Rank.KING && <Crown size={sizeConfig.royalIcon} fill="currentColor" className="w-[25cqw] h-[25cqw] text-amber-500" />}
                            {card.rank === Rank.QUEEN && <Crown size={sizeConfig.royalIcon} fill="currentColor" className="w-[25cqw] h-[25cqw] text-pink-500" />}
                            {card.rank === Rank.JACK && <FarmerIcon size={sizeConfig.royalIcon} fill="currentColor" className="text-emerald-600" />}
                          </div>
                        </div>

                        {/* Background Letter */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform">
                          <span className={`font-serif font-black ${sizeConfig.giantLetter} ${isDark || isNeon ? 'opacity-20' : 'opacity-10'} ${isRed ? 'text-red-900' : 'text-slate-900'} leading-none`}>
                            {rankLabel}
                          </span>
                        </div>

                        {/* Bottom Elite Icon */}
                        <div className="flex justify-end rotate-180 relative z-10 transition-transform p-1">
                          <div>
                            {card.rank === Rank.KING && <Crown size={sizeConfig.royalIcon} fill="currentColor" className="w-[25cqw] h-[25cqw] text-amber-500" />}
                            {card.rank === Rank.QUEEN && <Crown size={sizeConfig.royalIcon} fill="currentColor" className="w-[25cqw] h-[25cqw] text-pink-500" />}
                            {card.rank === Rank.JACK && <FarmerIcon size={sizeConfig.royalIcon} fill="currentColor" className="text-emerald-600" />}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* NUMBER CARDS - Clean pips without background clutter */}
                {!isAce && !isFaceCard && (
                  <div className="w-[65%] h-[75%] relative pointer-events-none flex items-center justify-center">
                    <div className="w-full h-full relative">
                      {pipContent}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

        {/* --- BACK --- */}
        <div className={`
          absolute inset-0 backface-hidden rotate-y-180
          ${isGalaxy || isDark ? 'bg-[#020617] border-slate-800' : isClassic ? 'bg-gradient-to-br from-[#7a0c16] via-[#5c0810] to-[#360206] border-[#dcd0b9] shadow-[inset_0_0_24px_rgba(0,0,0,0.6)]' : isNeon ? 'bg-[#050508] border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.25)]' : 'bg-gradient-to-br from-[#b91c1c] via-[#991b1b] to-[#450a0a] border-white/95 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]'}
          ${sizeConfig.radius}
          border-2
          overflow-hidden
        `}>
          {/* Galaxy-specific artwork inside the normal Dark card-back shell. */}
          {isGalaxy && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {galaxyNebulaLayers.map(({ key, ...layerStyle }) => (
                <div key={key} className="galaxy-nebula-gas animate-galaxy-nebula-drift" style={layerStyle} />
              ))}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,1,6,0.42)_66%,rgba(0,0,5,0.8)_100%)]" />
            </div>
          )}

          {/* specialized Neon back visuals */}
          {isNeon && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.05),_transparent_70%)]" />
              <div className="absolute inset-0 backdrop-blur-3xl opacity-50" />
            </>
          )}

          {/* Radial Lighting Accent for Modern & Dark */}
          {(isDark || (!isNeon && !isGalaxy && !isClassic)) && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: isDark
                  ? 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0.3) 100%)'
              }}
            />
          )}

          {/* Inset Border Frame (Double-Bezel) for Modern, Dark, and Classic */}
          {!isNeon && !isGalaxy && (
            <div className={`absolute inset-[5%] rounded-[inherit] border ${
              isDark ? 'border-slate-700/50' : isClassic ? 'border-[#dcd0b9]/60 shadow-[inset_0_0_10px_rgba(0,0,0,0.4)]' : 'border-white/35 shadow-inner'
            } pointer-events-none z-0`}>
              {isClassic && (
                <div className="w-full h-full rounded-[inherit] border border-[#dcd0b9]/30 p-1 flex flex-col justify-between">
                  <div className="flex justify-between text-[6px] text-[#dcd0b9]/70 leading-none select-none">
                    <span>✦</span>
                    <span>✦</span>
                  </div>
                  <div className="flex justify-between text-[6px] text-[#dcd0b9]/70 leading-none select-none">
                    <span>✦</span>
                    <span>✦</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Realistic Back Pattern (CSS Pattern) - Only for Classic style */}
          {isClassic && (
            <div className="w-full h-full opacity-70 pointer-events-none" style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, rgba(220, 208, 185, 0.12) 0px, rgba(220, 208, 185, 0.12) 1px, transparent 1px, transparent 6px),
                repeating-linear-gradient(-45deg, rgba(220, 208, 185, 0.12) 0px, rgba(220, 208, 185, 0.12) 1px, transparent 1px, transparent 6px),
                radial-gradient(circle at center, rgba(220, 208, 185, 0.15) 0%, transparent 70%)
              `,
              backgroundSize: '6px 6px, 6px 6px, 100% 100%',
            }} />
          )}

          {/* Center Logo/Graphic */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className={`w-1/2 h-1/3 rounded-full flex items-center justify-center relative p-0.5 ${
              isGalaxy
                ? 'border-2 border-white/30 backdrop-blur-[1px]'
                : isNeon
                ? 'border-2 border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.25)] bg-white/5 backdrop-blur-md'
                : isDark
                ? 'border-2 border-slate-700/70 bg-slate-950/80 backdrop-blur-sm shadow-md ring-1 ring-white/5'
                : isClassic
                ? 'border-2 border-[#dcd0b9]/80 bg-gradient-to-b from-[#6b0811]/95 to-[#380106]/95 shadow-[0_4px_12px_rgba(0,0,0,0.6)] ring-1 ring-[#dcd0b9]/30'
                : 'border-2 border-white/70 bg-gradient-to-b from-red-600/35 to-red-950/65 backdrop-blur-sm shadow-lg ring-1 ring-white/20'
            }`}>
              <div className={`w-full h-full rounded-full flex items-center justify-center border ${
                isGalaxy ? 'border-white/20' : isNeon ? 'border-cyan-400/30' : isDark ? 'border-slate-800' : isClassic ? 'border-[#dcd0b9]/40' : 'border-white/25'
              }`}>
                <div className={`${isClassic ? 'font-serif font-black tracking-[0.2em] text-[#fffdf5]' : 'font-sans font-black tracking-[0.25em] text-white'} ${sizeConfig.bussenText} ${
                  isNeon ? 'italic -rotate-12 drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]' :
                  isClassic ? 'italic -rotate-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' :
                  'italic -rotate-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]'
                }`}>
                  BUSSEN
                </div>
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
