import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardStyle, Rank, Suit } from '../../types';
import PlayingCard from '../PlayingCard';
import { Check } from 'lucide-react';
import { triggerHaptic } from '../../services/haptics';

interface GalaxyCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipBoth: () => void;
  t: (key: string) => string;
  lang?: string;
}

const SAMPLE_GALAXY_ACE: Card = {
  suit: Suit.SPADES,
  rank: Rank.ACE,
  id: 'galaxy-ace-spades',
};

const SAMPLE_GALAXY_KING: Card = {
  suit: Suit.HEARTS,
  rank: Rank.KING,
  id: 'galaxy-king-hearts',
};

export const GalaxyCelebrationModal: React.FC<GalaxyCelebrationModalProps> = React.memo(({
  isOpen,
  onClose,
  onEquipBoth,
  t,
  lang = 'nl',
}) => {
  const [phase, setPhase] = useState<'blackout' | 'singularity' | 'supernova' | 'reveal'>('blackout');

  useEffect(() => {
    if (!isOpen) {
      setPhase('blackout');
      return;
    }

    // Step 1: Blackout & Deep Gravitational Gathering
    triggerHaptic('majorLoss');
    const singularityTimer = setTimeout(() => {
      setPhase('singularity');
      triggerHaptic('medium');
    }, 150);

    // Step 2: Celestial Supernova Detonation
    const supernovaTimer = setTimeout(() => {
      setPhase('supernova');
      triggerHaptic('heavy');
    }, 900);

    // Step 3: Sovereign Reveal
    const revealTimer = setTimeout(() => {
      setPhase('reveal');
      triggerHaptic('success');
    }, 1850);

    return () => {
      clearTimeout(singularityTimer);
      clearTimeout(supernovaTimer);
      clearTimeout(revealTimer);
    };
  }, [isOpen]);

  // Luxury starlight field
  const celestialStars = useMemo(() => {
    return Array.from({ length: 42 }).map((_, i) => ({
      id: i,
      x: (i * 19 + 17) % 96 + 2,
      y: (i * 23 + 13) % 94 + 3,
      size: (i % 3 === 0) ? 2 : (i % 2 === 0) ? 1.5 : 1,
      opacity: (i % 3 === 0) ? 0.85 : 0.45,
      delay: (i % 6) * 0.5,
      duration: (i % 4) + 2.5,
      color: i % 4 === 0 ? '#fef08a' : i % 2 === 0 ? '#c084fc' : '#f8fafc',
    }));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center overflow-hidden select-none isolate">
      {/* 1. Deep Obsidian Void Base */}
      <div className="absolute inset-0 bg-[#010005] transition-opacity duration-700 opacity-100" />

      {/* 2. Singularity Phase: Gravitational Collapse into Central Diamond Core */}
      {phase === 'singularity' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none isolate">
          {/* Gravitational Inward Streaks */}
          {Array.from({ length: 24 }).map((_, i) => {
            const rot = (i / 24) * 360;
            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 h-[1px] bg-gradient-to-r from-transparent via-purple-300/40 to-white/90 origin-left animate-singularity-collapse"
                style={{
                  width: `${(i % 3) * 60 + 140}px`,
                  transform: `rotate(${rot}deg) translate3d(20px, 0, 0)`,
                  animationDelay: `${(i % 4) * 0.04}s`,
                }}
              />
            );
          })}

          {/* Rotating Astrolabe Ring Gathering Inward */}
          <div 
            className="absolute w-44 h-44 rounded-full border border-purple-400/20 animate-galaxy-spin opacity-40"
            style={{ animationDuration: '40s' }}
          />
          <div 
            className="absolute w-28 h-28 rounded-full border border-dashed border-amber-300/25 animate-galaxy-spin opacity-50"
            style={{ animationDuration: '25s', animationDirection: 'reverse' }}
          />

          {/* Pure Optical Diamond Singularity */}
          <div className="relative flex items-center justify-center animate-singularity-gather">
            <div className="w-5 h-5 rounded-full bg-white shadow-[0_0_25px_#ffffff,0_0_60px_#c084fc,0_0_120px_#a855f7]" />
            <div className="absolute w-20 h-[1.5px] bg-white/80 blur-[0.5px]" />
            <div className="absolute h-20 w-[1.5px] bg-white/80 blur-[0.5px]" />
          </div>
        </div>
      )}

      {/* 3. Supernova Phase: Sovereign Shockwaves & Ethereal Violet Bloom */}
      {(phase === 'supernova' || phase === 'reveal') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden isolate">
          {/* Supernova Shockwave Rings */}
          <div className="absolute w-[380px] h-[380px] rounded-full border border-purple-200/90 shadow-[0_0_40px_rgba(192,132,252,0.8)] animate-supernova-shockwave" />
          <div 
            className="absolute w-[320px] h-[320px] rounded-full border border-dashed border-amber-200/50 animate-supernova-shockwave"
            style={{ animationDelay: '0.12s' }}
          />
          <div 
            className="absolute w-[440px] h-[440px] rounded-full border border-white/40 animate-supernova-shockwave"
            style={{ animationDelay: '0.22s' }}
          />

          {/* Deep Violet / Amethyst Core Bloom */}
          <div className="absolute w-[600px] h-[600px] rounded-full bg-radial from-purple-600/45 via-purple-950/20 to-transparent blur-3xl animate-supernova-bloom" />

          {/* Starlight Compass Beams */}
          <div className="absolute w-screen h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent animate-celestial-beam" />
          <div className="absolute h-screen w-[1.5px] bg-gradient-to-b from-transparent via-purple-300/60 to-transparent animate-celestial-beam" />
        </div>
      )}

      {/* 4. Ambient Twinkling Cosmic Dust Field (Active during reveal) */}
      {phase === 'reveal' && (
        <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-1000 isolate">
          {celestialStars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full animate-star-twinkle"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor: star.color,
                boxShadow: star.size > 1.5 ? `0 0 6px ${star.color}` : 'none',
                opacity: star.opacity,
                '--twinkle-duration': `${star.duration}s`,
                '--twinkle-delay': `${star.delay}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* 5. Epic Dark Stars Dialogue (Awwwards-Tier Double-Bezel Architecture) */}
      {phase === 'reveal' && (
        <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-4 p-1.5 rounded-[2.5rem] bg-gradient-to-b from-purple-400/25 via-white/5 to-purple-950/30 border border-purple-300/20 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_60px_rgba(168,85,247,0.15)] animate-in fade-in zoom-in-95 duration-700 ease-out max-h-[92vh] flex flex-col">
          <div className="w-full h-full rounded-[calc(2.5rem-0.375rem)] bg-[#04010a]/95 p-6 sm:p-7 flex flex-col items-center text-center overflow-y-auto border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
            
            {/* Main Editorial Title */}
            <h2 className="text-2xl sm:text-3xl font-light italic tracking-[0.12em] uppercase text-white mt-1 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {lang === 'en' ? 'Cosmic Mastery' : 'Kosmische Meester'}
            </h2>

            {/* Subtitle description */}
            <p className="text-slate-300/85 text-xs sm:text-sm leading-relaxed mb-6 max-w-xs font-light" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {lang === 'en' ? (
                <>You overcame impossible odds. Unlocked the secret <strong className="font-medium text-purple-200">Stars Theme</strong> and animated <strong className="font-medium text-purple-200">Galaxy Cards</strong>.</>
              ) : (
                <>Je hebt het onmogelijke overleefd. Ontgrendeld: <strong className="font-medium text-purple-200">Stars Thema</strong> en geanimeerde <strong className="font-medium text-purple-200">Galaxy Kaarten</strong>.</>
              )}
            </p>

            {/* Exhibition Floating Pedestal */}
            <div className="relative mb-7 flex items-center justify-center gap-4 sm:gap-6 py-4 w-full">
              {/* Plinth Ambient Light & Shadow */}
              <div className="absolute bottom-1 w-52 h-6 bg-purple-500/25 blur-xl rounded-full pointer-events-none" />
              <div className="absolute inset-0 bg-radial from-purple-600/15 via-transparent to-transparent pointer-events-none" />

              {/* Floating Ace */}
              <div className="animate-card-pedestal-1 scale-90 sm:scale-95 drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
                <PlayingCard card={SAMPLE_GALAXY_ACE} size="md" style={CardStyle.GALAXY} highlight />
              </div>

              {/* Floating King (Backside Astrolabe) */}
              <div className="animate-card-pedestal-2 scale-90 sm:scale-95 drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
                <PlayingCard card={SAMPLE_GALAXY_KING} size="md" style={CardStyle.GALAXY} isFaceDown />
              </div>
            </div>

            {/* Nested Island Buttons */}
            <div className="flex flex-col w-full gap-2.5">
              {/* Primary Action Button: Button-in-Button */}
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onEquipBoth();
                }}
                className="w-full py-2.5 pl-6 pr-2 rounded-full bg-[#f1f5f9] text-[#090514] font-medium text-xs tracking-[0.15em] uppercase shadow-[0_8px_30px_rgba(241,245,249,0.25),0_0_20px_rgba(192,132,252,0.3)] active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer border border-purple-300/30 no-calm-override"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                <span>{lang === 'en' ? 'Equip Stars & Galaxy' : 'Activeer Stars & Galaxy'}</span>
                <div className="w-8 h-8 rounded-full bg-[#090514]/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#090514]/15 transition-all">
                  <Check size={16} className="text-[#090514]" />
                </div>
              </button>

              {/* Secondary Minimalist Pill */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-full text-slate-400 hover:text-white font-light text-xs tracking-wider transition-colors hover:bg-white/5 cursor-pointer"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {lang === 'en' ? 'Keep Current Setup' : 'Later Instellen'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
});
