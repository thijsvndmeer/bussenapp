import React from 'react';
import { Camera as CameraIcon, Image as ImageIcon } from 'lucide-react';

interface PhotoOptionsModalProps {
  isOpen: boolean;
  t: (key: string) => string;
  onTakePhoto: () => void;
  onSelectFromGallery: () => void;
  onClose: () => void;
}

export const PhotoOptionsModal: React.FC<PhotoOptionsModalProps> = React.memo(({
  isOpen,
  t,
  onTakePhoto,
  onSelectFromGallery,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900/90 rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-sm m-4 space-y-4 animate-in zoom-in-50 duration-300">
        <h3 className="text-xl font-bold text-white text-center mb-4">{t('Profielfoto kiezen')}</h3>
        <button
          onClick={onTakePhoto}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          <CameraIcon size={20} /> {t('Maak foto')}
        </button>
        <button
          onClick={onSelectFromGallery}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          <ImageIcon size={20} /> {t('Kies uit galerij')}
        </button>
        <button
          onClick={onClose}
          className="w-full bg-slate-700/50 text-white font-bold py-3 rounded-xl hover:bg-slate-600/50 active:scale-95 transition-transform"
        >
          {t('Annuleren')}
        </button>
      </div>
    </div>
  );
});

PhotoOptionsModal.displayName = 'PhotoOptionsModal';
