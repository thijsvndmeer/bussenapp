import React from 'react';

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
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-sm m-4 space-y-4 animate-in zoom-in-50 duration-300">
        <h3 className="text-xl font-bold text-white text-center mb-4">{t('Spel Stoppen')}</h3>
        <p className="text-slate-300 text-center mb-6">{t('Weet je zeker dat je wilt stoppen?')}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 active:scale-95 transition-transform"
          >
            {t('Annuleren')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            {t('Stoppen')}
          </button>
        </div>
      </div>
    </div>
  );
});

QuitConfirmModal.displayName = 'QuitConfirmModal';
