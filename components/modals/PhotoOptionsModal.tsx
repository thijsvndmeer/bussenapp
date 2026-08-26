import React from 'react';
import { Camera as CameraIcon, Image as ImageIcon } from 'lucide-react';
import { SlideMenuModal } from './SlideMenuModal';

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
  return (
    <SlideMenuModal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-slate-900/90 rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-sm m-4 space-y-4"
      backdropClassName="bg-black/70 backdrop-blur-sm"
    >
      {({ close }) => (
        <>
          <h3 className="text-xl font-bold text-white text-center mb-4">{t('Profielfoto kiezen')}</h3>
          <button
            onClick={() => {
              close();
              setTimeout(() => onTakePhoto(), 150);
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
          >
            <CameraIcon size={20} /> {t('Maak foto')}
          </button>
          <button
            onClick={() => {
              close();
              setTimeout(() => onSelectFromGallery(), 150);
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
          >
            <ImageIcon size={20} /> {t('Kies uit galerij')}
          </button>
          <button
            onClick={close}
            className="w-full bg-slate-700/50 text-white font-bold py-3 rounded-xl hover:bg-slate-600/50 active:scale-95 transition-transform"
          >
            {t('Annuleren')}
          </button>
        </>
      )}
    </SlideMenuModal>
  );
});

PhotoOptionsModal.displayName = 'PhotoOptionsModal';
