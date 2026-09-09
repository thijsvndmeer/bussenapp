import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Settings, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export type SliderSettingKey = 'pyramidRows' | 'busLength';

export interface SliderConfig {
  key: SliderSettingKey;
  label: string;
  min: number;
  max: number;
}

export interface SettingsPanelProps {
  isOpen: boolean;
  disabled?: boolean;
  hideHeader?: boolean;
  settings: any;
  playerCount?: number;
  t: (key: string) => string;
  onToggleOpen: () => void;
  onOpenMoreSettings: () => void;
  onSettingsChange: (key: string, val: any) => void;
  onCommitSettings?: (settings: any) => void;
}

const defaultSliders: Omit<SliderConfig, 'max'>[] = [
  { key: 'pyramidRows', label: 'Piramide Hoogte', min: 3 },
  { key: 'busLength', label: 'Bus Kaarten', min: 3 },
];

interface SliderRecommendation {
  text?: string;
  values: number[];
  startVal: number;
  endVal: number;
}

export const getRecommendedPyramidRows = (count: number = 2) => {
  if (count <= 3) return 4;
  if (count <= 9) return 5;
  return 6;
};

export const getPyramidRecommendation = (count: number = 2, t: (k: string) => string = (k) => k) => 
  getSliderRecommendation('pyramidRows', count, t);

const getSliderRecommendation = (
  key: SliderSettingKey,
  count: number = 2,
  t: (k: string) => string
): SliderRecommendation | null => {
  if (key === 'pyramidRows') {
    if (count <= 1) {
      return null;
    }
    if (count <= 3) {
      return {
        text: '4',
        values: [4],
        startVal: 3.5,
        endVal: 4.5,
      };
    }
    if (count <= 9) {
      return {
        text: '5',
        values: [5],
        startVal: 4.5,
        endVal: 5.5,
      };
    }
    return {
      text: '6',
      values: [6],
      startVal: 5.5,
      endVal: 6.5,
    };
  }

  if (key === 'busLength') {
    if (count <= 1) {
      return null;
    }
    return {
      values: [6, 7],
      startVal: 5.5,
      endVal: 7.5,
    };
  }

  return null;
};

export const getBusFinishChance = (busLength: number): string => {
  const guesses = Math.max(1, busLength - 1);
  const rawChance = Math.pow(0.71, guesses) * 100;
  if (rawChance >= 10) return `~${Math.round(rawChance)}%`;
  if (rawChance >= 0.1) return `~${rawChance.toFixed(1)}%`;
  return `<0.1%`;
};

export const getRecommendedHighlightColor = (hexOrRgb?: string): 'blue' | 'mint' => {
  if (!hexOrRgb) return 'blue';
  let r = 0, g = 0, b = 0;
  let c = hexOrRgb.trim();
  
  if (c.startsWith('#')) {
    c = c.substring(1);
    if (c.length === 3) {
      c = c.split('').map(x => x + x).join('');
    }
    const num = parseInt(c, 16);
    if (isNaN(num)) return 'blue';
    r = (num >> 16) & 255;
    g = (num >> 8) & 255;
    b = num & 255;
  } else if (c.startsWith('rgb')) {
    const match = c.match(/\d+/g);
    if (match && match.length >= 3) {
      r = parseInt(match[0], 10);
      g = parseInt(match[1], 10);
      b = parseInt(match[2], 10);
    } else {
      return 'blue';
    }
  } else {
    return 'blue';
  }
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 'blue';
  
  let hue = 0;
  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  
  const sat = delta / max;
  if (sat < 0.15) return 'blue';

  // Distinct Blue tones (sky blue, royal blue, indigo, periwinkle: 215° - 265°):
  // When line is blue, highlighted area must be mint green to remain visible.
  if (hue >= 215 && hue <= 265) {
    return 'mint';
  }

  // Mint, Cyan, Aqua, Teal, Green tones (130° - 214°) or any warm/neutral colors:
  // When line is mint/cyan or warm, highlighted area must be blue (never mint).
  return 'blue';
};

