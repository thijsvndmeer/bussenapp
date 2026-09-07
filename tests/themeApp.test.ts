import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('App Theme Synchronization', () => {
  const appPath = path.resolve(__dirname, '../App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  it('sets root variables for STARS theme in theme effect', () => {
    expect(appContent).toContain("settings.theme === UITheme.STARS");
    expect(appContent).toMatch(/setProperty\('--theme-accent',\s*'#f1f5f9'\)/);
    expect(appContent).toMatch(/setProperty\('--theme-accent-secondary',\s*'#c084fc'\)/);
    expect(appContent).toMatch(/setProperty\('--theme-accent-gradient',\s*'linear-gradient\(135deg,\s*#f1f5f9/);
  });

  it('sets light heineken red accent and beer color tertiary for BEER theme in theme effect', () => {
    expect(appContent).toContain("settings.theme === UITheme.BEER");
    expect(appContent).toMatch(/setProperty\('--theme-accent',\s*'#ff3333'\)/);
    expect(appContent).toMatch(/setProperty\('--theme-tertiary',\s*'#f59e0b'\)/);
    expect(appContent).toMatch(/setProperty\('--theme-accent-tertiary',\s*'#f59e0b'\)/);
  });

  it('defines an active slot specifically for UITheme.STARS in renderActiveSlot', () => {
    expect(appContent).toMatch(/settings\.theme === UITheme\.STARS[\s\S]*?renderActiveSlot/);
  });

  it('renders to the bus button matching start game button structure and themes', () => {
    expect(appContent).toContain('renderToTheBusButton');
    // Verifies theme branches matching START SPEL design
    expect(appContent).toContain('settings.theme === UITheme.STARS');
    expect(appContent).toContain('settings.theme === UITheme.CALM');
    expect(appContent).toContain('settings.theme === UITheme.METRO');
    expect(appContent).toContain('settings.theme === UITheme.BEER');
    // Verifies bus icon in right circular badge
    expect(appContent).toMatch(/<Bus\s+size=\{20\}/);
    // Verifies usage in pyramid complete proceed container
    expect(appContent).toContain('{renderToTheBusButton(proceedToBus');
  });

  it('adds margin in calm theme for the bus and passenger header text', () => {
    // Left title and passenger container has calm theme left margin
    expect(appContent).toMatch(/flex flex-col justify-center min-w-0 gap-1 sm:gap-1\.5 \$\{settings\.theme === UITheme\.CALM \? 'ml-3 sm:ml-4' : ''\}/);
  });

  it('centers the x cards pill vertically in the bus header', () => {
    expect(appContent).toMatch(/flex items-center justify-between p-3 sm:px-5 gap-3 \$\{getHeaderClasses\(\)\} !mb-0/);
    expect(appContent).toMatch(/flex items-center gap-2 sm:gap-3 flex-nowrap justify-end shrink-0 min-w-0/);
    expect(appContent).toContain('{remainingBusCards} {t("kaarten")}');
  });

  it('restores touch functionality and visibility to the dev menu in the bus phase', () => {
    // Header container in bus phase has relative z-30
    expect(appContent).toMatch(/className="flex-none px-2 sm:px-4 pt-2 relative z-30"/);
    // Dev menu is visible if any passenger or player is dev or devModeArmed
    expect(appContent).toMatch(/if \(phase === GamePhase\.THE_BUS \|\| phase === GamePhase\.BUS_TEAM_SELECTION\) return busPassengers\.some\(p => p\.isDev\) \|\| players\.some\(p => p\.isDev\) \|\| devModeArmed;/);
    // Header pointer down in bus phase arms and toggles dev mode
    expect(appContent).toMatch(/if \(phase === GamePhase\.THE_BUS \|\| phase === GamePhase\.BUS_TEAM_SELECTION\) \{[\s\S]*?const anyDev = busPassengers\.some\(p => p\.isDev\);[\s\S]*?busPassengers\.forEach/);
    // Passenger text has pointer handlers
    expect(appContent).toMatch(/onPointerDown=\{\(\) => \{[\s\S]*?const target = busPassengers\[0\] \|\| players\[0\];[\s\S]*?if \(target\) handleAvatarPointerDown\(target\);/);
    // Bus card peek pointer down allows peeking when dev mode armed or players/passengers dev
    expect(appContent).toMatch(/onPointerDown=\{\(\) => devSettings\.peekCards && \(busPassengers\.some\(p => p\.isDev\) \|\| players\.some\(p => p\.isDev\) \|\| devModeArmed\) && setPreviewCardId\(card\.id\)\}/);
  });

  it('renders sips drunk and distributed sips in pyramid current hand modal similar to card guess UI', () => {
    // Shows text for sips drunk and sips distributed
    expect(appContent).toContain('{t("Slokken gedronken")}');
    expect(appContent).toContain('{t("Slokken uitgedeeld")}');
    // Uses Gift icon for distributed sips instead of Sparkles
    expect(appContent).toMatch(/<Gift\s+size=\{12\}/);
    expect(appContent).toMatch(/currentPlayerObj\.drinksDistributed/);
    expect(appContent).toMatch(/currentPlayerObj\.drinksTaken/);
    // Vertical column layout similar to card guess phase
    expect(appContent).toMatch(/flex flex-col items-end leading-none/);
  });

  it('uses the same correct/wrong feedback message UI, size, and position in the bus round as in card guess rounds', () => {
    // Bus controls container uses the same card-guess feedback box structure
    expect(appContent).toMatch(/p-4 rounded-2xl text-center font-black text-lg border-2 shadow-2xl backdrop-blur-md[\s\S]*?bg-emerald-950\/90 border-emerald-400 text-emerald-100 shadow-\[0_0_35px_rgba\(16,185,129,0\.3\)\] animate-feedback-success[\s\S]*?bg-red-950\/90 border-red-400 text-white shadow-\[0_0_35px_rgba\(239,68,68,0\.3\)\] animate-feedback-error/);
    // Checks that in the bus phase, feedback replaces guess controls in max-w-md mx-auto
    const busSection = appContent.substring(appContent.indexOf('{/* Controls */}'));
    expect(busSection).toContain('{feedback ? (');
    expect(busSection).toContain('p-4 rounded-2xl text-center font-black text-lg border-2 shadow-2xl backdrop-blur-md');
  });

  it('removes pulse animation type indicator cursor from THE BUS text in bus theme', () => {
    const themeComponentsPath = path.resolve(__dirname, '../src/components/ui/ThemeComponents.tsx');
    const themeComponentsContent = fs.readFileSync(themeComponentsPath, 'utf-8');

    // ThemeLabel showCursor defaults to false and gates animate-pulse behind showCursor
    expect(themeComponentsContent).toContain('showCursor = false');
    expect(themeComponentsContent).toMatch(/isLg\s*&&\s*showCursor\s*&&\s*<span className="inline-block ml-4 w-3 h-6 bg-\[var\(--theme-accent\)\] animate-pulse" \/>/);

    // De Bus and Gedeelde Bus headers explicitly disable cursor indicator
    expect(appContent).toContain('<ThemeLabel text={t("De Bus")} theme={settings.theme} size="lg" showCursor={false} />');
    expect(appContent).toContain('<ThemeLabel text={t("Gedeelde Bus")} theme={settings.theme} size="lg" showCursor={false} />');
  });
});
