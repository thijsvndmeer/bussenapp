import React from 'react';
import { Clapperboard } from 'lucide-react';

interface AdLoadingModalProps {
  isOpen: boolean;
  t: (key: string) => string;
  lang?: string;
}

export const AdLoadingModal: React.FC<AdLoadingModalProps> = React.memo(({
  isOpen,
  t,
  lang = 'nl',
}) => {
  if (!isOpen) return null;

  const isEn = lang === 'en';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md select-none pointer-events-auto cursor-wait animate-in fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="bg-slate-900/95 border-2 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.3)] rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-6 max-w-xs sm:max-w-sm w-full mx-4 text-center ring-1 ring-white/10 relative overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {/* Subtle background glow effect */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Multi-layered animated spinner */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Outer glowing spin ring */}
          <div className="absolute inset-0 rounded-full border-3 border-amber-500/20 border-t-amber-400 border-r-amber-400 animate-spin shadow-[0_0_20px_rgba(245,158,11,0.35)]" />
          
          {/* Inner reverse spin ring */}
          <div className="absolute inset-2 rounded-full border-3 border-red-500/20 border-b-red-400 border-l-red-400 animate-[spin_1.2s_linear_infinite_reverse]" />
          
          {/* Center pulsing icon */}
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 shadow-inner">
            <Clapperboard size={20} className="animate-pulse" strokeWidth={2.5} />
          </div>
        </div>

        {/* Text Details */}
        <div className="text-center space-y-2 relative z-10">
          <h3 className="text-white font-black text-xl sm:text-2xl tracking-tight uppercase leading-tight">
            {isEn ? 'Loading ad...' : 'Advertentie laden...'}
          </h3>
          <p className="text-slate-400 text-sm font-medium">
            {isEn ? 'Just a moment...' : 'Een moment geduld...'}
          </p>
        </div>

        {/* Animated Loading Dots Bar */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-[bounce_1s_infinite_100ms]" />
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-[bounce_1s_infinite_300ms]" />
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-[bounce_1s_infinite_500ms]" />
        </div>
      </div>
    </div>
  );
});

AdLoadingModal.displayName = 'AdLoadingModal';