export const isColorBlueish = (hexOrRgb?: string): boolean => {
  return getRecommendedHighlightColor(hexOrRgb) === 'mint';
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  disabled = false,
  hideHeader = false,
  settings,
  playerCount = 2,
  t,
  onToggleOpen,
  onOpenMoreSettings,
  onSettingsChange,
  onCommitSettings,
}) => {
  const [isBusExpanded, setIsBusExpanded] = useState<boolean>(() => settings.busLength > 12);

  // Dynamic recommended color: default blue (#3b82f6), alternative mint green (#2dd4bf).
  // When line is blueish -> highlight is mint green. When line is mint/greenish or other -> highlight is blue (never mint).
  const currentLineColor = 
    settings?.theme === 'calm' ? (settings.calmAccentColor || '#fb7185') :
    settings?.theme === 'stars' ? '#f1f5f9' :
    settings?.theme === 'metro' ? '#fb7185' :
    settings?.theme === 'beer' ? '#ff3333' : '#ef4444';
  const isLineBlueish = getRecommendedHighlightColor(currentLineColor) === 'mint';

  const sliders: SliderConfig[] = [
    { key: 'pyramidRows', label: 'Piramide Hoogte', min: 3, max: 7 },
    { key: 'busLength', label: 'Bus Kaarten', min: 3, max: isBusExpanded ? 20 : 12 },
  ];

  const currentSliderValues = {
    pyramidRows: settings.pyramidRows,
    busLength: settings.busLength,
  };
  const [draftValues, setDraftValues] = useState<Record<SliderSettingKey, number>>(currentSliderValues);
  const committedValuesRef = useRef<Record<SliderSettingKey, number>>(currentSliderValues);
  const prevPlayerCountRef = useRef(playerCount);
  const isMountedRef = useRef(false);

  useEffect(() => {
    setDraftValues(prev => {
      const needsUpdate = 
        Math.round(prev.pyramidRows) !== settings.pyramidRows ||
        Math.round(prev.busLength) !== settings.busLength;
      if (!needsUpdate) return prev;
      return currentSliderValues;
    });
    committedValuesRef.current = currentSliderValues;
  }, [settings.pyramidRows, settings.busLength]);

  // Auto-upgrade / downgrade pyramidRows recommendation when player count changes
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      prevPlayerCountRef.current = playerCount;
      return;
    }

    const prevCount = prevPlayerCountRef.current;
    prevPlayerCountRef.current = playerCount;

    if (prevCount === playerCount) return;

    const oldRec = getSliderRecommendation('pyramidRows', prevCount, t);
    const newRec = getSliderRecommendation('pyramidRows', playerCount, t);

    if (!newRec || !newRec.values || newRec.values.length === 0) return;

    const currentVal = Math.round(draftValues.pyramidRows);
    const wasInOldRec = Boolean(oldRec && oldRec.values && oldRec.values.includes(currentVal));

    if (wasInOldRec) {
      let targetVal: number;
      if (newRec.values.length === 1) {
        targetVal = newRec.values[0];
      } else {
        if (newRec.values.includes(currentVal)) {
          targetVal = currentVal;
        } else if (currentVal > Math.max(...newRec.values)) {
          targetVal = Math.max(...newRec.values);
        } else {
          targetVal = Math.min(...newRec.values);
        }
      }

      if (targetVal !== currentVal) {
        setIsDragging(prev => ({ ...prev, pyramidRows: false }));
        setDraftValues(prev => ({ ...prev, pyramidRows: targetVal }));
        const newCommitted = {
          ...committedValuesRef.current,
          pyramidRows: targetVal,
        };
        committedValuesRef.current = newCommitted;
        if (onCommitSettings) {
          onCommitSettings(newCommitted);
        } else {
          onSettingsChange('pyramidRows', targetVal);
        }
      }
    }

    // Auto turn off shared bus if playerCount drops to <= 3 and it was on (never auto turn on)
    if (prevCount > 3 && playerCount <= 3 && settings.sharedBus) {
      const newCommitted = {
        ...committedValuesRef.current,
        sharedBus: false,
      };
      committedValuesRef.current = newCommitted;
      if (onCommitSettings) {
        onCommitSettings(newCommitted);
      }
      onSettingsChange('sharedBus', false);
    }
  }, [playerCount, t]);

  const [isDragging, setIsDragging] = useState<Record<SliderSettingKey, boolean>>({
    pyramidRows: false,
    busLength: false,
  });
  const lastRoundedRef = useRef<Record<SliderSettingKey, number>>({
    pyramidRows: Math.round(settings.pyramidRows),
    busLength: Math.round(settings.busLength),
  });

  const handleSliderChange = (key: SliderSettingKey, val: number) => {
    if (disabled) return;
    setIsDragging(prev => ({ ...prev, [key]: true }));
    const newRounded = Math.round(val);
    if (newRounded !== lastRoundedRef.current[key]) {
      lastRoundedRef.current[key] = newRounded;
      triggerHaptic('subtle');
    }
    setDraftValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSliderCommit = () => {
    if (disabled) return;
    setIsDragging({ pyramidRows: false, busLength: false });
    const rounded: Record<SliderSettingKey, number> = {
      pyramidRows: Math.round(draftValues.pyramidRows),
      busLength: Math.round(draftValues.busLength),
    };
    
    // Check if values actually changed to avoid redundant saves/renders
    const hasChanged = 
      rounded.pyramidRows !== committedValuesRef.current.pyramidRows ||
      rounded.busLength !== committedValuesRef.current.busLength;

    if (hasChanged) {
      committedValuesRef.current = rounded;
      if (onCommitSettings) {
        onCommitSettings(rounded);
      } else {
        Object.entries(rounded).forEach(([k, v]) => {
          onSettingsChange(k as SliderSettingKey, v);
        });
      }
    }
  };

  const handleRecommendationClick = (key: SliderSettingKey) => {
    if (disabled) return;
    setIsDragging(prev => ({ ...prev, [key]: false }));
    const rec = getSliderRecommendation(key, playerCount, t);
    if (!rec || !rec.values || rec.values.length === 0) return;

    const currentVal = Math.round(draftValues[key]);
    let targetVal: number;

    if (rec.values.length === 1) {
      targetVal = rec.values[0];
    } else {
      if (rec.values.includes(currentVal)) {
        const nextIdx = (rec.values.indexOf(currentVal) + 1) % rec.values.length;
        targetVal = rec.values[nextIdx];
      } else {
        if (currentVal > Math.max(...rec.values)) {
          targetVal = Math.max(...rec.values);
        } else {
          targetVal = Math.min(...rec.values);
        }
      }
    }

    if (targetVal !== currentVal) {
      triggerHaptic('subtle');
      setDraftValues(prev => ({ ...prev, [key]: targetVal }));
      const newCommitted = {
        ...committedValuesRef.current,
        [key]: targetVal,
      };
      committedValuesRef.current = newCommitted;
      if (onCommitSettings) {
        onCommitSettings(newCommitted);
      } else {
        Object.entries(newCommitted).forEach(([k, v]) => {
          onSettingsChange(k as SliderSettingKey, v);
        });
      }
    }
  };

  type SwitchKey = 'sharedBus' | 'doublePyramidCards';
  const [switchDrag, setSwitchDrag] = useState<{ key: SwitchKey; active: boolean; fraction: number; startX: number; rect: DOMRect | null } | null>(null);

  const handleSwitchPointerDown = (key: SwitchKey, e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentFraction = settings[key] ? 1 : 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSwitchDrag({
      key,
      active: true,
      fraction: currentFraction,
      startX: e.clientX,
      rect,
    });
  };

  const handleSwitchPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!switchDrag || !switchDrag.active || !switchDrag.rect) return;
    const travel = switchDrag.rect.width - 26;
    const offset = e.clientX - switchDrag.rect.left - 13;
    const fraction = Math.max(0, Math.min(1, offset / travel));
    setSwitchDrag(prev => prev ? { ...prev, fraction } : null);
  };

  const handleSwitchPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!switchDrag || !switchDrag.active) return;
    const { key, startX, fraction } = switchDrag;
    const isDragMove = Math.abs(e.clientX - startX) > 4;
    let nextVal: boolean;
    if (isDragMove) {
      nextVal = fraction >= 0.5;
    } else {
      nextVal = !settings[key];
    }
    setSwitchDrag(null);
    if (nextVal !== settings[key]) {
      triggerHaptic('subtle');
      const newCommitted = { ...committedValuesRef.current, [key]: nextVal };
      if (onCommitSettings) onCommitSettings(newCommitted);
      onSettingsChange(key, nextVal);
    }
  };

  const [headerDrag, setHeaderDrag] = useState<{ progress: number; isDragging: boolean } | null>(null);
  const headerPointerRef = useRef<{ startY: number; startX: number; initialProgress: number; isDragging: boolean } | null>(null);
  const contentInnerRef = useRef<HTMLDivElement>(null);

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    headerPointerRef.current = {
      startY: e.clientY,
      startX: e.clientX,
      initialProgress: isOpen ? 1 : 0,
      isDragging: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleHeaderPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!headerPointerRef.current) return;
    const innerHeight = contentInnerRef.current?.scrollHeight || 230;
    const dy = e.clientY - headerPointerRef.current.startY;
    const totalDist = Math.hypot(e.clientX - headerPointerRef.current.startX, dy);

    if (!headerPointerRef.current.isDragging && totalDist > 6) {
      headerPointerRef.current.isDragging = true;
    }

    if (headerPointerRef.current.isDragging) {
      let rawProgress: number;
      if (headerPointerRef.current.initialProgress === 0) {
        rawProgress = Math.max(dy / innerHeight, -dy / innerHeight);
      } else {
        rawProgress = 1 - (dy / innerHeight);
      }
      const clamped = Math.max(0, Math.min(1, rawProgress));
      setHeaderDrag({ progress: clamped, isDragging: true });
    }
  };

  const handleHeaderPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!headerPointerRef.current) return;
    const isDrag = headerPointerRef.current.isDragging;
    const startProgress = headerPointerRef.current.initialProgress;
    const currentDragProgress = headerDrag?.progress;
    headerPointerRef.current = null;
    setHeaderDrag(null);

    if (isDrag && typeof currentDragProgress === 'number') {
      if (startProgress === 0 && currentDragProgress > 0.25) {
        triggerHaptic('subtle');
        if (!isOpen) onToggleOpen();
      } else if (startProgress === 1 && currentDragProgress < 0.75) {
        triggerHaptic('subtle');
        if (isOpen) onToggleOpen();
      }
    } else {
      triggerHaptic('subtle');
      onToggleOpen();
    }
  };

  if (!isOpen && hideHeader) return null;

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900 overflow-hidden shadow-xl mb-3 transform-gpu">
      {!hideHeader && (
        <button
          type="button"
          onPointerDown={handleHeaderPointerDown}
          onPointerMove={handleHeaderPointerMove}
          onPointerUp={handleHeaderPointerUp}
          onPointerCancel={() => { headerPointerRef.current = null; setHeaderDrag(null); }}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors cursor-pointer select-none touch-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700/60 shadow-sm">
              <Settings className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-bold text-white text-sm sm:text-base leading-tight">{t("Snelle Instellingen")}</span>
              {(() => {
                const pRec = getSliderRecommendation('pyramidRows', playerCount, t);
                const isPRec = !!pRec && pRec.values.includes(Math.round(draftValues.pyramidRows));
                const bRec = getSliderRecommendation('busLength', playerCount, t);
                const isBRec = !!bRec && bRec.values.includes(Math.round(draftValues.busLength));
                const isSharedBusRec = playerCount > 3;

                return (
                  <div 
                    className={`text-xs text-slate-400 font-medium leading-none transition-[max-height,opacity,margin] duration-200 ease-out overflow-hidden flex items-center gap-1 flex-wrap ${isOpen ? 'max-h-0 opacity-0 mt-0 pointer-events-none' : 'max-h-4 opacity-100 mt-1'}`}
                    style={headerDrag ? { opacity: 1 - headerDrag.progress, transition: 'none' } : undefined}
                  >
                    <span className="flex items-center gap-1">
                      {t("Piramide Hoogte")}: {Math.round(draftValues.pyramidRows)}
                      {isPRec && <Sparkles className="w-3 h-3 text-slate-400 inline shrink-0" />}
                    </span>
                    <span className="mx-0.5">•</span>
                    <span className="flex items-center gap-1">
                      {t("Bus Kaarten")}: {Math.round(draftValues.busLength)}
                      {isBRec && <Sparkles className="w-3 h-3 text-slate-400 inline shrink-0" />}
                    </span>
                    {settings.sharedBus && (
                      <>
                        <span className="mx-0.5">•</span>
                        <span className="flex items-center gap-1">
                          {t("Gedeelde Bus")}
                          {isSharedBusRec && <Sparkles className="w-3 h-3 text-slate-400 inline shrink-0" />}
                        </span>
                      </>
                    )}


                  </div>
                );
              })()}
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 ${
              headerDrag ? '' : `transition-transform duration-250 ${isOpen ? 'rotate-180' : ''}`
            }`}
            style={headerDrag ? { transform: `rotate(${headerDrag.progress * 180}deg)` } : undefined}
          />
        </button>
      )}

      <div 
        className={`overflow-hidden transform-gpu ${
          headerDrag
            ? ''
            : `grid transition-[grid-template-rows,opacity] duration-250 ease-out ${
                isOpen || hideHeader ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`
        }`}
        style={headerDrag ? {
          maxHeight: `${headerDrag.progress * (contentInnerRef.current?.scrollHeight || 230)}px`,
          opacity: Math.min(1, headerDrag.progress * 1.5 + 0.1),
          display: 'block'
        } : undefined}
      >
        <div ref={contentInnerRef} className="overflow-hidden min-h-0">
          <div className={`p-3 sm:p-4 border-t border-slate-700/30 bg-slate-900/60 space-y-4 shadow-inner ${hideHeader ? 'border-t-0 bg-transparent shadow-none' : ''}`}>
          {sliders.map(s => {
            const rec = getSliderRecommendation(s.key, playerCount, t);
            const isRecommendedSelected = !!rec && rec.values.includes(Math.round(draftValues[s.key]));
            const fraction = (draftValues[s.key] - s.min) / (s.max - s.min);
            const posPct = `calc(8px + (100% - 16px) * ${fraction})`;
            const isSliderDragging = isDragging[s.key];

            return (
            <div key={s.key}>
              <div className="flex justify-between items-center mb-2 gap-2 relative">
                <span className="text-xs sm:text-sm font-bold text-slate-300 drop-shadow-md shrink-0">{t(s.label)}</span>

                {/* Absolutely centered prompt slot that never moves when Kans width changes */}
                {s.key === 'busLength' && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-[calc(100%-170px)] h-5 overflow-hidden">
                    {/* Alcoholic expansion prompt (disappears downwards into slider) */}
                    <div 
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                        Math.round(draftValues.busLength) === 12 && !isBusExpanded
                          ? 'opacity-100 translate-y-0 pointer-events-auto'
                          : 'opacity-0 translate-y-3 pointer-events-none'
                      }`}
                    >
                      <span className="text-[10px] sm:text-xs text-slate-400 font-semibold text-center leading-tight flex items-center justify-center">
                        <span className="hidden sm:inline mr-1">{t("Voor echte alcoholisten: wil je het maximum aantal buskaarten verhogen?")}</span>
                        <button 
                          type="button"
                          onClick={() => setIsBusExpanded(true)}
                          className="text-amber-400 font-bold underline hover:text-amber-300 transition-colors inline active:scale-95 whitespace-nowrap"
                        >
                          {t("Vergroot balk")}
                        </button>
                      </span>
                    </div>

                    {/* Verklein balk in same position and font (disappears downwards into slider) */}
                    <div 
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                        isBusExpanded && Math.round(draftValues.busLength) < 12
                          ? 'opacity-100 translate-y-0 pointer-events-auto'
                          : 'opacity-0 translate-y-3 pointer-events-none'
                      }`}
                    >
                      <button 
                        type="button"
                        onClick={() => setIsBusExpanded(false)}
                        className="text-[10px] sm:text-xs text-slate-400 hover:text-slate-200 underline font-semibold transition-colors whitespace-nowrap active:scale-95"
                      >
                        {t("Verklein balk")}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                  {rec?.text && (
                    <div 
                      onClick={() => handleRecommendationClick(s.key)}
                      role="button"
                      tabIndex={0}
                      className={`overflow-hidden transition-all duration-300 ease-out flex items-center cursor-pointer group active:scale-95 ${
                        isRecommendedSelected && rec.values.length === 1
                          ? 'max-w-0 opacity-0 -translate-x-1 pointer-events-none'
                          : 'max-w-[160px] opacity-100 translate-x-0'
                      }`}
                    >
                      <span className="text-[11px] sm:text-xs text-slate-400 group-hover:text-slate-200 font-semibold whitespace-nowrap transition-colors">
                        {t("Aanbevolen")}: {rec.text}
                      </span>
                    </div>
                  )}
                  {s.key === 'busLength' && (
                    <button
                      type="button"
                      onClick={() => handleRecommendationClick('busLength')}
                      className="text-[11px] sm:text-xs text-slate-400 hover:text-slate-200 font-semibold whitespace-nowrap transition-colors active:scale-95 cursor-pointer"
                    >
                      {t("Kans")}: {getBusFinishChance(Math.round(draftValues.busLength))}
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => handleRecommendationClick(s.key)}
                    className={`text-xs sm:text-sm font-black text-white px-2 py-0.5 rounded-lg border transition-all duration-300 active:scale-95 cursor-pointer no-calm-override ${
                      isRecommendedSelected
                        ? (isLineBlueish 
                            ? 'bg-teal-950/70 border-teal-400/60 shadow-[0_0_10px_rgba(45,212,191,0.4)]'
                            : 'bg-blue-950/70 border-blue-400/60 shadow-[0_0_10px_rgba(59,130,246,0.4)]')
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    {Math.round(draftValues[s.key])}
                  </button>
                </div>
              </div>
              <div className="relative w-full h-5 flex items-center">
                {/* Track background */}
                <div className="absolute inset-x-0 h-2 bg-slate-800 rounded-lg overflow-hidden flex items-center border border-white/10">
                  {/* Active fill */}
                  <div 
                    className={`slider-active-fill absolute left-0 top-0 bottom-0 pointer-events-none z-0 ${
                      isSliderDragging ? '' : 'transition-all duration-300 ease-out'
                    }`}
                    style={{ 
                      width: posPct,
                      background: 'var(--theme-accent-gradient, var(--theme-accent, #ef4444))',
                      opacity: 0.85,
                    }} 
                  />

                  {/* Recommended segment glow on slider (mixes with active fill) */}
                  {rec && (() => {
                    const startPct = (rec.startVal - s.min) / (s.max - s.min);
                    const endPct = (rec.endVal - s.min) / (s.max - s.min);
                    return (
                      <div 
                        className={`absolute top-0 bottom-0 pointer-events-none z-10 transition-all duration-300 ease-out`}
                        style={{
                          left: `calc(8px + (100% - 16px) * ${startPct})`,
                          right: `calc(8px + (100% - 16px) * ${1 - endPct})`,
                        }}
                      >
                        <div 
                          className={`w-full h-full rounded-sm opacity-60 no-calm-override ${
                            isLineBlueish
                              ? 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.7)]'
                              : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]'
                          }`} 
                          style={{
                            backgroundColor: isLineBlueish ? '#2dd4bf' : '#3b82f6',
                            boxShadow: isLineBlueish ? '0 0 8px rgba(45,212,191,0.7)' : '0 0 8px rgba(59,130,246,0.7)',
                          }}
                        />
                      </div>
                    );
                  })()}
                </div>

                {/* Switch threshold lines where numbers actually flip (e.g. 3.5, 4.5, etc.) */}
                <div className="absolute inset-x-0 h-3 flex items-center pointer-events-none z-10">
                  {Array.from({ length: s.max - s.min }).map((_, i) => {
                    const thresh = s.min + i + 0.5;
                    const threshFraction = (thresh - s.min) / (s.max - s.min);
                    const isPast = draftValues[s.key] >= thresh;
                    return (
                      <div 
                        key={thresh} 
                        className={`absolute w-[1.5px] h-2.5 rounded-full -translate-x-1/2 transition-all duration-300 ease-out ${
                          isPast ? 'bg-white/60 shadow-[0_0_3px_rgba(255,255,255,0.6)]' : 'bg-slate-600/70'
                        }`} 
                        style={{
                          left: `calc(8px + (100% - 16px) * ${threshFraction})`
                        }}
                      />
                    );
                  })}
                </div>

                {/* Custom Animated Thumb Knob linked with fill */}
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white pointer-events-none z-30 shadow-[0_0_10px_rgba(0,0,0,0.5),0_0_4px_var(--theme-accent)] no-calm-override ${
                    isSliderDragging ? 'scale-115' : 'transition-all duration-300 ease-out'
                  } ${
                    isRecommendedSelected 
                      ? (isLineBlueish
                          ? '!border-teal-200 !shadow-[0_0_14px_rgba(45,212,191,0.9),0_0_4px_#2dd4bf]'
                          : '!border-blue-200 !shadow-[0_0_14px_rgba(59,130,246,0.9),0_0_4px_#3b82f6]')
                      : ''
                  }`}
                  style={{
                    left: posPct,
                    background: isRecommendedSelected 
                      ? (isLineBlueish ? '#2dd4bf' : '#3b82f6') 
                      : 'var(--theme-accent-gradient, var(--theme-accent, #ef4444))'
                  }}
                />

                {/* Invisible Range Input for Drag & Touch Interaction */}
                <input 
                  type="range" 
                  min={s.min} 
                  max={s.max} 
                  step="any"
                  value={draftValues[s.key]}
                  onMouseDown={() => setIsDragging(prev => ({ ...prev, [s.key]: true }))}
                  onTouchStart={() => setIsDragging(prev => ({ ...prev, [s.key]: true }))}
                  onChange={(e) => handleSliderChange(s.key, parseFloat(e.target.value))}
                  onInput={(e) => handleSliderChange(s.key, parseFloat((e.target as HTMLInputElement).value))}
                  onMouseUp={handleSliderCommit}
                  onTouchEnd={handleSliderCommit}
                  className="custom-slider-invisible absolute inset-0 z-40 cursor-grab active:cursor-grabbing"
                />
              </div>
            </div>
            );
          })}

          {/* Gedeelde Bus Toggle */}
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
            <span className="text-xs sm:text-sm font-bold text-slate-300">
              {t("Gedeelde Bus")}
            </span>

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {playerCount > 3 && (
                <div 
                  onClick={() => {
                    if (disabled) return;
                    triggerHaptic('subtle');
                    const newCommitted = { ...committedValuesRef.current, sharedBus: true };
                    if (onCommitSettings) onCommitSettings(newCommitted);
                    onSettingsChange('sharedBus', true);
                  }}
                  role="button"
                  tabIndex={0}
                  className={`overflow-hidden transition-all duration-300 ease-out flex items-center cursor-pointer group active:scale-95 ${
                    settings.sharedBus 
                      ? 'max-w-0 opacity-0 -translate-x-1 pointer-events-none' 
                      : 'max-w-[160px] opacity-100 translate-x-0'
                  }`}
                >
                  <span className="text-[11px] sm:text-xs text-slate-400 group-hover:text-slate-200 font-semibold whitespace-nowrap transition-colors">
                    {t("Aanbevolen")}: {t("Aan")}
                  </span>
                </div>
              )}
              {/* Slideable & Centered Switch */}
              {(() => {
                const isDraggingSwitch = Boolean(switchDrag?.active && switchDrag.key === 'sharedBus');
                const activeFraction = (switchDrag && switchDrag.key === 'sharedBus') 
                  ? switchDrag.fraction 
                  : (settings.sharedBus ? 1 : 0);
                const isVisualActive = activeFraction >= 0.5;
                const knobLeft = `calc(3px + (100% - 26px) * ${activeFraction})`;

                return (
                  <div
                    role="switch"
                    aria-checked={settings.sharedBus}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        if (disabled) return;
                        const nextVal = !settings.sharedBus;
                        triggerHaptic('subtle');
                        const newCommitted = { ...committedValuesRef.current, sharedBus: nextVal };
                        if (onCommitSettings) onCommitSettings(newCommitted);
                        onSettingsChange('sharedBus', nextVal);
                      }
                    }}
                    onPointerDown={(e) => handleSwitchPointerDown('sharedBus', e)}
                    onPointerMove={handleSwitchPointerMove}
                    onPointerUp={handleSwitchPointerUp}
                    onPointerCancel={handleSwitchPointerUp}
                    className={`w-12 h-6.5 rounded-full relative cursor-pointer select-none touch-none no-calm-override ${
                      isDraggingSwitch ? '' : 'transition-colors duration-300'
                    } ${
                      isVisualActive
                        ? (playerCount > 3
                            ? (isLineBlueish 
                                ? 'bg-teal-500 shadow-[0_0_12px_rgba(45,212,191,0.5)] border border-teal-400/50' 
                                : 'bg-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.5)] border border-blue-400/50')
                            : 'border border-white/20 shadow-md')
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                    style={{
                      background: isVisualActive 
                        ? (playerCount > 3 ? (isLineBlueish ? '#14b8a6' : '#2563eb') : 'var(--theme-accent-gradient, var(--theme-accent, #ef4444))')
                        : undefined
                    }}
                  >
                    <div 
                      className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-md pointer-events-none ${
                        isDraggingSwitch ? 'scale-105' : 'transition-all duration-300 ease-out'
                      }`}
                      style={{
                        left: knobLeft,
                      }} 
                    />
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Dubbele Kaarten Toggle */}
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold mt-2">
            <span className="text-xs sm:text-sm font-bold text-slate-300">
              {t("Dubbele kaarten in de piramide")}
            </span>

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {/* Slideable & Centered Switch */}
              {(() => {
                const isDraggingSwitch = Boolean(switchDrag?.active && switchDrag.key === 'doublePyramidCards');
                const activeFraction = (switchDrag && switchDrag.key === 'doublePyramidCards') 
                  ? switchDrag.fraction 
                  : (settings.doublePyramidCards ? 1 : 0);
                const isVisualActive = activeFraction >= 0.5;
                const knobLeft = `calc(3px + (100% - 26px) * ${activeFraction})`;

                return (
                  <div
                    role="switch"
                    aria-checked={settings.doublePyramidCards}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        if (disabled) return;
                        const nextVal = !settings.doublePyramidCards;
                        triggerHaptic('subtle');
                        const newCommitted = { ...committedValuesRef.current, doublePyramidCards: nextVal };
                        if (onCommitSettings) onCommitSettings(newCommitted);
                        onSettingsChange('doublePyramidCards', nextVal);
                      }
                    }}
                    onPointerDown={(e) => handleSwitchPointerDown('doublePyramidCards', e)}
                    onPointerMove={handleSwitchPointerMove}
                    onPointerUp={handleSwitchPointerUp}
                    onPointerCancel={handleSwitchPointerUp}
                    className={`w-12 h-6.5 rounded-full relative cursor-pointer select-none touch-none no-calm-override ${
                      isDraggingSwitch ? '' : 'transition-colors duration-300'
                    } ${
                      isVisualActive
                        ? 'border border-white/20 shadow-md'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                    style={{
                      background: isVisualActive 
                        ? 'var(--theme-accent-gradient, var(--theme-accent, #ef4444))'
                        : undefined
                    }}
                  >
                    <div 
                      className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-md pointer-events-none ${
                        isDraggingSwitch ? 'scale-105' : 'transition-all duration-300 ease-out'
                      }`}
                      style={{
                        left: knobLeft,
                      }} 
                    />
                  </div>
                );
              })()}
            </div>
          </div>

          <button 
            onClick={onOpenMoreSettings}
            className="w-full mt-4 py-2.5 sm:py-3 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-xl font-bold transition-all active:scale-95 hover:brightness-110 border border-slate-600 shadow-md text-sm sm:text-base"
          >
            {t("Meer Instellingen")}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
