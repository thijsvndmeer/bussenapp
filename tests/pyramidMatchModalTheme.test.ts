import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PyramidMatchModal Deep Theme Customization', () => {
  const modalPath = path.resolve(__dirname, '../components/modals/PyramidMatchModal.tsx');
  const modalContent = fs.readFileSync(modalPath, 'utf-8');
  const appPath = path.resolve(__dirname, '../App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  it('declares theme and calmAccentColor in PyramidMatchModalProps', () => {
    expect(modalContent).toContain('theme?: UITheme;');
    expect(modalContent).toContain('calmAccentColor?: string;');
    expect(modalContent).toContain('theme = UITheme.CLASSIC');
  });

  it('passes theme and calmAccentColor to PyramidMatchModal from App.tsx', () => {
    expect(appContent).toMatch(/<PyramidMatchModal[\s\S]*?theme=\{settings\.theme\}[\s\S]*?calmAccentColor=\{settings\.calmAccentColor\}/);
  });

  it('passes theme={theme} to all PlayerAvatar components inside PyramidMatchModal', () => {
    const avatarOccurrences = (modalContent.match(/<PlayerAvatar[\s\S]*?\/>/g) || []);
    expect(avatarOccurrences.length).toBeGreaterThanOrEqual(3);
    avatarOccurrences.forEach((occ) => {
      expect(occ).toContain('theme={theme}');
    });
  });

  it('implements deep theme styling for UITheme.METRO', () => {
    expect(modalContent).toContain('isMetro');
    expect(modalContent).toContain('rounded-none');
    expect(modalContent).toContain("font-mono");
    expect(modalContent).toContain('border-2 border-[var(--theme-accent,#fb7185)]');
  });

  it('implements deep theme styling for UITheme.CALM without italic or wide spaced characters', () => {
    expect(modalContent).toContain('isCalm');
    expect(modalContent).toContain('calmAccent');
    expect(modalContent).toContain('var(--theme-accent-glow');
    expect(modalContent).not.toContain('italic');
    expect(modalContent).not.toContain('tracking-[0.25em]');
    expect(modalContent).not.toContain('tracking-[0.22em]');
  });

  it('implements deep theme styling for UITheme.BEER', () => {
    expect(modalContent).toContain('isBeer');
    expect(modalContent).toContain('text-amber-400');
    expect(modalContent).toContain('border-amber-500');
    expect(modalContent).toContain('🍻');
  });

  it('implements deep theme styling for UITheme.STARS', () => {
    expect(modalContent).toContain('isStars');
    expect(modalContent).toContain('border-white/18');
    expect(modalContent).toContain('text-slate-100');
    expect(modalContent).toContain('✦');
  });

  it('customizes victims dock and floating drag ghost according to theme', () => {
    expect(modalContent).toContain('getTargetAvatarFrameClasses');
    expect(modalContent).toContain('getDragPointerClasses');
    expect(modalContent).toContain('getDragAvatarRingClasses');
    expect(modalContent).toContain('getDragSipsPillClasses');
  });

  it('ensures profile picture borders and drag ghosts are always circular across all themes', () => {
    expect(modalContent).toMatch(/const getMatcherAvatarFrameClasses = \(\) => {[\s\S]*?if \(isMetro\) return 'rounded-full[\s\S]*?if \(isBeer\) return 'rounded-full/);
    expect(modalContent).toMatch(/const getTargetAvatarFrameClasses = [\s\S]*?const shape = 'rounded-full';/);
    expect(modalContent).toMatch(/const getDragAvatarRingClasses = [\s\S]*?const shape = 'rounded-full';/);
  });

  it('requires holding for 2 seconds to distribute sips to self without showing premature indicators', () => {
    // Hold states and refs
    expect(modalContent).toContain('selfHoldProgress');
    expect(modalContent).toContain('isSelfHoldComplete');
    expect(modalContent).toContain('startSelfHold');
    expect(modalContent).toContain('cancelSelfHold');
    expect(modalContent).toContain('elapsed / 2000');

    // Only top bar shows progress during hold
    expect(modalContent).toContain('hoveredTargetId === draggedPlayerId && !isSelfHoldComplete');
    expect(modalContent).toContain('width: `${selfHoldProgress * 100}%`');

    // Does not indicate self-distribution or scale up avatar until 2s complete
    expect(modalContent).toContain('isEffectivelyHovered = isHovered && (!isSource || isSelfHoldComplete)');
    expect(modalContent).toContain('getTargetAvatarFrameClasses(\n                          isEffectivelyHovered,\n                          isSource\n                        )');

    // Only at the end of 2s should the usual 'TO YOURSELF?' show
    expect(modalContent).toContain('disco-gradient');
    expect(modalContent).toContain('isSelfHoldComplete ? (\n                    <>\n                      {t("aan")}');

    // Haptics on 2s completion
    expect(modalContent).toContain("triggerHaptic('success')");
    expect(modalContent).toContain("triggerHaptic('heavy')");

    // Only resolves to self if hold is complete
    expect(modalContent).toMatch(/if\s*\(\s*targetId\s*===\s*playerId\s*\)\s*\{\s*if\s*\(\s*isComplete\s*\)\s*\{\s*onResolveMatch\(playerId,\s*targetId\);\s*\}/);
  });
});


