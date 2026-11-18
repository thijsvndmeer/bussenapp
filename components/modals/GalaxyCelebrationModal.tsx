import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardStyle, Rank, Suit } from '../../types';
import PlayingCard from '../PlayingCard';
import { Check, Sparkles, Stars } from 'lucide-react';
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
    }, 100);

    // Step 2: Celestial Supernova Detonation
    const supernovaTimer = setTimeout(() => {
      setPhase('supernova');
      triggerHaptic('heavy');
    }, 650);

    // Step 3: Sovereign Reveal
    const revealTimer = setTimeout(() => {
      setPhase('reveal');
      triggerHaptic('success');
    }, 1250);

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
      color: i % 4 === 0 ? '#fef08a' : i % 2 === 0 ? '#e2e8f0' : '#f8fafc',
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
                className="absolute top-1/2 left-1/2 h-[1px] bg-gradient-to-r from-transparent via-slate-300/40 to-white/90 origin-left animate-singularity-collapse"
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
            className="absolute w-44 h-44 rounded-full border border-white/20 animate-galaxy-spin opacity-40"
            style={{ animationDuration: '40s' }}
          />
          <div 
            className="absolute w-28 h-28 rounded-full border border-dashed border-amber-300/25 animate-galaxy-spin opacity-50"
            style={{ animationDuration: '25s', animationDirection: 'reverse' }}
          />

          {/* Pure Optical Diamond Singularity */}
          <div className="relative flex items-center justify-center animate-singularity-gather">
            <div className="w-5 h-5 rounded-full bg-white shadow-[0_0_25px_#ffffff,0_0_60px_#e2e8f0,0_0_120px_rgba(255,255,255,0.4)]" />
            <div className="absolute w-20 h-[1.5px] bg-white/80 blur-[0.5px]" />
            <div className="absolute h-20 w-[1.5px] bg-white/80 blur-[0.5px]" />
          </div>
        </div>
      )}

      {/* 3. Supernova Phase: Sovereign Shockwaves & Ethereal Starlight Bloom */}
      {(phase === 'supernova' || phase === 'reveal') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden isolate">
          {/* Supernova Shockwave Rings */}
          <div className="absolute w-[380px] h-[380px] rounded-full border border-white/80 shadow-[0_0_40px_rgba(255,255,255,0.6)] animate-supernova-shockwave" />
          <div 
            className="absolute w-[320px] h-[320px] rounded-full border border-dashed border-amber-200/50 animate-supernova-shockwave"
            style={{ animationDelay: '0.12s' }}
          />
          <div 
            className="absolute w-[440px] h-[440px] rounded-full border border-white/40 animate-supernova-shockwave"
            style={{ animationDelay: '0.22s' }}
          />

          {/* Deep Starlight Core Bloom */}
          <div className="absolute w-[600px] h-[600px] rounded-full bg-radial from-slate-400/20 via-slate-900/20 to-transparent blur-3xl animate-supernova-bloom" />

          {/* Starlight Compass Beams */}
          <div className="absolute w-screen h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent animate-celestial-beam" />
          <div className="absolute h-screen w-[1.5px] bg-gradient-to-b from-transparent via-slate-300/60 to-transparent animate-celestial-beam" />
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

      {/* 5. Epic Dark Stars Dialogue (Cosmic Violet & Cyan Double-Bezel) */}
      {phase === 'reveal' && (
        <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-4 p-[2px] rounded-[2.25rem] bg-gradient-to-b from-violet-400/50 via-sky-400/25 to-slate-900/50 shadow-[0_25px_90px_rgba(0,0,0,0.95),0_0_70px_rgba(167,139,250,0.22)] animate-in fade-in zoom-in-95 duration-500 ease-out max-h-[92vh] flex flex-col">
          <div className="w-full h-full rounded-[calc(2.25rem-2px)] bg-gradient-to-b from-[#0b0f1e]/95 via-[#060913]/95 to-[#020308]/98 p-6 sm:p-7 flex flex-col items-center text-center overflow-y-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.16)]">
            
            {/* Eyebrow Achievement Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-violet-500/15 border border-violet-300/30 text-[10px] font-black tracking-[0.22em] uppercase text-violet-200 mb-3 shadow-[0_0_20px_rgba(167,139,250,0.2)]">
              <Sparkles size={11} className="text-amber-300" />
              <span>{lang === 'en' ? '20-Card Bus Conquered' : '20-Kaarten Bus Overleefd'}</span>
            </div>

            {/* Main Editorial Title */}
            <h2 className="text-2xl sm:text-3xl font-black tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-sky-200 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {lang === 'en' ? 'Cosmic Mastery' : 'Kosmische Meester'}
            </h2>

            {/* Subtitle description */}
            <p className="text-slate-300/90 text-xs sm:text-sm leading-relaxed mb-4 max-w-xs font-normal" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {lang === 'en' ? (
                <>You overcame impossible odds and unlocked both the <strong className="font-bold text-violet-200">Stars Theme</strong> & <strong className="font-bold text-sky-200">Galaxy Cards</strong>.</>
              ) : (
                <>Je hebt het onmogelijke overleefd! Ontgrendeld: het <strong className="font-bold text-violet-200">Stars Thema</strong> & de <strong className="font-bold text-sky-200">Galaxy Kaarten</strong>.</>
              )}
            </p>

            {/* Reward Pills */}
            <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-violet-400/25 text-xs font-bold text-violet-100">
                <Stars size={13} className="text-violet-300" />
                <span>{t('Stars Thema')}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-sky-400/25 text-xs font-bold text-sky-100">
                <Sparkles size={13} className="text-sky-300" />
                <span>{t('Galaxy Kaartstijl')}</span>
              </div>
            </div>

            {/* Exhibition Floating Pedestal */}
            <div className="relative mb-6 flex items-center justify-center gap-4 sm:gap-6 py-3 w-full">
              {/* Plinth Ambient Light & Shadow */}
              <div className="absolute bottom-1 w-56 h-7 bg-violet-400/20 blur-xl rounded-full pointer-events-none" />
              <div className="absolute inset-0 bg-radial from-violet-400/10 via-transparent to-transparent pointer-events-none" />

              {/* Floating Ace */}
              <div className="animate-card-pedestal-1 -rotate-6 scale-90 sm:scale-95 drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
                <PlayingCard card={SAMPLE_GALAXY_ACE} size="md" style={CardStyle.GALAXY} highlight />
              </div>

              {/* Floating King (Backside) */}
              <div className="animate-card-pedestal-2 rotate-6 scale-90 sm:scale-95 drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
                <PlayingCard card={SAMPLE_GALAXY_KING} size="md" style={CardStyle.GALAXY} isFaceDown />
              </div>
            </div>

            {/* Nested Island Buttons */}
            <div className="flex flex-col w-full gap-2.5">
              {/* Primary Action Button: Cosmic Gradient Button-in-Button */}
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onEquipBoth();
                }}
                className="w-full py-2.5 pl-6 pr-2 rounded-full bg-gradient-to-r from-violet-400 via-indigo-400 to-sky-400 text-[#05070e] font-black text-xs tracking-[0.14em] uppercase shadow-[0_8px_30px_rgba(167,139,250,0.35),0_0_20px_rgba(56,189,248,0.2)] active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer border border-white/40 no-calm-override"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                <span>{lang === 'en' ? 'Equip Theme & Cards' : 'Activeer Thema & Kaarten'}</span>
                <div className="w-8 h-8 rounded-full bg-[#05070e]/15 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#05070e]/25 transition-all">
                  <Check size={16} className="text-[#05070e]" strokeWidth={3} />
                </div>
              </button>

              {/* Secondary Minimalist Pill */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-full text-slate-400 hover:text-white font-medium text-xs tracking-wider transition-colors hover:bg-white/5 cursor-pointer"
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
