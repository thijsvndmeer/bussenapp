import React, { useEffect, useState } from 'react';
import { Card, CardStyle, Rank, Suit } from '../../types';
import PlayingCard from '../PlayingCard';
import { Sparkles, Star, Award, Check } from 'lucide-react';
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
  const [phase, setPhase] = useState<'blackout' | 'warp' | 'reveal'>('blackout');

  useEffect(() => {
    if (!isOpen) {
      setPhase('blackout');
      return;
    }

    triggerHaptic('majorLoss');

    const warpTimer = setTimeout(() => {
      setPhase('warp');
      triggerHaptic('heavy');
    }, 600);

    const revealTimer = setTimeout(() => {
      setPhase('reveal');
      triggerHaptic('success');
    }, 1500);

    return () => {
      clearTimeout(warpTimer);
      clearTimeout(revealTimer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center overflow-hidden select-none isolate">
      {/* 1. Full Pitch Black Takeover Backdrop */}
      <div className="absolute inset-0 bg-black transition-opacity duration-700 opacity-100" />

      {/* 2. Hyperspace Starburst & Warp Lines */}
      {phase !== 'blackout' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Radial light burst */}
          <div className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-r from-purple-600/30 via-cyan-500/20 to-pink-500/30 blur-3xl animate-pulse" />

          {/* Starlight streaks expanding from center */}
          {Array.from({ length: 32 }).map((_, i) => {
            const rot = (i / 32) * 360;
            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent origin-left opacity-60"
                style={{
                  width: `${Math.random() * 250 + 150}px`,
                  transform: `rotate(${rot}deg) translate3d(20px, 0, 0)`,
                  animation: 'hyperspace-warp 2s cubic-bezier(0.1, 0.8, 0.2, 1) infinite',
                  animationDelay: `${(i % 5) * 0.12}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* 3. Twinkling Galaxy Starfield Overlay */}
      {phase === 'reveal' && (
        <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-1000">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-star-twinkle"
              style={{
                left: `${(i * 17 + 23) % 96}%`,
                top: `${(i * 29 + 11) % 96}%`,
                width: `${(i % 3) + 1.5}px`,
                height: `${(i % 3) + 1.5}px`,
                backgroundColor: i % 2 === 0 ? '#c084fc' : '#38bdf8',
                boxShadow: '0 0 6px currentColor',
                '--twinkle-duration': `${(i % 4) + 1.5}s`,
                '--twinkle-delay': `${(i % 5) * 0.4}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* 4. Epic Announcement Dialogue Card */}
      {phase === 'reveal' && (
        <div className="relative z-10 w-full max-w-md mx-4 p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-b from-[#09051d]/90 via-[#030014]/95 to-black/95 border-2 border-purple-500/50 shadow-[0_0_60px_rgba(168,85,247,0.4),inset_0_0_30px_rgba(56,189,248,0.15)] flex flex-col items-center text-center animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">
          {/* Top Cosmic Badge */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-400/50 shadow-[0_0_20px_rgba(192,132,252,0.5)] mb-4 animate-bounce-subtle">
            <Sparkles size={14} className="text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-purple-200">
              {lang === 'en' ? 'LEGENDARY ACHIEVEMENT' : 'LEGENDARISCHE PRESTATIE'}
            </span>
            <Star size={14} className="text-cyan-300 fill-cyan-300" />
          </div>

          {/* Main Massive Title */}
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-1 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
            {lang === 'en' ? '20 Cards on the First Try!' : '20 Kaarten in 1x Overleefd!'}
          </h2>

          {/* Super Rare Odds */}
          <div className="mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.3)]">
              {lang === 'en' ? '<0.001% CHANCE! INSANE!' : '<0.001% KANS! ONMOGELIJK!'}
            </span>
          </div>

          {/* Subtitle / Unlock details */}
          <p className="text-slate-300 text-sm leading-relaxed mb-6 px-2 max-w-sm">
            {lang === 'en'
              ? 'You mastered the ultimate challenge! You have unlocked the secret '
              : 'Je hebt de ultieme uitdaging overwonnen! Je hebt het geheime '}
            <span className="text-purple-300 font-bold drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]">
              &apos;Stars&apos; {lang === 'en' ? 'theme' : 'thema'}
            </span>
            {lang === 'en' ? ' and the animated ' : ' en de geanimeerde '}
            <span className="text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]">
              &apos;Galaxy&apos; {lang === 'en' ? 'card style' : 'kaartstijl'}
            </span>
            {lang === 'en' ? '!' : '!'}
          </p>

          {/* Live Animated Card Previews */}
          <div className="relative mb-8 flex items-center justify-center gap-4 py-2">
            {/* Ambient Back Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-pink-600/20 to-cyan-600/30 blur-2xl -z-10 rounded-full" />
            
            <div className="transform -rotate-6 hover:rotate-0 transition-transform duration-300 scale-90 sm:scale-100">
              <PlayingCard card={SAMPLE_GALAXY_ACE} size="md" style={CardStyle.GALAXY} highlight />
            </div>

            <div className="transform rotate-6 hover:rotate-0 transition-transform duration-300 scale-90 sm:scale-100">
              <PlayingCard card={SAMPLE_GALAXY_KING} size="md" style={CardStyle.GALAXY} isFaceDown />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-3">
            {/* Primary: Equip Both Now */}
            <button
              onClick={() => {
                triggerHaptic('heavy');
                onEquipBoth();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(168,85,247,0.6)] border border-white/40 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Sparkles size={18} className="text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>{lang === 'en' ? 'Equip Stars & Galaxy Now' : 'Direct Stars & Galaxy Instellen'}</span>
              <Check size={18} className="text-white" />
            </button>

            {/* Secondary: Dismiss / Continue */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest border border-slate-700/60 transition-colors cursor-pointer"
            >
              {lang === 'en' ? 'Awesome, Keep Current Setup' : 'Geweldig, Later Instellen'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
