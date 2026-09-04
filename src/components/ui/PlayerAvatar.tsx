import React from 'react';
import { Player, UITheme } from '../../../types';

export const PlayerAvatar: React.FC<{ 
  player?: Player; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  className?: string;
  theme?: UITheme;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerLeave?: (e: React.PointerEvent) => void;
}> = React.memo(({ player, size = 'md', glow = false, className = "", theme = UITheme.CLASSIC, onPointerDown, onPointerUp, onPointerLeave }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-base',
    lg: 'w-11 h-11 text-lg',
    xl: 'w-32 h-32 text-5xl',
  };

  const borderClasses = size === 'xl' ? 'border-4' : 'border-2';
  const ringClasses = size === 'xl' ? 'ring-4' : 'ring-2';
  
  const isCalmGlow = glow && theme === UITheme.CALM;
  const isDev = !!player?.isDev;

  const borderColor = isDev ? 'border-green-400/30' : (isCalmGlow ? '' : (glow ? 'border-red-500' : 'border-slate-600/50'));
  const shadowEffect = isDev ? '' : (isCalmGlow ? '' : (glow ? 'shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'shadow-md'));
  const animationEffect = isDev ? '' : '';
  const bgGradient = player?.image ? 'from-slate-700 to-slate-900' : 'from-black to-slate-900';

  const calmStyle = (isCalmGlow && !isDev) ? {
    borderColor: 'var(--theme-accent)',
    boxShadow: '0 0 40px var(--theme-accent-glow)'
  } : undefined;

  return (
    <div 
      className={`rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center relative shrink-0 ${sizeClasses[size]} ${borderClasses} ${borderColor} ${shadowEffect} ${animationEffect} ${className} ${onPointerDown ? 'cursor-pointer' : ''}`}
      style={calmStyle}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onContextMenu={(e) => { if (onPointerDown) e.preventDefault(); }}
    >
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center pointer-events-none">
        {player?.image ? (
          <img src={player.image} className="w-full h-full object-cover" alt={player?.name || 'player'} />
        ) : (
          <span className="font-black text-white">{player?.name?.charAt(0).toUpperCase() || '?'}</span>
        )}
      </div>
      {glow && (
        <div 
          className={`absolute -inset-[2px] rounded-full pointer-events-none ${ringClasses} ${isCalmGlow ? 'animate-pulse' : 'ring-red-500/40 animate-pulse'}`}
          style={(isCalmGlow && !isDev) ? { boxShadow: '0 0 0 4px var(--theme-accent-glow)' } : undefined}
        />
      )}
    </div>
  );
});
