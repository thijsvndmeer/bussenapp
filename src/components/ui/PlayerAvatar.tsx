import React from 'react';
import { Player, UITheme } from '../../../types';

export const PlayerAvatar: React.FC<{ 
  player?: Player | any; 
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  glow?: boolean;
  className?: string;
  theme?: UITheme;
  style?: React.CSSProperties;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerLeave?: (e: React.PointerEvent) => void;
}> = React.memo(({ player, size = 'md', glow = false, className = "", theme = UITheme.CLASSIC, style, onPointerDown, onPointerUp, onPointerLeave }) => {
  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-base',
    lg: 'w-11 h-11 text-lg',
    xl: 'w-32 h-32 text-5xl',
    custom: '',
  };

  const borderClasses = size === 'custom' ? '' : (size === 'xl' ? 'border-4' : (size === 'xs' ? 'border' : 'border-2'));
  const ringClasses = size === 'xl' ? 'ring-4' : 'ring-2';
  
  const isThemeGlow = glow && !player?.isDev;
  const isDev = !!player?.isDev;

  const borderColor = size === 'custom' ? '' : (isDev ? 'border-green-400/30' : (isThemeGlow ? '' : 'border-slate-600/50'));
  const shadowEffect = size === 'custom' ? '' : (isDev ? '' : (isThemeGlow ? '' : 'shadow-md'));
  const animationEffect = isDev ? '' : '';
  const accentColor = player?.avatarColor;
  const bgGradient = player?.image ? 'from-slate-700 to-slate-900' : 'from-black to-slate-900';
  const customBgStyle = (!player?.image && accentColor) ? {
    background: `radial-gradient(circle at 75% 75%, ${accentColor}44 0%, transparent 60%), linear-gradient(135deg, #000000 0%, #090d16 55%, ${accentColor}33 100%)`,
  } : undefined;

  const glowStyle: React.CSSProperties = {
    ...customBgStyle,
    ...(isThemeGlow && !isDev ? {
      borderColor: 'var(--theme-accent, #ef4444)',
      boxShadow: '0 0 30px var(--theme-accent-glow, rgba(239,68,68,0.4))',
    } : {}),
    ...style,
  };

  return (
    <div 
      className={`rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center relative shrink-0 ${sizeClasses[size]} ${borderClasses} ${borderColor} ${shadowEffect} ${animationEffect} ${className} ${onPointerDown ? 'cursor-pointer' : ''}`}
      style={glowStyle}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onContextMenu={(e) => { if (onPointerDown) e.preventDefault(); }}
    >
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center pointer-events-none">
        {player?.image ? (
          <img src={player.image} className="w-full h-full object-cover" alt={player?.name || 'player'} />
        ) : (
          <span className="font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{player?.name?.charAt(0).toUpperCase() || '?'}</span>
        )}
      </div>
      {glow && (
        <div 
          className={`absolute -inset-[2px] rounded-full pointer-events-none ${ringClasses} ${isThemeGlow ? 'animate-pulse' : 'ring-red-500/40 animate-pulse'}`}
          style={(isThemeGlow && !isDev) ? { 
            boxShadow: '0 0 0 3px var(--theme-accent-glow, rgba(239,68,68,0.4))' 
          } : undefined}
        />
      )}
    </div>
  );
});
