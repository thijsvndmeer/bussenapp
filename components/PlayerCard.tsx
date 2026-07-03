import React from 'react';
import { Player } from '../types';

const PlayerCard: React.FC<{ player?: Player; size?: 'sm' | 'md' | 'lg' | 'xl'; glow?: boolean; className?: string }> = ({ player, size = 'md', glow = false, className = '' }) => {
  const sizeClasses = { sm: 'w-8 h-8 text-[10px]', md: 'w-10 h-10 text-base', lg: 'w-11 h-11 text-lg', xl: 'w-32 h-32 text-5xl' };
  const borderClasses = size === 'xl' ? 'border-4' : 'border-2';
  const ringClasses = size === 'xl' ? 'ring-4' : 'ring-2';
  const borderColor = glow ? 'border-red-500' : 'border-slate-600/50';
  const shadowEffect = glow ? 'shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'shadow-md';
  const bgGradient = player?.image ? 'from-slate-700 to-slate-900' : 'from-black to-slate-900';

  return (
    <div className={`rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center overflow-hidden relative shrink-0 ${sizeClasses[size]} ${borderClasses} ${borderColor} ${shadowEffect} ${className}`}>
      {player?.image ? <img src={player.image} className="w-full h-full object-cover" alt={player?.name || 'player'} /> : <span className="font-black text-white">{player?.name?.charAt(0).toUpperCase() || '?'}</span>}
      <div className={`absolute inset-0 rounded-full ${ringClasses} ring-red-500/20 animate-pulse`} />
    </div>
  );
};

export default PlayerCard;
