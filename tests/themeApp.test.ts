import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('App Theme Synchronization', () => {
  const appPath = path.resolve(__dirname, '../App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  it('sets root variables for STARS theme in theme effect', () => {
    expect(appContent).toContain("settings.theme === UITheme.STARS");
    expect(appContent).toMatch(/setProperty\('--theme-accent',\s*'#e2e8f0'\)/);
    expect(appContent).toMatch(/setProperty\('--theme-accent-secondary',\s*'#f8fafc'\)/);
    expect(appContent).toMatch(/setProperty\('--theme-accent-gradient',\s*'linear-gradient\(135deg,\s*#ffffff/);
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

  it('does not pulse the avatar on the Aan de beurt screen', () => {
    expect(appContent).toContain('text={t("Aan de beurt")}');
    expect(appContent).not.toMatch(/<PlayerAvatar\s+player=\{activePlayer\}\s+size="xl"\s+glow/);
  });

  it('implements epic cinematic To the Bus transition animations and overlay UI with moving parts', () => {
    const animPath = path.resolve(__dirname, '../styles/animations.css');
    const animContent = fs.readFileSync(animPath, 'utf-8');

    // Keyframe animations and utility classes for real moving vehicle physics
    expect(animContent).toContain('@keyframes busDriveSequence');
    expect(animContent).toContain('@keyframes busSuspensionTilt');
    expect(animContent).toContain('@keyframes busWheelRoll');
    expect(animContent).toContain('@keyframes busRoadMove');
    expect(animContent).toContain('@keyframes exhaustCloud1');
    expect(animContent).toContain('@keyframes busHazardFlash');
    expect(animContent).toContain('@keyframes busStampImpact');
    expect(animContent).toContain('.animate-bus-drive');
    expect(animContent).toContain('.animate-bus-suspension');
    expect(animContent).toContain('.animate-bus-wheel');
    expect(animContent).toContain('.animate-bus-road');
    expect(animContent).toContain('.animate-bus-exhaust-1');
    expect(animContent).toContain('.animate-bus-hazard');
    expect(animContent).toContain('.animate-bus-stamp');

    // AnimatedPartyBus component
    const busPath = path.resolve(__dirname, '../components/AnimatedPartyBus.tsx');
    expect(fs.existsSync(busPath)).toBe(true);
    const busContent = fs.readFileSync(busPath, 'utf-8');
    expect(busContent).toContain('animate-bus-drive');
    expect(busContent).toContain('animate-bus-suspension');
    expect(busContent).toContain('animate-bus-wheel');
    expect(busContent).toContain('animate-bus-exhaust-1');
    expect(busContent).toContain('animate-bus-hazard');
    expect(busContent).toContain('PlayerAvatar');

    // BusTransitionOverlay implementation in App.tsx
    expect(appContent).toContain('AnimatedPartyBus');
    expect(appContent).toContain('BusTransitionOverlay');
    expect(appContent).toContain('animate-bus-stamp');
    expect(appContent).toContain('{isDuo ? t("Samen in de bus!") : t("Naar de Bus!")}');
  });

  it('implements bus crash through pyramid cards, header morph, and staggered bus card deal-in', () => {
    const animPath = path.resolve(__dirname, '../styles/animations.css');
    const animContent = fs.readFileSync(animPath, 'utf-8');

    // Crash and deal keyframes and classes
    expect(animContent).toContain('@keyframes busCrashAcross');
    expect(animContent).toContain('.animate-bus-crash');
    expect(animContent).toContain('@keyframes busCrashWheelRoll');
    expect(animContent).toContain('.animate-bus-crash-wheel');
    expect(animContent).toContain('@keyframes busCrashSuspension');
    expect(animContent).toContain('.animate-bus-crash-suspension');
    expect(animContent).toContain('@keyframes busCardDealIn');
    expect(animContent).toContain('.animate-bus-card-deal');

    // AnimatedPartyBus supports crash mode
    const busPath = path.resolve(__dirname, '../components/AnimatedPartyBus.tsx');
    const busContent = fs.readFileSync(busPath, 'utf-8');
    expect(busContent).toContain('isCrash?: boolean');
    expect(busContent).toContain('animate-bus-crash-wheel');

    // App.tsx crash sequence, header morph, card scatter, and card deal-in cascade
    const appPath = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain('isBusCrashing');
    expect(appContent).toContain('pyramidScatterCards');
    expect(appContent).toContain('setPyramidScatterCards(true)');
    expect(appContent).toContain('{isBusCrashing ? (');
    expect(appContent).toContain('animate-bus-crash');
    expect(appContent).toContain('isCrash={true}');
    expect(appContent).toContain('animate-bus-card-deal');
    expect(appContent).toContain('animationDelay: `${index * 0.08}s`');
  });

  it('implements in-place shared bus partner selection with paused bus animation and draggable profile pictures', () => {
    const animPath = path.resolve(__dirname, '../styles/animations.css');
    const animContent = fs.readFileSync(animPath, 'utf-8');

    // Paused bus animation class
    expect(animContent).toContain('.animate-bus-paused');
    expect(animContent).toMatch(/animation-play-state:\s*paused\s*!important/);
    expect(animContent).toContain('.animate-partner-bus-drop');

    // App.tsx in-place shared bus selection state and drag interactions
    const appPath = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain('isBusPaused');
    expect(appContent).toContain('isSharedBusSelecting');
    expect(appContent).toContain('animate-bus-paused');
    expect(appContent).toContain('handlePartnerPointerDown');
    expect(appContent).toContain('handlePartnerPointerMove');
    expect(appContent).toContain('handlePartnerPointerUp');
    expect(appContent).toContain('handleInPlaceSharedBusSelection');
    expect(appContent).toContain('{t("NIEMAND")}');
  });
});
