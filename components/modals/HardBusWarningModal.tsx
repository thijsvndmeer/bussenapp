import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface HardBusWarningModalProps {
  isOpen: boolean;
  busLength: number;
  t: (key: string) => string;
  lang?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const HardBusWarningModal: React.FC<HardBusWarningModalProps> = React.memo(({
  isOpen,
  busLength,
  t,
  lang = 'nl',
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const guesses = Math.max(1, busLength - 1);
  const rawChance = Math.pow(0.71, guesses) * 100;
  const formattedChance = Math.round(rawChance * 10) / 10;

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.3)] w-full max-w-md m-4 space-y-6 animate-in zoom-in-95 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
          <AlertTriangle size={32} strokeWidth={2.5} />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">
            {lang === 'en' ? 'Extreme Bus Warning!' : 'Zeer Moeilijke Bus!'}
          </h3>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {lang === 'en' ? (
              <>
                You are playing with <span className="text-amber-400 font-black">{busLength}</span> bus cards.
                This bus is very hard and there is only approximately a{' '}
                <span className="text-red-400 font-black text-lg underline decoration-red-500 underline-offset-2">
                  {formattedChance}%
                </span>{' '}
                chance of finishing without making a mistake!
              </>
            ) : (
              <>
                Je speelt met <span className="text-amber-400 font-black">{busLength}</span> buskaarten.
                Deze bus is erg moeilijk en de kans om er in één keer zonder fouten uit te komen is slechts ongeveer{' '}
                <span className="text-red-400 font-black text-lg underline decoration-red-500 underline-offset-2">
                  {formattedChance}%
                </span>
                !
              </>
            )}
          </p>
          <p className="text-xs text-slate-400 font-medium">
            {lang === 'en' ? 'Are you sure you want to continue?' : 'Weet je zeker dat je wilt beginnen?'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onCancel}
            style={{
              backgroundColor: 'var(--theme-btn-bg, #f59e0b)',
              color: 'var(--theme-btn-text, #0b0d19)',
              boxShadow: '0 4px 15px var(--theme-accent-glow, rgba(245, 158, 11, 0.3))'
            }}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 font-black transition-all active:scale-95 text-sm uppercase tracking-wider"
          >
            {t('Aanpassen')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold transition-all active:scale-95 text-sm uppercase tracking-wider"
          >
            {t('Toch Starten')}
          </button>
        </div>
      </div>
    </div>
  );
});

HardBusWarningModal.displayName = 'HardBusWarningModal';
