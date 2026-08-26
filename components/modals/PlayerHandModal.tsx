import React from 'react';
import { Player, CardStyle } from '../../types';
import PlayingCard from '../PlayingCard';
import { SlideMenuModal } from './SlideMenuModal';

interface PlayerHandModalProps {
  player: Player | null;
  cardStyle?: CardStyle;
  t: (key: string) => string;
  onClose: () => void;
}

export const PlayerHandModal: React.FC<PlayerHandModalProps> = React.memo(({
  player,
  cardStyle,
  t,
  onClose,
}) => {
  return (
    <SlideMenuModal
      isOpen={!!player}
      onClose={onClose}
      className="w-full max-w-sm m-4 relative bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 text-center"
      backdropClassName="bg-black/80 backdrop-blur-sm"
    >
      {({ close }) => (
        player && (
          <>
            <div className="w-16 h-16 rounded-full border-2 border-amber-500 bg-slate-800 overflow-hidden mx-auto mb-4">
              {player.image ? (
                <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl">
                  {player.name.charAt(0)}
                </div>
              )}
            </div>
            <h3 className="text-2xl font-black text-white mb-2">{player.name}</h3>
            <p className="text-slate-400 mb-6">
              {t('Kaarten in hand')}: {player.hand.length}
            </p>
            <div className="grid grid-cols-4 gap-2 mb-6 max-h-[50vh] overflow-y-auto p-2 justify-items-center">
              {player.hand.map((card, i) => (
                <div key={i} className="hover:scale-105 transition-transform drop-shadow-md">
                  <PlayingCard card={card} size="sm" style={cardStyle} />
                </div>
              ))}
              {player.hand.length === 0 && (
                <div className="col-span-4 text-slate-500 italic py-4">{t('Geen kaarten')}</div>
              )}
            </div>
            <button
              onClick={close}
              className="w-full bg-amber-500 text-slate-900 font-black py-4 rounded-2xl hover:bg-amber-400 active:scale-95 transition-all uppercase tracking-widest cursor-pointer"
            >
              {t('Sluiten')}
            </button>
          </>
        )
      )}
    </SlideMenuModal>
  );
});

PlayerHandModal.displayName = 'PlayerHandModal';
