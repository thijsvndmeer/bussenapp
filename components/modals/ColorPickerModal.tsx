import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SlideMenuModal } from './SlideMenuModal';
import { triggerHaptic } from '../../services/haptics';

const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return { h: 352, s: 80, l: 75 };

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
    h: Math.round(h * 360) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const hslToHex = (h: number, s: number, l: number): string => {
  const normH = ((h % 360) + 360) % 360;
  const normS = Math.max(0, Math.min(100, s)) / 100;
  const normL = Math.max(0, Math.min(100, l)) / 100;
  const a = normS * Math.min(normL, 1 - normL);
  const f = (n: number) => {
    const k = (n + normH / 30) % 12;
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

const CALM_PRESETS = [
  { name: 'Rose', hue: 352 },
  { name: 'Amber', hue: 43 },
  { name: 'Emerald', hue: 156 },
  { name: 'Teal', hue: 172 },
  { name: 'Sky', hue: 199 },
  { name: 'Indigo', hue: 235 },
  { name: 'Lavender', hue: 275 },
];

export const ColorPickerModal: React.FC<ColorPickerModalProps> = React.memo(({
  isOpen,
  currentColor,
  t,
  onClose,
  onSave,
}) => {
  const initialHsl = useMemo(() => hexToHsl(currentColor || '#fb7185'), [currentColor]);
  const [hue, setHue] = useState<number>(initialHsl.h);
  const [isDragging, setIsDragging] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const parsed = hexToHsl(currentColor || '#fb7185');
      setHue(parsed.h);
    }
  }, [isOpen, currentColor]);

  // Always force 75% brightness (lightness) and 80% saturation for Calm theme
  const tempColor = useMemo(
    () => hslToHex(hue, 80, 75),
    [hue]
  );

  // Position of handle on circular color track (r = 38.5% radius)
  const { pinX, pinY } = useMemo(() => {
    const angleRad = ((hue - 90) * Math.PI) / 180;
    const r = 38.5;
    return {
      pinX: 50 + r * Math.cos(angleRad),
      pinY: 50 + r * Math.sin(angleRad),
    };
  }, [hue]);

  const updateHueFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);

    let angleDeg = Math.round(Math.atan2(y, x) * (180 / Math.PI));
    angleDeg = (angleDeg + 90 + 360) % 360;

    setHue(angleDeg);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    updateHueFromPointer(e.clientX, e.clientY);
    triggerHaptic('subtle');
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    updateHueFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      setIsDragging(false);
      triggerHaptic('subtle');
    }
  };

  if (!isOpen) return null;

  return (
    <SlideMenuModal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl w-full max-w-xs m-4 flex flex-col items-center gap-5"
      backdropClassName="bg-black/80 backdrop-blur-md"
    >
      {({ close }) => (
        <>
          <div className="text-center space-y-1 w-full">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">{t('Kleur Kiezer')}</h3>
            <p className="text-slate-400 text-xs">{t('Sleep op het wiel om een kleur te kiezen')}</p>
          </div>

          {/* Color Wheel Donut Container */}
          <div
            id="calm-popup-wheel"
            ref={wheelRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-52 h-52 cursor-pointer select-none touch-none rounded-full flex items-center justify-center p-1"
          >
            {/* 1. Full 360° Hue Spectrum Ring with Donut Cutout (Fixed 75% Brightness) */}
            <div
              className="absolute inset-0 rounded-full shadow-[0_4px_25px_rgba(0,0,0,0.5),inset_0_0_12px_rgba(0,0,0,0.4)]"
              style={{
                background: `conic-gradient(
                  from 0deg,
                  hsl(0, 80%, 75%),
                  hsl(30, 80%, 75%),
                  hsl(60, 80%, 75%),
                  hsl(90, 80%, 75%),
                  hsl(120, 80%, 75%),
                  hsl(150, 80%, 75%),
                  hsl(180, 80%, 75%),
                  hsl(210, 80%, 75%),
                  hsl(240, 80%, 75%),
                  hsl(270, 80%, 75%),
                  hsl(300, 80%, 75%),
                  hsl(330, 80%, 75%),
                  hsl(360, 80%, 75%)
                )`,
                WebkitMaskImage: 'radial-gradient(circle, transparent 56%, black 57%)',
                maskImage: 'radial-gradient(circle, transparent 56%, black 57%)',
              }}
            />

            {/* Subtle inner track border overlay */}
            <div className="absolute inset-0 rounded-full border border-white/15 pointer-events-none" />

            {/* 2. Center Preview Disc (Clean solid color swatch, zero text) */}
            <div
              className="relative w-24 h-24 rounded-full border-2 border-white/25 shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-colors pointer-events-none z-10"
              style={{ backgroundColor: tempColor }}
            />

            {/* 3. Pointer Handle (Pinned on Ring Track, Interactive) */}
            <div
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-[3px] border-white shadow-[0_2px_12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(0,0,0,0.3)] pointer-events-none z-20 transition-transform ${
                isDragging ? 'scale-125 ring-2 ring-white/60' : 'scale-100'
              }`}
              style={{
                left: `${pinX}%`,
                top: `${pinY}%`,
                backgroundColor: tempColor,
              }}
            />
          </div>

          {/* Quick Preset Swatches */}
          <div className="flex justify-between items-center w-full px-1">
            {CALM_PRESETS.map((preset) => {
              const presetHex = hslToHex(preset.hue, 80, 75);
              const isSelected = Math.abs(hue - preset.hue) <= 4;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setHue(preset.hue);
                    triggerHaptic('subtle');
                  }}
                  className={`w-7 h-7 rounded-full border-2 transition-all active:scale-90 flex items-center justify-center cursor-pointer ${
                    isSelected ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.6)]' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: presetHex }}
                  title={preset.name}
                >
                  {isSelected && <span className="text-slate-950 font-black text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Current Selection Bar (Clean swatch + label, zero color id text) */}
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
          <div className="grid grid-cols-2 gap-3 w-full pt-1">
            <button
              type="button"
              onClick={close}
              className="py-3 rounded-2xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors text-sm active:scale-95 transition-transform cursor-pointer"
            >
              {t('Annuleren')}
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                close();
                setTimeout(() => onSave(tempColor), 100);
              }}
              className="py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm active:scale-95 transition-transform cursor-pointer shadow-lg shadow-white/10"
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

