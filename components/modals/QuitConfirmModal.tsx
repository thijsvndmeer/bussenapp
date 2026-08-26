import React from 'react';
import { SlideMenuModal } from './SlideMenuModal';

interface QuitConfirmModalProps {
  isOpen: boolean;
  t: (key: string) => string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const QuitConfirmModal: React.FC<QuitConfirmModalProps> = React.memo(({
  isOpen,
  t,
  onCancel,
  onConfirm,
}) => {
  return (
    <SlideMenuModal
      isOpen={isOpen}
      onClose={onCancel}
      className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-sm m-4 space-y-4"
    >
      {({ close }) => (
        <>
          <h3 className="text-xl font-bold text-white text-center mb-4">{t('Spel Stoppen')}</h3>
          <p className="text-slate-300 text-center mb-6">{t('Weet je zeker dat je wilt stoppen?')}</p>
          <div className="flex gap-3">
            <button
              onClick={close}
              className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 active:scale-95 transition-transform"
            >
              {t('Annuleren')}
            </button>
            <button
              onClick={() => {
                close();
                setTimeout(() => onConfirm(), 100);
              }}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
            >
              {t('Stoppen')}
            </button>
          </div>
        </>
      )}
    </SlideMenuModal>
  );
});

QuitConfirmModal.displayName = 'QuitConfirmModal';
