import React from 'react';
import { GripVertical, Shield, X } from 'lucide-react';
import { Player } from '../types';

type PlayerCardProps = {
  player: Player;
  index: number;
  isDragging: boolean;
  isOver: boolean;
  dragPlayerIndex: number | null;
  onDragStart: (event: React.TouchEvent | React.MouseEvent, index: number) => void;
  onRemove: (playerId: string) => void;
  renderAvatar: (player: Player) => React.ReactNode;
  isImmune?: boolean;
  isNewlyAdded?: boolean;
};

const PlayerCardComponent: React.FC<PlayerCardProps> = ({
  player,
  index,
  isDragging,
  isOver,
  dragPlayerIndex,
  onDragStart,
  onRemove,
  renderAvatar,
  isImmune,
  isNewlyAdded = false,
}) => {
  const animClass = isNewlyAdded ? 'animate-card-hand-enter' : 'animate-card-hand-subtle';
  return (
    <div data-player-item className={`relative transition-transform duration-150 ${isDragging ? 'opacity-40 scale-95' : ''}`}>
      {isOver && dragPlayerIndex !== null && dragPlayerIndex > index && (
        <div className="absolute -top-1.5 left-2 right-2 h-[3px] bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] z-10" />
      )}
      <div className={`flex justify-between items-center bg-slate-800/40 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-lg ${animClass}`}>
      <div className="flex items-center gap-3 min-w-0">
        {renderAvatar(player)}
        <span className="font-bold text-white text-sm tracking-tight truncate flex-1 min-w-0">{player.name}</span>
        {isImmune && <Shield size={14} className="text-yellow-400 drop-shadow-md shrink-0" />}
      </div>
      <div className="flex items-center gap-0.5">
        <div
          onTouchStart={(event) => onDragStart(event, index)}
          onMouseDown={(event) => onDragStart(event, index)}
          className="text-slate-600 hover:text-slate-400 p-2 cursor-grab active:cursor-grabbing transition-colors touch-none select-none"
        >
          <GripVertical size={18} />
        </div>
        <button onClick={() => onRemove(player.id)} className="text-slate-500 hover:text-red-500 p-2 transition-all active:scale-90"><X size={18} /></button>
      </div>
    </div>
      {isOver && dragPlayerIndex !== null && dragPlayerIndex < index && (
        <div className="absolute -bottom-1.5 left-2 right-2 h-[3px] bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] z-10" />
      )}
    </div>
  );
};

export const PlayerCard = React.memo(PlayerCardComponent);
