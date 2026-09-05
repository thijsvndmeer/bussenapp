import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

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
});
