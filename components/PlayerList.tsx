import React from 'react';
import { Users } from 'lucide-react';
import { Player, UITheme } from '../types';
import { PlayerCard } from './PlayerCard';
import { ScrollIndicatorContainer } from '../src/components/ui/ScrollIndicatorContainer';

type PlayerListProps = {
  players: Player[];
  dragPlayerIndex: number | null;
  dragOverIndex: number | null;
  listRef: React.RefObject<HTMLDivElement | null>;
  onDragStart: (event: React.TouchEvent | React.MouseEvent, index: number) => void;
  onRemovePlayer: (playerId: string) => void;
  renderAvatar: (player: Player) => React.ReactNode;
  t: (value: string) => string;
  immunePlayerId?: string | null;
  lastAddedPlayerId?: string | null;
  theme?: UITheme;
};

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  dragPlayerIndex,
  dragOverIndex,
  listRef,
  onDragStart,
  onRemovePlayer,
  renderAvatar,
  t,
  immunePlayerId,
  lastAddedPlayerId,
  theme = UITheme.CLASSIC,
}) => (
  <ScrollIndicatorContainer
    orientation="vertical"
    theme={theme}
    scrollRef={listRef}
    className="flex-1 min-h-0"
    scrollClassName="p-3 space-y-2 scroll-smooth"
  >
    {players.map((player, index) => (
      <PlayerCard
        key={player.id}
        player={player}
        index={index}
        isDragging={dragPlayerIndex === index}
        isOver={dragOverIndex === index && dragPlayerIndex !== null && dragPlayerIndex !== index}
        dragPlayerIndex={dragPlayerIndex}
        onDragStart={onDragStart}
        onRemove={onRemovePlayer}
        renderAvatar={renderAvatar}
        isImmune={player.isImmune || player.id === immunePlayerId}
        isNewlyAdded={!!lastAddedPlayerId && player.id === lastAddedPlayerId}
      />
    ))}
    {players.length === 0 && (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 opacity-70">
        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
          <Users size={24} />
        </div>
        <span className="font-bold text-sm uppercase tracking-widest">{t("Start met toevoegen")}</span>
      </div>
    )}
  </ScrollIndicatorContainer>
);
