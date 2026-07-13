

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

  const commitSliderValue = (key: SliderSettingKey) => {
    if (disabled) return;
    const draftValue = draftValues[key];
    if (draftValue === committedValuesRef.current[key]) return;

    committedValuesRef.current = { ...committedValuesRef.current, [key]: draftValue };
    const nextSettings = { ...settings, [key]: draftValue };
    onSettingsChange(nextSettings);
    onCommitSettings(nextSettings);
  };

  const toggleSetting = (key: 'sharedBus' | 'doublePyramidCards') => {
    if (disabled) return;
    const nextSettings = { ...settings, [key]: !settings[key] };
    onSettingsChange(nextSettings);
    onCommitSettings(nextSettings);
  };

  return (
    <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden transition-all duration-300">
      {!hideHeader && (
        <button
          onClick={onToggleOpen}
          className="w-full flex items-center justify-between p-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Settings size={14} /> {t('Instellingen')}
          </div>
          <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
            <ChevronDown size={14} />
          </div>
        </button>
      )}

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen || hideHeader ? 'max-h-96' : 'max-h-0'}`}>
        <div className="p-4 space-y-4 bg-black/20 border-t border-slate-800">
          {sliders.map(({ key, label, min, max }) => (
            <div key={key}>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase">{t(label)}</label>
                <span className="text-red-500 font-bold text-sm">{draftValues[key]}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step="1"
                disabled={disabled}
                value={draftValues[key]}
                onChange={(e) => { if (!disabled) setDraftValues((current) => ({ ...current, [key]: parseInt(e.target.value, 10) }))}}
                onPointerUp={() => commitSliderValue(key)}
                onTouchEnd={() => commitSliderValue(key)}
                onMouseUp={() => commitSliderValue(key)}
                onBlur={() => commitSliderValue(key)}
                className={`w-full accent-red-500 h-2 bg-slate-700 rounded-lg appearance-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              />
            </div>
          ))}

          <div className={`flex items-center justify-between pt-2 ${disabled ? 'opacity-50' : ''}`}>
            <label className="text-[10px] text-slate-400 font-bold uppercase">{t('Gedeelde Bus')}</label>
            <button disabled={disabled} onClick={() => toggleSetting('sharedBus')} className={`w-12 h-6 rounded-full relative transition-all ${settings.sharedBus ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-700'} ${disabled ? 'cursor-not-allowed' : ''}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.sharedBus ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          <div className={`flex items-center justify-between pt-2 ${disabled ? 'opacity-50' : ''}`}>
            <label className="text-[10px] text-slate-400 font-bold uppercase">{t('Dubbele kaarten in de piramide')}</label>
            <button disabled={disabled} onClick={() => toggleSetting('doublePyramidCards')} className={`w-12 h-6 rounded-full relative transition-all ${settings.doublePyramidCards ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-700'} ${disabled ? 'cursor-not-allowed' : ''}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.doublePyramidCards ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          <button
            onClick={() => { if (!disabled) onOpenMoreSettings(); }}
            disabled={disabled}
            className={`w-full mt-4 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-inner border border-slate-700 ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
          >
            {t('Meer Instellingen')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
