import React, { useState, useEffect, useMemo } from 'react';
import { SlideMenuModal } from './SlideMenuModal';

const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return { h: 43, s: 95, l: 65 };

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const hslToHex = (h: number, s: number, l: number): string => {
  const normL = l / 100;
  const a = (s * Math.min(normL, 1 - normL)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = normL - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

interface ColorPickerModalProps {
  isOpen: boolean;
  currentColor: string;
  t: (key: string) => string;
  onClose: () => void;
  onSave: (newColor: string) => void;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = React.memo(({
  isOpen,
  currentColor,
  t,
  onClose,
  onSave,
}) => {
  const [tempColor, setTempColor] = useState(currentColor || '#fb7185');

  useEffect(() => {
    if (isOpen) {
      setTempColor(currentColor || '#fb7185');
    }
  }, [isOpen, currentColor]);

  const { pinX, pinY } = useMemo(() => {
    const hsl = hexToHsl(tempColor);
    const angleRad = ((hsl.h - 90) * Math.PI) / 180;
    const r = 38;
    return {
      pinX: 50 + r * Math.cos(angleRad),
      pinY: 50 + r * Math.sin(angleRad),
    };
  }, [tempColor]);

  if (!isOpen) return null;

  const handleWheelTouch = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | MouseEvent | TouchEvent) => {
    const target = document.getElementById('calm-popup-wheel');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;

    let angleDeg = Math.round(Math.atan2(y, x) * (180 / Math.PI));
    angleDeg = (angleDeg + 90 + 360) % 360;

    const hex = hslToHex(angleDeg, 80, 75);
    setTempColor(hex);
  };

  return (
    <SlideMenuModal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl w-full max-w-xs m-4 flex flex-col items-center gap-6"
      backdropClassName="bg-black/80 backdrop-blur-md"
    >
      {({ close }) => (
        <>
          <div className="text-center space-y-1.5 w-full">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">{t('Kleur Kiezer')}</h3>
            <p className="text-slate-400 text-xs">{t('Sleep op het wiel om een kleur te kiezen')}</p>
          </div>

          {/* Color Wheel Container */}
          <div
            id="calm-popup-wheel"
            className="relative w-48 h-48 cursor-crosshair select-none touch-none rounded-full"
            onMouseDown={(e) => {
              handleWheelTouch(e);
              const onMouseMove = (moveEvent: MouseEvent) => handleWheelTouch(moveEvent);
              const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
              };
              window.addEventListener('mousemove', onMouseMove);
              window.addEventListener('mouseup', onMouseUp);
            }}
            onTouchStart={(e) => {
              handleWheelTouch(e);
              const onTouchMove = (moveEvent: TouchEvent) => handleWheelTouch(moveEvent);
              const onTouchEnd = () => {
                window.removeEventListener('touchmove', onTouchMove);
                window.removeEventListener('touchend', onTouchEnd);
              };
              window.addEventListener('touchmove', onTouchMove);
              window.addEventListener('touchend', onTouchEnd);
            }}
            style={{
              background: `
                radial-gradient(circle closest-side, #ffffff 0%, transparent 60%),
                conic-gradient(
                  from 0deg,
                  #ff4d4d,
                  #ff9933,
                  #ffff33,
                  #33cc33,
                  #3399ff,
                  #9933ff,
                  #ff33cc,
                  #ff4d4d
                )
              `,
              boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 0 15px rgba(0,0,0,0.3)',
            }}
          >
            {/* Center Thumb */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-white shadow-lg pointer-events-none transition-transform"
              style={{ backgroundColor: tempColor }}
            />
          </div>

          {/* Current Selection Bar */}
          <div className="flex items-center gap-4 w-full bg-slate-800/40 p-3 rounded-2xl border border-slate-700/30">
            <div
              className="w-12 h-12 rounded-2xl border border-white/10 shadow-inner flex items-center justify-center transition-colors shrink-0"
              style={{ backgroundColor: tempColor }}
            />
            <span className="text-sm text-slate-300 font-bold uppercase tracking-wider">
              {t('Geselecteerde Kleur')}
            </span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 w-full pt-2">
            <button
              onClick={close}
              className="py-3 rounded-2xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors text-sm active:scale-95 transition-transform cursor-pointer"
            >
              {t('Annuleren')}
            </button>
            <button
              onClick={() => {
                close();
                setTimeout(() => onSave(tempColor), 100);
              }}
              className="py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm active:scale-95 transition-transform cursor-pointer"
            >
              {t('Opslaan')}
            </button>
          </div>
        </>
      )}
    </SlideMenuModal>
  );
});

ColorPickerModal.displayName = 'ColorPickerModal';
