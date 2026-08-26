import React from 'react';
import { X } from 'lucide-react';
import { SlideMenuModal } from './SlideMenuModal';

interface PatchNotesModalProps {
  isOpen: boolean;
  version: string;
  patchNotes: string[];
  t: (key: string) => string;
  onClose: () => void;
}

export const PatchNotesModal: React.FC<PatchNotesModalProps> = React.memo(({
  isOpen,
  version,
  patchNotes,
  t,
  onClose,
}) => {
  return (
    <SlideMenuModal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-lg p-6 flex flex-col max-h-[85vh] bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl relative mx-4"
      backdropClassName="bg-black/90 backdrop-blur-xl"
    >
      {({ close }) => (
        <>
          <button
            onClick={close}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
          <div className="mb-6 shrink-0 pr-8">
            <h1 className="text-3xl font-black text-white flex items-center gap-2 mb-1 tracking-tight">
              🪙 Update {version}
            </h1>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {patchNotes.length > 0 ? (
              <ul className="space-y-3 text-slate-300 text-sm leading-relaxed mb-4">
                {patchNotes.map((note, index) => (
                  <li
                    key={index}
                    className="flex items-start p-3.5 rounded-xl border border-slate-700/30 bg-slate-800/40 shadow-sm"
                  >
                    <span className="mr-3 text-base font-bold text-amber-400 leading-none select-none">•</span>
                    <span className="flex-1">{t(note)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">
                {t('Geen nieuwe patch notes beschikbaar.')}
              </p>
            )}
          </div>
          <button
            onClick={close}
            className="mt-6 w-full py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl uppercase tracking-widest active:scale-95 transition-transform shrink-0"
          >
            {t('Sluiten')}
          </button>
        </>
      )}
    </SlideMenuModal>
  );
});

PatchNotesModal.displayName = 'PatchNotesModal';
