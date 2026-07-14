import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';

export type SliderSettingKey = 'pyramidRows' | 'busLength' | 'busDecks';

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
  t: (key: string) => string;
  onToggleOpen: () => void;
  onOpenMoreSettings: () => void;
  onSettingsChange: (key: SliderSettingKey, val: number) => void;
  onCommitSettings: () => void;
}

const sliders: SliderConfig[] = [
  { key: 'pyramidRows', label: 'Piramide Hoogte', min: 3, max: 7 },
  { key: 'busLength', label: 'Bus Kaarten', min: 3, max: 12 },
  { key: 'busDecks', label: 'Bus Pakjes', min: 1, max: 5 },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  disabled = false,
  hideHeader = false,
  settings,
  t,
  onToggleOpen,
  onOpenMoreSettings,
  onSettingsChange,
  onCommitSettings,
}) => {
  const currentSliderValues = {
    pyramidRows: settings.pyramidRows,
    busLength: settings.busLength,
    busDecks: settings.busDecks,
  };
  const [draftValues, setDraftValues] = useState<Record<SliderSettingKey, number>>(currentSliderValues);
  const committedValuesRef = useRef<Record<SliderSettingKey, number>>(currentSliderValues);

  useEffect(() => {
    setDraftValues(currentSliderValues);
    committedValuesRef.current = currentSliderValues;
  }, [settings.pyramidRows, settings.busLength, settings.busDecks]);

  const handleSliderChange = (key: SliderSettingKey, val: number) => {
    if (disabled) return;
    setDraftValues(prev => ({ ...prev, [key]: val }));
    // Do not call onSettingsChange here to prevent re-rendering the whole app on every slider tick, ensuring a smooth ("gradual") slider experience.
  };

  const handleSliderCommit = () => {
    if (disabled) return;
    // Commit to parent state
    Object.entries(draftValues).forEach(([k, v]) => {
      onSettingsChange(k as SliderSettingKey, Math.round(v as number));
    });
    onCommitSettings();
    committedValuesRef.current = {
      pyramidRows: Math.round(draftValues.pyramidRows),
      busLength: Math.round(draftValues.busLength),
      busDecks: Math.round(draftValues.busDecks)
    };
  };

  if (!isOpen && hideHeader) return null;

  return (
    <div className={`mt-4 w-full bg-slate-900/60 rounded-2xl border border-slate-700/50 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {!hideHeader && (
        <button 
          onClick={onToggleOpen}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-slate-800/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
              <Settings size={16} className="text-slate-400" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-bold text-slate-200 text-sm sm:text-base">{t("Snelle Instellingen")}</span>
              <div 
                className={`text-xs text-slate-400 font-medium leading-none transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-0 opacity-0 mt-0' : 'max-h-4 opacity-100 mt-1'}`}
              >
                {Math.round(draftValues.pyramidRows)} {t("Piramide Rijen")} • {Math.round(draftValues.busLength)} {t("Bus Kaarten")}
              </div>
            </div>
          </div>
          {isOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
        </button>
      )}

      <div 
        className="transition-all duration-300 ease-in-out overflow-hidden" 
        style={{ 
          maxHeight: isOpen || hideHeader ? '500px' : '0px',
          opacity: isOpen || hideHeader ? 1 : 0
        }}
      >
        <div className={`p-3 sm:p-4 border-t border-slate-700/30 bg-slate-900/40 space-y-4 shadow-inner ${hideHeader ? 'border-t-0 bg-transparent shadow-none' : ''}`}>
          {sliders.map(s => (
            <div key={s.key}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm font-bold text-slate-300 drop-shadow-md">{t(s.label)}</span>
                <span className="text-xs sm:text-sm font-black text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">{Math.round(draftValues[s.key])}</span>
              </div>
              <input 
                type="range" 
                min={s.min} 
                max={s.max} 
                step="0.01"
                value={draftValues[s.key]}
                onChange={(e) => handleSliderChange(s.key, parseFloat(e.target.value))}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: 'var(--theme-accent)' }}
              />
            </div>
          ))}

          <button 
            onClick={onOpenMoreSettings}
            className="w-full mt-4 py-2.5 sm:py-3 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-xl font-bold transition-colors border border-slate-600 shadow-md text-sm sm:text-base"
          >
            {t("Meer Instellingen")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
