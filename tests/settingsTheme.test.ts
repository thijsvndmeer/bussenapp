import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getRecommendedHighlightColor } from '../components/SettingsPanel';

describe('Settings & Modals Theme Harmony', () => {
  const settingsFile = path.resolve(__dirname, '../components/SettingsPanel.tsx');
  const settingsContent = fs.readFileSync(settingsFile, 'utf-8');

  it('resolves activeAccentColor for stars and metro in SettingsPanel', () => {
    expect(settingsContent).toContain("settings?.theme === 'stars'");
  });

  it('provides a calibrated color wheel with visible pin handle, forced 75% brightness, and no color ID text', () => {
    const modalFile = path.resolve(__dirname, '../components/modals/ColorPickerModal.tsx');
    const modalContent = fs.readFileSync(modalFile, 'utf-8');

    // Calibrated HSL conic gradient matching standard degrees at 75% brightness
    expect(modalContent).toContain('conic-gradient(');
    expect(modalContent).toContain('hsl(0, 80%, 75%)');
    expect(modalContent).toContain('hsl(180, 80%, 75%)');
    expect(modalContent).toContain('hsl(360, 80%, 75%)');

    // Visible handle positioned by pinX/pinY
    expect(modalContent).toContain('left: `${pinX}%`');
    expect(modalContent).toContain('top: `${pinY}%`');

    // Pointer capture for flawless touch/mouse tracking
    expect(modalContent).toContain('setPointerCapture');
    expect(modalContent).toContain('releasePointerCapture');

    // Always forced 75% brightness
    expect(modalContent).toContain('hslToHex(hue, 80, 75)');

    // No color ID text and no brightness slider
    expect(modalContent).not.toContain('toUpperCase()');
    expect(modalContent).not.toContain('{hue}°');
    expect(modalContent).not.toContain('type="range"');
  });

  it('renders expandable thin horizontal bar slider with animate-hand-tray-enter in App.tsx', () => {
    const appFile = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appFile, 'utf-8');

    expect(appContent).toContain('animate-hand-tray-enter');
    expect(appContent).toContain('calm-hue-slider');
    expect(appContent).toContain('hsl(0, 80%, 75%)');
    expect(appContent).toContain('hslToHex(val, 80, 75)');
    expect(appContent).toContain('setIsColorPickerOpen(prev => !prev)');
    expect(appContent).toContain('isBarVisible = isPickerSelected && isOpen');
    expect(appContent).toContain('onPointerUp={(e) => commitColor(Number((e.target as HTMLInputElement).value))}');
    expect(appContent).toContain("el.addEventListener('change', handleNativeChange)");
    expect(appContent).toContain('shouldAnimateEntry ? \'animate-hand-tray-enter\' : \'\'');
    expect(appContent).toContain('setShouldAnimateEntry(true)');
    expect(appContent).not.toContain('pt-2 animate-in slide-in-from-top-2 duration-300">\n                    <h4 className="text-white font-medium">{t("Calm Accent Kleur")}');
  });

  it('uses subtle micro-vibration haptic for setting and accent color changes', () => {
    const hapticsFile = path.resolve(__dirname, '../services/haptics.ts');
    const hapticsContent = fs.readFileSync(hapticsFile, 'utf-8');

    expect(hapticsContent).toContain("'subtle'");
    expect(hapticsContent).toContain('duration: 3');
    expect(hapticsContent).toContain('subtle: 3');

    const appFile = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appFile, 'utf-8');
    expect(appContent).toContain("triggerHaptic('subtle')");

    const settingsPanelFile = path.resolve(__dirname, '../components/SettingsPanel.tsx');
    const settingsPanelContent = fs.readFileSync(settingsPanelFile, 'utf-8');
    expect(settingsPanelContent).toContain("triggerHaptic('subtle')");
  });

  it('renders theme-dependent scroll indicators without pulse animation across scrollable containers', () => {
    const appFile = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appFile, 'utf-8');

    // Scroll indicators are theme dependent and have pulse animation removed
    expect(appContent).toContain('getThemeScrollColors');
    expect(appContent).toContain('ScrollIndicatorContainer');
    expect(appContent).not.toContain('ChevronLeft size={12} className="text-amber-400 drop-shadow animate-pulse"');
    expect(appContent).not.toContain('ChevronRight size={12} className="text-amber-400 drop-shadow animate-pulse"');

    // PlayerList uses ScrollIndicatorContainer with theme support
    const playerListFile = path.resolve(__dirname, '../components/PlayerList.tsx');
    const playerListContent = fs.readFileSync(playerListFile, 'utf-8');
    expect(playerListContent).toContain('ScrollIndicatorContainer');
    expect(playerListContent).toContain('theme');

    // PatchNotesModal uses ScrollIndicatorContainer with theme support
    const patchNotesFile = path.resolve(__dirname, '../components/modals/PatchNotesModal.tsx');
    const patchNotesContent = fs.readFileSync(patchNotesFile, 'utf-8');
    expect(patchNotesContent).toContain('ScrollIndicatorContainer');
  });

  it('unifies switch style and switch theme modals into shared renderUnlockModal and removes bottom gradient line', () => {
    const appFile = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appFile, 'utf-8');

    // Both style and theme unlock modals delegate to renderUnlockModal
    expect(appContent).toContain('const renderUnlockModal = ({');
    expect(appContent).toMatch(/const renderStyleUnlockModal = \(\) => {[\s\S]*?return renderUnlockModal\(\{/);
    expect(appContent).toMatch(/const renderThemeUnlockModal = \(\) => {[\s\S]*?return renderUnlockModal\(\{/);

    // 3D watch video button styling with bevel shadow and push-down active state
    expect(appContent).toContain('shadow-[0_8px_0_rgb(180,83,9)]');
    expect(appContent).toContain('active:translate-y-1 active:shadow-none');

    // No bottom gradient line
    expect(appContent).not.toContain('bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mt-4');
  });

  it('configures recommended area colors dynamically: blue for mint/red/gold lines, mint for blue lines', () => {
    const currentSettingsContent = fs.readFileSync(settingsFile, 'utf-8');

    // Mint and Cyan lines (#2dd4bf, #8cf2f2, #8ce1f2, #38bdf8) -> must NEVER be mint, must be blue!
    expect(getRecommendedHighlightColor('#2dd4bf')).toBe('blue');
    expect(getRecommendedHighlightColor('#8cf2f2')).toBe('blue');
    expect(getRecommendedHighlightColor('#8ce1f2')).toBe('blue');
    expect(getRecommendedHighlightColor('#38bdf8')).toBe('blue');

    // Distinct Blue lines (Periwinkle #818cf8, Tailwind Blue #3b82f6, Pure Blue #0000ff) -> must be mint!
    expect(getRecommendedHighlightColor('#818cf8')).toBe('mint');
    expect(getRecommendedHighlightColor('#3b82f6')).toBe('mint');
    expect(getRecommendedHighlightColor('#0000ff')).toBe('mint');

    // Other lines (Classic red #ef4444, Rose #fb7185, Gold #fbcd53, Beer amber #ff3333) -> default blue
    expect(getRecommendedHighlightColor('#ef4444')).toBe('blue');
    expect(getRecommendedHighlightColor('#fb7185')).toBe('blue');
    expect(getRecommendedHighlightColor('#fbcd53')).toBe('blue');
    expect(getRecommendedHighlightColor('#ff3333')).toBe('blue');

    // Uses getRecommendedHighlightColor with currentLineColor
    expect(currentSettingsContent).toContain("settings?.theme === 'calm' ? (settings.calmAccentColor || '#fb7185')");
    expect(currentSettingsContent).toContain("const isLineBlueish = getRecommendedHighlightColor(currentLineColor) === 'mint';");

    // Does not use red for recommended selected
    expect(currentSettingsContent).not.toContain("? (isAccentBlueish ? '#ef4444' : '#3b82f6')");
    expect(currentSettingsContent).toMatch(/isRecommendedSelected[\s\n]+\? \(isLineBlueish \? '#2dd4bf' : '#3b82f6'\)/);

    // Mint green is alternative color
    expect(currentSettingsContent).toContain('bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.7)]');
    expect(currentSettingsContent).toContain('bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]');
  });

  it('renders card style preview using the same in-modal overlay UI as berichten', () => {
    const appFile = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appFile, 'utf-8');

    // Uses in-modal overlay with slide enter/exit animations identical to phrase editor
    expect(appContent).toContain('previewDeckStyle && (');
    expect(appContent).toContain("isDeckPreviewClosing ? 'animate-slide-right-exit pointer-events-none' : 'animate-slide-left-enter'");
    expect(appContent).toContain('handleDeckPreviewBack');
    expect(appContent).toContain('PREVIEW_SAMPLE_CARDS');

    // No standalone fixed-modal renderDeckPreview
    expect(appContent).not.toContain('const renderDeckPreview = () => {');
    // Switching styles through preview overlay uses the exact same setStyleToUnlock code and popup
    expect(appContent).toContain('setStyleToUnlock(previewDeckStyle);');

    // Unlock modal stacks on top with zIndex z-[200], preserving preview UI underneath
    expect(appContent).toContain('zIndex="z-[200]"');

    // Switching styles also closes the card style preview menu
    expect(appContent).toMatch(/onUnlock:\s*async\s*\(\)\s*=>[\s\S]*?handleDeckPreviewBack\(\);/);
  });
});

